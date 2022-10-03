
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

let before = (chain: Chain, accounts: Map<string, Account>): any => {
    let deployerWallet = accounts.get("deployer") as Account;

    return chain.mineBlock([
        Tx.contractCall(
            `oracle`,
            "add-asset",
            [
                types.principal(`${deployerWallet.address}.usda`),
                types.tuple(
                    {
                        "price": types.uint(1000000),
                        "decimals": types.uint(1000000)
                    })
            ],
            deployerWallet.address
        ),
        Tx.contractCall(
            `oracle`,
            "add-asset",
            [
                types.principal(`${deployerWallet.address}.wSTX`),
                types.tuple(
                    {
                        "price": types.uint(2340000),
                        "decimals": types.uint(1000000)
                    })
            ],
            deployerWallet.address
        ),
        Tx.contractCall(
            `oracle`,
            "add-asset",
            [
                types.principal(`${deployerWallet.address}.btc`),
                types.tuple(
                    {
                        "price": types.uint(48020000000),
                        "decimals": types.uint(1000000)
                    })
            ],
            deployerWallet.address
        ),
        Tx.contractCall(
            `oracle`,
            "get-asset",
            [types.principal(`${deployerWallet.address}.wSTX`)],
            deployerWallet.address
        ),
        Tx.contractCall(
            `oracle`,
            "get-asset",
            [types.principal(`${deployerWallet.address}.usda`)],
            deployerWallet.address
        ),
        Tx.contractCall(
            `oracle`,
            "get-asset",
            [types.principal(`${deployerWallet.address}.btc`)],
            deployerWallet.address
        ),
    ]);
}

Clarinet.test({
    name: "Get borrowing potential, and yield on this potential for borrower",
    fn(chain: Chain, accounts: Map<string, Account>) {
        let deployerWallet = accounts.get("deployer") as Account;
        let block = before(chain, accounts);
        block = chain.mineBlock([
            Tx.contractCall(
                `loan-fixed-return`,
                "get-borrowing-potential",
                [
                    types.principal(`${deployerWallet.address}.oracle`),
                    types.principal(`${deployerWallet.address}.wSTX`),
                    types.principal(`${deployerWallet.address}.btc`),
                    types.uint(1000000000)
                ],
                deployerWallet.address
            ),
            Tx.contractCall(
                `loan-fixed-return`,
                "get-borrowing-potential",
                [
                    types.principal(`${deployerWallet.address}.oracle`),
                    types.principal(`${deployerWallet.address}.usda`),
                    types.principal(`${deployerWallet.address}.btc`),
                    types.uint(1000000000)
                ],
                deployerWallet.address
            ),
            Tx.contractCall(
                `vault`,
                "get-borrowing-potential",
                [types.uint(0)],
                deployerWallet.address
            ),
        ]);

        assertEquals(block.receipts[0].result.expectOk(), "u73093");
        assertEquals(block.receipts[1].result.expectOk(), "u31236");

        /*
         * Get yield for 100 blocks
        */

        block = chain.mineBlock([
            Tx.contractCall(
                `loan-fixed-return`,
                "get-yield",
                [
                    types.uint(73093),
                    types.uint(100)
                ],
                deployerWallet.address
            ),
            Tx.contractCall(
                `loan-fixed-return`,
                "get-yield",
                [
                    types.uint(31236),
                    types.uint(100)
                ],
                deployerWallet.address
            ),
            Tx.contractCall(
                `vault`,
                "get-borrowing-potential",
                [types.uint(0)],
                deployerWallet.address
            ),
        ]);

        assertEquals(block.receipts[0].result.expectOk(), "u41");
        assertEquals(block.receipts[1].result.expectOk(), "u17");

    },
});