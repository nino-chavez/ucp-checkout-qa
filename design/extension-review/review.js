/* Review-only interaction model. No browser automation or remote requests. */
const state = { concept: 'panel', view: 'setup', mode: 'page', paused: false, stopped: false, published: false };
const $ = (selector) => document.querySelector(selector);
const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const button = (text, action, cls = '', extra = '') => `<button class="${cls}" data-action="${action}" ${extra}>${text}</button>`;
const badge = (text, tone = '') => `<span class="badge ${tone}">${text}</span>`;
const sources = () => `<div class="source-links">${button('Google product', 'google-source')}${button('Storefront product', 'native-source')}</div>`;
const profile = () => `<div class="setting-row"><div><strong>Test account</strong><span>Work Google account · Buy access checked</span></div>${button('Change', 'account')}</div><div class="setting-row"><div><strong>Shipping details</strong><span>Test destination · contact details ready</span></div>${button('Review', 'destination')}</div><div class="setting-row"><div><strong>Agent review</strong><span>On · reviews every product</span></div>${button('Details', 'agent')}</div>`;

function setup() {
  return `<h2>What should we test?</h2><p class="small-copy">Compare the product and checkout totals. Stop before payment.</p>
    <div class="segmented" role="group" aria-label="Run mode">${button('This page', 'mode-page', '', `aria-pressed="${state.mode === 'page'}"`)}${button('List of links', 'mode-list', '', `aria-pressed="${state.mode === 'list'}"`)}</div>
    ${state.mode === 'page' ? `<div class="product-summary"><strong>Studio cable · 3 ft</strong><p>Northline Audio · selected Google offer</p><p>Variant: black · quantity: 1</p></div>` : `<div class="field"><label for="links-input">Google Shopping links</label><textarea id="links-input" spellcheck="false" placeholder="Paste one link per line">https://www.google.com/search?mock=studio-cable
https://www.google.com/search?mock=audio-adapter
https://www.google.com/search?mock=travel-case</textarea><span class="help">Sample links only. The real tool keeps original sheet rows when it groups duplicates.</span></div>`}
    ${profile()}<div class="notice"><strong>Packaged-tools option</strong>This concept can use the separate test browser if the pilot needs scripted checks. The first proof uses Claude in Chrome.</div>
    ${button(state.mode === 'page' ? 'Preview this test' : 'Preview batch run', 'start', 'primary full')}
    <span class="help">Simulated run. In the first pilot, Claude asks for missing details in the conversation.</span>`;
}

function running() {
  if (state.stopped) return `<div class="detail-kicker">${badge('Stopped', 'neutral')}<span>Partial evidence only</span></div><h2>The run stopped early</h2><p class="small-copy">The sample run ended during the shipping comparison. We have an initial observation, but no completed checkout comparison.</p><ul class="queue-list"><li><span>Studio cable</span>${badge('Incomplete', 'warning')}</li><li><span>Audio adapter</span>${badge('Not tested', 'neutral')}</li><li><span>Travel case</span>${badge('Buy unavailable', 'blocked')}</li></ul><div class="notice"><strong>Keep what was observed</strong>The real tool saves partial evidence and cleans up the test cart. A stopped run cannot become a full pass.</div>${button('Start a new preview', 'setup', 'primary full')}`;
  return `<div class="detail-kicker">${badge(state.paused ? 'Paused' : 'Testing', state.paused ? 'neutral' : '')}<span>Studio cable · Northline Audio</span></div>
    <h2>${state.paused ? 'Run paused' : 'Checking the shipping change'}</h2>
    <p class="small-copy">${state.paused ? 'Evidence is saved. Resume to continue from the last completed check.' : 'Google first showed free shipping. The agent is comparing a fresh Buy with the storefront quote.'}</p>
    <div class="run-strip"><span>${state.mode === 'page' ? 'This product' : 'Sample batch · product 1 of 3'}</span><span>Before payment</span></div><div class="progress-track"><span></span></div>
    <ol class="timeline"><li class="done"><span class="step-dot">1</span><div>Check every link<p>${state.mode === 'page' ? 'Selected offer loaded. Buy is present.' : 'Three sample pages scanned. One lacks Buy.'}</p></div></li><li class="done"><span class="step-dot">2</span><div>Confirm the item<p>Black cable, 3 ft, quantity 1.</p></div></li><li class="active"><span class="step-dot">3</span><div>Compare shipping and tax<p>Switch method, switch back, open a fresh Buy.</p></div></li><li><span class="step-dot">4</span><div>Review the evidence<p>Record what happened and what remains unknown.</p></div></li></ol>
    <div class="notice"><strong>Agent observation</strong>The same method costs $7.00 on the storefront. A matching total after switching does not explain the initial $0.00.</div>
    <div class="actions">${button(state.paused ? 'Resume' : 'Pause', 'pause', 'secondary')}${button('Stop run', 'stop')}</div>
    ${button('Preview the resulting finding', 'finding', 'subtle-link')}`;
}

function finding() {
  return `<div class="detail-kicker">${badge('Mismatch', 'warning')}<span>Shipping · product 1</span></div>
    <h2>Shipping starts at $0.00</h2><p class="small-copy">Studio cable · 3 ft · black · quantity 1</p>${sources()}
    <table class="comparison-table"><caption class="sr-only">Shipping and total by checkout state. Synthetic data.</caption><thead><tr><th>Checkout state</th><th>Shipping</th><th>Total</th></tr></thead><tbody><tr><td>Google · fresh Buy</td><td class="flagged-amount">$0.00</td><td>$20.00</td></tr><tr><td>Google · switched back</td><td>$7.00</td><td>$27.00</td></tr><tr><td>Storefront · Ground</td><td>$7.00</td><td>$27.00</td></tr></tbody></table>
    <p class="small-copy">Same item, destination, and Ground method. Tax is $1.00 in each reading.</p>
    <div class="owner-box"><h3>Owner still unresolved</h3><p>Google or BigCommerce. We need the first shipping response to tell which system returned or displayed $0.00.</p><div class="confidence"><span>Observation confidence: <strong>high</strong></span><span>Owner confidence: <strong>low</strong></span></div></div>
    <details class="evidence-toggle"><summary>Reproduction and evidence</summary><ol><li>A fresh Buy shows Ground shipping at $0.00.</li><li>Reselecting Ground keeps $0.00.</li><li>Switching away and back shows $7.00.</li><li>A second fresh Buy returns to $0.00.</li><li>The rendered storefront quote shows Ground at $7.00.</li></ol><p>Mock timestamps and sample readings only. A real result links each statement to a captured observation.</p></details>
    <div class="actions">${button('View all results', 'results')}${button('Review report', 'report', 'primary')}</div>`;
}

function blocked() {
  return `<div class="detail-kicker">${badge('Needs your input', 'blocked')}<span>Run paused</span></div><h2>A phone number is required</h2><p class="small-copy">The test checkout cannot continue without it. This is a setup gap; we have not marked the product as failed.</p><div class="product-summary"><strong>Studio cable · Northline Audio</strong><p>Google order review · shipping details</p></div><form id="phone-form"><div class="field"><label for="test-phone">Phone number for this test</label><input id="test-phone" type="tel" autocomplete="off" placeholder="Enter a test phone number" required><span class="help">Use synthetic data in this preview. The pilot uses authorized checkout details and excludes them from reports. Details entered in Claude also follow its chat retention settings.</span></div><button class="primary full" type="submit">Save and resume</button></form><div class="actions">${button('Skip this product', 'skip')}${button('Stop run', 'stop')}</div><div class="notice"><strong>Other blocked states use this same pattern</strong>Wrong Google account, missing local helper, ambiguous variant, changed page, or a sign-in challenge.</div>`;
}

function report() {
  return `<div class="detail-kicker">${badge('Ready to review')}<span>Sample onboarding run</span></div><h2>One issue needs follow-up</h2><p class="small-copy">The shipping change reproduced. One product matched; one remains blocked because Buy was unavailable.</p><ul class="queue-list"><li><span>Studio cable</span>${badge('Mismatch', 'warning')}</li><li><span>Audio adapter</span>${badge('Checks matched', 'success')}</li><li><span>Travel case</span>${badge('Blocked', 'blocked')}</li></ul>
    <label class="report-choice"><input id="sheet-output" type="checkbox" checked><span><strong>Spreadsheet detail · preview</strong><small>New run tab in Sample onboarding sheet. Existing notes stay outside the write range.</small></span></label><label class="report-choice"><input id="doc-output" type="checkbox" checked><span><strong>Google Doc summary · preview</strong><small>New document with findings, product links, and limits.</small></span></label>
    <div class="source-links">${button('Preview spreadsheet', 'sheet-preview')}${button('Preview Google Doc', 'doc-preview')}</div>
    <div class="notice"><strong>Browser publishing · simulation</strong>The proposed tool uses the signed-in work account and verifies saved text after reopening. No Google project setup. This preview changes no Google files.</div>
    <div class="actions">${button('Download CSV', 'download')}${button('Preview publishing', 'publish', 'primary')}</div>
    ${state.published ? `<div class="status-text" role="status"><strong>Simulated save verified.</strong> The mock report was re-read. No Google file was created or changed.</div>` : ''}`;
}

const views = { setup, running, issue: finding, blocked, report };
function sourcePage() {
  return `<div class="mock-page"><div class="page-brand">Google Shopping <span class="muted">· page preview</span></div><div class="searchbox">Studio cable 3 ft</div><div class="page-product"><div class="product-art"><svg viewBox="0 0 260 230" role="img" aria-label="Illustration of a sample audio cable"><ellipse cx="129" cy="110" rx="79" ry="68" fill="none" stroke="#263746" stroke-width="15"/><path d="M63 148 Q25 210 82 204 L100 194 M192 146 Q230 200 180 200 L165 188" fill="none" stroke="#263746" stroke-width="12" stroke-linecap="round"/><rect x="88" y="169" width="20" height="42" rx="5" transform="rotate(35 98 189)" fill="#798ca3"/><rect x="158" y="165" width="20" height="42" rx="5" transform="rotate(-35 168 185)" fill="#798ca3"/></svg></div><div class="product-copy"><p class="eyebrow">Northline Audio</p><h2>Studio cable</h2><p>3 ft · black · single cable</p><p class="price">$19.00</p><p>Selected merchant offer</p><span class="badge neutral">Synthetic product</span></div></div><div class="page-source"><strong>This is the source page.</strong><p>The first pilot uses Claude in Chrome. If a scripted check is needed, packaged tools can open a separate test browser. This panel shows a possible later progress view.</p>${button('Preview test window', 'test-window')}</div></div>`;
}

function frame(content, title) {
  return `<div class="browser-chrome"><span class="window-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="address-bar">${title}</span><strong>Review prototype</strong></div>${content}`;
}

