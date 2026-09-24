# Set up Claude for checkout testing

[Back to the README](../README.md)

Use Claude with Claude in Chrome to test a product without a terminal. The skill supplies the test procedure; the Chrome extension lets Claude operate the browser.

> [!IMPORTANT]
> **Current pilot: [v0.1.0-pilot.3](https://github.com/nino-chavez/ucp-checkout-qa/releases/tag/v0.1.0-pilot.3).** Use it for supervised testing. Run it from Claude Desktop (Home > Chat). A first-time installation still needs a coworker test. Read the [known limits](known-limits.md) before checkout.

## 1. Prepare Chrome and your accounts

1. Create a separate Chrome profile named **UCP testing**. Use it only for these tests, so your shopping carts stay separate.
2. Follow the official [Claude in Chrome setup guide](https://support.claude.com/en/articles/12012173-get-started-with-claude-in-chrome) to install the extension and sign in to Claude.
3. In that Chrome profile, sign in to the Google account approved for your UCP test program. This approval is sometimes called the **Buy allowlist**.
4. Open a known test product. Check **Buying options** for a **Buy** button beside the intended merchant.

If you see only **Visit site**, check the Google account and ask your onboarding contact to confirm access. A missing Buy button alone does not prove an account problem or a product defect.

Your organization must permit Claude in Chrome and uploaded skills. If the controls below are unavailable, ask your Claude administrator to confirm access.

## 2. Install the skill from this repository

1. Open the [pilot release](https://github.com/nino-chavez/ucp-checkout-qa/releases/tag/v0.1.0-pilot.3). Read its release notes and known limits.
2. Under **Assets**, download **ucp-checkout-qa.zip**. Keep it zipped. The **Source code** archives contain the whole repository and are not the skill installer.
3. In Claude, enable **Code execution and file creation**. Your organization may control this setting.
4. Open **Customize > Skills**, select **+ Add**, then **Upload skill**.
5. Choose `ucp-checkout-qa.zip` and select **Upload**. Claude runs a security scan, which took about two minutes in testing. The skill is ready when the scan notice disappears and its switch is on. Leave **Publish to org** alone.

See [Claude’s skill installation guide](https://support.claude.com/en/articles/12512180-use-skills-in-claude) if your controls differ.

## 3. Run the test from Claude Desktop

Start the test in the **Claude Desktop app**, in **Home > Chat**. That is the one place, as of September 24, 2026, that has both the uploaded skill and control of Chrome:

| Where you start | Uploaded skill | Controls Chrome |
|---|---|---|
| **Claude Desktop, Home > Chat** | Yes | Yes, through the Claude in Chrome connector |
| claude.ai in a browser tab | Yes | No; it has no Claude in Chrome connector |
| Claude in Chrome side panel | No; it ignored the skill and made its own plan | Yes |

1. In Claude Desktop, open **Home**, choose **Chat**, then **+ > Connectors**. Check that **Claude in Chrome** is on. Turn on **Google Drive** too if you want Google reports.
2. Type `/ucp` and choose **ucp-checkout-qa**, then add your request and the Google Buy link. The prompts in the README work after it.
3. If more than one Chrome is connected to your Claude account, Claude asks which one to use. Choose the testing profile's browser.
4. A **Claude for Chrome** window asks before Claude opens each new site: google.com, then the merchant's store. Read each prompt and choose **Allow this action**, or **Always allow actions on this site** to stop repeat prompts for that site. When Claude asks you to approve a prompt, look for this window; it can sit behind the Claude app.
5. Claude asks for the shipping name, address, and phone, and says which checkouts receive them.

This was tested end to end on one product in a test Mac, from the release download through the Drive reports. A coworker's cold run is still pending.

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
