# ucp-checkout-qa

Test Google UCP (Universal Commerce Protocol) Buy links against a merchant's own BigCommerce checkout. Compare the product, shipping method, tax, and total, then give reviewers direct links to verify each finding.

**Stops at order review, before payment.** Use this agent skill when onboarding merchants, adding products, or retesting reported issues.

[First run](#first-run) · [Chrome runner](#chrome-runner) · [Distribution](#distribution) · [Current limits](#current-limits) · [Cost estimates](#cost-estimates) · [ROI estimates](#roi-estimates)

## Reports

The command-line runner saves local files:

```text
run directory/
├── scan.json   Link coverage
├── report.md   Checkout comparison
└── flags.json  Detected mismatches
```

The scan includes blocked pages; the comparison links to the product pages. The scripts also save each checkout's observations. The Chrome runner records readings in chat and can create a new Google Doc and Sheet when requested. Both routes add verdicts against prior claims, likely owners, confidence, limits, and sheet-ready notes. Matching totals alone do not prove matching shipping methods.

**Validation status:** the CLI's 17 regression tests pass. One Chrome proof matched Google and native quotes and verified synthetic Google reports after saving. It was not a coworker test of the installed skill. Repeat runs, recovery, and the [current limits](#current-limits) still need work before handoff. Packaged-run cost, time saved, and ROI remain unmeasured.

## First run

Start from this public repository for setup, installation, downloads, and updates. Reading the instructions and downloading release assets do not require a GitHub invitation. Google Buy access and Claude permissions are separate prerequisites.

There are two ways to run the same test. Pick by who is running it.

| | Chrome runner | Command-line runner |
|---|---|---|
| Who | CSMs, PMs, anyone who works in Claude desktop or the browser | Someone comfortable in a terminal |
| Install | Claude in Chrome, the Google Drive connector, and this skill | Node 22+, browse-tool, Chrome for Testing, and this skill |
| Reads Google's order review | Screenshots in the recorded proof; top-page text did not expose the review frame | Text from the review frame, at about 5, 15, and 30 seconds |
| Native cart | The tester's Chrome profile; cleanup needs correction before handoff | A fresh guest browser context each time |
| Hiding personal details | Claude follows the runbook rules; nothing redacts automatically | Scripts redact address, phone, and email |
| Reports | Chat by default; new Google Doc and Sheet through the Drive connector when requested | Local files; a person pastes into Google |
| Link input | Pasted links or the open product page | The `.xlsx` sheet export, including `HYPERLINK()` cells |
| Account check | Claude looks for Buy and asks you to fix the account | `preflight` finds the account number and Chrome's pending prompts |
| Mismatch flags | Claude applies the protocol's checks by judgment | `report` computes them the same way every run (`flags.json`) |
| Tests | One recorded product proof; no automated Chrome tests | 17 regression tests |
| Cost | Not measured | CLI forecast below |
| Best for | One product, a short list, and investigating a finding while you test | Large batches, repeat runs, and a second check on a screen-read number |

### Chrome runner

**Current pilot:** [v0.1.0-pilot.1](https://github.com/nino-chavez/ucp-checkout-qa/releases/tag/v0.1.0-pilot.1). Its release notes list the known limits.

1. Add **Claude in Chrome** to Chrome, in a separate Chrome profile such as "UCP testing". Keeping it apart from your own shopping avoids old merchant carts.
2. In that profile, sign in to the Google account approved for your UCP test program (the allowlist).
3. In Claude, turn on the **Google Drive** connector. Enable **Code execution and file creation** for skills.
4. Open this repo's **Releases** page, choose the pilot release, and download `ucp-checkout-qa.zip` from **Assets**. GitHub's **Source code** archives contain the whole repo; they are not the skill installer.
5. In Claude, open **Customize > Skills**, choose **+ Create skill**, then **Upload a skill**. Upload the downloaded file and enable `ucp-checkout-qa`. See [Claude's skill installation guide](https://support.claude.com/en/articles/12512180-use-skills-in-claude) if the controls differ.
6. Open a Google Shopping product page and ask:

> Use ucp-checkout-qa on this product. Stop before payment.

For a list, paste the Buy links instead, with any sheet row labels. Claude asks for anything it needs, including your shipping details and where to save the reports. Claude in Chrome asks you to allow each site the first time.

Whether your organization lets CSM and PM accounts use Claude in Chrome, the Drive connector, and uploaded skills has not been confirmed. Check with the Claude admin before rollout.

For updates, return to **Releases**, read the changes and known limits, and install the new asset using the same steps. Disable the older copy if both appear. Keep the release tag with your test report so a reviewer knows which instructions you used. Downloading an update does not install it in Claude.

### Command-line runner

Install from this repository:

```bash
npx skills add https://github.com/nino-chavez/ucp-checkout-qa
```

You need Node 22+, [browse-tool](https://github.com/nino-chavez/browse-tool), and Chrome for Testing. Follow browse-tool's installation instructions and run `browse-start` with a visible browser window. Sign in to the Google account approved for your UCP test program (the allowlist). Confirm access with your onboarding contact if Buy is absent.

Then give your agent a Google Sheet export (`.xlsx`) or Buy-link list:

> Use ucp-checkout-qa on this file. Check every Buy link first, then test the passing products through order review. Ask for missing account or checkout details. Compare with the merchant checkout and produce a report with both product links, likely owners, confidence, and limits. Stop before payment.

The skill asks for the allowlisted email and authorized checkout details: name, destination address, phone, and email. You can narrow the rows or provide earlier claims to verify. Shared sheet or Google Doc updates require an explicit request.

## Distribution

This public repository owns setup, installation, and distribution. Share the repo link with coworkers. Keep source, instructions, version history, and downloadable installers here; do not send ZIPs through chat, email, or a separate file share.

Claude's upload format is a ZIP. Publish that file as a versioned asset in this repo's **Releases**. Testers download and upload it through the browser; packaging commands are for maintainers only. [How GitHub releases work](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)

### Release preparation

From the repo root, build from the reviewed commit you intend to tag:

```bash
git rev-parse HEAD
mkdir -p dist
git archive --format=zip --prefix=ucp-checkout-qa/ --output=dist/ucp-checkout-qa.zip HEAD:skills/ucp-checkout-qa
unzip -t dist/ucp-checkout-qa.zip
shasum -a 256 dist/ucp-checkout-qa.zip
```

Only committed skill files enter the archive. Check that it contains `ucp-checkout-qa/SKILL.md` and its referenced files. Run the relevant checks, then attach the archive to a release targeting that same commit. Mark pilot releases as prereleases.

Release notes must name the source commit, archive checksum, changes, checks performed, and known limits. Verify a downloaded copy matches before sharing the repo link. Remove the pending-download notice above when the first pilot release is published. Keep report output and shopper details out of release assets.

## Checks

| Stage | What the test checks |
|---|---|
| Account | Allowlist access, visible browser, and pending Chrome prompts |
| Every link | Page loads, intended product and variant, Buy availability |
| Google checkout | Order review over 30 seconds; retry and shipping-change behavior |
| Native checkout | Same item and destination; shipping methods, tax, and totals |
| Report | Evidence links, mismatches, blocked rows, and unresolved questions |

For initial $0 shipping, the test reselects the method, switches away and back, then opens a fresh Buy. The command-line runner quotes native checkout in an isolated guest cart; the Chrome runner uses the tester's profile. Owner assignments follow the [routing guide](skills/ucp-checkout-qa/references/owner-routing.md); a checkout observation alone may not identify the responsible system.

## Current limits

These issues remain open in the merged runners. The three Chrome-runner issues listed in the v0.1.0-pilot.1 release notes are fixed on `main` and ship in the next release.

| Runner | Open issue | Required correction |
|---|---|---|
| Command line | Buy selection uses the first matching button; native quantity is fixed at 1 | Verify the selected offer and stop on unsupported quantities before comparing |

The [build plan](decisions/browser-extension-plan.md) records the evidence and remaining pilot checks. The [design files](design/extension-review/index.html) show an optional custom interface with synthetic data. No custom extension has been built.

## Cost estimates

Use **Claude Sonnet**, or **GPT-5.6 Terra with high effort**, for recurring browser tests. Reserve **Claude Opus**, or **GPT-5.6 Sol with high effort**, for an independent adversarial retest. This follows our Operator model-routing tool's `balance` policy. These recommendations are not comparative accuracy benchmarks; this skill does not switch models itself.

**CLI forecast: one batch of 12 distinct product links.** This forecast does not cover the Chrome runner. Prices are USD at standard token rates, checked September 24, 2026. These figures exclude cache-write premiums, separate tool fees, taxes, and subscriptions. They are not invoices.

| Model | Role | Estimated token cost / batch |
|---|---|---:|
| Claude Sonnet 5 | Recurring test | $1.30–$1.83 |
| GPT-5.6 Terra, high | Recurring test | $1.33–$1.86 |
| Claude Opus 5.5 | Adversarial retest | $2.06–$2.87 |
| GPT-5.6 Sol, high | Adversarial retest | $2.59–$3.66 |
| GPT-6 Astra | Cost comparison only | $6.49–$9.15 |

Rates: [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra), [Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol), and [OpenAI pricing](https://developers.openai.com/api/docs/pricing). Sol's quoted price is promotional through at least November 21, 2026.

Haiku or Luna can handle narrow inventory and formatting tasks under Operator's fast route. They are not the recommended route for the complete browser test.

<details>
<summary>Forecast assumptions and calculation</summary>

These are planning inputs, not a measured packaged run:

- 35 model responses, starting with 60,000–100,000 input tokens of context.
- Context grows by 1,500 tokens per response; 16,000 output tokens total, including reasoning where billed.
- 90% of input tokens receive the cached-input rate.
- Total input: 2,992,500–4,392,500 tokens across all responses, including repeated context.
- Same token budget across models for comparison. Actual tokenization, reasoning, retries, and report editing will differ.

```text
total input = 35 × starting context + 1,500 × (0 + 1 + … + 34)
base cost   = (uncached input × input rate
             + cached input × cache-read rate
             + output × output rate) / 1,000,000
```

Rates per million tokens, in input / cache-read / output order:

| Model | Input | Cache read | Output |
|---|---:|---:|---:|
| Sonnet 5 | $2 | $0.20 | $10 |
| Terra | $2 | $0.20 | $12 |
| Opus 5.5 | $4 | $0.20 | $20 |
| Sol | $4 | $0.40 | $20 |
| Astra | $10 | $1 | $50 |

Cache behavior matters. At 50% cached input, Sonnet becomes **$3.45–$4.99** before cache-write premiums. If every uncached token incurs Claude's 1.25× five-minute cache-write rate, that becomes **$4.20–$6.09**. Longer cache retention or a second full retest adds cost.

Model policy source: [Operator routing](https://github.com/nino-chavez/operator/blob/54e575f3109f93d1b10d40e7f3af324df04994f4/src/operator_plane/model_routing.py) (private repo). The selected mode was `balance` when checked.

</details>

<details>
<summary>Earlier exploratory run: measured tokens, estimated dollar equivalent</summary>

The September 23 Codex run used GPT-6 Astra for the initial link scan and checkout tests. Local session accounting recorded:

| Usage | Measured tokens |
|---|---:|
| Uncached input | 269,426 |
| Cached input | 31,621,376 |
| Output | 25,751 |

Across 214 model responses, that is **$35.60 at the base token rates above**. It is a token-rate equivalent, not a subscription charge or a complete API bill. Cache-write charges were not measured.

Source: local Codex session `01a0ce72-bbcf-7241-a083-524253e404f2`, September 23, 2026, 13:35–14:57 UTC. The scope excludes document editing, Claude's independent retest, and building this package. The private transcript is not distributed here.

This exploratory run and the packaged forecast are not a controlled comparison. No cost-reduction percentage or labor savings has been measured.

</details>

## ROI estimates

**Time saved and return on investment (ROI) are not yet measured.** The planning scenarios below show what would justify repeat use.

Hypothetical inputs:

- **$100/hour** loaded labor rate.
- **$10 per batch** for model and tool usage. This allows room for retries and unpriced tools; it is not derived from the token-cost table.
- **$200 one-time setup.** This is not a measurement of this package's development cost.

Time saved means human work avoided after preparation, review, retries, and maintenance.

| Hypothetical time saved / batch | Net value / batch | Batches to recover setup | ROI after 10 batches |
|---|---:|---:|---:|
| 15 minutes | $15 | 14 | −17% |
| 30 minutes | $40 | 5 | 67% |
| 60 minutes | $90 | 3 | 233% |

These are invented planning scenarios, not observed results. ROI includes setup and usage costs; percentages are rounded. Labor value means capacity recovered; it becomes cash savings only if spending actually falls.

<details>
<summary>ROI calculation and measurement plan</summary>

```text
labor value / batch = human minutes saved / 60 × loaded hourly rate
net value / batch   = labor value − incremental model and tool cost
payback batches     = round up(one-time investment / net value per batch)
total cost, N runs  = one-time investment + N × model and tool cost
ROI after N runs   = (N × labor value per batch − total cost) / total cost
```

If net value is zero or negative, there is no payback. Replace the assumptions with your actual costs, including development or onboarding you need to recover.

For the next batch, record human preparation, supervision, review, and correction time, plus actual tokens and fees. Compare with a manual run covering the same products and checks. Confirm equivalent coverage and correct findings before claiming savings. Browser elapsed time is not human labor time.

</details>

## Limits and data handling

- The test ends before payment. It cannot verify a successful transaction, fulfillment, or refunds.
- New storefront themes or Google markup may require selector updates. Report blocked steps instead of guessing values.
- Native checkout receives the authorized shopper details. The optional rendered-method check submits email and can leave an abandoned-cart record.
- Keep address files and run directories outside this repo. `.gitignore` catches common filenames, not arbitrary ones.
- Scripts redact supplied address, phone, and email. Review reports and crop screenshots before sharing.
- Chrome order-review screenshots can show the tester's address, phone, and card ending. The runbook forbids saving or sharing them; no automatic redactor enforces that rule.
- Chrome-runner totals are read from the screen. They matched the command-line run to the cent on one product (September 23, 2026). Recheck any screen-read number a finding depends on.

Use the [full procedure](skills/ucp-checkout-qa/SKILL.md) for commands and inputs, and the [report protocol](skills/ucp-checkout-qa/references/protocol.md) for the final writeup.
