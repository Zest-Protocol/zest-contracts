
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { Buffer } from "https://deno.land/std@0.110.0/node/buffer.ts";

import { Oracle } from "./interfaces/oracle.ts";
import { Vault } from './interfaces/vault.ts';
import { Native } from './interfaces/native.ts';

Clarinet.test({
    name: "Ensure that a vault can be created, receive payment, complete periodic payments and repay lots",
    fn(chain: Chain, accounts: Map<string, Account>) {
        let deployerWallet = accounts.get("deployer") as Account;
        let oracle = new Oracle(chain, deployerWallet);
        let vault = new Vault(chain, deployerWallet);
        let native = new Native(chain, deployerWallet);

        let block = oracle.addAsset(`${deployerWallet.address}.usda`, 1_000_000, 1_000_000);
        oracle.addAsset(`${deployerWallet.address}.wSTX`, 2_340_000, 1_000_000);
        oracle.addAsset(`${deployerWallet.address}.btc`, 48_020_000_000, 1_000_000);
        
        block = vault.createVault(
            100_000_000,
            `${deployerWallet.address}.usda`,
            `${deployerWallet.address}.loan-fixed-return`,
            5,
            "76a91456c0bc2f50bc150d4ea122e66db7c48b01b9722988ac",
            17292);
        
        block = chain.mineBlock([
            Tx.contractCall(
                `vault-test`,
                "verify-dust-1",
                [],
                deployerWallet.address
            ),
        ]);
        // block.receipts[0].result.expectOk()
        chain.mineEmptyBlock(5);

        block = chain.mineBlock([
            Tx.contractCall(
                `vault-test`,
                "verify-payment-3",
                [],
                deployerWallet.address
            )
        ]);
        // block.receipts[0].result.expectOk();
        chain.mineEmptyBlock(4320);

        block = chain.mineBlock([
            Tx.contractCall(
                `vault-test`,
                "verify-payment-interest-1",
                [],
                deployerWallet.address
            ),
        ]);
        // block.receipts[0].result.expectOk();
        // assertStringIncludes(vault.getLenderData(0, 0).result, "last-paid-interest-lots: u5, last-paid-interest-time: u4332");
        // console.log(vault.getVaultData(0).result);
        // console.log(native.getNativeLenderSpk(0, 0).result);

        chain.mineEmptyBlock(4320);
        block = chain.mineBlock([
            Tx.contractCall(
                `vault-test`,
                "verify-payment-interest-2",
                [],
                deployerWallet.address
            ),
        ]);
        // block.receipts[0].result.expectOk();
        // assertStringIncludes(vault.getLenderData(0, 0).result, "last-paid-interest-lots: u5, last-paid-interest-time: u8652");
        chain.mineEmptyBlock(4320);

        block = chain.mineBlock([
            Tx.contractCall(
                `vault-test`,
                "verify-payment-interest-3",
                [],
                deployerWallet.address
            ),
            Tx.contractCall(
                `vault-test`,
                "verify-payment-interest-4",
                [],
                deployerWallet.address
            ),
            Tx.contractCall(
                `vault-test`,
                "verify-payment-interest-5",
                [],
                deployerWallet.address
            ),
            Tx.contractCall(
                `vault-test`,
                "verify-payment-interest-6",
                [],
                deployerWallet.address
            ),
            Tx.contractCall(
                `vault-test`,
                "verify-payment-interest-7",
                [],
                deployerWallet.address
            ),
        ]);
        // assertStringIncludes(vault.getLenderData(0, 0).result, "last-paid-interest-lots: u5, last-paid-interest-time: u12972");
        // assertStringIncludes(vault.getVaultData(0).result, "last-paid-treasury-block: u12972");

        chain.mineEmptyBlock(4320);
        
        block = chain.mineBlock([
            Tx.contractCall(
                `vault-test`,
                "verify-repayment-1",
                [],
                deployerWallet.address
            ),
        ]);
        // console.log(block);
        // assertStringIncludes(vault.getLenderData(0, 0).result, "filled-lots: u0, last-paid-interest-lots: u5, last-paid-interest-time: u12972");
        // console.log(vault.getVaultData(0).result);
        // let assetMaps = chain.getAssetsMaps();
        // assertEquals(vault.getVaultData(0).result, "none");
    },
});

Clarinet.test({
    name: "Ensure that when two people reserve on the same block, the user with largest dust amount gets the reservation",
    fn(chain: Chain, accounts: Map<string, Account>) {
        let deployerWallet = accounts.get("deployer") as Account;
        let oracle = new Oracle(chain, deployerWallet);
        let vault = new Vault(chain, deployerWallet);
        let native = new Native(chain, deployerWallet);

        let block = oracle.addAsset(`${deployerWallet.address}.usda`, 1_000_000, 1_000_000);
        oracle.addAsset(`${deployerWallet.address}.wSTX`, 2_340_000, 1_000_000);
        oracle.addAsset(`${deployerWallet.address}.btc`, 48_020_000_000, 1_000_000);
        
        block = vault.createVault(
            100_000_000,
            `${deployerWallet.address}.usda`,
            `${deployerWallet.address}.loan-fixed-return`,
            5,
            "76a91456c0bc2f50bc150d4ea122e66db7c48b01b9722988ac",
            17292);

        // block = chain.mineBlock([
        //     Tx.contractCall(
        //         `vault-test`,
        //         "verify-dust-1",
        //         [],
        //         deployerWallet.address
        //     ),
        //     Tx.contractCall(
        //         `vault-test`,
        //         "verify-dust-2",
        //         [],
        //         deployerWallet.address
        //     )
        // ]);

        // block.receipts[0].result.expectOk();
        // block.receipts[1].result.expectOk();
        // assertStringIncludes(native.getNativeVaultData(0).result, "refund-spk: 0xa9142c2ff269501c179ff08fee3c769e6e4a94105e9187");
    },
});

