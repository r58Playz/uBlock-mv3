/*******************************************************************************

    uBlock Origin - a comprehensive, efficient content blocker
    Copyright (C) 2014-present Raymond Hill

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

import { i18n$ } from './i18n.js';
import µb from './background.js';

/******************************************************************************/

const contextMenu = (( ) => {

/******************************************************************************/

if ( vAPI.contextMenu === undefined ) {
    return {
        update: function() {}
    };
}

/******************************************************************************/

const BLOCK_ELEMENT_BIT          = 0b00001;
const BLOCK_RESOURCE_BIT         = 0b00010;
const TEMP_ALLOW_LARGE_MEDIA_BIT = 0b00100;
const SUBSCRIBE_TO_LIST_BIT      = 0b01000;
const VIEW_SOURCE_BIT            = 0b10000;
const OPEN_POPUP_PANEL_BIT       = 0b100000;

// [PATCH uBlock-mv3]
// Chromium on Android phones has no toolbar, hence no way to open the popup
// panel. Chromium only drops the `Mobile` token from its user agent when it
// uses the tablet/desktop layout, which does have a toolbar.
const isChromiumMobile = ( ) =>
    vAPI.webextFlavor.soup.has('chromium') &&
    vAPI.webextFlavor.soup.has('mobile');

/******************************************************************************/

const onBlockElement = function(details, tab) {
    if ( tab === undefined ) { return; }
    if ( /^https?:\/\//.test(tab.url) === false ) { return; }
    let tagName = details.tagName || '';
    let src = details.frameUrl || details.srcUrl || details.linkUrl || '';

    if ( !tagName ) {
        if ( typeof details.frameUrl === 'string' && details.frameId !== 0 ) {
            tagName = 'iframe';
            src = details.srcUrl;
        } else if ( typeof details.srcUrl === 'string' ) {
            if ( details.mediaType === 'image' ) {
                tagName = 'img';
                src = details.srcUrl;
            } else if ( details.mediaType === 'video' ) {
                tagName = 'video';
                src = details.srcUrl;
            } else if ( details.mediaType === 'audio' ) {
                tagName = 'audio';
                src = details.srcUrl;
            }
        } else if ( typeof details.linkUrl === 'string' ) {
            tagName = 'a';
            src = details.linkUrl;
        }
    }

    µb.epickerArgs.mouse = true;
    µb.elementPickerExec(tab.id, 0, `${tagName}\t${src}`);
};

/******************************************************************************/

const onBlockElementInFrame = function(details, tab) {
    if ( tab === undefined ) { return; }
    if ( /^https?:\/\//.test(details.frameUrl) === false ) { return; }
    µb.epickerArgs.mouse = false;
    µb.elementPickerExec(tab.id, details.frameId);
};

/******************************************************************************/

const onSubscribeToList = function(details) {
    let parsedURL;
    try {
        parsedURL = new URL(details.linkUrl);
    }
    catch {
    }
    if ( parsedURL instanceof URL === false ) { return; }
    const url = parsedURL.searchParams.get('location');
    if ( url === null ) { return; }
    const title = parsedURL.searchParams.get('title') || '?';
    const hash = µb.selectedFilterLists.indexOf(parsedURL) !== -1
        ? '#subscribed'
        : '';
    vAPI.tabs.open({
        url:
            `/asset-viewer.html` +
            `?url=${encodeURIComponent(url)}` +
            `&title=${encodeURIComponent(title)}` + 
            `&subscribe=1${hash}`,
        select: true,
    });
};

/******************************************************************************/

const onTemporarilyAllowLargeMediaElements = function(details, tab) {
    if ( tab === undefined ) { return; }
    const pageStore = µb.pageStoreFromTabId(tab.id);
    if ( pageStore === null ) { return; }
    pageStore.temporarilyAllowLargeMediaElements(true);
};

/******************************************************************************/

const onViewSource = function(details, tab) {
    if ( tab === undefined ) { return; }
    const url = details.linkUrl || details.frameUrl || details.pageUrl || '';
    if ( /^https?:\/\//.test(url) === false ) { return; }
    µb.openNewTab({
        url: `code-viewer.html?url=${self.encodeURIComponent(url)}`,
        select: true,
    });
};

/******************************************************************************/

const onOpenPopupPanel = function(details, tab) {
    if ( tab === undefined ) { return; }
    µb.openNewTab({
        url: `popup-fenix.html?tabId=${tab.id}&intab=1`,
        select: true,
    });
};

/******************************************************************************/

const onEntryClicked = function(details, tab) {
    if ( details.menuItemId === 'uBlock0-blockElement' ) {
        return onBlockElement(details, tab);
    }
    if ( details.menuItemId === 'uBlock0-blockElementInFrame' ) {
        return onBlockElementInFrame(details, tab);
    }
    if ( details.menuItemId === 'uBlock0-blockResource' ) {
        return onBlockElement(details, tab);
    }
    if ( details.menuItemId === 'uBlock0-subscribeToList' ) {
        return onSubscribeToList(details);
    }
    if ( details.menuItemId === 'uBlock0-temporarilyAllowLargeMediaElements' ) {
        return onTemporarilyAllowLargeMediaElements(details, tab);
    }
    if ( details.menuItemId === 'uBlock0-viewSource' ) {
        return onViewSource(details, tab);
    }
    if ( details.menuItemId === 'uBlock0-openPopupPanel' ) {
        return onOpenPopupPanel(details, tab);
    }
};

/******************************************************************************/

const menuEntries = {
    blockElement: {
        id: 'uBlock0-blockElement',
        title: i18n$('pickerContextMenuEntry'),
        contexts: [ 'all' ],
        documentUrlPatterns: [ 'http://*/*', 'https://*/*' ],
    },
    blockElementInFrame: {
        id: 'uBlock0-blockElementInFrame',
        title: i18n$('contextMenuBlockElementInFrame'),
        contexts: [ 'frame' ],
        documentUrlPatterns: [ 'http://*/*', 'https://*/*' ],
    },
    blockResource: {
        id: 'uBlock0-blockResource',
        title: i18n$('pickerContextMenuEntry'),
        contexts: [ 'audio', 'frame', 'image', 'video' ],
        documentUrlPatterns: [ 'http://*/*', 'https://*/*' ],
    },
    subscribeToList: {
        id: 'uBlock0-subscribeToList',
        title: i18n$('contextMenuSubscribeToList'),
        contexts: [ 'link' ],
        targetUrlPatterns: [ 'abp:*', 'https://subscribe.adblockplus.org/*' ],
    },
    temporarilyAllowLargeMediaElements: {
        id: 'uBlock0-temporarilyAllowLargeMediaElements',
        title: i18n$('contextMenuTemporarilyAllowLargeMediaElements'),
        contexts: [ 'all' ],
        documentUrlPatterns: [ 'http://*/*', 'https://*/*' ],
    },
    viewSource: {
        id: 'uBlock0-viewSource',
        title: i18n$('contextMenuViewSource'),
        contexts: [ 'page', 'frame', 'link' ],
        documentUrlPatterns: [ 'http://*/*', 'https://*/*' ],
    },
    openPopupPanel: {
        id: 'uBlock0-openPopupPanel',
        title: i18n$('contextMenuOpenPopupPanel'),
        contexts: [ 'all' ],
        documentUrlPatterns: [ 'http://*/*', 'https://*/*' ],
    },
    mobileRoot: {
        id: 'uBlock0-mobileRoot',
        title: vAPI.app.name,
        contexts: [ 'all' ],
        documentUrlPatterns: [ 'http://*/*', 'https://*/*' ],
    },
};

/******************************************************************************/

let currentBits = 0;

const update = function(tabId = undefined) {
    let newBits = 0;
    if ( µb.userSettings.contextMenuEnabled ) {
        const pageStore = tabId && µb.pageStoreFromTabId(tabId) || null;
        if ( pageStore?.getNetFilteringSwitch() ) {
            if ( µb.userFiltersAreEnabled() ) {
                if ( pageStore.shouldApplySpecificCosmeticFilters(0) ) {
                    newBits |= BLOCK_ELEMENT_BIT;
                } else {
                    newBits |= BLOCK_RESOURCE_BIT;
                }
            }
            if ( pageStore.largeMediaCount !== 0 ) {
                newBits |= TEMP_ALLOW_LARGE_MEDIA_BIT;
            }
        }
        if ( µb.hiddenSettings.filterAuthorMode ) {
            newBits |= VIEW_SOURCE_BIT;
        }
        if ( isChromiumMobile() ) {
            newBits |= OPEN_POPUP_PANEL_BIT;
        }
    }
    newBits |= SUBSCRIBE_TO_LIST_BIT;
    if ( newBits === currentBits ) { return; }
    currentBits = newBits;
    const usedEntries = [];
    if ( (newBits & BLOCK_ELEMENT_BIT) !== 0 ) {
        usedEntries.push(menuEntries.blockElement);
        usedEntries.push(menuEntries.blockElementInFrame);
    }
    if ( (newBits & BLOCK_RESOURCE_BIT) !== 0 ) {
        usedEntries.push(menuEntries.blockResource);
    }
    if ( (newBits & TEMP_ALLOW_LARGE_MEDIA_BIT) !== 0 ) {
        usedEntries.push(menuEntries.temporarilyAllowLargeMediaElements);
    }
    if ( (newBits & SUBSCRIBE_TO_LIST_BIT) !== 0 ) {
        usedEntries.push(menuEntries.subscribeToList);
    }
    if ( (newBits & VIEW_SOURCE_BIT) !== 0 ) {
        usedEntries.push(menuEntries.viewSource);
    }
    if ( (newBits & OPEN_POPUP_PANEL_BIT) !== 0 ) {
        usedEntries.push(menuEntries.openPopupPanel);
        // [PATCH uBlock-mv3]
        // Chromium's Android context menu drops clicks on top-level extension
        // items (ContextMenuMediator replaces their click listener), while
        // items inside an extension's submenu still work. Nest all entries
        // under one parent so they always end up in a submenu. The panel
        // entry matches every http(s) page, so the parent is never empty.
        for ( let i = 0; i < usedEntries.length; i++ ) {
            usedEntries[i] = {
                ...usedEntries[i],
                parentId: menuEntries.mobileRoot.id,
            };
        }
        usedEntries.unshift(menuEntries.mobileRoot);
    }
    vAPI.contextMenu.setEntries(usedEntries, onEntryClicked);
};

/******************************************************************************/

// https://github.com/uBlockOrigin/uBlock-issues/issues/151
//   For unknown reasons, the currently active tab will not be successfully
//   looked up after closing a window.

vAPI.contextMenu.onMustUpdate = async function(tabId = undefined) {
    if ( µb.userSettings.contextMenuEnabled === false ) {
        return update();
    }
    if ( tabId !== undefined ) {
        return update(tabId);
    }
    const tab = await vAPI.tabs.getCurrent();
    if ( tab instanceof Object === false ) { return; }
    update(tab.id);
};

return { update: vAPI.contextMenu.onMustUpdate };

/******************************************************************************/

})();

/******************************************************************************/

export default contextMenu;

/******************************************************************************/
