#!/usr/bin/env node
// ucpqa — collect evidence for Google UCP buy-link checkout QA. Collects data only;
// verdicts and owner routing are the agent's job (see SKILL.md). Stops before payment:
// nothing here clicks a pay / place-order control.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Browser, listTargets, sleep, deadline, BASE } from './lib/cdp.mjs';
import { makeRedactor, parseMoney } from './lib/redact.mjs';

const [cmd, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);
const now = () => new Date().toISOString();

// ---------- redaction ----------
let redact = makeRedactor();
function loadAddress(file) {
  if (!file) return null;
  const a = JSON.parse(fs.readFileSync(file, 'utf8'));
  redact = makeRedactor(a);
  return a;
}
function emit(obj, outDir, name) {
  const clean = redact(obj);
  if (outDir) {
    // With --out, the full record goes to disk and the agent gets one line: every extra
    // line printed here is re-read on every later turn of the session.
    fs.mkdirSync(outDir, { recursive: true }); const file = path.join(outDir, name);
    fs.writeFileSync(file, JSON.stringify(clean, null, 2));
    const i = clean.initial || {}; const back = clean.steps?.switchBack;
    console.log(JSON.stringify({ file, status: clean.status || (clean.error ? 'error' : 'ok'), error: clean.error || clean.attempts?.at(-1)?.error || undefined,
      initial: i.method ? `${i.method} ship ${i.shipping} tax ${i.tax} total ${i.total}` : undefined, switchBack: back ? `ship ${back.shipping} total ${back.total}` : undefined,
      methods: clean.methods?.length ?? i.methods?.length, merchantUrl: clean.offer?.merchantUrl }));
  } else console.log(JSON.stringify(clean, null, 2));
}

// ---------- preflight ----------
async function preflight() {
  deadline(180000, 'preflight');
  const out = { at: now(), cdp: BASE, checks: [] };
  const ok = (name, pass, detail) => out.checks.push(pass ? { name, pass } : { name, pass, fix: detail });
  ok('node >= 22', Number(process.versions.node.split('.')[0]) >= 22, process.versions.node);
  let v;
  try { v = await (await fetch(`${BASE}/json/version`)).json(); ok('chrome debugging endpoint', true); out.browser = v.Browser; }
  catch { ok('chrome debugging endpoint', false, 'Run `browse-start` (headed, not --headless) and retry.'); return emit(out); }
  ok('headed browser', !/Headless/i.test(v['User-Agent']), 'Headless Chrome can silently no-op on checkout UI; restart with `browse-start` without --headless.');
  const targets = await listTargets();
  const dice = targets.some((t) => t.url.includes('signin-dice-web-intercept'));
  ok('no pending "Separate browsing?" prompt', !dice, dice ? 'Click the toolbar chip in the automation Chrome and choose to stay in this profile. It freezes second-account tabs.' : '');
  if (!args.email) { ok('account', false, 'Pass --email <your allowlisted Google account>'); return emit(out); }
  const b = await Browser.connect(); const p = await b.newPage();
  try {
    for (let i = 0; i < 6; i++) {
      await p.goto(`https://www.google.com/?authuser=${i}`, 3500);
      const label = await p.eval(`const e=[...document.querySelectorAll('a[aria-label]')].map(x=>x.getAttribute('aria-label')).find(t=>/Google Account/.test(t)); return e||''`);
      const m = label.match(/\(([^)]+@[^)]+)\)/); const who = m ? m[1] : '';
      if (who.toLowerCase() === args.email.toLowerCase()) { out.authuser = i; break; }
      if (i > 0 && !who) break;
    }
    ok('allowlisted account signed in', out.authuser !== undefined, `Sign ${args.email} into this browser profile (google.com → avatar → Add account). The email form of authuser falls back to the first account, so the index is resolved here.`);
    if (args.probe && out.authuser !== undefined) {
      await p.goto(withAuth(args.probe, out.authuser), 9000);
      const btn = await p.eval(`return [...document.querySelectorAll('button,a,[role=button]')].map(e=>(e.innerText||'').trim()).filter(t=>/^(Buy|Visit site)$/.test(t)).join(',')`);
      ok('probe link shows Buy', /Buy/.test(btn), `buttons: ${btn || 'none'}. Visit site only means this account is not on the UCP allowlist, or the offer is not UCP-enabled.`);
    }
  } finally { await p.close(); b.close(); }
  out.ready = out.checks.every((c) => c.pass);
  emit(out);
}

