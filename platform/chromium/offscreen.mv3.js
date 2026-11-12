// offscreen document host for workers. transient

const activeWorkers = new Map();

function handlePort() {
	let { port1: port, port2 } = new MessageChannel();

	port.onmessage = (e) => {
		if (e.data.type === "worker") {
			let wport = e.data.port;
			let worker = new Worker(...e.data.args);
			worker.onmessage = (e) => {
				wport.postMessage(e.data);
			};
			wport.onmessage = (e) => {
				worker.postMessage(e.data);
			};
			console.log("OWORKER CREATED", e.data.id);
			wport.start();

			activeWorkers.set(e.data.id, worker);
		} else if (e.data.type === "workerKill") {
			activeWorkers.get(e.data.id)?.terminate();
			activeWorkers.delete(e.data.id);
			console.log("OWORKER DEAD", e.data.id);
		}
	};
	port.start();

	return port2;
}

const sw = (await navigator.serviceWorker.ready).active;
const port2 = handlePort();
sw.postMessage({ type: "port", port: port2 }, [port2]);
console.log("OWORKER CONTACTED");
