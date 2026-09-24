// Redaction for everything ucpqa writes. Two layers:
//  1. Exact values from the tester's address file, in every form a page may display them.
//  2. A generic pattern for other phone numbers and emails.
// The generic phone pattern requires separators and digit boundaries. An unanchored
// 10-digit pattern ate the first 10 digits of every Google offer docid (2026-09-23),
// which broke the reproduction links. A bare 10-digit phone is caught only by layer 1.

const esc = (s) => JSON.stringify(String(s)).slice(1, -1); // match inside a JSON string

function phoneForms(raw) {
  const d = String(raw).replace(/\D/g, '').slice(-10);
  if (d.length !== 10) return [];
  const [a, b, c] = [d.slice(0, 3), d.slice(3, 6), d.slice(6)];
  const base = [`${a}-${b}-${c}`, `(${a}) ${b}-${c}`, `(${a})${b}-${c}`, `${a}.${b}.${c}`, `${a} ${b} ${c}`, d];
  return [...base.flatMap((f) => [`+1 ${f}`, `+1${f}`, `1-${f}`, `+1-${f}`]), ...base];
}

export function makeRedactor(addr = {}) {
  const exact = [
    ...(addr.phone ? phoneForms(addr.phone) : []),
    ...[addr.email, addr.email && encodeURIComponent(addr.email), addr.address1, addr.address2].filter((x) => x && String(x).length > 3),
  ].sort((x, y) => String(y).length - String(x).length); // longest first, so '+1 …' goes before the bare form
  const phone = /(?<![\w+])(?:\+?1[ .-]?)?(?:\(\d{3}\) ?|\d{3}[ .-])\d{3}[ .-]\d{4}(?!\d)/g;
  const email = /[\w.+-]+@[\w-]+\.[a-z]{2,}(?:\.[a-z]{2,})*/gi;
  return (value) => {
    let s = JSON.stringify(value);
    for (const x of exact) s = s.split(esc(x)).join('[redacted]');
    s = s.replace(phone, '[phone]').replace(email, '[email]');
    return JSON.parse(s);
  };
}

export function parseMoney(v) {
  if (typeof v === 'number') return v;
  const m = String(v ?? '').match(/-?\d[\d,]*(?:\.\d+)?/);
  return m ? Number(m[0].replace(/,/g, '')) : NaN;
}
