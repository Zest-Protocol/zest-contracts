const fs = require("fs/promises");
const { spawn , exec } = require('child_process');
var net = require("net");
const BitcoinClient = require("bitcoin-core");
const bitcoin = require('bitcoinjs-lib');
const BN = require("bn.js")
const ecpair = require('ecpair');

const REGTEST_DIR = "./btc/regtest"
const PORT = 18332;
const DEBUG = !!process.env.DEBUG;

async function start_btc_chain() {
    return new Promise(async(resolve, reject) => {
        try { await clear_regtest() }
        catch(e) { console.error(e) }

        let btc_proc = spawn('npm run btc-test-rpc', { shell: true, timeout: 5000 })
        DEBUG && btc_proc.stdout.on("data", chunk => console.debug(chunk.toString()))
        btc_proc.on("error", reject)
        btc_proc.on("exit", code => code > 0 && reject(`BTC process exited with ${code}. Set DEBUG=1 for more information.`))
        
        const client = await wait_btc_client();
        const batch = [
            { method: 'createwallet', parameters: ["test"] },
            // { method: 'settxfee', parameters: ["0.00001"] },
        ]
        await client.command(batch);
        // await client.createWallet("test")
        // await client.setTxFee("0.00001")
        
        const addresses = await Promise.all([client.getNewAddress(), client.getNewAddress(), client.getNewAddress()])
        const private_keys = await Promise.all(addresses.map(address => client.dumpPrivKey(address)))
        const accounts = private_keys.map(private_key => ecpair.ECPair.fromWIF(private_key, bitcoin.networks.regtest))
        
        accounts.map((account, index) => account.address = addresses[index])

        // mining 101 blocks (100 blocks for the coinbase to be available)
        await client.generateToAddress(101, addresses[0])
        
        await Promise.all(accounts.slice(1).map(account => client.sendToAddress(account.address, "10"))) // send 10 BTC to the addresses
        
        resolve({
            btc_proc,
            client,
            session: { accounts },
            mine_empty_blocks: function(count) {
                return client.generateToAddress(count, accounts[0].address)
            },
            block_height: async (increment) => {
                const height = new BN(await client.getBlockCount())
                return increment ? height.add(new BN(increment)) : height
            },
            balance: function(address, confirmations) {
                return client.getReceivedByAddress(address, confirmations || 0)
            },
            kill: async function(signal) {
                await exec("bitcoin-cli -regtest stop")
                await fs.rm(REGTEST_DIR, { recursive: true, force: true })
                this.btc_proc.kill(signal);
            }
        })
    })
}

async function wait_btc_client() {
    return new Promise((resolve, reject) => {
        let attempts = 0
        let try_client = async () => {
            ++attempts
            if(await is_local_port_open(PORT))
                return setTimeout(() => {
                    resolve(new BitcoinClient({
                                network: "regtest",
                                port: PORT,
                                // timeout: 1000000,
                                username: "btc-lend",
                                password: "btc-lend-password"
                            }))
                }, 1000);
            if(attempts > 40)
                return reject("BTC RPC not responding after 10 seconds")
            setTimeout(try_client, 250);
        }
        try_client()
    })
}

async function is_local_port_open(port) {
    return new Promise(resolve => {
        let socket
        const timeout = setTimeout(() => {
            socket.end()
            resolve(false)
        }, 10000)
        socket = net.createConnection(port, "127.0.0.1", () => {
            socket.end()
            clearTimeout(timeout)
            resolve(true)
        })
        socket.on("error", () => {
            clearTimeout(timeout)
            resolve(false)
        })
    })
}

function clear_regtest() {
    return fs.rm(REGTEST_DIR, { recursive : true, force: true })
}

module.exports = {
    start_btc_chain,
}