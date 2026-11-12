// gemini'd. sorry
// only barely enough for ublock origin background page
globalThis.XMLHttpRequest = class {
	constructor() {
		this._listeners = {
			load: [],
			error: [],
			abort: [],
			loadend: [],
			progress: [],
		};
		this.readyState = 0; // UNSENT
		this.status = 0;
		this.statusText = "";
		this.response = null;
		this.responseType = "text";
		this._method = "";
		this._url = "";
		this._async = true;
		this._aborted = false;
		this._sendFlag = false;
		this._controller = null; // For AbortController
	}

	_dispatchEvent(type, event) {
		this._listeners[type].forEach((listener) => listener.call(this, event));
	}

	_finish(type) {
		if (this._sendFlag === false) return;
		this._sendFlag = false;
		this.readyState = 4; // DONE
		const event = { type, target: this };
		this._dispatchEvent(type, event);
		this._dispatchEvent("loadend", { type: "loadend", target: this });
	}

	addEventListener(type, listener) {
		if (this._listeners[type]) {
			this._listeners[type].push(listener);
		}
	}

	removeEventListener(type, listener) {
		if (this._listeners[type]) {
			this._listeners[type] = this._listeners[type].filter(
				(l) => l !== listener
			);
		}
	}

	open(method, url, async = true) {
		this._method = method.toUpperCase();
		this._url = url;
		this._async = async;
		this.readyState = 1; // OPENED
	}

	send(body = null) {
		this._aborted = false;
		this._sendFlag = true;
		this._controller = new AbortController();
		const signal = this._controller.signal;

		// readyState is 1 (OPENED) after open(), no initial progress event here.
		// Progress events will be dispatched as data arrives from the stream.

		const fetchOptions = {
			method: this._method,
			signal: signal,
		};

		if (body) {
			fetchOptions.body = body;
		}

		fetch(this._url, fetchOptions)
			.then((response) => {
				if (this._aborted) return;

				this.status = response.status;
				this.statusText = response.statusText;

				// HTTP error statuses are successful XHR transactions. They must
				// reach the load handler with status/statusText intact so callers can
				// distinguish a server response from a network failure.
				const contentLength = response.headers.get("Content-Length");
				const total = contentLength ? parseInt(contentLength, 10) : 0;
				// A real XHR takes the blob's type from the response, and
				// redirect-engine.js turns that blob into a data: URI whose mime
				// comes from exactly this.
				const blobOptions = {
					type: (response.headers.get("Content-Type") || "").split(";")[0].trim(),
				};
				let loaded = 0;
				const chunks = [];

				if (response.body) {
					const reader = response.body.getReader();
					return new Promise((resolveStream, rejectStream) => {
						const read = () => {
							reader
								.read()
								.then(({ done, value }) => {
									if (this._aborted) {
										reader.cancel(); // Cancel the stream if aborted
										rejectStream(new DOMException("Aborted", "AbortError"));
										return;
									}

									if (done) {
										// All data received
										resolveStream(new Blob(chunks, blobOptions)); // Resolve with a Blob containing all chunks
										return;
									}

									chunks.push(value);
									loaded += value.length;
									// Dispatch progress event
									this._dispatchEvent("progress", {
										loaded: loaded,
										total: total,
										lengthComputable: total > 0,
									});
									read(); // Read next chunk
								})
								.catch((error) => {
									rejectStream(error);
								});
						};
						read(); // Start reading the stream
					});
				} else {
					// No body (e.g., HEAD request or empty response)
					return Promise.resolve(new Blob([], blobOptions));
				}
			})
			.then((blob) => {
				if (this._aborted) return;

				// Convert blob content to desired responseType
				switch (this.responseType) {
					case "blob":
						this.response = blob;
						return;
					case "arraybuffer":
						return blob.arrayBuffer().then((buffer) => {
							this.response = buffer;
						});
					case "json":
						return blob.text().then((text) => {
							try {
								this.response = JSON.parse(text);
							} catch {
								// Invalid JSON does not turn a completed XHR into a
								// network error.
								this.response = null;
							}
						});
					default:
						// 'text' or default
						return blob.text().then((text) => {
							this.response = text;
						});
				}
			})
			.then(() => {
				if (this._aborted) return;
				this._finish("load");
			})
			.catch((error) => {
				if (this._aborted) return;
				this.status = 0;
				this.statusText = "";
				this.response = null;
				this._finish(error.name === "AbortError" ? "abort" : "error");
			});
	}

	abort() {
		if (this._sendFlag === false) return;
		this._aborted = true;
		this._controller?.abort();
		this.status = 0;
		this.statusText = "";
		this.response = null;
		this._finish("abort");
		this.readyState = 0; // UNSENT after the abort event has been dispatched
	}
};
