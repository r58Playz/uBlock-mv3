/*******************************************************************************

    uBlock Origin - a comprehensive, efficient content blocker
    Copyright (C) 2017-present Raymond Hill

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/gorhill/uBlock
*/

// For background page, auxiliary pages, and content scripts.

/******************************************************************************/

if (
    self.browser instanceof Object &&
    // [PATCH uBlock-mv3] @SukkaW
    //
    // uBO add this check to circumvent a specific issue:
    // contentscript is injected directly into the DOM, but what if
    // there is a <div id="broswer" /> that can also register self.browser?
    //
    // See https://github.com/uBlockOrigin/uBlock-issues/issues/1914
    //
    // However, we don't have this issue in the very first place, as we are in
    // a Service Worker and there is no DOM pollution.
    //
    // self.browser instanceof Element === false
    typeof self.browser === "object" &&
    (
        typeof Element === "function"
            ? (self.browser instanceof Element === false)
            : (true)
    )
) {
    self.chrome = self.browser;
} else {
    self.browser = self.chrome;
}

/******************************************************************************/

// https://bugzilla.mozilla.org/show_bug.cgi?id=1408996#c9
var vAPI = self.vAPI; // jshint ignore:line

// https://github.com/chrisaljoudi/uBlock/issues/464
// https://github.com/chrisaljoudi/uBlock/issues/1528
//   A XMLDocument can be a valid HTML document.

// https://github.com/gorhill/uBlock/issues/1124
//   Looks like `contentType` is on track to be standardized:
//   https://dom.spec.whatwg.org/#concept-document-content-type

// https://forums.lanik.us/viewtopic.php?f=64&t=31522
//   Skip text/plain documents.

if (
    // [PATCH uBlock-mv3 START] @SukkaW
    //
    // uBO include this check to skip itself on Chrome's JSON/XML/Text code view.
    //
    // For us, Service Worker do not have DOM, so we short circuit Service Worker here
    (
        (
            typeof ServiceWorkerGlobalScope !== "undefined"
        ) || (
            (
                document instanceof HTMLDocument ||
                document instanceof XMLDocument &&
                document.createElement('div') instanceof HTMLDivElement
            ) &&
            (
                /^image\/|^text\/plain/.test(document.contentType || '') === false
            )
        )
    ) && (
        self.vAPI instanceof Object === false || vAPI.uBO !== true
    )
) {
    vAPI = self.vAPI = { uBO: true };
}








/*******************************************************************************

    DO NOT:
    - Remove the following code
    - Add code beyond the following code
    Reason:
    - https://github.com/gorhill/uBlock/pull/3721
    - uBO never uses the return value from injected content scripts

**/

void 0;
