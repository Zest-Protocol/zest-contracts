
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { Buffer } from "https://deno.land/std@0.110.0/node/buffer.ts";
import { Vault } from './interfaces/vault.ts';

Clarinet.test({
    name: "Ensure that uint64 hex numbers are converted to uint",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        let deployerWallet = accounts.get("deployer") as Account;
        let vault = new Vault(chain, deployerWallet);

        assertEquals(vault.readUint64("0000000000000000").result, "u0");
        assertEquals(vault.readUint64("5802000000000000").result, "u600");
        assertEquals(vault.readUint64("8f02030000000000").result, "u197263");
    },
});
