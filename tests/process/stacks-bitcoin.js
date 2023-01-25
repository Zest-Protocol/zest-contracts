const assert = require('chai').assert;
const expect = require('chai').expect;
const BN = require("bn.js");

const {
    start_stx_chain,
} = require("./chain/stacks");
const {
    start_btc_chain
} = require("./chain/btc");

describe("When starting up a Stacks and Bitcoin chain", function() {
    before(async function() {
        console.log("Starting Stacks and Bitcoin chain...")
        let stx_chain_process, btc_chain_process;

		const kill = async() => {
            console.log('Stopping chains...');
            try {stx_chain_process.kill('SIGINT');} catch(e){};
            try {btc_chain_process.kill('SIGINT');} catch(e){};
        };

        process.on('SIGINT', kill);
        process.on('uncaughtException', kill);

        try {
            btc_chain_process = await start_btc_chain();
            stx_chain_process = await start_stx_chain();
        } catch(error) {
            console.error(error);
            kill();
            process.exit(1);
        }
        this.stx = stx_chain_process;
        this.btc = btc_chain_process;
    })

    after( function() {
        console.log("Stopping chains...")
        this.stx.kill()
        this.btc.kill()
    })

    it('should properly initiate a Stacks chain', async function() {
        assert.isDefined(this.stx)
        assert.equal(await this.stx.block_height() - new BN(0), 0)
        assert.equal(await this.stx.balance("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG") - new BN(100000000000000), 0)
        assert.equal((await this.stx.read_only_call(".hello", "get-counter")).result.result, 'u0')
        assert.equal((await this.stx.contract_call(".hello", "increase-counter"))[0].result, "(ok true)")
        assert.equal((await this.stx.read_only_call(".hello", "get-counter")).result.result, 'u1')
    })

    it('should properly initiate a Bitcoin chain', async function() {
        const addresses = this.btc.session.accounts.map(account => account.address)
        assert.isDefined(this.btc)
        assert.equal(await this.btc.block_height(0) - new BN(101), 0)
        assert.equal(await this.btc.balance(addresses[1], 0), 10)
        assert.equal(await this.btc.balance(addresses[2], 0), 10)
    })

})