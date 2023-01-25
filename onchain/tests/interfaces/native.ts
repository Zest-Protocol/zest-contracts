import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

class Native {
    chain: Chain;
    deployer: Account;

    constructor(chain: Chain, deployer: Account) {
        this.chain = chain;
        this.deployer = deployer;
    }

    getNativeVaultData(vaultId: number) {
        return this.chain.callReadOnlyFn(`${this.deployer.address}.native`, "get-native-data", [
            types.uint(vaultId)
        ], this.deployer.address);
    }

    getNativeLenderSpk(vaultId: number, lenderId: number) {
        return this.chain.callReadOnlyFn(`${this.deployer.address}.native`, "get-lender-spk", [
            types.uint(vaultId),
            types.uint(lenderId)
        ], this.deployer.address);
    }
}

export { Native };