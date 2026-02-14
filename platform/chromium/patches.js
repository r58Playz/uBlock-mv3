class HTMLDivElement {}
class HTMLDocument {
	currentScript = {
		src: chrome.runtime.getURL("/js/background.sw.js"),
	}
	title = "uBlock Origin Background Page";

	createElement(type) {
		if (type === "div")
			return new HTMLDivElement();
		throw "a";
	}
}
class CSS {
	static supports(selector) {
		console.log("supports", selector);
		return true;
	}
}

globalThis.HTMLDivElement = HTMLDivElement;
globalThis.HTMLDocument = HTMLDocument;
globalThis.XMLDocument = class { };
globalThis.Element = class { };
globalThis.CSS = CSS;
globalThis.document = new HTMLDocument();
globalThis.window = globalThis;

chrome.browserAction = chrome.action;
let oldSetIcon = chrome.browserAction.setIcon;
chrome.browserAction.setIcon = (...args) => {
	if (args[0].path) {
		args[0].path = Object.fromEntries(Object.entries(args[0].path).map(([a, b]) => [a, "/" + b]));
	}
	oldSetIcon(...args);
}

globalThis.requestIdleCallback =
	function(cb) {
		var start = Date.now();
		return setTimeout(function() {
			cb({
				didTimeout: false,
				timeRemaining: function() {
					return Math.max(0, 50 - (Date.now() - start));
				},
			});
		}, 1);
	};
globalThis.cancelIdleCallback =
	function(id) {
		clearTimeout(id);
	};

chrome.tabs.executeScript = (id, details, cb) => {
	let target = { tabId: id };
	if (typeof details.frameId === "number") target.frameIds = [details.frameId];

	if (details.file && typeof details.file === "string") {
		chrome.scripting.executeScript({ target, files: [details.file], injectImmediately: true }).then(cb);
	} else if (details.code && typeof details.code === "string") {
		if (details.code.indexOf("\0")) {
			let split = details.code.split("\0");
			let mainWorld = split[0];
			details.code = split[1];
			chrome.userScripts.execute({ target, js: [{ code: mainWorld }], injectImmediately: true, world: "MAIN" });
		}
		chrome.userScripts.execute({ target, js: [{ code: details.code }], injectImmediately: true }).then(cb);
	} else {
		console.error(id, details);
		throw "b";
	}
}
chrome.tabs.insertCSS = (id, details, cb) => {
	let target = { tabId: id };
	if (typeof details.frameId === "number") target.frameIds = [details.frameId];

	chrome.scripting.insertCSS({ target, css: details.code, origin: details.cssOrigin.toUpperCase() }).then(cb);
}

self.browser = self.chrome;

function checkUserScripts() {
	try {
		chrome.userScripts.getScripts();
		return true;
	} catch {
		return false;
	}
}

globalThis.__ubo_preinit = async () => {
	while (!checkUserScripts()) {
        chrome.browserAction.setBadgeText({ text: "!" });
        chrome.browserAction.setBadgeBackgroundColor({
            color: "#FC0",
        });
		await new Promise(r=>setTimeout(r, 1000 * 60 * 5));
	}
	globalThis.__ubo_hasUserScripts = true;
}
