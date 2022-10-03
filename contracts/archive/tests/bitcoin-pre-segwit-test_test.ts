
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that <...>",
    fn(chain: Chain, accounts: Map<string, Account>) {
        const deployerWallet = accounts.get("deployer") as Account;

        const block = chain.mineBlock([
            Tx.contractCall(
                `bitcoin-pre-segwit-test`,
                "test-concat-tx-1",
                [],
                deployerWallet.address
            )
        ]);

        // console.log(block);
    },
});
