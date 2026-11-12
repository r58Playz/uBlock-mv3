<h1 align="center">
<sub>
<img src="https://github.com/gorhill/uBlock/blob/master/src/img/ublock.svg" height="38" width="38">
</sub>
uBlock Origin (uBO) MV3 Port
</h1>

***

uBlock Origin (uBO) is a CPU and memory-efficient [wide-spectrum content blocker][Blocking] for Chromium and Firefox. It blocks ads, trackers, coin miners, popups, annoying anti-blockers, malware sites, etc., by default using [EasyList][EasyList], [EasyPrivacy][EasyPrivacy], [Peter Lowe's Blocklist][Peter Lowe's Blocklist], [Online Malicious URL Blocklist][Malicious Blocklist], and uBO [filter lists][uBO Filters]. There are many other lists available to block even more. Hosts files are also supported. uBO uses the EasyList filter syntax and [extends][Extended Syntax] the syntax to work with custom rules and filters.

You may easily unselect any preselected filter lists if you think uBO blocks too much. For reference, Adblock Plus installs with only EasyList, ABP filters, and Acceptable Ads enabled by default.

It is important to note that using a blocker is **NOT** [theft]. Do not fall for this creepy idea. The _ultimate_ logical consequence of `blocking = theft` is the criminalization of the inalienable right to privacy.

Ads, "unintrusive" or not, are just the visible portion of the privacy-invading means entering your browser when you visit most sites. **uBO's primary goal is to help users neutralize these privacy-invading methods** in a way that welcomes those users who do not wish to use more technical means.

***

