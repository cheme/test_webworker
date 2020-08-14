
function log(msg) {
//	console.log("WORKER " + msg);
}

var array_buf = { };
var atomic = 0;
var first = true;
var shared_array_buf = false;
var count = 0;
var total_count = 0;
var expected_result = {};

onmessage = function(e) {
	if (first == true) {
		log('Received shared array buffer');
		shared_array_buf = e.data;
    array_buf = new Int32Array(shared_array_buf);
    first == false;
		start();
	} else {
		log('Worker: Message received from main script' + e.data);

		array_buf.set(e.data, 0);
		atomic = 1;
	}
}

//import { start_client, default as init } from './pkg/polkadot_cli.js';
async function start() {
	log('Loading WASM');
//	await init('./pkg/polkadot_cli_bg.wasm');
	log('Successfully loaded WASM');
	log('Fetching chain spec');
/*	//const chain_spec_response = await fetch("https://raw.githubusercontent.com/paritytech/polkadot/master/service/res/westend.json");
	//const chain_spec_response = await fetch("http://localhost:8000/polkadot.json");
	const chain_spec_response = await fetch("http://localhost:8000/westend.json");
	const chain_spec_text = await chain_spec_response.text();

	// Build our client.
	log('Starting client');
	let client = await start_client(chain_spec_text, 'info');
	log('Client started');

	client.rpcSubscribe('{"method":"chain_subscribeNewHead","params":[],"id":1,"jsonrpc":"2.0"}',
		(r) => log("New chain head: " + r));

	setInterval(() => {
		client
			.rpcSend('{"method":"system_networkState","params":[],"id":1,"jsonrpc":"2.0"}')
			.then((r) => log("Network state: " + r));
	}, 20000);*/


// fix 4 length key
// 4length value
  let write_set_kv_message = function() {
    atomic = 0;
    let sl = new Int32Array(8);
		crypto.getRandomValues(sl);
    array_buf.set(sl, 1);
    log("set "+ array_buf.slice(1, 9));
    expected_result = array_buf.slice(5, 9);
    Atomics.store(array_buf, 0, 1);
    postMessage({});
    Atomics.wait(array_buf, 0, 1);
    if (array_buf[0] == 3) {
    log("set ok "+ array_buf.slice(1, 5));
				return array_buf.slice(1,5);
		} else {
    log("set ko ");
				return array_buf.slice(0,0);
		}
	};
  let set_new_key = function() {
    let key = write_set_kv_message();

    return key;
	};
  let get_key = function(key) {
    atomic = 0;
    array_buf.set(key, 1);
    Atomics.store(array_buf, 0, 2);
    postMessage({});
    Atomics.wait(array_buf, 0, 2);
    if (array_buf[0] == 3) {
  		count += 1;
      log("get " + count + " ok "+ array_buf.slice(1, 5));
			return array_buf.slice(1,5);
		} else {
      log("set ko ");
			return array_buf.slice(0,0);
		}
	};
  while (true) {
    // do set a random value
		let key = set_new_key();
    // do read this random value
    if (key.length > 0) {
			let val = get_key(key);
      if (val.length > 0) {
				if (expected_result[0] != val[0]) {
					console.error('mismatch');
				}
				log("got inserted " + val);
			}
 
		}
		total_count += 1;
    if (total_count % 1000 == 0) {
      console.log("processed {:?}", total_count);
      // create a delay by waiting on worker blocked message
			Atomics.store(array_buf, 0, 0);
			postMessage({});
      Atomics.wait(array_buf, 0, 0);
		}
	}
}
