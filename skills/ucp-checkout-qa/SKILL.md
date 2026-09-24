---
name: ucp-checkout-qa
description: Verify Google UCP (Universal Commerce Protocol) Buy links for BigCommerce merchants end to end through order review, compare product, shipping, tax, and totals against the merchant's native BigCommerce checkout, and produce a row-by-row report with likely owner (Google, BC, feed, or merchant setting). Runs through Claude in Chrome with no install, or through browse-tool scripts from a terminal. Use when onboarding new UCP merchants or products, retesting a UCP testing sheet, independently verifying someone else's UCP test notes, or when asked why a Google Buy flow shows the wrong shipping, tax, total, or an eligibility error. Stops before payment.
---

# UCP checkout QA

Test Google UCP Buy links the way a shopper sees them, compare every number with the merchant's own BigCommerce checkout, and report what matches, what doesn't, and who most likely owns each problem.

**Hard boundaries.** Stop at order review, and never click a pay or place-order control. Don't change payment details, create accounts, or subscribe to marketing. Don't edit a shared sheet or doc unless the user says so, and then append instead of overwriting. Keep the tester's address, phone, email, and card out of anything shared. The command-line scripts redact these automatically, and its screenshots must be cropped before sharing. The Chrome runner never saves order-review screenshots.

## Choose a runner

| Runner | Use when | Instructions |
|---|---|---|
| **Chrome** | Claude in Chrome tools are available. No terminal or install; the usual choice for CSMs and PMs, single products, and small batches | [references/chrome-runbook.md](references/chrome-runbook.md) — follow it instead of the command-line Setup, Inputs, and Workflow sections |
| **Command line** | A terminal with Node and browse-tool. Large batches, repeat runs, or a second check on a screen-read Chrome result | The setup and workflow sections below |

Both runners follow [references/protocol.md](references/protocol.md) and [references/owner-routing.md](references/owner-routing.md), and produce the Deliverable described below.

## Setup (command-line runner, once per machine)

1. Node 22 or newer.
2. [browse-tool](https://github.com/nino-chavez/browse-tool): clone it, `npm install`, put `bin/` on PATH, and install Chrome for Testing as its README describes.
3. Run `browse-start` **headed**, without `--headless`. In that Chrome window, sign in to the Google account that is on the UCP allowlist, and dismiss any "Separate browsing?" prompt by staying in this profile.

## Inputs (command-line runner) — ask for any that are missing

| Input | Notes |
|---|---|
| Buy links | Sheet export (`.xlsx`: download the Google Sheet; `HYPERLINK()` formulas are parsed), or a text file / pasted list of `google.com/search?…ibp=oshop…` URLs |
| Rows to test | e.g. `4,8-9,11-17`; default is all rows with a link |
| Tester's allowlisted Google email | Used only to find the right `authuser` index |
| Destination address | Write it to a local JSON file outside the repo. Shape: `examples/address.example.json` |
| Prior claims to verify (optional) | Existing sheet notes or another tester's findings. Treat them as hypotheses, not evidence |
| Write back? | Default: report in chat only. Update the sheet or doc only with explicit approval, and only for materially new findings |

## Workflow (command-line runner)

```bash
Q=<skill-dir>/scripts/ucpqa.mjs; OUT=./ucp-qa-$(date +%F); ADDR=~/ucp-qa-address.json
node $Q preflight --email you@commerce.com --probe "<one Buy link>"   # must end "ready": true; note authuser
node $Q links sheet.xlsx --tab "Commerce Internal Testing" --rows 4,8-17 > $OUT-links.json
node $Q scan sheet.xlsx --tab "Commerce Internal Testing" --rows 4,8-17 --authuser 1 --out $OUT
# Review $OUT/scan.json and confirm each intended product/variant before checkout.
# for each distinct docid (rows sharing a link are tested once):
node $Q google "<buy url>" --authuser 1 --label row12 --address $ADDR --out $OUT
node $Q native "<offer.merchantUrl from the google result>" --label row12 --method "<initial.method>" --address $ADDR --out $OUT
node $Q report $OUT        # writes $OUT/report.md + flags.json
```

1. **Preflight** must pass before anything else. If "Visit site only" shows up for a link, check the account before calling it a defect.
2. **Scan every distinct link before checkout.** `scan.json` records navigation, page title, Buy/Visit site, and the merchant link. Check that each page shows the intended product and variant; `buy-present` is a control hint, not a pass. Blocked links remain in the final report.
3. **Google** for each passing link. The script records the offer and the listing estimate, clicks Buy, and reads order review at about 5, 15, and 30 seconds. When the first shipping charge is $0 it runs reselect → switch → switch back → fresh Buy. It retries "couldn't complete your purchase" once and keeps both attempts. Pass `--alt "<method>"` to choose the switch target, and `--price-methods` to price every method.
4. **Native** only when Google reached order review. It runs in an isolated guest browser context: it adds the same variant through `?sku=` from Google's merchant link, gets a quote for the same address from the Storefront API for every method, reads the rendered checkout summary, and empties the cart. If the native URL has no `sku=` and the product has options, the report flags the variant as not pinned; rerun `native` with a URL that carries `?sku=`. When the method lists differ, confirm the native list on the rendered page by hand ([references/protocol.md](references/protocol.md)).
5. **Report**: `report.md` holds the all-link scan and mechanical flags. You then write the judgment layer described in [references/protocol.md](references/protocol.md): verdicts against prior claims, new findings, and limits. Assign a likely owner with [references/owner-routing.md](references/owner-routing.md).

## Deliverable

Lead with the answer: what reproduced, what was contradicted, what's new. Then give:
- A row table with direct Google and native product links, initial Google, after workaround, native, and flags.
- One verdict per prior claim: reproduced, contradicted, not reproduced, or blocked.
- Likely owner and confidence per issue.
- Limits.
- Short sheet-ready notes.

Report a listing estimate (from the link's `uuld=` location) separately from an addressed checkout quote. Never mark a merchant "transaction-successful". This test ends before payment.

## When a script fails

Scripts stop with `selector not found: …` when Google or a theme changes its markup. Fix the selector in `scripts/ucpqa.mjs` and don't guess values. Non-Stencil storefronts may lack `#form-action-addToCart`. For those, add the item by hand in the isolated window.
