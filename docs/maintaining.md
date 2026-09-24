# Publish a pilot installer

[Back to the README](../README.md#distribution)

Keep installation and distribution in this public repository. Publish the skill ZIP as a versioned GitHub Release asset, then share the repo link. Do not distribute installers through chat, email, or file shares.

The current installer is [v0.1.0-pilot.4](https://github.com/nino-chavez/ucp-checkout-qa/releases/tag/v0.1.0-pilot.4). Resolve the [handoff blockers](known-limits.md) and test the installed skill before calling a release ready for routine coworker use.

## Build the archive

1. Select the reviewed commit you intend to release. From its checkout, run:

   ```bash
   git rev-parse HEAD
   mkdir -p dist
   git archive --format=zip --prefix=ucp-checkout-qa/ --output=dist/ucp-checkout-qa.zip HEAD:skills/ucp-checkout-qa
   unzip -t dist/ucp-checkout-qa.zip
   shasum -a 256 dist/ucp-checkout-qa.zip
   ```

2. Confirm the archive contains `ucp-checkout-qa/SKILL.md` and its referenced files. Only committed skill files belong in the installer.
3. Run the relevant checks and test installation in the Claude app the coworker will use.

Keep shopper details and test outputs out of the archive.

## Publish and verify

1. Create a GitHub Release targeting that same commit. Mark a pilot as a **prerelease**.
2. Attach `ucp-checkout-qa.zip`. Include the source commit, checksum, changes, checks performed, and known limits in the release notes.
3. Download the published asset. Verify its checksum matches the file you tested.
4. Update the README, Claude setup guide, and known-limits page with the release link and its verified readiness status.

Keep the public download, source commit, and instructions aligned. Downloading an update does not replace a tester’s installed skill; the setup guide must retain the upload instructions.
