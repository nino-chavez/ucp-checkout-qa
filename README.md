# ucp-checkout-qa

Test Google UCP (Universal Commerce Protocol) Buy links against a merchant's own BigCommerce checkout. Compare the product, shipping method, tax, and total, then give reviewers direct links to verify each finding.

**Stops at order review, before payment.** Use this agent skill when onboarding merchants, adding products, or retesting reported issues.

[First run](#first-run) · [Checks](#checks) · [Cost estimates](#cost-estimates) · [ROI estimates](#roi-estimates)

## Reports

```text
run directory/
├── scan.json   Link coverage
├── report.md   Checkout comparison
└── flags.json  Detected mismatches
```

The scan includes blocked pages; the comparison links to the product pages. The scripts also save each checkout's observations. Your agent adds verdicts against prior claims, likely owners, confidence, limits, and sheet-ready notes. Matching totals alone do not prove matching shipping methods.

**Validation status:** parser and report regression tests pass; exploratory-run token usage was measured. The packaged end-to-end workflow still needs an authenticated live run. Its cost, time saved, and ROI remain unmeasured.

## First run

Install with a GitHub account that has access to this private repo:

```bash
npx skills add https://github.com/nino-chavez/ucp-checkout-qa
```

You need Node 22+, [browse-tool](https://github.com/nino-chavez/browse-tool), and Chrome for Testing. Follow browse-tool's installation instructions and run `browse-start` with a visible browser window. Sign in to the Google account approved for your UCP test program (the allowlist). Confirm access with your onboarding contact if Buy is absent.

Then give your agent a Google Sheet export (`.xlsx`) or Buy-link list:

> Use ucp-checkout-qa on this file. Check every Buy link first, then test the passing products through order review. Ask for missing account or checkout details. Compare with the merchant checkout and produce a report with both product links, likely owners, confidence, and limits. Stop before payment.

The skill asks for the allowlisted email and authorized checkout details: name, destination address, phone, and email. You can narrow the rows or provide earlier claims to verify. Shared sheet or Google Doc updates require an explicit request.

## Checks

| Stage | What the test checks |
|---|---|
| Account | Allowlist access, visible browser, and pending Chrome prompts |
| Every link | Page loads, intended product and variant, Buy availability |
| Google checkout | Order review over 30 seconds; retry and shipping-change behavior |
| Native checkout | Same item and destination; shipping methods, tax, and totals |
| Report | Evidence links, mismatches, blocked rows, and unresolved questions |

For initial $0 shipping, the test reselects the method, switches away and back, then opens a fresh Buy. Native quotes use an isolated guest cart. Owner assignments follow the [routing guide](skills/ucp-checkout-qa/references/owner-routing.md); a checkout observation alone may not identify the responsible system.

## Cost estimates

Use **Claude Sonnet**, or **GPT-5.6 Terra with high effort**, for recurring browser tests. Reserve **Claude Opus**, or **GPT-5.6 Sol with high effort**, for an independent adversarial retest. This follows our Operator model-routing tool's `balance` policy. These recommendations are not comparative accuracy benchmarks; this skill does not switch models itself.

**Forecast: one batch of 12 distinct product links.** Prices are USD at standard token rates, checked September 23, 2026. These figures exclude cache-write premiums, separate tool fees, taxes, and subscriptions. They are not invoices.

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

Use the [full procedure](skills/ucp-checkout-qa/SKILL.md) for commands and inputs, and the [report protocol](skills/ucp-checkout-qa/references/protocol.md) for the final writeup.