function panel() {
  return frame(`<div class="panel-layout">${sourcePage()}<aside class="extension-panel"><header class="panel-header"><strong>Checkout QA</strong>${button('Expand results', 'results', 'subtle-link')}</header><div class="panel-main">${views[state.view]()}</div><footer class="panel-footer"><span class="connection">Local helper connected</span><span>Mock state</span></footer></aside></div>`, 'Google Shopping · current source tab');
}

function batchTable() {
  return `<table class="batch-table"><thead><tr><th>Product</th><th>Status</th><th class="optional-col">Next check</th></tr></thead><tbody><tr class="selected"><td>${button('Studio cable · 3 ft', 'finding', 'row-link')}<small>Northline Audio · row 12</small></td><td>${badge('Mismatch', 'warning')}</td><td class="optional-col">First shipping response</td></tr><tr><td>${button('Audio adapter', 'matched', 'row-link')}<small>Northline Audio · row 13</small></td><td>${badge('Checks matched', 'success')}</td><td class="optional-col">None in tested scope</td></tr><tr><td>${button('Travel case', 'buy-blocked', 'row-link')}<small>Trail Supply · row 14</small></td><td>${badge('Blocked', 'blocked')}</td><td class="optional-col">Confirm account access</td></tr></tbody></table>`;
}

