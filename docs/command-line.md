# Run from a terminal

[Back to the README](../README.md)

Use this route for repeat batches, a spreadsheet export, or a second check on amounts read from Chrome screenshots. The scripts collect checkout observations and calculate mismatches. Your agent adds the findings and likely owners.

## Setup

1. Install Node 22 or newer.
2. Install [browse-tool](https://github.com/nino-chavez/browse-tool) and Chrome for Testing using that project’s README.
3. Install this skill:

   ```bash
   npx skills add https://github.com/nino-chavez/ucp-checkout-qa
   ```

4. Run `browse-start` with a visible browser window. Sign in to your approved Google test account and dismiss any pending Chrome profile prompt.
5. Review the [current selection and quantity limits](known-limits.md#command-line-workflow) before starting.

## Start a batch

Give your agent a Google Sheet export (`.xlsx`) or a list of Buy links, then ask:

```text
Use ucp-checkout-qa on this file.
Check every Buy link first, then test passing products through order review.
Confirm the intended offer and quantity 1 before comparing checkouts.
Ask for missing account or checkout details. Stop before payment.
Report both product links, likely owners, confidence, and limits.
```

The skill asks for the approved Google email and authorized checkout details: name, address, phone, and email. You can specify rows or supply prior claims to check independently.

Keep the address file and run directory outside this repository. Shared Sheet or Doc edits need an explicit request.

## Read the output

```text
run directory/
├── scan.json   Every link, including blocked pages
├── report.md   Checkout comparisons and product links
└── flags.json  Mismatches detected by the scripts
```

Each checkout’s observations are saved beside these files. The agent completes the report with its judgments, evidence limits, and short notes suitable for the testing sheet.

The native comparison uses a fresh guest browser context. Scripts redact the supplied address, phone, and email. Review the output and crop screenshots before sharing.

For individual commands and input fields, use the [full procedure](../skills/ucp-checkout-qa/SKILL.md). For interpreting results, use the [report protocol](../skills/ucp-checkout-qa/references/protocol.md).
