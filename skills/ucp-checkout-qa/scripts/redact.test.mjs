import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRedactor, parseMoney } from './lib/redact.mjs';

// Real row 12 Google URL: its docid is 19 digits and must survive redaction intact.
const ROW12 = 'https://www.google.com/search?q=ZenPro%20Audio%20products&ibp=oshop&prds=headlineOfferDocid%3A3286405574235035501%2Cpvt%3Ahg%2Cpvo%3A29&oshop=apv&uuld=palo+alto&gl=us&hl=en&sec_src=editors';
const ADDR = { address1: '123 Example St', phone: '5555550100', email: 'tester@example.com' };

test('identifiers and prices survive redaction', () => {
  const r = makeRedactor(ADDR);
  const out = r({ url: ROW12, docid: '3286405574235035501', srsltid: 'AU7gw4VfdIyv3JTCvAK23qhF', price: '$1,195.95', at: '2026-09-24T00:25:53.410Z', sku: '32883-3F' });
  assert.equal(out.url, ROW12);
  assert.equal(out.docid, '3286405574235035501');
  assert.equal(out.srsltid, 'AU7gw4VfdIyv3JTCvAK23qhF');
  assert.equal(out.price, '$1,195.95');
  assert.equal(out.at, '2026-09-24T00:25:53.410Z');
  assert.equal(out.sku, '32883-3F');
});

test("the tester's own phone is redacted in every display form", () => {
  const r = makeRedactor(ADDR);
  for (const form of ['+1 555-555-0100', '(555) 555-0100', '555.555.0100', '555 555 0100', '5555550100', '+15555550100']) {
    assert.doesNotMatch(JSON.stringify(r({ line: `Tester | ${form} | Flat rate` })), /555.?555.?0100/, form);
  }
});

test('street address and email are redacted, including URL-encoded email', () => {
  const r = makeRedactor(ADDR);
  const out = JSON.stringify(r({ a: 'Tester | 123 Example St | Aurora, IL', b: 'tester@example.com', c: 'x?e=tester%40example.com' }));
  assert.doesNotMatch(out, /123 Example St|tester@example\.com|tester%40example\.com/);
});

test('without an address file, separated phone numbers and emails are still redacted', () => {
  const r = makeRedactor();
  const out = JSON.stringify(r({ a: '+1 312-555-0199', b: '(312) 555-0199', c: 'someone@example.org' }));
  assert.doesNotMatch(out, /555-0199|someone@example\.org/);
});

test('parseMoney handles thousands separators and currency text', () => {
  assert.equal(parseMoney('$1,195.95'), 1195.95);
  assert.equal(parseMoney('+ $4.99'), 4.99);
  assert.equal(parseMoney(18.99), 18.99);
  assert.ok(Number.isNaN(parseMoney('Free')));
});