function workspace() {
  return frame(`<div class="workspace"><aside class="workspace-nav"><strong>Checkout QA</strong><nav aria-label="Workspace navigation">${button('Current run', 'keep-run', 'selected')}${button('Reports', 'report')}${button('Setup', 'setup')}</nav><div class="nav-foot"><span class="connection">Helper connected</span><p>Agent review is on.<br>Mock state.</p></div></aside><section class="workspace-main"><header class="workspace-heading"><div><h2>Merchant onboarding</h2><p>Review products, evidence, and next checks.</p></div>${button('New run', 'setup')}</header><div class="workspace-split"><div>${state.view === 'setup' ? `<h3>Choose the test scope</h3><p class="small-copy">Start with the current product or paste a batch. Each source row stays attached to its result.</p><div class="notice">This full-tab design gives the product queue the most space.</div>` : batchTable()}<div class="notice"><strong>Original notes stay intact</strong>A run adds its own observations. Earlier claims are compared only after the fresh observations are saved.</div></div><section class="detail" aria-label="Selected product or run details">${views[state.view]()}</section></div></section></div>`, 'Checkout QA · full-tab workspace');
}

function guide() {
  const current = state.view === 'setup' || state.view === 'blocked' ? 1 : state.view === 'running' ? 2 : state.view === 'issue' ? 3 : 4;
  const steps = ['Choose products', 'Run the checks', 'Review findings', 'Save reports'];
  return frame(`<div class="guide"><aside class="guide-rail"><h2>Checkout QA</h2><div class="guide-steps">${steps.map((step, i) => `<div class="guide-step ${current === i + 1 ? 'selected' : ''}"><span class="guide-number">${i + 1}</span><span>${step}</span></div>`).join('')}</div></aside><section class="guide-body"><div class="guide-card">${views[state.view]()}</div><p class="guide-caption">One decision at a time. Evidence and the product queue open on demand.</p></section></div>`, 'Checkout QA · guided run');
}

