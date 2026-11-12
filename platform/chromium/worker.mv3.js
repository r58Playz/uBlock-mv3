// lazy offscreen document for workers

let genuid = () => {
	return [...Array(16)].reduce((a) => a + Math.random().toString(36)[2], "");
};

const OFFSCREEN_URL = chrome.runtime.getURL("/offscreen.html");
const OFFSCREEN_GRACE = 30000;

let offscreenPort = null;
let offscreenPending = null;
let resolveOffscreenPort = null;
let closeTimer = null;
let closePending = null;

const workers = new Set();

self.onmessage = (e) => {
	const msg = e.data;
	if (msg.type !== "port") {
		return;
	}
	console.log("OFFSCREEN CONNECTED");
	offscreenPort = msg.port;
	if (resolveOffscreenPort !== null) {
		resolveOffscreenPort(msg.port);
		resolveOffscreenPort = null;
	}
};

async function offscreenExists() {
	const existing = await chrome.runtime.getContexts({
		contextTypes: ["OFFSCREEN_DOCUMENT"],
		documentUrls: [OFFSCREEN_URL],
	});
	return existing.length !== 0;
}

const offscreenReset = (async () => {
	try {
		if (await offscreenExists()) {
			console.log("OFFSCREEN STALE");
			await chrome.offscreen.closeDocument();
		}
	} catch {}
})();

function ensureOffscreen() {
	if (closeTimer !== null) {
		clearTimeout(closeTimer);
		closeTimer = null;
	}
	if (offscreenPort !== null) {
		return Promise.resolve(offscreenPort);
	}
	if (offscreenPending !== null) {
		return offscreenPending;
	}
	offscreenPending = (async () => {
		await offscreenReset;
		if (closePending !== null) {
			await closePending;
		}
		const handshake = new Promise((r) => {
			resolveOffscreenPort = r;
		});
		if ((await offscreenExists()) === false) {
			try {
				await chrome.offscreen.createDocument({
					url: OFFSCREEN_URL,
					reasons: ["WORKERS"],
					justification: "polyfilling workers",
				});
				console.log("OFFSCREEN CREATED");
			} catch {
				// Lost a race against another createDocument(); the document
				// that won will hand us a port.
			}
		}
		const port = await handshake;
		offscreenPending = null;
		return port;
	})();
	return offscreenPending;
}

function releaseOffscreen() {
	if (workers.size !== 0) {
		return;
	}
	if (closeTimer !== null) {
		return;
	}
	closeTimer = setTimeout(async () => {
		closeTimer = null;
		if (workers.size !== 0) {
			return;
		}
		offscreenPort = null;
		offscreenPending = null;
		closePending = (async () => {
			try {
				await chrome.offscreen.closeDocument();
				console.log("OFFSCREEN CLOSED");
			} catch {}
		})();
		await closePending;
		closePending = null;
	}, OFFSCREEN_GRACE);
}

/******************************************************************************/

class Worker extends EventTarget {
	backlog = [];
	id = genuid();
	port = null;

	constructor(...args) {
		super();

		workers.add(this);

		ensureOffscreen().then((host) => {
			if (workers.has(this) === false) {
				return;
			}

			let { port1, port2 } = new MessageChannel();
			host.postMessage({ type: "worker", args, port: port2, id: this.id }, [
				port2,
			]);

			this.port = port1;
			port1.onmessage = (e) => {
				if (this.onmessage) this.onmessage(e);
				this.dispatchEvent(new MessageEvent("message", { data: e.data }));
			};

			for (let x of this.backlog.splice(0, this.backlog.length)) {
				this.port.postMessage(...x);
			}
			port1.start();
		});
	}

	postMessage(...args) {
		if (this.port) {
			this.port.postMessage(...args);
		} else {
			this.backlog.push(args);
		}
	}

	terminate() {
		if (workers.delete(this) === false) {
			return;
		}
		if (offscreenPort !== null) {
			offscreenPort.postMessage({ type: "workerKill", id: this.id });
		}
		this.port = null;
		this.backlog.length = 0;
		releaseOffscreen();
	}
}
globalThis.Worker = Worker;
