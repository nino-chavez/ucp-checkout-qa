# Test protocol and judgment layer

The scripts collect evidence. This file covers what the agent decides with it.

## Order of work

1. Collect your own observations before you read any prior claims. Write results to disk first, then compare.
2. Test each distinct link (docid) once. Rows that share a link share the result.
3. Run the quick checks first: rows expected to be blocked (ineligible, Visit site), then clean rows, then the rows with suspected shipping or tax problems.

## What each result field means

| Field | Meaning |
|---|---|
| `offer.listingDelivery` / `listingTotal` | Listing estimate for the link's `uuld=` location. It is not an addressed quote |
| `attempts[].readings[afterSec]` | Order review read at about 5, 15 and 30 seconds after Buy. Use the last settled reading as "initial" |
| `initial.method` / `methods` | The method Google preselected, and every method Google offers |
| `steps.reselect` / `switch` / `switchBack` / `reopen` | The $0 workaround sequence, and whether the $0 comes back on a fresh Buy |
| `native.perMethod` | The merchant's own quote for every method, same address and quantity 1 |
| `native.renderedSummary` | The native checkout page, left on `--method`, as a cross-check on the API numbers |

## Evidence labels

Label every statement in the report with where it came from:
- **Observed in this run**: you saw it in a result file or on the page during this run.
- **Reported in an existing note**: a sheet note, a teammate's findings, or a service-log quote you did not inspect yourself.
- **Inferred**: your reasoning from the above. Never present an inference or a quoted note as something you checked.

## Reading the rendered native method list

The API method list (`native.methods`) is usually enough. When it disagrees with Google's list, confirm it on the rendered page, because a correction rests on it:
1. Open the product URL in a guest browser window and add the same variant, quantity 1.
2. Open `/checkout`. At the customer step, **uncheck "Subscribe to our newsletter"** (it is pre-checked), enter the authorized email, and continue. Do not create an account.
3. Fill the shipping address with the same destination. The method list appears under it.
4. Record every method name and price, then empty the cart.
5. In the report, note that the guest email is now attached to an abandoned checkout.

## Verdict vocabulary (for prior claims)

- **Reproduced**: your observation matches the claim.
- **Contradicted**: your evidence shows the claim is wrong. Name the evidence, and check the native side twice. Carrier rate lists can change between runs, so give the time of your check.
- **Not reproduced**: the claimed defect did not occur for your account and destination.
- **Blocked**: the step couldn't be reached, for example because the item is ineligible or the test stops before payment.

Split a compound claim into parts and give each part its own verdict.

## Traps seen in live runs

- **Visit site instead of Buy** usually means the account isn't on the UCP allowlist. Preflight probes for it.
- **Second-account tabs froze** while Chrome's "Separate browsing?" prompt was pending. Preflight checks for it.
- The **email form of `authuser`** falls back to the first account. Preflight resolves the numeric index instead.
- A **$0 first shipping charge** on the preselected method can persist through a reselect and come back on every fresh Buy. Switching away and back gives the real charge.
- **Google can list a method the merchant doesn't offer** (seen: an extra USPS First-Class priced like native Parcel Select Ground). Compare method names, not only totals.
- **"We couldn't complete your purchase. Please try again later."** was seen once and cleared on retry. Report both attempts.
- **The saved Google address is already present**, so the before-address state usually can't be observed. Say so.
- **Product attributes** in Google's panel can contradict the offer (seen: "Packaging Size 16 fl oz" on a 4 fl oz offer). Read `offer.attributes`.

## Limits to state every time

- The account and destination tested.
- That the run stopped before payment.
- The rows that were not tested.
- Whether native method lists came from the rendered page or only from the API.
- Any side effects, such as a guest email attached to an abandoned checkout after a manual rendered-list check.
