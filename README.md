<h1 align="center">
<sub>
<img src="https://github.com/gorhill/uBlock/blob/master/src/img/ublock.svg" height="38" width="38">
</sub>
uBlock Origin (uBO) MV3 Port
</h1>

[Jump to installation](#installation)

***

uBlock Origin (uBO) is a CPU and memory-efficient [wide-spectrum content blocker][Blocking] for Chromium and Firefox. It blocks ads, trackers, coin miners, popups, annoying anti-blockers, malware sites, etc., by default using [EasyList][EasyList], [EasyPrivacy][EasyPrivacy], [Peter Lowe's Blocklist][Peter Lowe's Blocklist], [Online Malicious URL Blocklist][Malicious Blocklist], and uBO [filter lists][uBO Filters]. There are many other lists available to block even more. Hosts files are also supported. uBO uses the EasyList filter syntax and [extends][Extended Syntax] the syntax to work with custom rules and filters.

You may easily unselect any preselected filter lists if you think uBO blocks too much. For reference, Adblock Plus installs with only EasyList, ABP filters, and Acceptable Ads enabled by default.

It is important to note that using a blocker is **NOT** [theft]. Do not fall for this creepy idea. The _ultimate_ logical consequence of `blocking = theft` is the criminalization of the inalienable right to privacy.

Ads, "unintrusive" or not, are just the visible portion of the privacy-invading means entering your browser when you visit most sites. **uBO's primary goal is to help users neutralize these privacy-invading methods** in a way that welcomes those users who do not wish to use more technical means.

***

* [Documentation](#documentation)
* [Installation](#installation)
* [Issues](#issues)
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

Visit the [Wiki][Wiki] for documentation.

For support, questions, or help, visit [/r/uBlockOrigin][Reddit].

## Installation
Add `"blockddmmcjpfkbhanlgegpmjpfpfjka;https://ublock.r58playz.dev/update.xml"` to your ExtensionInstallForcelist policy.

To do this on Linux:
1. Create `/etc/opt/chrome/policies/managed/policy.json` or `/etc/chromium/policies/managed/policy.json`. (or some other variant depending on your chrome install)
2. Write `{ "ExtensionInstallForcelist": ["blockddmmcjpfkbhanlgegpmjpfpfjka;https://ublock.r58playz.dev/update.xml"] }` into the file.

Local build:
1. Clone and `make`
2. Load unpacked `dist/build/uBlock0.chromium` in the extensions UI
3. Start chrome from the terminal with the command line flag `--allowlisted-extension-id=<sideloaded_uBO_id>`. You'll need to do this every time.
4. Enable "Allow User Scripts" in the extension settings
5. Restart Chrome

CRX build (last resort):
1. Install the CRX
2. Start chrome from the terminal with the command line flag `--allowlisted-extension-id=<sideloaded_uBO_id>`. You'll need to do this every time.
3. Enable "Allow User Scripts" in the extension settings
4. Restart Chrome

## Issues
1. Occasionally it tries to inject into a nonexistent frame? ~~No idea what's going on here~~ This looks like it's a browser bug, uBlock Origin Lite has the same issues
2. Probably some of the MV2 APIs haven't been polyfilled yet so random parts are broken. It seems to be work consistently though

## How It Works
- `webRequestBlocking` is allowed on MV3 extensions if they are forceinstalled by policy or allowlisted via the command line
- Polyfilling `chrome.tabs.executeScript` and `chrome.tabs.insertCSS` is trivial with `chrome.scripting` and `chrome.userScripts`
- uBO's background page doesn't use many DOM APIs, and polyfilling them is trivial

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
[Chrome Dev]: https://chromewebstore.google.com/detail/ublock-origin-development/cgbcahbpdhpcegmbfconppldiemgcoii
[EasyList]: https://easylist.to/#easylist
[Mozilla]: https://addons.mozilla.org/addon/ublock-origin/
[Crowdin]: https://crowdin.com/project/ublock
[Chrome]: https://chromewebstore.google.com/detail/ublock-origin/cjpalhdlnbpafiamejdnhcphjbkeiagm
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
