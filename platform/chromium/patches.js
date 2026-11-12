// dom polyfills
class HTMLDocument {
	currentScript = {
		src: chrome.runtime.getURL("/js/background.sw.js"),
	};
	title = "uBlock Origin Background Page";

	createElement(type) {
		throw new TypeError("HTMLDocument.createElement is not implemented");
	}
}

globalThis.requestIdleCallback = function (cb) {
	var start = Date.now();
	return setTimeout(function () {
		cb({
			didTimeout: false,
			timeRemaining: function () {
				return Math.max(0, 50 - (Date.now() - start));
			},
		});
	}, 1);
};
globalThis.cancelIdleCallback = function (id) {
	clearTimeout(id);
};

globalThis.HTMLDocument = HTMLDocument;
globalThis.Element = class {};
globalThis.document = new HTMLDocument();
globalThis.window = globalThis;

// browserAction
chrome.browserAction = chrome.action;
let oldSetIcon = chrome.browserAction.setIcon;
chrome.browserAction.setIcon = (...args) => {
	if (args[0].path) {
		args[0].path = Object.fromEntries(
			Object.entries(args[0].path).map(([a, b]) => [a, "/" + b])
		);
	}
	oldSetIcon(...args);
};

// scripting/css
chrome.tabs.executeScript = (id, details, cb) => {
	let target = { tabId: id };
	if (typeof details.frameId === "number") target.frameIds = [details.frameId];
	else if (details.allFrames) target.allFrames = true;

	let injectImmediately = details.runAt === "document_start";
	let callback = (r) => cb(Array.isArray(r) ? r.map((x) => x && x.result) : r);
	let failed = () => cb(undefined);

	if (details.file && typeof details.file === "string") {
		chrome.scripting
			.executeScript({ target, files: [details.file], injectImmediately })
			.then(callback, failed);
	} else if (details.code && typeof details.code === "string") {
		chrome.userScripts
			.execute({
				target,
				js: [{ code: details.code }],
				injectImmediately,
			})
			.then(callback, failed);
	} else {
		console.error(id, details);
		throw new Error("failed to executeScript");
	}
};
chrome.tabs.insertCSS = (id, details, cb) => {
	let target = { tabId: id };
	if (typeof details.frameId === "number") target.frameIds = [details.frameId];
	else if (details.allFrames) target.allFrames = true;

	chrome.scripting
		.insertCSS({
			target,
			css: details.code,
			origin: details.cssOrigin.toUpperCase(),
		})
		.then(cb, () => cb());
};
chrome.tabs.removeCSS = (id, details, cb) => {
	let target = { tabId: id };
	if (typeof details.frameId === "number") target.frameIds = [details.frameId];
	else if (details.allFrames) target.allFrames = true;

	chrome.scripting
		.removeCSS({
			target,
			css: details.code,
			origin: details.cssOrigin.toUpperCase(),
		})
		.then(cb, () => cb());
};

self.browser = self.chrome;

// keepalive. works because chrome treats this as a browser-side function call
// and pushes keepalive for it. cheaper than offscreen document which is
// guaranteed to work
setInterval(() => {
	chrome.runtime.getPlatformInfo().catch(() => {});
}, 20 * 1000);

// async webRequestBlocking is gated behind Manifest::IsPolicyLocation() directly,
// so --allowlisted-extension-id installs don't support it. the only way to check
// whether it's available is not available syncly. assume it's available for the
// 1 call before we can check
globalThis.__ubo_canAsyncBlock = undefined;
let getSelfPromise = chrome.management
	.getSelf()
	.then((info) => {
		globalThis.__ubo_canAsyncBlock = info.installType === "admin";
	})
	.catch(() => {});

function checkUserScripts() {
	try {
		chrome.userScripts.getScripts().catch(() => {});
		return true;
	} catch {
		return false;
	}
}

globalThis.__ubo_preinit = async () => {
	await getSelfPromise;

	while (!checkUserScripts()) {
		chrome.browserAction.setBadgeText({ text: "!" });
		chrome.browserAction.setBadgeBackgroundColor({
			color: "#FC0",
		});
		await new Promise((r) => setTimeout(r, 1000 * 5));
	}
	await chrome.userScripts.configureWorld({ csp: "", messaging: true });
	globalThis.__ubo_hasUserScripts = true;
};