function render() {
  $('#preview').innerHTML = ({ panel, workspace, guide })[state.concept]();
  document.querySelectorAll('[data-concept]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.concept === state.concept));
  document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.view === state.view));
  $('#announcement').textContent = `Showing ${state.concept} concept, ${state.view} state. Mock data only.`;
}

function showDialog(title, body) {
  $('#dialog-title').textContent = title;
  $('#dialog-body').innerHTML = body;
  $('#detail-dialog').showModal();
}

const previewDoc = `<div class="doc-preview"><p class="eyebrow">Mock — synthetic data</p><h3>Shipping needs a first-load fix</h3><p>One product shows $0.00 shipping on a fresh Google Buy. The same Ground method costs $7.00 on the storefront. Switching away and back restores that amount.</p><h3>Studio cable · Northline Audio</h3><p><strong>Product links:</strong> Google product and storefront product would link to the exact tested offer in the real report.</p><p><strong>Owner:</strong> unresolved between Google and BigCommerce. Observation confidence is high; owner confidence is low.</p><p><strong>Next check:</strong> capture the first shipping response before changing the selected method.</p><h3>Coverage and limits</h3><p>The audio adapter matched the tested checkout values. The travel case was blocked because Buy was unavailable. All checks stop before payment.</p><p>All figures and results in this preview are invented. Do not quote them as test findings.</p></div>`;

