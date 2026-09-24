# Likely-owner routing

This file is the single source for owner routing. Sheets and docs link here and don't restate the rules.

A category is a lead for investigation, not a confirmed cause. For each issue, record the category, observation confidence, owner confidence, basis, and the next check as separate fields.

## Categories

| Category | Assign when | Before assigning, check |
|---|---|---|
| **Google** | The submitted product record and the BC/UCP response are correct, but Google displays a different value, method, eligibility state, or product detail | A captured response or record. A UI difference alone is only a lead |
| **BC team** | The BC/UCP service response is wrong even though the product record is correct and the merchant configuration is intended | The service response itself |
| **Feed** | The submitted identifier, variant, price, availability, or attribute is wrong or missing, and that explains the Google result | The current feed record, not only an old sheet comment |
| **Merchant setting** | The native checkout returns the same shipping or tax value for the same method and destination, and the merchant confirms the configuration is intended | A native match shows agreement. It doesn't prove the setting is intended |
| **Test setup** | The problem depends on the tester, for example a non-allowlisted account showing Visit site | Reproduce with the intended account |
| **Unresolved** | The comparison stopped before the relevant response, feeds or logs weren't checked, or more than one system could explain the result | Name the exact record that would resolve it |

## Confidence

- **Observation confidence**: how sure you are that the behavior happens. High means it was reproduced on a fresh attempt.
- **Owner confidence**: how sure you are who owns it. High requires a primary record: a payload, a feed row, a log, or the merchant's configuration. Sheet notes and patterns seen on other stores count as medium at best.

## Patterns seen so far (leads, not rules)

| Pattern | Usual lead | What settles it |
|---|---|---|
| Buy → "This item is ineligible for checkout" | Feed: the feed ID doesn't map to a catalog SKU | Feed record against catalog SKU, plus a fresh service trace |
| Products with modifier options, or no SKU | Feed, fixed by a BC Surface filter (FP-18537) | The feed filter output |
| Initial $0 on the preselected method; switching away and back fixes it | Google/BC boundary (unresolved) | BC's UCP response for the first shipping selection before any change. BC returns no price or $0: BC. BC returns a price that Google drops: Google |
| Google lists a method the native checkout doesn't | Google/BC method mapping (unresolved) | Method IDs and names across the merchant response, BC output, and the Google picker |
| Google product attribute contradicts the offer (size, weight) | Feed, or Google attribute rendering | The submitted attribute for that exact offer |
| Listing delivery fee differs from the addressed checkout, which matches native | Merchant setting (Merchant Center shipping) | The merchant's Merchant Center shipping settings |
| $0 tax in some states only | Merchant setting (tax nexus or tax provider) | The merchant's tax configuration |
| No returns-policy link | Merchant setting | The channel's returns-policy URL |
| One-off "couldn't complete your purchase" | Unresolved transient error | The request ID and service logs at that time |
