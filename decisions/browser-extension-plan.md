# Run checkout QA from Chrome

Status: proposal for Nino's review, September 23, 2026. Custom-extension implementation has not started.

Update: the Chrome skill runner is now merged in [PR #5](https://github.com/nino-chavez/ucp-checkout-qa/pull/5), commit `8476e2a`. The custom extension remains unbuilt. Source review and the captured proof outputs support the first three feasibility checks for one product and synthetic reports; the coworker and repeat/recovery gates remain open.

Prove the workflow in Claude Desktop and Claude in Chrome before building a custom extension. Pilot testers already use these tools. Package the protocol, required-input prompts, evidence format, and report templates as a skill. If that preserves the required checks, it is the simplest first release for customer success managers and product managers.

Keep a Claude Desktop QA tools package as the next option when the browser agent cannot reliably perform a check. It would wrap the existing scripts. Add a custom Chrome launcher only if the pilot reveals a remaining need for product selection, batch handling, or a dedicated results view.

This supersedes the earlier independent-agent-worker proposal. Neither Claude Code CLI nor terminal proficiency is a tester prerequisite. The coworker test should assess installation and correct results, not willingness to learn the CLI.

[Open the interactive design review](../design/extension-review/index.html). Its three layouts remain options for a future custom interface. Products, amounts, results, connections, and saves are synthetic. Live progress in our own panel is not promised for the first pilot.

## Constraints confirmed in this session

- Offer two starting points: test the current Google Shopping page, or test a list of links.
- Keep agent judgment during testing, including follow-up checks and evidence-based conclusions.
- Verify the selected merchant offer, variant, and quantity before Buy.
- Stop at order review before payment.
- Produce a detailed spreadsheet and readable document from the same saved observations. Include exact Google and native product links.
- Require no Google Cloud or Workspace project, custom OAuth client, or service account. Browser publishing is the session's established approach; the built-in Drive connector is a proposed simplification to verify.
- Use browse-tool's Chrome extension and local host as prior art if a local bridge is needed.
- CSMs and PMs already use Claude Desktop and Claude in Chrome. Some have Claude Code CLI; it stays optional.
- Simplify setup without silently dropping coverage, cart isolation, evidence, or reports.
- Keep the repo public, with setup, installation, and distribution in the repo. The [README distribution section](../README.md#distribution) owns the process. Coworkers do not need a GitHub invitation to read it or download releases. Do not distribute ZIPs directly.
- Review the plan and design before building a production extension.

These constraints record the user's Google integration, browser-tool, and audience corrections. This document owns the project-specific requirements.

## Start with the agent the tester already uses

The tester supplies the current product or a list, invokes the QA skill, and sends the task. Claude checks readiness, asks for missing details, runs the checks, investigates anomalies, saves observations, and produces reports. Questions and progress appear in Claude.

The repo should contain the skill, a visual setup guide, prompts for both entry modes, report templates, and troubleshooting. Derive these from the existing protocol and owner-routing files. Keep one testing standard. Testers use the public README and browser download/upload steps, with no repository invitation, package manager, debugging ports, or shell commands.

Use Solution Architecture voice for this plan and Documentation voice for setup. Carry over evidence discipline and clear subjects, not blog cadence or personal reflection.

| Approach | Tester setup | Missing proof | Position |
|---|---|---|---|
| QA skill with Claude Desktop / Claude in Chrome | Existing apps, skill, permitted Drive connector | Frame capture, native comparison, clean carts, repeatable evidence and reports | Test first |
| Claude Desktop QA tools package (`.mcpb`) | Install a repo release asset; guided test-browser preparation | Compatible runtime, dependencies, cleanup, recovery, second-machine setup | Add for a demonstrated capability gap |
| Custom Chrome launcher with QA package | Reviewed Chrome extension plus the package | Product capture and handoff; separate connection for live progress | Add for a demonstrated usability gap |

Keep familiar conversation, repeatable checks, and explicit product selection. Do not add a separate agent login.

### Supported features still need an integration test

Anthropic documents Chrome control from Desktop and skill/connector support in the Cowork side panel. Availability depends on plan, rollout, and organization settings. Check the pilot's actual surface. [Claude in Chrome](https://support.claude.com/en/articles/12012173-get-started-with-claude-in-chrome)

Desktop supports private `.mcpb` packages and includes Node.js. That can remove manual Node installation, but our scripts require Node 22+ and compatible browser dependencies. No package has been built here. If needed, publish packages and update instructions through repo releases. [Desktop extensions](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop)

A later launcher can prefill a task through a documented Desktop link. The tester reviews and sends it. A link does not start unattended work or return live events. Keep shopper details out of URLs; use a reviewed attachment for long batches. [Desktop links](https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link)

If a Chrome launcher is justified, use a reviewed private Web Store listing or approved managed deployment. Unpacked installation is a developer method. [Chrome distribution](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution)

## Prove four things before choosing the implementation

Start with one known product, then repeat against representative cases. Retain offer identity, account and destination aliases, versions, timestamps, and evidence.

| Proof | Acceptance evidence | If it fails |
|---|---|---|
| Google order review | Product, variant, quantity, method, subtotal, shipping, tax, total, and currency match a human reading of the same live state. Preserve initial, reselected, switched-back, and fresh-Buy readings. | Test a narrow packaged capture tool. Screenshot extraction must retain readable evidence and flag uncertainty. |
| Native comparison | Same item, variant, quantity, destination, and method. Compare API quotes with rendered checkout. Prove clean start and cleanup after success, failure, and cancellation. | Reuse the isolated-cart runner through packaged tools. |
| Google reports | Create scratch Doc and Sheet through the actual Claude connector. Verify native file types, exact values, product links, headings, tables, and spacing after reopening. | Try supported DOCX/XLSX conversion or browser publishing. Keep downloadable reports if save verification fails. |
| Repeat and recover | Fresh run and short batch; interrupt and resume; preserve earlier failures and every source row. Prove no cart state leaks between runs. | Add the missing persistence or deterministic check. One successful run is insufficient. |

### Evidence from the merged Chrome runner

The reviewer inspected Claude's original tool results and rendered captures from September 23, rather than relying only on the PR description:

- KONG Halloween Snuzzles Ghost, SKU `HW26C112`, quantity 1: Google's screenshot shows Flat rate shipping $4.99, tax $0.92, total $11.90. The native Storefront API output matches those amounts. Its cleanup output reports zero carts.
- Drive creation returned native Google Doc and Sheet MIME types. Independent connector reads returned their content. The captured Doc shows heading hierarchy, a numbered list, a link, and a readable table. The Sheet capture shows the imported rows and links. A later readback confirms the currency-string example retains `$11.90`.
- Local `main` and GitHub both resolve to `8476e2ac8eba798fcfedc94d0dda94ff267efee7`. The reviewer reran all 17 CLI regression tests successfully and rebuilt the ZIP from that exact Git tree.

This is one product tested through Claude's connected tools, not a cold run of an uploaded skill in a CSM's app. It does not prove batches, interruption recovery, the $0 workaround sequence, or repeat-run cleanup. The reviewer inspected historical evidence and did not rerun a live checkout.

Before coworker handoff, address these runbook findings:

- Cleanup still deletes every physical cart item. A local fixture confirmed that it also deletes an unrelated item added after the initial empty-cart check. Capture run-owned cart/item IDs and remove only those; if ownership is uncertain, stop cleanup and report it.
- The setup text treats Visit site as proof of a non-allowlisted account. Check the account first, but keep unresolved Buy absence blocked rather than assigning a cause from that button alone.
- The normal native path quotes the API without explicitly reading the rendered checkout summary. Restore the intended method and capture its rendered summary, or state that the comparison was API-only. The existing protocol defines both sources.

Update, September 24, 2026: all three are fixed in the runbook on `main` (run-owned cleanup, account check before blocking, rendered-summary read), after v0.1.0-pilot.1. They were checked live on the KONG product in the Tart test Mac, including an unrelated item added mid-run that cleanup left in place. These were originally review findings, not fixes already made. The rebuilt ZIP matches the merged source and is a local review artifact. It is not a coworker handoff. Installation and distribution go through the public repo; no GitHub invitation is needed. No pilot release is published as of September 24, 2026.

The captured proof establishes screenshot access to one Google review. Its top-page script returned no frame text; that does not establish a universal limitation for every tool version. Historical amounts such as $11.90 are clues, not a future run's ground truth. Recheck prices and addressed quotes each time.

BigCommerce documents storefront JavaScript requests in the current shopper session. Native quotes through browser JavaScript are therefore plausible, but their session context matters. [BigCommerce REST Storefront context](https://docs.bigcommerce.com/developer/docs/overview/api-fundamentals/api-accounts.md)

Our native runner creates an isolated guest context and deletes cart items during cleanup. Copying that cleanup into ordinary Chrome could remove pre-existing items. A dedicated testing profile separates personal browsing but is not a fresh cart for every run. Require an empty starting cart or stop; track only items created by the run and verify cleanup. No profile creation or replacement is part of this planning work.

## Both entry modes follow one protocol

1. Capture the Google link, intended merchant, product, variant, quantity, and source row. Resolve multiple offers before Buy.
2. Check the active Google account and Buy availability. A non-allowlisted account is a setup issue, not proof of a merchant defect.
3. Collect missing shopper details and identify which merchant checkouts receive them. Authorization persists through retries in that run.
4. Scan all distinct links before checkout testing. Preserve sheet/tab/row labels, or input line numbers. Keep blocked and untested rows.
5. Compare through order review. Save initial readings before retries or shipping changes. Keep the method name beside every amount.
6. Review every product's evidence, including products with no automatic flag. Investigate anomalies and separate observations from hypotheses.
7. Save the structured result, generate both reports, verify publication, and finish without paying.

Pilot quantity is 1. Verify both sides and stop visibly on another quantity. The native script currently sets 1 and must not silently compare against a different Google quantity.

Pasted links are the first batch format. Live Sheet import and XLSX upload need their own range/file handling. Reuse results only when offer, variant, quantity, destination, and test conditions match; retain every original row reference.

## Preserve judgment and describe the controls accurately

The agent must receive observations, choose follow-ups, inspect results, and revise or qualify conclusions during the run. A final summary alone is insufficient. Retain actions, observations, conclusions, and evidence links; hidden model reasoning is not a report dependency.

| Code and templates | Agent judgment | Tester input |
|---|---|---|
| Parse observations, compare values and methods, validate coverage, redact, render reports | Confirm offer/variant parity, investigate unfamiliar behavior, challenge prior claims, qualify likely owner | Missing details, ambiguous offer, sign-in, challenge, unsupported flow, report destination |

Claude in Chrome follows the skill and its own permission system. This is not our code-enforced guarantee that payment is unreachable. Anthropic documents prohibited purchases and configurable permission modes. Prove that opening order review is permitted; do not bypass a protection to pass the experiment. [Chrome permissions](https://support.claude.com/en/articles/12902446-claude-in-chrome-permissions-guide)

A QA package should expose named test operations, exclude payment, and accept no arbitrary shell or JavaScript. Those limits apply to its tools. A Claude session with another browser tool can act outside them. A hard boundary for unattended execution requires a separately restricted agent connection and proof; neither a prompt nor a tool list establishes it.

Use Operator's classification rules as model guidance: routine formatting uses the fast route, browser work the capable implementation route, and adversarial retesting the deep route. Keep model mappings in Operator. Our package does not control Desktop's selected model. Record the displayed model and mark runtime identity or token usage unavailable when not exposed.

### Keep the existing runner available

```text
First proof
  Claude Desktop / Claude in Chrome
    QA skill and evidence rules
    browser checks
    saved observations and verified reports

If a check needs deterministic tools
  same Claude session
    QA tools package
      existing scripts and isolated merchant carts

If selection or batches remain awkward
  Chrome launcher
    prepared task for the tester to send in Claude
```

The current parser prefers a link containing `sku=`, then the first external link. Its Buy selector takes the first matching control. Fix selected-offer identity before using that code behind any new interface. Include a test where the chosen merchant is not first.

| Existing source | Role |
|---|---|
| `skills/ucp-checkout-qa/references/protocol.md`, `owner-routing.md` | Canonical testing and evidence rules |
| `skills/ucp-checkout-qa/scripts/ucpqa.mjs`, `lib/cdp.mjs`, `lib/redact.mjs` | Observations, isolated contexts, comparisons, redaction; extract callable functions as needed |
| browse-tool's extension, native host, and installer | Active-tab capture, framed messages, identity, and installation safeguards |
| Operator's `src/operator_plane/dispatch.py` | Optional CLI reference, not a Desktop prerequisite |

Page Feedback does not start agents or inject prompts into chats. Native messaging connects an extension to a separately installed process; it is not a scheduler. Reuse that pattern only when a live local connection is needed. Keep UCP behavior in this repo. [Chrome native messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)

A package using the existing test browser must provide guided preparation and check its Google login. Coordinate access with the profile lease. Lost connections become interrupted checkpoints. Resume revalidates account, item, and checkout. These are unbuilt requirements.

## One saved result feeds both reports

The shared record contains:

- Run ID, schema/protocol version, timestamps, account/destination aliases, and model/usage availability.
- Source rows, exact product URLs, merchant, offer, variant, quantity, and attempted/blocked/untested checks.
- Observations with source, time, method, currency, amounts, and evidence references.
- Findings with claim, evidence class, prior-claim verdict, likely owner, observation confidence, owner confidence, and next check.
- Publication URL, content version, and verification state.

Use minor currency units. Missing values remain unknown. Different method names or variants remain mismatches even when totals match. Separate listing estimates from addressed quotes. “Checks matched” applies only to the item and conditions tested; it is not transaction success.

The [owner-routing guide](../skills/ucp-checkout-qa/references/owner-routing.md) owns classification. Observation confidence and owner confidence remain separate.

### Spreadsheet

Use a compact product-results table and a separate findings table for reproduction notes. Include initial and changed Google readings, native readings, method names, product links, source rows, evidence, owner, confidence, and next check. Preserve IDs as strings and neutralize formula-like untrusted text.

CSV carries values, not a styled workbook, multiple tabs, or frozen headings. Use XLSX or verified Sheet formatting when those are required.

### Document

Use a versioned template: result first, coverage and limits, material findings, short reproduction steps, exact Google/native links, owner uncertainty, and evidence needed next. Keep headings and paragraph spacing consistent. An extracted merchant URL does not prove native checkout was inspected.

### Shopper details

Do not put this session's personal details into the package or reuse them for future testers. Collect each run's authorized details and exclude them from reports, URLs, diagnostics, and retained screenshots.

A local package keeps details in memory by default and clears them at run end. Restart may require re-entry. Saving details between runs needs explicit opt-in, secure storage, and deletion controls. Claude history, browser autofill, and merchant records follow those products' retention controls; clearing our helper cannot erase them. Preserve existing profiles and user files.

## Verify Google reports after saving

Anthropic's Workspace connector help documents uploads with optional conversion to Google formats. This supports trying the connector before editor keystrokes. It does not prove that a particular Markdown or CSV import preserves our formatting or that each tester has write tools enabled. [Google Workspace connectors](https://support.claude.com/en/articles/10166901-use-google-workspace-connectors)

Use the actual Claude connector and account. Confirm native Google file types; storing a source file in Drive is insufficient. Reopen and compare values, links, headings, tables, and visible spacing. Text readback alone cannot verify formatting. Record the tool and source format used.

Use the built-in connector when permitted and proven. It needs no custom project maintained by us. Keep signed-in Google UI publishing as the fallback, with formatting, save checks, and independent readback. Do not call undocumented endpoints to compensate for missing tools.

Default to a new Doc and new spreadsheet. A browser publisher may instead add a run-owned tab to an explicitly selected Sheet. Existing shared notes and formulas stay outside automatic writes; prepare amendments for human review.

Show account, destination, and exact content before publishing. Retain authorization for the same retry. Track the run ID and target URL to prevent duplicate outputs. A failed readback stays partial or unverified, with downloadable source available. UI editing cannot guarantee atomic changes while someone else edits the same cells.

## Let the coworker test decide what to add

1. Check Chrome, skill, and connector permissions on the tester's actual Claude surface, plus Google Buy allowlist access.
2. Run the four feasibility proofs, then the representative cases below. Claude's pasted proposal is not a completed test receipt.
3. Give a CSM or PM the public repo's README link. Have them follow setup and download the pilot release there. Record whether they reach a correct, verifiable report without a terminal or author takeover. Count assistance explicitly.
4. Add deterministic tools for measured capability gaps. Add a launcher only if product selection, batches, or reviewing results remains a meaningful obstacle.

If a Desktop package becomes necessary, repeat installation on another machine, including browser preparation, restart/reconnect, and updates. Do not hide those steps behind “one click.”

Acceptance cases include:

- Matching item; wrong-account Buy absence; non-first merchant; ambiguous variant; unsupported quantity.
- Initial $0, unchanged reselect, changed switch-back, and recurrence on fresh Buy.
- Equal totals with different methods; API options versus rendered checkout options.
- Transient Buy failure retained after retry; missing details; interruption; batch with blocked rows.
- Product links and source rows preserved; readable long report; partial publication and duplicate retry.

Use fixtures for code comparisons and the project's test runner for regressions. Live authenticated runs establish browser behavior. A coworker independently inspects evidence and reproduces a material finding. Scripts repeat a procedure; they do not guarantee identical results when prices, pages, stock, or account state change.

## Keep the custom designs available for review

The existing preview compares three concepts using the same synthetic states. Its design intent is rethink.

| Concept | Best fit | Tradeoff |
|---|---|---|
| A. Beside the page | One product with its context visible | Narrow panel needs progressive disclosure |
| B. Batch workspace | Queue and results together | Heavier for one product; leaves the shopping page |
| C. Guided run | One decision or missing input at a time | More navigation on repeat runs |

If a custom interface is needed, prefer A with B's expanded table and C's focused input prompt. Leave out B's permanent navigation and C's mandatory sequence. Human selection remains pending.

Tokens come from browse-tool's popup: system typography, `#20252b` text, `#526171` secondary text, `#185abc` actions, `#dce2e8` borders. This is not a Google or BigCommerce brand claim. The mock covers start, progress, findings, input, and reports. Claude supplies those interactions in the first pilot; mirrored progress in our panel requires a new connection.

## Measure cost and value on comparable tests

The [README estimates](../README.md#cost-estimates) cover prior exploration and a CLI forecast, not this browser-agent route.

Record setup, supervision, review, correction and publishing time, retries, elapsed time, coverage, and correctness. Capture model/token usage only when available. Distinguish plan allowance, API-price equivalent, and actual additional spend. Start a batch with its protocol and evidence rather than this whole conversation.

Apply the existing ROI formula using measured inputs, including maintenance and setup. Merchant/product frequency is unknown, so custom-extension payback is unestablished. Equivalent coverage and correctness must pass before time saved counts as a benefit.

## What would change the recommendation

- Unreliable review capture: add a narrow capture tool before a whole extension.
- Failed isolation or repeatability: package the existing isolated runner.
- Organization blocks a tool: verify permitted alternatives; a custom extension does not automatically escape that policy.
- Hard payment boundary required: design and prove restricted execution separately.
- Connector conversion fails: retain local files and verified browser publishing; one failed import format does not rule out others.
- Correct testing with awkward selection or batches: build the smallest interface that removes the observed obstacle.

## Evidence and open work

Checked September 23, 2026:

- QA `450d16fdccce8611565644bfbdba7cdb765edbd9`: link heuristics, quantity behavior, frame capture, isolated context/cleanup, reports, protocol, owner routing.
- browse-tool `55bdb93fd93fbd07e5e6c782404d3741e7f0f6cc`: extension/host, installer safeguards, explicit agent-launch limit.
- Operator `54e575f3109f93d1b10d40e7f3af324df04994f4`: routing, classifier dependency, buffered dispatcher, CLI discovery. App-bundled Codex responds; a clean standard shell does not find standalone `codex`. Coworkers do not need it for this proposal.
- Official sources above fetched directly. Workspace help documents broader Drive tools than the separate Docs-context integration page. Verify the actual pilot's connector and saved outputs.
- Dotfiles and agentic-ways-of-working were fetched earlier in planning; local changes were preserved.

No new merchant test, Claude-in-Chrome frame test, package installation, or Google publication was performed by this review. The later proof inspection above adds primary historical evidence from Claude's run. The earlier cold review covered the custom mock and previous architecture, not this revised integration. See the [verification record](../design/extension-review/verification.md). Publishing this plan does not complete the remaining pilot checks or implement a custom extension.
