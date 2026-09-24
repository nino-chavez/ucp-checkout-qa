import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Page } from './lib/cdp.mjs';

const script = new URL('./ucpqa.mjs', import.meta.url).pathname;

test('report links both product pages and flags a wrong native SKU despite matching totals', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ucpqa-report-'));
  try {
    const googleUrl = 'https://www.google.com/search?ibp=oshop';
    const nativeUrl = 'https://merchant.example/product?sku=EXPECTED';
    fs.writeFileSync(path.join(dir, 'google-row17.json'), JSON.stringify({
      kind: 'google', label: 'row17', url: googleUrl, status: 'order-review',
      offer: { merchantUrl: nativeUrl },
      initial: { method: 'Ground', shipping: 7.26, tax: 1.99, total: 26.25, itemPrice: '$17.00', qty: 'Qty: 1', methods: ['Ground'] },
    }));
    fs.writeFileSync(path.join(dir, 'native-row17.json'), JSON.stringify({
      kind: 'native', label: 'row17', url: nativeUrl,
      items: [{ sku: 'WRONG', qty: 1, price: 17 }],
      methods: [{ name: 'Ground' }], perMethod: { Ground: { shipping: 7.26, tax: 1.99, total: 26.25 } },
    }));
    execFileSync(process.execPath, [script, 'report', dir], { timeout: 5000 });
    const report = fs.readFileSync(path.join(dir, 'report.md'), 'utf8');
    const flags = JSON.parse(fs.readFileSync(path.join(dir, 'flags.json'), 'utf8'));
    assert.match(report, /\[Google\]\(<https:\/\/www\.google\.com\/search\?ibp=oshop>\)/);
    assert.match(report, /\[Native\]\(<https:\/\/merchant\.example\/product\?sku=EXPECTED>\)/);
    assert.match(report, /native cart SKU differs from product link/);
    assert.equal(flags[0].googleUrl, googleUrl);
    assert.equal(flags[0].nativeUrl, nativeUrl);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('report preserves blocked links from the all-link scan without checkout files', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ucpqa-scan-'));
  try {
    fs.writeFileSync(path.join(dir, 'scan.json'), JSON.stringify([{
      rows: [8, 9], url: 'https://www.google.com/search?item=blocked',
      status: 'visit-site-only', offer: { title: 'Example item', merchantUrl: 'https://merchant.example/item' },
    }]));
    execFileSync(process.execPath, [script, 'report', dir], { timeout: 5000 });
    const report = fs.readFileSync(path.join(dir, 'report.md'), 'utf8');
    assert.match(report, /## All-link scan/);
    assert.match(report, /\| 8, 9 \|/);
    assert.match(report, /visit-site-only/);
    assert.match(report, /https:\/\/merchant\.example\/item/);
    assert.match(report, /## Checkout comparisons/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('link input preserves sheet row references when one offer appears twice', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ucpqa-links-'));
  try {
    const input = path.join(dir, 'links.txt');
    const url = 'https://www.google.com/search?ibp=oshop&headlineOfferDocid:1234';
    fs.writeFileSync(input, `one ${url}\ntwo ${url}\n`);
    const rows = JSON.parse(execFileSync(process.execPath, [script, 'links', input], { encoding: 'utf8', timeout: 5000 }));
    assert.deepEqual(rows.map((row) => row.row), [1, 2]);
    assert.deepEqual(rows[0].sameLinkRows, [1, 2]);
    assert.equal(rows[0].docid, '1234');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('navigation error is surfaced instead of being mistaken for a page without Buy', async () => {
  const page = new Page({ send: async () => ({ errorText: 'net::ERR_NAME_NOT_RESOLVED' }) }, 'target', 'session');
  await assert.rejects(page.goto('https://invalid.example', 0), /navigation failed: net::ERR_NAME_NOT_RESOLVED/);
});

test('unverified merchant link is not labeled as native checkout evidence', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ucpqa-merchant-'));
  try {
    fs.writeFileSync(path.join(dir, 'google-row8.json'), JSON.stringify({
      kind: 'google', label: 'row8', url: 'https://www.google.com/search?item=8',
      status: 'no-buy', offer: { merchantUrl: 'https://merchant.example/product' },
    }));
    execFileSync(process.execPath, [script, 'report', dir], { timeout: 5000 });
    const report = fs.readFileSync(path.join(dir, 'report.md'), 'utf8');
    const flags = JSON.parse(fs.readFileSync(path.join(dir, 'flags.json'), 'utf8'));
    assert.match(report, /\[Merchant\]\(<https:\/\/merchant\.example\/product>\)/);
    assert.doesNotMatch(report, /\[Native\]\(<https:\/\/merchant\.example\/product>\)/);
    assert.equal(flags[0].nativeUrl, null);
    assert.equal(flags[0].merchantUrl, 'https://merchant.example/product');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