* [Documentation](#documentation)
* [Installation](#installation)
* [How it works](#how-it-works)
* [Release History](#release-history)
* [Translations](#translations)
* [About](#about)

## Documentation

<table>
    <thead>
        <tr>
            <th>Basic Mode</th>
            <th>Advanced Mode</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>The <a href="https://github.com/gorhill/uBlock/wiki/Quick-guide:-popup-user-interface">simple popup user interface</a> for an install-it-and-forget-it type of installation that is configured optimally by default.</td>
            <td>The <a href="https://github.com/gorhill/uBlock/wiki/Dynamic-filtering:-quick-guide">advanced popup user interface</a> includes a point-and-click firewall that is configurable on a per-site basis.</td>
        </tr>
        <tr>
            <td align="center" valign="top"><a href="https://github.com/gorhill/uBlock/wiki/Quick-guide:-popup-user-interface"><img src="https://user-images.githubusercontent.com/585534/232531044-c4ac4dd5-0b60-4c1e-aabb-914be04b846c.png"/></a></td>
            <td align="center" valign="top"><a href="https://github.com/gorhill/uBlock/wiki/Dynamic-filtering:-quick-guide"><img src="https://user-images.githubusercontent.com/585534/232531439-a8f81cc3-6622-45c4-8b32-7348cecf6e98.png"/></a></td>
        </tr>
    </tbody>
</table>

## Installation

Chrome 138 or newer is required. To install, add
`"blockddmmcjpfkbhanlgegpmjpfpfjka;https://ublock.r58playz.dev/update.xml"` to Chrome's
`ExtensionInstallForcelist` policy, or install manually and use the
`--allowlisted-extension-id=blockddmmcjpfkbhanlgegpmjpfpfjka` flag. This varies across operating systems and is
heavily restricted on Windows and macOS. The flag must be present on every launch. Unlike a policy install, the flag-based install does
not allow blocking handlers to return promises while uBO starts.

### Linux

None of the restrictions described below exist on Linux, on either Chrome or Chromium.

1. Create `/etc/opt/chrome/policies/managed/policy.json`, or `/etc/chromium/policies/managed/policy.json` depending on your install.
2. Write `{ "ExtensionInstallForcelist": ["blockddmmcjpfkbhanlgegpmjpfpfjka;https://ublock.r58playz.dev/update.xml"] }` into the file.
3. Restart the browser, then enable `Allow User Scripts` in the extension's details page.

For a signed CRX built from this checkout and tested entirely from local files,
see [local policy testing](docs/local-policy-test.md).

### Windows and macOS

Chrome refuses to force-install an extension from a non-Web-Store update URL unless the device has a management
authority it considers trustworthy. Merely writing the policy locally via platform policy locations like regedit or
plists does **not** establish that trust. Chrome shows the effective entry as `[BLOCKED]...` in `chrome://policy`.

#### Option 1: give the device a trusted management authority

This is the only way to get a full policy install, including promise-returning `webRequestBlocking` handlers.

- **Windows Pro or higher**: join the device to Microsoft Entra ID (*Settings → Accounts → Access work or school →
  Join this device to Microsoft Entra ID*), join an Active Directory domain, or enroll the device in an MDM.
- **macOS**: enroll the Mac in an MDM, or bind it to a directory server, meaning an Open Directory node under
  `/LDAPv3` or `/Active Directory`.
- **Either platform**: enroll the browser in Chrome Enterprise Core and set the forcelist entry in the Google Admin
  console. No local registry or plist entry is needed in this case.

If the device is managed through a domain or MDM, deploy the policy through that management system. A locally applied
machine policy can also be used after Chrome recognises the device as managed:

- Windows: in regedit, create the key `HKEY_LOCAL_MACHINE\Software\Policies\Google\Chrome\ExtensionInstallForcelist`,
  add a string value named `1` (or the next free number), and set it to
  `blockddmmcjpfkbhanlgegpmjpfpfjka;https://ublock.r58playz.dev/update.xml`.
- macOS: add `ExtensionInstallForcelist`, as an array containing
  `blockddmmcjpfkbhanlgegpmjpfpfjka;https://ublock.r58playz.dev/update.xml`, to
  `/Library/Managed Preferences/com.google.Chrome.plist`.

Then restart the browser and enable `Allow User Scripts` in the extension's details page. If `chrome://policy` still
shows the value with a `[BLOCKED]` prefix, the device is not being recognised as managed.

#### Option 2: manual install plus a launch flag

This works on any unmanaged Windows or macOS machine, but the extension ends up installed as an ordinary extension
rather than by policy. **Promise-returning `webRequestBlocking` handlers are therefore unavailable.** While uBO starts,
subresource requests are temporarily cancelled and affected tabs may be reloaded instead of requests being held until
the filtering engine is ready.

On branded Google Chrome, the packaged CRX must also be added to the machine-level `ExtensionInstallAllowlist` policy
so Chrome does not disable it after installation. This is not needed for unbranded Chromium. The allowlist does not
install the extension or replace the launch flag.

1. Download the CRX from <https://ublock.r58playz.dev/>.
2. Remove any `ExtensionInstallForcelist` entry for this extension.
3. Add `blockddmmcjpfkbhanlgegpmjpfpfjka` to the machine-level `ExtensionInstallAllowlist` policy:
   - Windows: in regedit, create `HKEY_LOCAL_MACHINE\Software\Policies\Google\Chrome\ExtensionInstallAllowlist`, add a string value named `1` (or the next free number), and set it to the extension ID.
   - macOS: add `ExtensionInstallAllowlist`, as an array containing only the extension ID, to `/Library/Managed Preferences/com.google.Chrome.plist`.
4. Completely quit Chrome, including background processes, restart it, and verify the allowlist in `chrome://policy`.
5. Launch Chrome with `--allowlisted-extension-id=blockddmmcjpfkbhanlgegpmjpfpfjka`. Chrome will show an unsupported
   command-line flag warning; do not suppress it with `--test-type`, which changes other browser behaviour.
6. Open `chrome://extensions`, enable `Developer mode`, then drag the CRX onto the page and approve the installation.
7. Enable `Allow User Scripts` in the extension's details page. Wait for the `!` badge to clear; reload the extension
   if it does not.

The flag is what makes Chromium grant the MV3 `webRequestBlocking` permission to this extension. Chrome must be
started with it every time.

## How It Works

- This port does not convert uBO's filtering engine to `declarativeNetRequest`. The existing engine runs in an MV3
  service worker and returns blocking decisions through `webRequest`.
- Chromium normally grants `webRequestBlocking` to MV3 extensions only when they are installed by policy. The
  `--allowlisted-extension-id` flag bypasses that permission check, but does not turn a manual install into a policy
  install.
    - Only a real policy install may return promises from blocking handlers. This port uses them to hold requests while
      the filtering engine starts.
    - A manual install instead temporarily cancels subresource requests during startup and reloads affected tabs after
      the engine is ready, like Chrome on MV2. Normal filtering decisions are synchronous after startup.
- `chrome.tabs.executeScript`, `chrome.tabs.insertCSS`, and `chrome.tabs.removeCSS` are implemented with
  `chrome.scripting` and `chrome.userScripts`.
- Small DOM and `XMLHttpRequest` shims provide the background-page APIs uBO uses, and a periodic extension API call
  keeps the service worker active.
- Web Workers run in a lazily created offscreen document and communicate with the service worker through message ports.

## Release History

[Releases Page][Releases]

## Translations

Help translate uBO via [Crowdin][Crowdin].

## About

[Manifesto][Manifesto]

[Privacy Policy][Privacy Policy]

[GPLv3 License][License]

Free. Open-source. For users by users. No donations sought.

If you ever want to contribute something, think about the people working hard to maintain the filter lists you are using, which are available to use by all for free.


<!----------------------------------------------------------------------------->

[Peter Lowe's Blocklist]: https://pgl.yoyo.org/adservers/
[Malicious Blocklist]: https://gitlab.com/malware-filter/urlhaus-filter#malicious-url-blocklist
[Performance]: https://www.debugbear.com/blog/chrome-extensions-website-performance#the-impact-of-ad-blocking-on-website-performance
[EasyPrivacy]: https://easylist.to/#easyprivacy
[Thunderbird]: https://addons.thunderbird.net/thunderbird/addon/ublock-origin/
[EasyList]: https://easylist.to/#easylist
[Mozilla]: https://addons.mozilla.org/addon/ublock-origin/
[Crowdin]: https://crowdin.com/project/ublock
[Reddit]: https://www.reddit.com/r/uBlockOrigin/
[Theft]: https://x.com/LeaVerou/status/518154828166725632
[Opera]: https://addons.opera.com/extensions/details/ublock/
[Edge]: https://microsoftedge.microsoft.com/addons/detail/ublock-origin/odfafepnkmbhccpbejgmiehpchacaeak
[NPM]: https://www.npmjs.com/package/@gorhill/ubo-core

[Manifesto]: MANIFESTO.md
[License]: LICENSE.txt

[Nicole Rolls]: https://github.com/nicole-ashley

<!---------------------------------[ Internal ]-------------------------------->

[Manual Installation]: https://github.com/gorhill/uBlock/tree/master/dist#install
[Extended Syntax]: https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#extended-syntax
[Privacy Policy]: https://github.com/gorhill/uBlock/wiki/Privacy-policy
[uBO Filters]: https://github.com/uBlockOrigin/uAssets/tree/master/filters
[Permissions]: https://github.com/gorhill/uBlock/wiki/Permissions
[Commit Rate]: https://github.com/gorhill/uBlock/commits/master
[Works Best]: https://github.com/gorhill/uBlock/wiki/uBlock-Origin-works-best-on-Firefox
[Deployment]: https://github.com/gorhill/uBlock/wiki/Deploying-uBlock-Origin
[Blocking]: https://github.com/gorhill/uBlock/wiki/Blocking-mode
[Releases]: https://github.com/gorhill/uBlock/releases
[Issues]: https://github.com/uBlockOrigin/uBlock-issues/issues
[Beta]: https://github.com/gorhill/uBlock/blob/master/dist/README.md#for-beta-version
[Wiki]: https://github.com/gorhill/uBlock/wiki

<!----------------------------------[ Badges ]--------------------------------->

[Badge Localization]: https://d322cqt584bo4o.cloudfront.net/ublock/localized.svg
[Badge Commits]: https://img.shields.io/github/commit-activity/m/gorhill/ublock?label=Commits
[Badge Mozilla]: https://img.shields.io/amo/rating/ublock-origin?label=Firefox
[Badge License]: https://img.shields.io/badge/License-GPLv3-blue.svg
[Badge Chrome]: https://img.shields.io/chrome-web-store/rating/cjpalhdlnbpafiamejdnhcphjbkeiagm?label=Chrome
[Badge Edge]: https://img.shields.io/badge/dynamic/json?label=Edge&color=brightgreen&query=%24.averageRating&suffix=%2F%35&url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fodfafepnkmbhccpbejgmiehpchacaeak
[Badge Issues]: https://img.shields.io/github/issues/uBlockOrigin/uBlock-issues
[Badge NPM]: https://img.shields.io/npm/v/@gorhill/ubo-core
