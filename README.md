# ucp-checkout-qa

An agent skill that tests Google UCP Buy links for BigCommerce merchants. It runs each flow through order review and compares product, shipping, tax, and totals with the merchant's own checkout. It stops before payment.

Use it each time new merchants or products join the BigCommerce and Google UCP integration.

## What it does

- Checks your setup: an allowlisted Google account, a headed browser, and no pending Chrome sign-in prompt.
- Reads Buy links from a Google Sheet export or a plain list.
- Captures Google order review three times over 30 seconds.
- Runs the $0-shipping sequence when needed: reselect, switch, switch back, and a fresh Buy.
- Quotes the same item, address, and methods on the native BigCommerce storefront in a guest context.
- Writes a redacted report with mechanical flags. Your agent then adds verdicts and a likely owner.

## Install

    npx skills add https://github.com/nino-chavez/ucp-checkout-qa

The repo is private, so your GitHub account needs read access first.

## Requirements

- Node 22 or newer.
- [browse-tool](https://github.com/nino-chavez/browse-tool), with Chrome for Testing installed as its README describes.
- A Google account on the UCP allowlist, signed in to the browser that `browse-start` opens.

## Usage

Ask your agent to test UCP buy links, verify a UCP testing sheet, or retest another tester's notes. The skill asks for anything it needs.

The full procedure is in [`skills/ucp-checkout-qa/SKILL.md`](skills/ucp-checkout-qa/SKILL.md). Owner routing is in [`references/owner-routing.md`](skills/ucp-checkout-qa/references/owner-routing.md).

## Data handling

Keep the tester's address file outside the repo; the `.gitignore` blocks it. Script output redacts address, phone, and email. Never commit a run directory.
