
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

import { Oracle } from "./interfaces/oracle.ts";
import { Vault } from './interfaces/vault.ts';
import { Native } from './interfaces/native.ts';

Clarinet.test({
    name: "Ensure that division ceiling functions correctly",
    async fn(chain: Chain, accounts: Map<string, Account>)  {
        let deployerWallet = accounts.get("deployer") as Account;
        let oracle = new Oracle(chain, deployerWallet);
        let vault = new Vault(chain, deployerWallet);

        oracle.addAsset(`${deployerWallet.address}.usda`, 1_000_000, 1_000_000);
        oracle.addAsset(`${deployerWallet.address}.wSTX`, 2_340_000, 1_000_000);
        oracle.addAsset(`${deployerWallet.address}.btc`, 48_020_000_000, 1_000_000);

        let block = chain.mineBlock([
            Tx.contractCall(
                `vault-accounting`,
                "div-ceil",
                [
                    types.uint(1),
                    types.uint(2)
                ],
                deployerWallet.address
            ),
            Tx.contractCall(
                `vault-accounting`,
                "div-ceil",
                [
                    types.uint(3),
                    types.uint(2)
                ],
                deployerWallet.address
            ),
            Tx.contractCall(
                `vault-accounting`,
                "div-ceil",
                [
                    types.uint(10),
                    types.uint(5)
                ],
                deployerWallet.address
            ),
        ]);

        assertEquals(block.receipts[0].result, "u1");
        assertEquals(block.receipts[1].result, "u2");
        assertEquals(block.receipts[2].result, "u2");
    },
});

Clarinet.test({
    name: "Ensure that loan-interest is calculated properly",
    async fn(chain: Chain, accounts: Map<string, Account>)  {
        let deployerWallet = accounts.get("deployer") as Account;
        let oracle = new Oracle(chain, deployerWallet);
        let vault = new Vault(chain, deployerWallet);

        oracle.addAsset(`${deployerWallet.address}.usda`, 1_000_000, 1_000_000);
        oracle.addAsset(`${deployerWallet.address}.wSTX`, 2_340_000, 1_000_000);
        oracle.addAsset(`${deployerWallet.address}.btc`, 48_020_000_000, 1_000_000);

        vault.createVault(
            100_000_000,
            `${deployerWallet.address}.usda`,
            `${deployerWallet.address}.loan-fixed-return`,
            5,
            "76a91456c0bc2f50bc150d4ea122e66db7c48b01b9722988ac",
            4000
        );

        let block = chain.mineBlock([
            Tx.contractCall(
                `vault-accounting`,
                "div-ceil",
                [
                    types.uint(3),
                    types.uint(2)
                ],
                deployerWallet.address
            ),
            Tx.contractCall(
                `vault-accounting`,
                "div-ceil",
                [
                    types.uint(10),
                    types.uint(5)
                ],
                deployerWallet.address
            ),
            Tx.contractCall(
                `vault-accounting`,
                "get-loan-interest",
                [
                    types.uint(10000000),
                    types.uint(0),
                    types.uint(100)
                ],
                deployerWallet.address
            ),
            Tx.contractCall(
                `vault-accounting`,
                "get-loan-interest",
                [
                    types.uint(10000000),
                    types.uint(0),
                    types.uint(100)
                ],
                deployerWallet.address
            ),
        ]);
        
        assertEquals(block.receipts[0].result, "u2");
        assertEquals(block.receipts[1].result, "u2");
        // assertEquals(block.receipts[2].result.expectOk(), "u5707");
    },
});
