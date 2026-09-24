# Set up Claude for checkout testing

[Back to the README](../README.md)

Use Claude with Claude in Chrome to test a product without a terminal. The skill supplies the test procedure; the Chrome extension lets Claude operate the browser.

> [!IMPORTANT]
> **Current pilot: [v0.1.0-pilot.2](https://github.com/nino-chavez/ucp-checkout-qa/releases/tag/v0.1.0-pilot.2).** Use it for supervised testing. This version includes the Chrome fixes. A first-time installation still needs a coworker test. Read the [known limits](known-limits.md) before checkout.

## 1. Prepare Chrome and your accounts

1. Create a separate Chrome profile named **UCP testing**. Use it only for these tests, so your shopping carts stay separate.
2. Follow the official [Claude in Chrome setup guide](https://support.claude.com/en/articles/12012173-get-started-with-claude-in-chrome) to install the extension and sign in to Claude.
3. In that Chrome profile, sign in to the Google account approved for your UCP test program. This approval is sometimes called the **Buy allowlist**.
4. Open a known test product. Check **Buying options** for a **Buy** button beside the intended merchant.

If you see only **Visit site**, check the Google account and ask your onboarding contact to confirm access. A missing Buy button alone does not prove an account problem or a product defect.

Your organization must permit Claude in Chrome and uploaded skills. If the controls below are unavailable, ask your Claude administrator to confirm access.

## 2. Install the skill from this repository

1. Open the [pilot release](https://github.com/nino-chavez/ucp-checkout-qa/releases/tag/v0.1.0-pilot.2). Read its release notes and known limits.
2. Under **Assets**, download **ucp-checkout-qa.zip**. Keep it zipped. The **Source code** archives contain the whole repository and are not the skill installer.
3. In Claude, enable **Code execution and file creation**. Your organization may control this setting.
4. Open **Customize > Skills**, select **+ Create skill**, then **Upload a skill**.
5. Upload `ucp-checkout-qa.zip` and turn the skill on. Confirm **ucp-checkout-qa** appears enabled in the list.

See [Claude’s skill installation guide](https://support.claude.com/en/articles/12512180-use-skills-in-claude) if your controls differ.

## 3. Confirm Claude can see the page

1. Open the Google Shopping product in your testing profile.
2. Open Claude’s Chrome side panel. You can also use Claude Desktop with its Chrome connection active.
3. Ask: **“Read this page and tell me the product and merchant. Do not start checkout yet.”**
4. Compare Claude’s answer with the page. If they match, return to the README and choose a [test prompt](../README.md#run-a-test).

Chrome may request access to Google and each merchant’s site. Read those prompts before granting access.

The uploaded skill has not yet completed a coworker test in either the Chrome side panel or Claude Desktop. Record which app you use and whether it picks up the skill. A successful page-reading check proves the browser connection, not the complete test workflow.

## Optional: save reports in Google Drive

Connect **Google Drive** in Claude using the work account that should own the reports. The test can return results in chat without it.

Ask for a **new Google Doc and Sheet** when the test finishes. The skill’s recorded proof created both, then checked their saved content and formatting. No custom Google Cloud project or OAuth application is required. Editing an existing shared report is a separate task.

## Update the skill

1. Return to this repo’s **Releases** page and read the new release notes.
2. Download the new installer and repeat the upload steps. Disable the older copy if both appear.
3. Keep the release tag with your report so another tester knows which version you used.

Downloading a new file does not update the skill already installed in Claude. Share the repository link with coworkers; do not send installers through chat, email, or a separate file share.

## Troubleshooting

| What you see | Next step |
|---|---|
| Only Source code archives are visible | Open the pilot release above and expand **Assets**. Choose `ucp-checkout-qa.zip`. |
| No upload control in Claude | Check code execution and ask your Claude administrator about uploaded skills. |
| Claude cannot see the product | Check its Chrome connection and site permission. Repeat the page-reading check above. |
| Visit site instead of Buy | Check the Google account and program access. Leave the row blocked if the cause remains unclear. |
| An existing merchant cart | Stop before adding products. Do not clear someone’s cart to make the test pass. |
| Google Drive is unavailable | Keep the results in chat. Connect Drive before requesting Google reports. |
