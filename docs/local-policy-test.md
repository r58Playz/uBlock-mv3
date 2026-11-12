# Test local Chromium policy installs and updates

Run from the repository root on Linux:

```sh
python3 tools/pack-local-policy.py
sudo install -Dm644 dist/local-policy/policy.json /etc/chromium/policies/managed/ubo-local.json
```

The packer builds `dist/build/uBlock0.chromium`, creates a private signing key
under `dist/local-policy/`, and writes a signed CRX, a `file://` update manifest,
and a force-install policy there. The CRX uses `dist/version`, exactly as the CI
build does. Keep `dist/local-policy/key.pem` so the extension ID stays the same.
The directory is ignored by Git. No web server is required.

Launch the dedicated test profile with:

```sh
chromium --user-data-dir="$PWD/dist/local-policy/browser-profile" chrome://extensions
```

Check `chrome://policy` for `ExtensionInstallForcelist`, then
`chrome://extensions` for the new test extension. In its details page, turn on
**Allow User Scripts**. The test extension has its own ID, so it can coexist
with the published one. This is an actual policy install;
`chrome.management.getSelf()` reports `installType: "admin"` in its service
worker console.

For each new build, close this test browser, change the source, rerun
`python3 tools/pack-local-policy.py`, and launch the same Chromium command again.
After a successful build, the packer removes only
`dist/local-policy/browser-profile`, so Chromium installs the new CRX from the
policy. Because the version stays the same, this tests a fresh policy install of
the new build rather than an in-place extension update. The CRX and XML must
remain in their generated locations while Chromium installs the extension.

The policy file is machine wide. If another JSON file under
`/etc/chromium/policies/managed/` already sets `ExtensionInstallForcelist`, merge
the generated entry into that list instead of installing a second file with the
same policy. The dedicated `--user-data-dir` keeps extension settings separate
while testing; it does not isolate machine policy. Settings in that profile are
lost each time the packer resets it.

To stop the local force install, remove only
`/etc/chromium/policies/managed/ubo-local.json` and restart Chromium. Chromium
then removes the test extension. Keep `dist/local-policy/` if you might need to
make further updates with the same ID.