Clarinet.test({
    name: "Ensure that the dust transaction that happened before remains as the valid one",
    fn(chain: Chain, accounts: Map<string, Account>) {
        // let deployerWallet = accounts.get("deployer") as Account;
        // let oracle = new Oracle(chain, deployerWallet);
        // let vault = new Vault(chain, deployerWallet);
        // let native = new Native(chain, deployerWallet);

        // let block = oracle.addAsset(`${deployerWallet.address}.usda`, 1000000, 1000000);
        // oracle.addAsset(`${deployerWallet.address}.wSTX`, 2340000, 1000000);
        // oracle.addAsset(`${deployerWallet.address}.btc`, 48_020_000_000, 1000000);
        // vault.createVault(
        //     100_000_000,
        //     `${deployerWallet.address}.usda`,
        //     `${deployerWallet.address}.loan-fixed-return`,
        //     3_037_515,
        //     "76a91456c0bc2f50bc150d4ea122e66db7c48b01b9722988ac",
        //     400);

        // block = chain.mineBlock([
        //     Tx.contractCall(
        //         `vault-test`,
        //         "verify-dust-1",
        //         [],
        //         deployerWallet.address
        //     ),
        //     Tx.contractCall(
        //         `vault-test`,
        //         "verify-dust-3",
        //         [],
        //         deployerWallet.address
        //     )
        // ]);

        // block.receipts[0].result.expectOk();
        // block.receipts[1].result.expectErr();
        // assertStringIncludes(native.getNativeVaultData(0).result, "refund-spk: 0xa914b671dfe6d682417e1efffd8a8b33b166221b219c87");
    },
});


Clarinet.test({
    name: "Ensure that the earliest dust transaction replaces the later one",
    fn(chain: Chain, accounts: Map<string, Account>) {
        // let deployerWallet = accounts.get("deployer") as Account;
        // let oracle = new Oracle(chain, deployerWallet);
        // let vault = new Vault(chain, deployerWallet);
        // let native = new Native(chain, deployerWallet);

        // let block = oracle.addAsset(`${deployerWallet.address}.usda`, 1000000, 1000000);
        // oracle.addAsset(`${deployerWallet.address}.wSTX`, 2340000, 1000000);
        // oracle.addAsset(`${deployerWallet.address}.btc`, 48_020_000_000, 1000000);
        // vault.createVault(
        //     100_000_000,
        //     `${deployerWallet.address}.usda`,
        //     `${deployerWallet.address}.loan-fixed-return`,
        //     3_037_515,
        //     "76a91456c0bc2f50bc150d4ea122e66db7c48b01b9722988ac",
        //     400);

        // block = chain.mineBlock([
        //     Tx.contractCall(
        //         `vault-test`,
        //         "verify-dust-3",
        //         [],
        //         deployerWallet.address
        //     ),
        //     Tx.contractCall(
        //         `vault-test`,
        //         "verify-dust-1",
        //         [],
        //         deployerWallet.address
        //     ),
        // ]);

        // block.receipts[0].result.expectOk();
        // block.receipts[1].result.expectOk();
        // assertStringIncludes(native.getNativeVaultData(0).result, "refund-spk: 0xa914b671dfe6d682417e1efffd8a8b33b166221b219c87");
    },
});


Clarinet.test({
    name: "Ensure that we can liquidate the vault",
    fn(chain: Chain, accounts: Map<string, Account>) {
        // let deployerWallet = accounts.get("deployer") as Account;
        // let oracle = new Oracle(chain, deployerWallet);
        // let vault = new Vault(chain, deployerWallet);
        // let native = new Native(chain, deployerWallet);

        // let block = oracle.addAsset(`${deployerWallet.address}.usda`, 1_000_000, 1_000_000);
        // oracle.addAsset(`${deployerWallet.address}.wSTX`, 2_340_000, 1_000_000);
        // oracle.addAsset(`${deployerWallet.address}.btc`, 39_133_000_000, 1_000_000);
        // block = vault.createVault(
        //     2_000_000_000,
        //     `${deployerWallet.address}.wSTX`,
        //     `${deployerWallet.address}.loan-fixed-return`,
        //     3_037_515,
        //     "76a91456c0bc2f50bc150d4ea122e66db7c48b01b9722988ac",
        //     400
        // );

        // block = chain.mineBlock([
        //     Tx.contractCall(
        //         `vault-test`,
        //         "verify-dust-1",
        //         [],
        //         deployerWallet.address
        //     ),
        // ]);

        // block.receipts[0].result.expectOk()
        // chain.mineEmptyBlock(10);

        // block = chain.mineBlock([
        //     Tx.contractCall(
        //         `vault-test`,
        //         "verify-payment-3",
        //         [],
        //         deployerWallet.address
        //     )
        // ]);
        // block.receipts[0].result.expectOk();

        // block = oracle.setPrice(`${deployerWallet.address}.wSTX`, 500_000);

        // block = chain.mineBlock([
        //     Tx.contractCall(
        //         `vault-accounting`,
        //         "get-collateral-debt-ratio",
        //         [
        //             types.uint(0),
        //             types.principal(`${deployerWallet.address}.wSTX`),
        //             types.principal(`${deployerWallet.address}.btc`),
        //             types.principal(`${deployerWallet.address}.oracle`),
        //         ],
        //         deployerWallet.address
        //     )
        // ]);

        // console.log(block);
    },
});