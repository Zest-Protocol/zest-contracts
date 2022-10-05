import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';
import { Buffer } from "https://deno.land/std@0.110.0/node/buffer.ts";

class Vault {
    chain: Chain;
    deployer: Account;

    constructor(chain: Chain, deployer: Account) {
        this.chain = chain;
        this.deployer = deployer;
    }

    createVault(
        collateralAmount: number,
        asset: string,
        loanStrategy: string,
        nLots: number,
        address: string,
        maturity: number) {
        let block = this.chain.mineBlock([
            Tx.contractCall(
                `vault`,
                "create-vault",
                [
                    types.uint(collateralAmount),
                    types.principal(asset),
                    types.principal(loanStrategy),
                    types.uint(nLots),
                    types.buff(Buffer.from(address, "hex")),
                    types.uint(maturity)
                ],
                this.deployer.address
            ),
        ]);

        return block;
    }

    getVaultData(vaultId: number) {
        return this.chain.callReadOnlyFn(`${this.deployer.address}.vault-accounting`, "get-vault-data", [
            types.uint(vaultId)
        ], this.deployer.address);
    }

    getLenderData(vaultId: number, lenderId: number) {
        return this.chain.callReadOnlyFn(`${this.deployer.address}.vault-accounting`, "get-lender-data", [
            types.uint(vaultId),
            types.uint(lenderId)
        ], this.deployer.address);
    }

    readUint64(amount: string) {
        return this.chain.callReadOnlyFn(`${this.deployer.address}.tx-verification`, "read-uint64", [
            types.buff(Buffer.from(amount, "hex"))
        ], this.deployer.address);
    }    

}

export { Vault };