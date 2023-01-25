const readline = require('readline')
const spawn = require('child_process').spawn
const BN = require("bn.js")

const DEBUG = !!process.env.DEBUG

function wrap_clarinet_proc(clarinet_proc, onready) {
    let rl = readline.createInterface({ input: clarinet_proc.stdout })
    let running = false
    const queue = []
    const session = {}
    let block_height = 0;
    rl.on("line", line => {
        if(!running) { // initialize Clarinet to defaults
            try {
                const response = JSON.parse(line);
                if (response.ready) {
                    running = true
                    session.accounts = response.accounts
                    session.contracts = response.contracts
                    DEBUG && console.debug(`Received Clarinet session state: ${line}`)
                    onready()
                }
            } catch(e) {
                DEBUG && console.debug(`${e}`)
                DEBUG && console.debug(`Input causing Error: ${line}`)
                // console.error(e)
            }
            return;
        }
        DEBUG && console.debug(`STX: ${line}`)
        DEBUG && console.debug(`QUEUE: ${queue}`)
        if(!queue.length)
            return;
        const [resolve, reject, op] = queue.shift()
        
        try {
            const response = JSON.parse(line)
            if (response && response.result && response.result.block_height)
                block_height = response.result.block_height
            switch(op) {
                case "mine_empty_blocks": return resolve(response.result.block_height)
                case "call_read_only_fn": return resolve({ result: response.result, events: response.result.events })
                case "mine_block": return resolve(response.result.receipts)
                case "get_assets_maps": return resolve(response.result.assets)
            }
            resolve(response)
        } catch(e) {
            // First input causes an error
            // we might want to skip the first one
            // reject({e, line})
            DEBUG && console.debug(`${e}`)
            DEBUG && console.debug(`Input causing Error: ${line}`)
        }
    })
    return {
        clarinet_proc,
        session_id: 0,
        request_id: 0,
        session,
        block_height: async (increment) => {
            const height = new BN(block_height)
            return increment ? height.add(new BN(increment)) : height
        },
        send: async function (op, params) {
            if(!running)
                return Promise.reject("Not running!")
            return new Promise((resolve, reject) => {
                queue.push([resolve, reject, op])
                DEBUG && console.debug(`Sending to Clarinet session: ${JSON.stringify({ op, params })}`)
                this.clarinet_proc.stdin.write(JSON.stringify({ id: this.request_id++, op, params }) + "\n")
            })
        },
        mine_empty_blocks: async function(count) {
            return this.send("mine_empty", { sessionId: this.session_id, count })
        },
        contract_call: async function(contract, function_name, function_args, sender) {
            if (contract[0] === ".")
                contract = this.session.accounts.deployer.address + contract
            const transactions = [
                {
                    type: 2, // contract call
                    contractCall: {
                        contract,
                        method: function_name,
                        args: function_args || []
                    },
                    sender: sender || this.session.accounts.deployer.address,
                }
            ]
            return this.send("mine_block", { sessionId: this.session_id, transactions})
        },
        read_only_call: async function(contract, function_name, function_args, sender) {
            if (contract[0] === ".")
                contract = this.session.accounts.deployer.address + contract
            return this.send("call_read_only_fn", {
                sessionId: this.session_id,
                contract,
                method: function_name,
                args: function_args || [],
                sender: sender || this.session.accounts.deployer.address
            })
        },
        asset_maps: async function() {
            return this.send("get_assets_maps", { sessionId: this.session_id })
        },
        balance: async function(principal) {
            const assets = await this.asset_maps();
            return new BN(assets.STX[principal] || 0)
        },
        kill: function (signal) {
            queue.forEach(([, reject]) => reject())
            rl.close()
            this.clarinet_proc.kill(signal)
        }
    }
}

async function start_stx_chain() {
    return new Promise((resolve, reject) => {
        const child = spawn("npm run stx-test-rpc", { shell: true, timeout: 5000 })
		child.on('error',reject)
		child.on('exit',code => code > 0 && reject(`Clarinet process exited with ${code}. Set DEBUG=1 for more information.`))
        const clarinet_session = wrap_clarinet_proc(child, () => resolve(clarinet_session))
    })
}

module.exports = {
    start_stx_chain
}