// ---------- links ----------
function links() {
  console.log(JSON.stringify(readRows(), null, 2));
}
function readRows() {
  const file = args._[0]; if (!file) die('usage: <links|scan> <sheet.xlsx|links.txt> [--tab NAME] [--rows 4,8-9]');
  let rows = [];
  if (/\.xlsx$/i.test(file)) rows = xlsxRows(file, args.tab);
  else fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    const m = line.match(/https?:\/\/(www\.)?google\.com\/search\?[^\s,"']+/); if (m) rows.push({ row: i + 1, url: m[0], cells: { note: line.replace(m[0], '').trim() } });
  });
  if (args.rows) { const want = expandRows(args.rows); rows = rows.filter((r) => want.has(r.row)); }
  const byUrl = new Map(); for (const r of rows) byUrl.set(docid(r.url), [...(byUrl.get(docid(r.url)) || []), r.row]);
  return rows.map((r) => ({ ...r, docid: docid(r.url), sameLinkRows: byUrl.get(docid(r.url)) }));
}
async function scan() {
  deadline(600000, 'scan');
  if (args.authuser === undefined || !args.out) die('usage: scan <sheet.xlsx|links.txt> --authuser N --out dir [--tab NAME] [--rows 4,8-9]');
  const rows = readRows();
  const unique = [...new Map(rows.map((r) => [r.docid, r])).values()];
  fs.mkdirSync(args.out, { recursive: true });
  const file = path.join(args.out, 'scan.json');
  const b = await Browser.connect(); const p = await b.newPage(); const results = [];
  try {
    for (const r of unique) {
      const item = { rows: r.sameLinkRows, docid: r.docid, url: r.url, checkedAt: now() };
      try {
        item.offer = await openOffer(p, withAuth(r.url, args.authuser));
        item.status = item.offer.buttons.includes('Buy') ? 'buy-present' : item.offer.buttons.includes('Visit site') ? 'visit-site-only' : 'no-buy';
        if (!item.offer.title) item.status = 'page-content-missing';
      } catch (e) { item.status = 'navigation-error'; item.error = String(e.message || e); }
      results.push(item);
      fs.writeFileSync(file, JSON.stringify(redact(results), null, 2) + '\n');
      console.log(JSON.stringify(redact({ rows: item.rows, status: item.status, title: item.offer?.title, merchantUrl: item.offer?.merchantUrl, error: item.error })));
    }
  } finally { await p.close(); b.close(); }
  console.log(file);
}
function xlsxRows(file, tab) {
  const unz = (p) => { try { return execFileSync('unzip', ['-p', file, p], { maxBuffer: 1 << 28 }).toString(); } catch { return ''; } };
  const ss = [...unz('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => xmlText(t[1])).join(''));
  const wb = unz('xl/workbook.xml'); const rels = unz('xl/_rels/workbook.xml.rels');
  const sheets = [...wb.matchAll(/<sheet\b[^>]*>/g)].map((m) => ({ name: xmlText((m[0].match(/\bname="([^"]+)"/) || [])[1] || '').trim(), rid: (m[0].match(/r:id="([^"]+)"/) || [])[1] }));
  const s = tab ? sheets.find((x) => x.name.toLowerCase() === tab.toLowerCase().trim()) : sheets[0];
  if (!s) die(`tab not found: ${tab}. Tabs: ${sheets.map((x) => x.name).join(' | ')}`);
  const rel = [...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => m[0]).find((r) => r.includes(`Id="${s.rid}"`));
  const tpath = 'xl/' + (rel.match(/Target="([^"]+)"/)[1]).replace(/^\/?xl\//, '');
  const xml = unz(tpath); const srels = unz(tpath.replace('worksheets/', 'worksheets/_rels/') + '.rels');
  const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1];
  const rmap = Object.fromEntries([...srels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => [attr(m[0], 'Id'), xmlText(attr(m[0], 'Target') || '')]));
  const hl = Object.fromEntries([...xml.matchAll(/<hyperlink\b[^>]*>/g)].map((m) => [attr(m[0], 'ref'), rmap[attr(m[0], 'r:id')]]));
  const cells = {};
  for (const m of xml.matchAll(/<c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const [, col, rn, attrs, inner = ''] = m; const t = (attrs.match(/t="(\w+)"/) || [])[1];
    const f = (inner.match(/<f>([\s\S]*?)<\/f>/) || [])[1]; const v = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
    let val = t === 's' && v ? ss[+v] : v ? xmlText(v) : '';
    // HYPERLINK() formulas carry links the hyperlink table misses (rows 14 and 16, 2026-09-23).
    const fl = f && xmlText(f).match(/HYPERLINK\("([^"]+)"/i);
    (cells[+rn] ||= {})[col] = { val, link: hl[col + rn] || (fl && fl[1]) || null };
  }
  const out = [];
  for (const [rn, cols] of Object.entries(cells)) {
    const linkCell = Object.values(cols).find((c) => c.link && /google\.com\/search/.test(c.link));
    if (linkCell) out.push({ row: +rn, url: linkCell.link, cells: Object.fromEntries(Object.entries(cols).map(([k, c]) => [k, c.val])) });
  }
  return out.sort((a, b) => a.row - b.row);
}

// ---------- google ----------
const REVIEW = 'buyflow2';
async function google() {
  deadline(args['price-methods'] ? 1200000 : 420000, 'google');
  const url = args._[0]; if (!url || args.authuser === undefined) die('usage: google <buy-url> --authuser N [--label row12] [--out dir] [--steps auto|always|never] [--alt "<method>"] [--price-methods]');
  loadAddress(args.address);
  const b = await Browser.connect(); const p = await b.newPage();
  const res = { kind: 'google', label: args.label || docid(url), url, docid: docid(url), startedAt: now(), attempts: [] };
  try {
    res.offer = await openOffer(p, withAuth(url, args.authuser));
    if (!res.offer.buttons.includes('Buy')) { res.status = res.offer.buttons.includes('Visit site') ? 'visit-site-only' : 'no-buy'; return; }
    let a = await clickBuy(p); res.attempts.push(a);
    if (a.error && /couldn.t complete your purchase/i.test(a.error)) { await sleep(20000); await openOffer(p, withAuth(url, args.authuser)); a = await clickBuy(p); res.attempts.push(a); }
    if (a.error) { res.status = 'buy-error'; return; }
    res.status = 'order-review';
    res.initial = a.readings.at(-1);
    const steps = args.steps || 'auto';
    const zero = res.initial?.shipping === 0;
    if (steps === 'always' || (steps === 'auto' && zero)) {
      const orig = res.initial.method; const alt = args.alt || res.initial.methods.find((m) => m !== orig);
      res.steps = {};
      res.steps.reselect = await pick(p, orig, orig);
      res.steps.switch = await pick(p, orig, alt);
      res.steps.switchBack = await pick(p, alt, orig);
      await openOffer(p, withAuth(url, args.authuser)); const again = await clickBuy(p);
      res.steps.reopen = again.error ? { error: again.error } : again.readings.at(-1);
    }
    if (args['price-methods']) {
      res.methodPrices = {}; let cur = (res.steps?.switchBack || res.initial).method;
      for (const m of res.initial.methods) { const r = await pick(p, cur, m); res.methodPrices[m] = r; cur = m; }
    }
  } catch (e) { res.status = res.status || 'script-error'; res.error = String(e.message || e); }
  finally { res.finishedAt = now(); await p.close(); b.close(); emit(res, args.out, `google-${res.label}.json`); }
}
async function openOffer(p, url) {
  await p.goto(url, 9000);
  return p.eval(`
    const t=document.body.innerText.split('\\n').map(s=>s.trim()).filter(Boolean); const i=t.indexOf('Buying options');
    const buy=i>=0?t.slice(i+1,i+22):[]; const num=(k)=>{const j=buy.indexOf(k); return j>=0?buy[j+1]:null};
    const hrefs=[...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>/^https?:/.test(h)&&!/google\\./.test(new URL(h).hostname));
    return { at:new Date().toISOString(), title:t[0]||null, offerLines:buy.slice(0,4), basePrice:num('Base price'), listingDelivery:num('Delivery fee'), listingTotal:num('Total'),
      attributes:t.slice(0,i>0?i:12).join(' | ').slice(0,500),
      buttons:[...new Set([...document.querySelectorAll('button,a,[role=button]')].map(e=>(e.innerText||'').trim()).filter(x=>/^(Buy|Visit site)$/.test(x)))],
      merchantUrl:hrefs.find(h=>/[?&]sku=/.test(h))||hrefs[0]||null };`);
}
async function clickBuy(p) {
  const clicked = await p.eval(`const b=[...document.querySelectorAll('button,a,[role=button]')].find(e=>(e.innerText||'').trim()==='Buy'); if(!b) return false; b.click(); return true;`);
  if (!clicked) throw new Error('selector not found: Buy button');
  const readings = []; const startedAt = Date.now();
  for (const at of [5, 15, 30]) {
    await sleep(Math.max(0, at * 1000 - (Date.now() - startedAt)));
    const err = await p.eval(`const t=document.body.innerText; const i=t.indexOf('Something went wrong'); return i<0?null:t.slice(i,i+200).split(/\\n+/).filter(l=>l.trim()&&!/1Password/.test(l)).slice(0,3).join(' | ')`);
    if (err) return { at: now(), error: err, readings };
    if (await p.hasFrame(REVIEW)) { try { readings.push({ afterSec: at, ...(await readReview(p)) }); } catch (e) { readings.push({ afterSec: at, loading: String(e.message) }); } }
    else readings.push({ afterSec: at, loading: 'order review not open yet' });
  }
  if (!readings.some((r) => r.total !== undefined)) return { at: now(), error: 'order review did not load within 30s', readings };
  return { at: now(), readings };
}
async function readReview(p) {
  return p.eval(`
    const x=document.querySelector('button[aria-label="Expand Summary Line Items"]');
    if(x && !document.body.innerText.includes('Subtotal')){ x.click(); await new Promise(r=>setTimeout(r,2000)); }
    const L=document.body.innerText.split('\\n').map(s=>s.trim()).filter(Boolean);
    const money=(k)=>{const j=L.indexOf(k); if(j<0) return undefined; const m=(L[j+1]||'').match(/-?\\$?([\\d,]+\\.\\d{2})/); return m?+m[1].replace(/,/g,''):undefined};
    const si=L.indexOf('Subtotal'); const pay=L.findIndex(l=>/^Pay /.test(l));
    if(si<0) throw new Error('selector not found: Subtotal line in order review');
    const methods=[...document.querySelectorAll('[role=button][aria-expanded]')].map(e=>(e.innerText||'').trim()).filter(t=>t && !t.includes('\\n') && !/^Add /.test(t));
    const qty=L.find(l=>/^Qty:/.test(l))||null;
    return { merchant:L[0], product:L[L.indexOf('Review your order')+1], itemPrice:L[L.indexOf('Review your order')+2], qty,
      method:L[si-1], subtotal:money('Subtotal'), discount:money('Discount'), shipping:money('Shipping'), tax:money('Estimated tax'),
      total: pay>=0 ? +((L[pay+1]||'').replace(/[^\\d.]/g,'')) : undefined, payButton:L.find(l=>/^(Update card info|Place order|Pay|Buy)$/i.test(l))||null, methods };`, { frameMatch: REVIEW });
}
async function pick(p, current, target) {
  const open = await p.eval(`const els=[...document.querySelectorAll('[role=button]')].filter(e=>{const r=e.getBoundingClientRect(); return r.width>0&&r.height>0&&(e.innerText||'').trim().split('\\n')[0]===${JSON.stringify(current)}}); if(!els.length) return false; els.at(-1).click(); return true;`, { frameMatch: REVIEW });
  if (!open) throw new Error(`selector not found: shipping method row "${current}"`);
  await sleep(3500);
  const chose = await p.eval(`const els=[...document.querySelectorAll('[role=button]')].filter(e=>{const r=e.getBoundingClientRect(); return r.width>0&&r.height>0&&(e.innerText||'').trim().split('\\n')[0]===${JSON.stringify(target)}}); if(!els.length) return false; els.at(-1).click(); return true;`, { frameMatch: REVIEW });
  if (!chose) throw new Error(`selector not found: shipping option "${target}" in picker`);
  await sleep(6000);
  return { at: now(), picked: target, ...(await readReview(p)) };
}

// ---------- native (BigCommerce storefront, isolated guest context) ----------
async function native() {
  deadline(360000, 'native');
  if (args['rendered-methods']) die('--rendered-methods is not supported: the rendered method list sits behind the shipping-address form. Read it by hand; see references/protocol.md, "Reading the rendered native method list".');
  const url = args._[0]; const addr = loadAddress(args.address);
  if (!url || !addr) die('usage: native <storefront-product-url-with-?sku=> --address addr.json [--label row12] [--out dir] [--method "<Google selected method>"]');
  const b = await Browser.connect(); const ctx = await b.newIsolatedContext(); const p = await b.newPage({ contextId: ctx });
  const res = { kind: 'native', label: args.label || new URL(url).hostname, url, startedAt: now() };
  try {
    await p.goto(url, 7000);
    res.origin = await p.eval('return location.origin');
    res.cartBefore = await p.eval(`const c=await fetch('/api/storefront/carts',{credentials:'include'}).then(r=>r.json()).catch(()=>null); return Array.isArray(c)?c.map(x=>x.lineItems.physicalItems.map(i=>i.sku+' x'+i.quantity)).flat():'not a BigCommerce storefront API response'`);
    res.product = await p.eval(`const chk=[...document.querySelectorAll('form[data-cart-item-add] input[type=radio]:checked')].map(e=>document.querySelector('label[for="'+e.id+'"]')?.innerText?.trim()); const sel=[...document.querySelectorAll('form[data-cart-item-add] select')].map(s=>s.options[s.selectedIndex]?.text); const optionFields=new Set([...document.querySelectorAll('form[data-cart-item-add] [name^="attribute["]')].map(e=>e.name)).size; return { title:document.querySelector('h1')?.innerText?.trim(), price:document.querySelector('.price--withoutTax')?.innerText?.trim(), selectedOptions:[...chk,...sel].filter(Boolean), optionFields }`);
    const added = await p.eval(`const q=document.querySelector('input[name="qty[]"]'); if(q) q.value='1'; const b=document.querySelector('#form-action-addToCart'); if(!b) return false; b.click(); await new Promise(r=>setTimeout(r,5000)); return true;`);
    if (!added) throw new Error('selector not found: #form-action-addToCart (non-Stencil theme: add the item by hand in an isolated window and quote it there)');
    const quote = await p.eval(`
      const cart=(await fetch('/api/storefront/carts',{credentials:'include'}).then(r=>r.json()))[0];
      const items=cart.lineItems.physicalItems.map(i=>({name:i.name,sku:i.sku,qty:i.quantity,price:i.salePrice,options:(i.options||[]).map(o=>o.name+': '+o.value)}));
      const a=${JSON.stringify({ first_name: addr.first_name, last_name: addr.last_name, address1: addr.address1, address2: addr.address2 || '', city: addr.city, state_or_province_code: addr.state_or_province_code, postal_code: addr.postal_code, country_code: addr.country_code || 'US', phone: addr.phone || '' })};
      const li=cart.lineItems.physicalItems.map(i=>({itemId:i.id,quantity:i.quantity}));
      const r=await fetch('/api/storefront/checkouts/'+cart.id+'/consignments?include=consignments.availableShippingOptions',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify([{address:a,lineItems:li}])}).then(r=>r.json());
      const c=r.consignments[0]; const opts=c.availableShippingOptions||[]; const per={};
      for(const o of opts){ const u=await fetch('/api/storefront/checkouts/'+cart.id+'/consignments/'+c.id,{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({shippingOptionId:o.id})}).then(r=>r.json()); per[o.description]={shipping:u.shippingCostTotal,tax:u.taxTotal,total:u.grandTotal}; }
      const want=${JSON.stringify(args.method || '')}; const fin=opts.find(o=>o.description===want)||opts.find(o=>o.isRecommended)||opts[0];
      if(fin) await fetch('/api/storefront/checkouts/'+cart.id+'/consignments/'+c.id,{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({shippingOptionId:fin.id})});
      return { items, addressOnly:{tax:r.taxTotal,total:r.grandTotal}, methods:opts.map(o=>({name:o.description,cost:o.cost,recommended:o.isRecommended})), perMethod:per, renderedFor:fin?.description };`, { timeoutMs: 120000 });
    Object.assign(res, quote);
    await p.goto(`${res.origin}/checkout`, 8000);
    res.renderedSummary = await p.eval(`return (document.querySelector('aside')||document.body).innerText.replace(/\\n+/g,' | ').slice(0,500)`);
  } catch (e) { res.error = String(e.message || e); }
  finally {
    try { res.cartAfterCleanup = await p.eval(`for(const c of await fetch('/api/storefront/carts',{credentials:'include'}).then(r=>r.json())) for(const i of c.lineItems.physicalItems) await fetch('/api/storefront/carts/'+c.id+'/items/'+i.id,{method:'DELETE',credentials:'include'}); return (await fetch('/api/storefront/carts',{credentials:'include'}).then(r=>r.json())).length`); } catch {}
    res.finishedAt = now(); await p.close(); await b.disposeContext(ctx); b.close(); emit(res, args.out, `native-${res.label}.json`);
  }
}
// ---------- report ----------
function report() {
  const dir = args._[0]; if (!dir) die('usage: report <results-dir> [--plan plan.json]');
  const files = fs.readdirSync(dir).filter((f) => /^(google|native)-.*\.json$/.test(f));
  const byLabel = {};
  for (const f of files) { const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); (byLabel[j.label] ||= {})[j.kind] = j; }
  const money = (n) => (n === undefined || n === null || Number.isNaN(n) ? '—' : `$${Number(n).toFixed(2)}`);
  const cell = (value) => String(value ?? '—').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  const page = (name, url) => /^https?:\/\//.test(url || '') ? `[${name}](<${url.replace(/>/g, '%3E')}>)` : `${name}: unavailable`;
  const lines = ['# UCP checkout QA — results', '', `Generated ${now()} from ${files.length} result files. Stopped before payment. Personal data redacted.`, ''];
  const flags = [];
  const scanFile = path.join(dir, 'scan.json');
  if (fs.existsSync(scanFile)) {
    const scanned = JSON.parse(fs.readFileSync(scanFile, 'utf8'));
    lines.push('', '## All-link scan', '', 'This is a page and Buy-control check only. Confirm the intended product and variant before checkout.', '',
      '| Sheet rows | Google product | Merchant link (unverified) | Page result | Visible title |', '|---|---|---|---|---|');
    for (const item of scanned) lines.push(`| ${cell(item.rows?.join(', '))} | ${page('Google', item.url)} | ${page('Merchant', item.offer?.merchantUrl)} | ${cell(item.status)} | ${cell(item.offer?.title)} |`);
  }
  lines.push('', '## Checkout comparisons', '',
    '| Label | Product pages | Google status | Initial Google (method · ship · tax · total) | After switch-back | Native (same method) | Flags |', '|---|---|---|---|---|---|---|');
  for (const [label, { google: g, native: n }] of Object.entries(byLabel).sort()) {
    const f = [];
    const init = g?.initial; const back = g?.steps?.switchBack;
    if (g?.status && g.status !== 'order-review') f.push(`${g.status}${g.attempts?.at(-1)?.error ? ': ' + g.attempts.at(-1).error : ''}`);
    if (g?.attempts?.length > 1) f.push(`Buy needed ${g.attempts.length} attempts (first: ${g.attempts[0].error})`);
    if (init?.shipping === 0 && n?.perMethod?.[init.method]?.shipping > 0) f.push(`initial $0 shipping on ${init.method}; native quotes ${money(n.perMethod[init.method].shipping)}`);
    if (g?.steps?.reselect?.shipping === 0) f.push('reselecting the same method stays $0');
    if (g?.steps?.reopen?.shipping === 0) f.push('$0 returns on a fresh Buy');
    if (init && n?.methods) {
      const gm = new Set(init.methods), nm = new Set(n.methods.map((m) => m.name));
      const onlyG = [...gm].filter((m) => !nm.has(m)), onlyN = [...nm].filter((m) => !gm.has(m));
      if (onlyG.length) f.push(`Google-only methods: ${onlyG.join(', ')}`);
      if (onlyN.length) f.push(`native-only methods: ${onlyN.join(', ')}`);
    }
    const cmp = (gr) => { const nv = gr && n?.perMethod?.[gr.method]; if (!gr || !nv) return; if (Math.abs(gr.total - nv.total) > 0.005 || Math.abs(gr.tax - nv.tax) > 0.005) f.push(`${gr.method}: Google ${money(gr.total)} vs native ${money(nv.total)} (tax ${money(gr.tax)} vs ${money(nv.tax)})`); };
    if (init?.shipping !== 0) cmp(init); cmp(back); cmp(g?.steps?.switch);
    if (g?.methodPrices) for (const r of Object.values(g.methodPrices)) cmp(r);
    if (n?.items?.length && init?.itemPrice) {
      const gp = parseMoney(init.itemPrice);
      if (!Number.isFinite(gp)) f.push(`item price unreadable on Google: "${init.itemPrice}"`);
      else if (Math.abs(gp - Number(n.items[0].price)) > 0.005) f.push(`item price differs: Google ${init.itemPrice} vs native $${n.items[0]?.price}`);
    }
    // Only a product with option fields can land on the wrong variant. Older result files have no
    // optionFields, so an unknown count is treated as "has options".
    if (n?.url && !/[?&]sku=/.test(n.url) && (n.product?.optionFields ?? 1) > 0) f.push('variant not pinned: the native URL has no sku= and the product has options, so confirm the cart item matches the Google offer');
    const requestedSku = n?.url && new URL(n.url).searchParams.get('sku');
    if (requestedSku && n?.items?.length && !n.items.some((item) => item.sku === requestedSku)) f.push(`native cart SKU differs from product link: requested ${requestedSku}; cart ${n.items.map((item) => item.sku).join(', ')}`);
    if (n && !n.error && !n.items?.length) f.push('native cart item not verified');
    const googleQty = init?.qty?.match(/\d+/)?.[0];
    if (googleQty && n?.items?.length && !n.items.some((item) => String(item.qty) === googleQty)) f.push(`quantity differs: Google ${googleQty}; native ${n.items.map((item) => item.qty).join(', ')}`);
    if (n?.error) f.push(`native error: ${n.error}`);
    if (g?.error) f.push(`google script error: ${g.error}`);
    const nv = init && n?.perMethod?.[init.method];
    const merchantPage = n?.url ? page('Native', n.url) : page('Merchant', g?.offer?.merchantUrl);
    lines.push(`| ${cell(label)} | ${page('Google', g?.url)} · ${merchantPage} | ${cell(g?.status)} | ${cell(init ? `${init.method} · ${money(init.shipping)} · ${money(init.tax)} · ${money(init.total)}` : '—')} | ${cell(back ? `${money(back.shipping)} · ${money(back.total)}` : '—')} | ${cell(nv ? `${money(nv.shipping)} · ${money(nv.tax)} · ${money(nv.total)}` : n ? (n.error ? 'error' : 'method not offered natively') : '—')} | ${cell(f.join('; ') || 'none')} |`);
    flags.push({ label, googleUrl: g?.url || null, nativeUrl: n?.url || null, merchantUrl: g?.offer?.merchantUrl || null, flags: f, listing: g?.offer ? { delivery: g.offer.listingDelivery, total: g.offer.listingTotal, note: 'listing estimate for the link\'s location parameter, not an addressed checkout quote' } : null });
  }
  lines.push('', '## Flags by label', '');
  for (const x of flags) { lines.push(`- **${x.label}** (${page('Google', x.googleUrl)} · ${x.nativeUrl ? page('Native', x.nativeUrl) : page('Merchant', x.merchantUrl)}): ${x.flags.join('; ') || 'no mechanical flags'}${x.listing ? ` (listing: delivery ${x.listing.delivery}, total ${x.listing.total})` : ''}`); }
  lines.push('', 'Flags are mechanical comparisons. Verdicts against prior claims, owner routing, and sheet notes are written by the agent per references/owner-routing.md.');
  const out = path.join(dir, 'report.md'); fs.writeFileSync(out, lines.join('\n') + '\n'); fs.writeFileSync(path.join(dir, 'flags.json'), JSON.stringify(flags, null, 2));
  console.log(out);
}

// ---------- helpers ----------
function withAuth(u, n) { const x = new URL(u); x.searchParams.set('authuser', String(n)); return x.toString(); }
function docid(u) { const m = decodeURIComponent(u).match(/headlineOfferDocid:(\d+)/); return m ? m[1] : u; }
function expandRows(spec) { const s = new Set(); for (const part of String(spec).split(',')) { const [a, b] = part.split('-').map(Number); for (let i = a; i <= (b || a); i++) s.add(i); } return s; }
function xmlText(s) { return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'").replace(/&#10;/g, '\n'); }
function parseArgs(a) { const o = { _: [] }; for (let i = 0; i < a.length; i++) { if (a[i].startsWith('--')) { const k = a[i].slice(2); const v = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true; o[k] = v; } else o._.push(a[i]); } return o; }
function die(msg) { console.error(msg); process.exit(2); }

const cmds = { preflight, links, scan, google, native, report };
if (!cmds[cmd]) die('usage: ucpqa.mjs <preflight|links|scan|google|native|report> ...  (see SKILL.md)');
Promise.resolve(cmds[cmd]()).catch((e) => { console.error(JSON.stringify({ error: String(e.message || e) })); process.exit(1); });
