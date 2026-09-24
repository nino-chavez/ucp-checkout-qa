// Minimal Chrome DevTools Protocol client over one browser-level websocket.
// Why not browse-eval: it hung on second-account Google tabs (2026-09-23), and it
// cannot reach Google's same-process payment frame. Needs Node >= 22 (global WebSocket).

const PORT = process.env.BROWSE_PORT || process.env.CDP_PORT || '9222';
export const BASE = `http://127.0.0.1:${PORT}`;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function listTargets() {
  try { return await (await fetch(`${BASE}/json/list`, { signal: AbortSignal.timeout(5000) })).json(); }
  catch { throw new Error(`No Chrome debugging endpoint at ${BASE}. Run \`browse-start\` (headed) first.`); }
}

export class Browser {
  static async connect() {
    let v;
    try { v = await (await fetch(`${BASE}/json/version`, { signal: AbortSignal.timeout(5000) })).json(); }
    catch { throw new Error(`No Chrome debugging endpoint at ${BASE}. Run \`browse-start\` (headed) first.`); }
    const b = new Browser();
    b.ws = new WebSocket(v.webSocketDebuggerUrl);
    b.id = 0; b.pending = new Map(); b.listeners = [];
    b.ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id && b.pending.has(m.id)) { const { res, rej } = b.pending.get(m.id); b.pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
      else if (m.method) for (const l of b.listeners) l(m);
    };
    await new Promise((res, rej) => { b.ws.onopen = res; b.ws.onerror = () => rej(new Error('websocket error')); });
    return b;
  }
  send(method, params = {}, sessionId, timeoutMs = 30000) {
    const id = ++this.id;
    const p = new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error(`timeout: ${method}`)); } }, timeoutMs).unref();
    });
    this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    return p;
  }
  on(fn) { this.listeners.push(fn); }
  close() { try { this.ws.close(); } catch {} }
  async newPage({ contextId } = {}) {
    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank', ...(contextId ? { browserContextId: contextId } : {}) });
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    const page = new Page(this, targetId, sessionId);
    await page.init();
    return page;
  }
  // Isolated guest context: no cookies or logins from the profile.
  async newIsolatedContext() { return (await this.send('Target.createBrowserContext', { disposeOnDetach: true })).browserContextId; }
  async disposeContext(id) { try { await this.send('Target.disposeBrowserContext', { browserContextId: id }); } catch {} }
}

export class Page {
  constructor(b, targetId, sid) { this.b = b; this.targetId = targetId; this.sid = sid; this.ctx = new Map(); }
  s(method, params, t) { return this.b.send(method, params, this.sid, t); }
  async init() {
    this.b.on((m) => {
      if (m.sessionId !== this.sid) return;
      if (m.method === 'Runtime.executionContextCreated') { const c = m.params.context; if (c.auxData?.isDefault) this.ctx.set(c.auxData.frameId, c.id); }
      if (m.method === 'Runtime.executionContextDestroyed') { for (const [f, id] of this.ctx) if (id === m.params.executionContextId) this.ctx.delete(f); }
      if (m.method === 'Runtime.executionContextsCleared') this.ctx.clear();
    });
    await this.s('Page.enable'); await this.s('Runtime.enable');
  }
  async goto(url, settleMs = 8000) {
    const result = await this.s('Page.navigate', { url });
    if (result.errorText) throw new Error(`navigation failed: ${result.errorText}`);
    await sleep(settleMs);
  }
  async close() { try { await this.b.send('Target.closeTarget', { targetId: this.targetId }); } catch {} }
  async frames() {
    const { frameTree } = await this.s('Page.getFrameTree');
    const out = []; const walk = (t) => { out.push(t.frame); (t.childFrames || []).forEach(walk); }; walk(frameTree); return out;
  }
  async hasFrame(match) { return (await this.frames()).some((f) => f.url.includes(match)); }
  // Evaluate an async function body in the top frame, or in the frame whose URL contains frameMatch.
  // Google's order review lives in a same-process payments.google.com frame, so it is reached by
  // frame id + execution context, not by target auto-attach.
  async eval(body, { frameMatch, timeoutMs = 30000 } = {}) {
    let contextId;
    if (frameMatch) {
      const f = (await this.frames()).find((x) => x.url.includes(frameMatch));
      if (!f) throw new Error(`frame not found: ${frameMatch}`);
      for (let i = 0; i < 6 && !this.ctx.get(f.id); i++) await sleep(500);
      contextId = this.ctx.get(f.id);
      if (!contextId) throw new Error(`no script context for frame: ${frameMatch}`);
    }
    const r = await this.s('Runtime.evaluate', { expression: `(async()=>{${body}})()`, awaitPromise: true, returnByValue: true, userGesture: true, ...(contextId ? { contextId } : {}) }, timeoutMs);
    if (r.exceptionDetails) throw new Error(`page error: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    return r.result.value;
  }
  async screenshot(clip) {
    const r = await this.s('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
    return Buffer.from(r.data, 'base64');
  }
}

// Hard wall-clock cap for a whole command (macOS ships no `timeout`).
export function deadline(ms, label) {
  setTimeout(() => { console.error(JSON.stringify({ error: `${label} exceeded ${ms / 1000}s` })); process.exit(3); }, ms).unref();
}
