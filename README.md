# UCP checkout QA

Check a Google Shopping Buy link against the merchant’s own BigCommerce checkout. Get a report of what matches, what differs, and who should investigate.

Use this Claude skill for merchant onboarding and product retests through Google’s Universal Commerce Protocol (UCP). **The test ends at order review, before payment.**

**[Set up Claude](#set-up-claude)** · **[Run a test](#run-a-test)** · [Reports](#read-and-share-the-results) · [Cost and ROI](#cost-and-roi)

> [!IMPORTANT]
> **Pilot available: [v0.1.0-pilot.4](https://github.com/nino-chavez/ucp-checkout-qa/releases/tag/v0.1.0-pilot.4).** Use it for supervised testing. Run it from Claude Desktop (Home > Chat). A coworker’s first-time setup and repeated batches still need validation. Read the [known limits](docs/known-limits.md) before running checkout.

## Set up Claude

For CSMs and PMs, use **Claude with Claude in Chrome**. You do not need a terminal.

**[Watch the 77-second walkthrough](https://github.com/nino-chavez/ucp-checkout-qa/releases/download/v0.1.0-pilot.4/ucp-checkout-qa-tutorial.mp4)** (silent, captioned) of the whole flow: download, install, and one test run on a real product, recorded with pilot.4.

Follow the [Claude setup guide](docs/claude-setup.md) to:

1. Prepare a dedicated Chrome profile and your approved Google test account.
2. Download the pilot from this repo, upload it in Claude, and enable it.
3. Run tests from the **Claude Desktop app** (Home > Chat), which has both the skill and Chrome control.

Google Drive is optional. Connect it only if you want a Google Doc or Sheet.

Already use a terminal? Follow the separate [command-line guide](docs/command-line.md).

## Run a test

After setup, choose a prompt below. Supervise the pilot and test **quantity 1**. Keep ordinary shopping out of the testing profile.

### One product

In Claude Desktop, open **Home > Chat**. Paste this, then the product's Google Buy link:

```text
Use ucp-checkout-qa on this link.
Confirm the merchant and product.
Confirm the variant.
Compare both checkouts at quantity 1.
Ask for missing details.
Stop before payment.
```

### A list of links

In the same chat, paste this prompt, followed by your Google Buy links. Keep any sheet row labels beside the links.

```text
Use ucp-checkout-qa on these links.
Check each page loads and shows
the intended product and Buy button.
Test passing links to order review.
Compare both checkouts at quantity 1.
Include blocked links in the report.
Ask for missing details.
Stop before payment.
```

Claude asks for missing details: the merchant, variant, name, shipping address, email, and phone. Authorize which merchant checkouts may receive them. Both checkouts need the same destination.

The test checks product details, shipping methods and charges, tax, and total. If shipping starts at $0, it checks whether changing the method or reopening Buy changes the charge.

## Read and share the results

Results appear in chat by default. Each product’s result should include:

- **Links to both product pages**, so a person can repeat the check.
- **The comparison**, including the selected variant, quantity, shipping method, tax, and total.
- **What was observed**, any workaround, and anything blocked or left untested.
- **A likely owner, labeled as a hypothesis:** Google, BigCommerce, the product feed, merchant settings, or unresolved. Include how confident the assignment is.

Matching totals do not prove that the shipping methods match.

To create Google reports, connect Google Drive and ask:

```text
Create a new Google Doc summary
and Google Sheet of these results.
Include both product links
for each finding.
Keep personal details out.
Reopen and verify both reports.
Return the links.
```

This uses Claude’s existing connector; no Google Cloud project is required. Editing an existing shared document needs a separate request. Before sharing, check the evidence and remove personal details. **Do not share order-review screenshots.**

<details>
<summary>Recorded example: one KONG product</summary>

The September 23, 2026 Chrome test of the KONG Halloween Snuzzles Ghost matched Google’s displayed amounts with the merchant’s quote:

| Amount | Google | Merchant |
|---|---:|---:|
| Shipping | $4.99 | $4.99 |
| Tax | $0.92 | $0.92 |
| Total | $11.90 | $11.90 |

This was one product, not a full installation or repeat-run test. Scratch Google reports were also created and checked after saving. [Proof and remaining checks](docs/known-limits.md#verification-to-date)

</details>

## Cost and ROI

**Chrome-run cost and time saved have not been measured.** Chrome tests use your Claude plan allowance.

For planning, a **12-product command-line batch** is estimated at **$1.30–$1.86** with Sonnet 5 or GPT-5.6 Terra. This forecast does not apply to Chrome runs.

<details>
<summary>Compare model costs and the earlier test run</summary>

| Model | Est. USD / batch |
|---|---:|
| Claude Sonnet 5 | $1.30–$1.83 |
| GPT-5.6 Terra | $1.33–$1.86 |
| Claude Opus 5.5 | $2.06–$2.87 |
| GPT-5.6 Sol | $2.59–$3.66 |
| GPT-6 Astra | $6.49–$9.15 |

USD rates checked September 24, 2026. These estimates assume 90% cached input and exclude cache-write premiums, tool fees, taxes, and subscriptions. They are not invoices. The earlier exploratory test had a **$35.60 token-rate equivalent**; its scope differs from this forecast.

</details>

**Illustrative ROI:** saving 30 minutes per batch at $100/hour recovers $40 of labor value after a $10 usage allowance. A $200 setup cost then pays back after five batches. These inputs are invented; actual savings are unmeasured. Recovered labor time becomes cash savings only if spending falls.

[Model choices, sources, calculations, and other ROI scenarios](docs/costs.md)

## Distribution

Share this public repo’s link with coworkers. Setup, versioned downloads, and updates stay here. A GitHub invitation is not required; Google Buy access and Claude permissions are separate.

- [Claude setup and troubleshooting](docs/claude-setup.md)
- [Known limits and verification](docs/known-limits.md)
- [Maintainer release instructions](docs/maintaining.md)
- [Full test procedure](skills/ucp-checkout-qa/SKILL.md) and [reporting rules](skills/ucp-checkout-qa/references/protocol.md)
