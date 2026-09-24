# Known limits and verification

[Back to the README](../README.md)

**The pilot needs supervised testing.** [v0.1.0-pilot.1](https://github.com/nino-chavez/ucp-checkout-qa/releases/tag/v0.1.0-pilot.1) is published from commit `1a8a3b6`. The Chrome issues below remain in that installer. The updated instructions are on `main` at `c8bb19f` and await a new release. A release download does not establish readiness for routine coworker use.

## Chrome workflow

### Cart cleanup can remove unrelated items

In the published pilot, cleanup deletes every physical item in the merchant cart. An item added after the initial empty-cart check can be deleted too.

The updated runbook records cart and item IDs, then deletes only those recorded items. A dedicated testing profile reduces interference; it does not repair the older installer.

### A missing Buy button has more than one possible cause

The published pilot treats **Visit site** as proof that the account lacks program access. That conclusion is too strong.

The updated runbook checks the account first. If Buy remains absent on the approved account, it records the row as blocked with an unresolved owner.

### Native quotes need a clear evidence label

The published pilot reads rates through the merchant’s Storefront API, its programmatic checkout interface. It does not routinely restore the selected method and read the rendered checkout summary.

The updated runbook restores a shipping method and reads the checkout page. It requires an **API-only** label if that summary cannot be read. When method lists differ, confirm the native list on the rendered page before claiming a mismatch.

## Command-line workflow

The script chooses the first matching merchant link and Buy button. It does not prove that this is the offer the tester intended. The native script also fixes quantity at 1.

Add an offer check and stop on unsupported quantities before comparison. Until then, a reviewer must verify offer, variant, and quantity on both sides. A mismatch flagged after the run is not an early selection guard.

## Verification to date

- **Chrome proof, September 23, 2026:** KONG Halloween Snuzzles Ghost, SKU `HW26C112`, quantity 1. Google showed shipping $4.99, tax $0.92, and total $11.90; the native quote matched. The test cart was empty after cleanup.
- **Maintainer-reported check, September 24, 2026:** the updated runbook was exercised on the same KONG product. The maintainer reported a rendered total of $11.90 and cleanup that retained an unrelated cart item. This documentation review checked the source changes; it did not repeat that live test.
- **Google reports:** a scratch Doc and Sheet were created through Claude’s Drive connector. Saved content was read back, formatting was inspected, and the scratch files were trashed.
- **Command-line regression suite:** 17 tests passed at the reviewed source revision. These checks do not validate Chrome behavior.

The Chrome proof covered one product. A coworker has not yet completed a cold run using the installed skill in the Chrome side panel or Claude Desktop. Repeat batches and recovery remain unverified. Chrome-run cost, time saved, and ROI are unmeasured.

The [build plan](../decisions/browser-extension-plan.md) contains the evidence record and remaining pilot checks. The [interface concepts](../design/extension-review/index.html) use synthetic data. No custom browser extension has been built.

## Test boundaries and personal data

- Stop at order review. This test cannot verify completed payment, fulfillment, or refunds.
- The Chrome workflow relies on the skill’s instructions and Claude’s permissions. It has no custom code that makes payment controls unreachable.
- Test quantity 1. Use the same product, variant, destination, and shipping method for both comparisons.
- Enter shopper details only into authorized merchant checkouts. A guest email entered at checkout can leave an abandoned-cart record.
- Keep address files and run directories outside this public repository. `.gitignore` covers common names, not every possible filename.
- The command-line scripts redact supplied contact details. Review their output before sharing.
- Chrome screenshots can expose address, phone, and card endings. The runbook prohibits saving or sharing order-review screenshots; there is no automatic redactor.
- If a page changes or a step is blocked, report the limit. Do not guess missing amounts.

See the [report protocol](../skills/ucp-checkout-qa/references/protocol.md) for evidence labels and the [owner guide](../skills/ucp-checkout-qa/references/owner-routing.md) for issue classification.
