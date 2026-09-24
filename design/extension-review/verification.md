# Extension design review: verification

Checked September 23, 2026. This receipt covers the proposed design and local prototype. It does not establish that a Chrome extension, agent worker, checkout run, or Google publisher works.

## What is ready to review

- [Build plan](../../decisions/browser-extension-plan.md)
- [Clickable prototype](index.html): three concepts, each with start, in-progress, finding, missing-input, and report views.
- Recommended direction: A, the side panel, with B's expanded results table and C's focused input prompt. Human selection remains open.

The prototype uses one fixed synthetic scenario. Pasted links are not executed or used to generate test results. Product names, amounts, statuses, connection indicators, source links, and report destinations are illustrative. No real personal details or live test evidence are included.

## Browser checks performed

The author inspected rendered frames in the Codex in-app browser, including the recommended side panel, the batch table, the guided finding, and the document preview. Desktop review used 1360 × 1000. A narrow-panel check used 390 × 844; the finding page's measured scroll width equaled its 390-pixel viewport, with no horizontal page overflow.

| Interaction | Observed result |
|---|---|
| Switch concepts and preview states | The chosen concept and state remain visible and correctly selected |
| Choose current page or list | Setup switches between the product card and link input |
| Submit an empty list | Stays on setup and displays “Add at least one sample link.” |
| Correct the empty list | The mock run starts |
| Pause, then resume | Status changes to paused, then returns to the shipping check |
| Stop the run | Shows incomplete evidence and untested products; does not show a full pass |
| Supply a synthetic phone number | Returns from the input prompt to the mock run; nothing is transmitted |
| Choose a product in expanded results | Closes the dialog and opens its finding |
| Preview spreadsheet and Doc | Opens labeled synthetic report examples |
| Preview publishing and simulate save | Shows the intended new-output behavior and explicitly states no Google files changed |
| Read browser error log after the checks | No page console errors returned |

The browser tool's first empty-string `fill` attempt did not clear the input. The author inspected the actual field, cleared it through the accessibility control, and then verified both rejection and recovery. This was a tool interaction issue, not counted as a successful validation check.

## Cold design review

A separate reviewer inspected the live prototype without the implementation brief. The reviewer preferred A for the single-product task and supported borrowing B's table and C's input prompts.

Changes following review:

- Replaced terse confidence labels with “Observation confidence” and “Owner confidence.”
- Labeled report choices and browser publishing as previews or simulations before the dialog opens.
- Tightened spacing below the main preview.
- Fixed product-row navigation so it closes the results dialog.
- Gave stopped runs their own incomplete state.
- Removed the skipped-product shortcut that displayed a completed report.

The guided concept still takes more scrolling to inspect evidence. That remains a visible tradeoff in the comparison, rather than a reason to merge its entire layout into A. This prototype is a review surface, not a full accessibility certification or production acceptance test.

## Earlier technical review of the worker proposal

A source-based architecture review found these gaps in the earlier worker proposal:

- Capture and compare the selected merchant offer; the current parser's first-link heuristic is insufficient.
- Prove the agent cannot reach the browser outside the controller. If isolation fails, use a model connection with no browser or shell access.
- Establish an Operator-owned streaming launch interface and verify the actual model and effort.
- Preserve an intermediate observation, requested follow-up, result, and revised conclusion across panel closure.
- Keep automatic Google writes to new outputs. UI editing cannot guarantee atomic updates to shared notes.
- Defer XLSX upload until its file transport and cleanup are designed.

The follow-up review reported no material contradictions in those edited areas at that time. The audience revision below supersedes that architecture; the earlier review does not verify the new route.

## Audience and existing-agent revision

The user confirmed that the pilot testers are CSMs and PMs who already use Claude Desktop and Claude in Chrome. The revised plan first tests a packaged skill in those tools. A Desktop QA tools package is a fallback for capability gaps; a custom launcher follows only for a demonstrated usability need.

The build plan now requires Google review capture, native-cart comparison, report conversion/readback, and repeat/recovery proofs. Source inspection also found that the native runner's cleanup deletes cart items inside its isolated guest context. That cleanup must not be copied unchanged into an ordinary Chrome session.

The preview remains a future custom-interface concept. Its introduction, start buttons, agent explanation, and Google integration note now state that distinction. Its earlier simulated browser-publishing screens illustrate the UI fallback, not a verified connector publisher. No authenticated experiment was run for this revision.

The author reloaded the revised preview, inspected the agent dialog's rendered frame and accessibility text, and confirmed that “Preview this test” still opens the simulated running state. JavaScript syntax, local links, and whitespace checks passed. This check did not repeat the earlier full three-concept review.

## Checks and limits

After PR #5 merged as `8476e2a`, the reviewer inspected the original Claude tool outputs and three rendered captures: Google's KONG order review, the scratch Google Doc, and the scratch Sheet. The checkout values and native quote match at $4.99 shipping, $0.92 tax, and $11.90 total. Drive creation returned native file types and readback returned the synthetic report contents. This is inspection of the earlier proof, not a new live run.

All 17 CLI tests passed again. A local review ZIP was rebuilt from the exact merged tree and each of its 11 files was compared byte-for-byte with that commit. A local cleanup fixture confirmed the current Chrome snippet deletes unrelated physical items introduced after its initial empty-cart check. The build plan records that finding and the remaining account-classification and native-rendered-summary gaps. No production fix was made during this review.

On September 24, the user required all setup, installation, and distribution to stay in the repo, then confirmed it should remain public. The README owns that process, and the plan points to it. Coworkers can read the instructions and download release assets without a GitHub invitation. A local ZIP is a build artifact, not a direct handoff. No release was published during this documentation change. The documented archive command and README image/link audit passed; this does not establish that a coworker can install or run the skill.

JavaScript syntax, local artifact links, and whitespace were checked. The source revisions and external documentation used for the plan are listed in its provenance section.

For the September 24 publication review, the CLI regression suite passed again. The README now distinguishes the single-product proof from a coworker test, lists the open runner issues, and labels the forecast as CLI-only. Vendor pricing pages were fetched again and the displayed estimates were recalculated. README formatting, local links, and anchors passed. The author inspected a local README render at GitHub content width and reopened the design preview. These checks did not rerun a merchant checkout or establish a released installer.

Not verified here: native-host installation, extension permissions, real model launch or isolation, offer capture across browsers, authenticated merchant behavior, Google formatting/save/readback, XLSX generation, second-machine installation, or extension cost and ROI. Those remain explicit build gates. No new merchant test or Google document edit was performed during this planning work.