document.addEventListener('click', (event) => {
  const concept = event.target.closest('[data-concept]');
  if (concept) { state.concept = concept.dataset.concept; render(); return; }
  const view = event.target.closest('[data-view]');
  if (view) { state.view = view.dataset.view; state.stopped = false; state.paused = false; render(); return; }
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'mode-page' || action === 'mode-list') { state.mode = action === 'mode-page' ? 'page' : 'list'; render(); }
  else if (action === 'setup') { state.view = 'setup'; state.stopped = false; state.published = false; render(); }
  else if (action === 'start') {
    const links = $('#links-input');
    if (links && !links.value.trim()) { links.setCustomValidity('Add at least one sample link.'); links.reportValidity(); return; }
    if (links) links.setCustomValidity('');
    state.view = 'running'; state.paused = false; state.stopped = false; render();
  }
  else if (action === 'pause') { state.paused = !state.paused; render(); }
  else if (action === 'stop') { state.stopped = true; state.view = 'running'; render(); }
  else if (action === 'finding') { $('#detail-dialog').close(); state.view = 'issue'; render(); }
  else if (action === 'report') { state.view = 'report'; render(); }
  else if (action === 'skip') showDialog('Product skipped · preview', '<p>This product would stay blocked by missing contact details. Its checkout comparison remains untested. The real runner continues with the next eligible product.</p><p>No completed result is created for the skipped product in this preview.</p>');
  else if (action === 'results') showDialog('All results · mock run', batchTable());
  else if (action === 'keep-run') { state.view = 'running'; render(); }
  else if (action === 'google-source' || action === 'native-source') showDialog(action === 'google-source' ? 'Google product · evidence preview' : 'Storefront product · evidence preview', `<p>A real result opens the exact tested URL. This concept uses an invented product, so there is no live product link.</p><div class="product-summary"><strong>Studio cable · 3 ft</strong><p>Northline Audio · black · quantity 1</p></div><p>Link identity, timestamp, shipping method, and capture reference travel with every observation.</p>`);
  else if (action === 'matched') showDialog('Audio adapter · sample match', '<p>The same variant, quantity, destination, shipping method, tax, and total matched in this mock case.</p><p>The real tool reports “Checks matched,” with its exact coverage. It does not claim the merchant is ready for all products or that a transaction succeeded.</p>');
  else if (action === 'buy-blocked') showDialog('Buy unavailable · sample blocker', '<p>The travel case showed Visit site. The tool first checks the selected Google account. If access remains unresolved, the product stays blocked and its checkout values remain untested.</p>');
  else if (action === 'account') showDialog('Choose the test account', '<p>The proposed setup checks Buy access in the test browser. Being signed in to everyday Chrome does not confirm that the separate test browser has the same account.</p><p>If needed, the tool opens the test browser so you can sign in. It does not copy cookies or switch profiles silently.</p>');
  else if (action === 'destination') showDialog('Review the test destination', '<p>The proposed form collects a name, shipping address, email, and phone only when needed. One run uses the same authorized destination in both checkouts.</p><p>Contact details are excluded from reports. This design preview does not collect or retain them.</p>');
  else if (action === 'agent') showDialog('What Claude contributes', '<p>The first pilot uses Claude Desktop and Claude in Chrome with the QA skill. Add packaged testing tools only where the pilot proves they are needed.</p><ul><li>Review the item, variant, and evidence for every product.</li><li>Run follow-up checks when something is unclear.</li><li>Separate observations, existing notes, and inferences.</li><li>Explain owner confidence and the evidence still needed.</li></ul><p>Progress appears in Claude first. Mirroring it in this proposed panel needs an additional connection. No agent is connected to this preview.</p>');
  else if (action === 'test-window') showDialog('Separate test browser · mock view', `<div class="mock-order"><header><strong>Northline Audio</strong>${badge('Order review')}</header><p>Studio cable · 3 ft · quantity 1</p><div class="money-line"><span>Item</span><span>$19.00</span></div><div class="money-line"><span>Ground shipping</span><span class="flagged-amount">$0.00</span></div><div class="money-line"><span>Tax</span><span>$1.00</span></div><div class="money-line total"><span>Total</span><span>$20.00</span></div><span class="no-pay">Testing stops here. No payment action.</span></div><p class="help">Mock — all amounts above are invented. The packaged-tools fallback would keep the existing test browser and isolated merchant cart.</p>`);
  else if (action === 'sheet-preview') showDialog('Spreadsheet preview', `<p class="small-copy">Mock — synthetic data. Each real result would also include source links, evidence references, and separate observation and owner confidence.</p>${batchTable()}`);
  else if (action === 'doc-preview') showDialog('Google Doc preview', previewDoc);
  else if (action === 'publish') {
    if (!$('#sheet-output').checked && !$('#doc-output').checked) { showDialog('Choose a report destination', '<p>Select Spreadsheet detail, Google Doc summary, or both.</p>'); return; }
    const selected = [$('#sheet-output').checked ? 'Spreadsheet: new run-owned tab' : '', $('#doc-output').checked ? 'Google Doc: new document' : ''].filter(Boolean);
    showDialog('Browser publishing · simulation', `<p>Preview only: no Google files will change. The real tool shows the account, destination, and exact content before publishing.</p><ul>${selected.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><p>The publisher confirms the signed-in account and target file, writes the approved content, waits for save, reopens it, and compares the saved content.</p><p>The pilot creates new outputs. It does not rewrite shared notes. A partial save stays partial.</p>${button('Simulate save and read-back', 'confirm-publish', 'primary full')}`);
  }
  else if (action === 'confirm-publish') { $('#detail-dialog').close(); state.published = true; render(); }
  else if (action === 'download') {
    const csv = 'Mock — synthetic data. All values are invented.\nProduct,Status,Google initial shipping,Google after switch,Native shipping,Likely owner\nStudio cable,Mismatch,0.00,7.00,7.00,Unresolved Google or BC\nAudio adapter,Checks matched,,,,\nTravel case,Blocked,,,,Test setup unresolved\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'checkout-qa-MOCK-preview.csv'; a.click(); URL.revokeObjectURL(url);
    $('#announcement').textContent = 'Downloaded a CSV containing only invented preview data.';
  }
});

document.addEventListener('input', (event) => { if (event.target.id === 'links-input') event.target.setCustomValidity(''); });
document.addEventListener('submit', (event) => { if (event.target.id === 'phone-form') { event.preventDefault(); state.view = 'running'; state.paused = false; state.stopped = false; render(); } });
$('#close-dialog').addEventListener('click', () => $('#detail-dialog').close());
$('#detail-dialog').addEventListener('click', (event) => { if (event.target === $('#detail-dialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
render();
