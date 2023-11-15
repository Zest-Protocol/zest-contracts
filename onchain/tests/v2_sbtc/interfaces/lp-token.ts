import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';

class LPToken {
    chain: Chain;
    deployer: Account;

    constructor(chain: Chain, deployer: Account) {
        this.chain = chain;
        this.deployer = deployer;
    }

    withdrawFunds(lpToken: string, lender: string) {
      return this.chain.mineBlock([
        Tx.contractCall(
          `${lpToken}`,
          "withdraw-rewards",
          [],
          lender
        )
      ]);
    }

    withdrawableFundsOf(lpToken: string, caller: string) {
      return this.chain.callReadOnlyFn(`${this.deployer.address}.${lpToken}`, "withdrawable-funds-of", [          
          types.principal(caller),
      ], this.deployer.address);
    }

    recognizableLossesOf(lpToken: string, tokenId: number, caller: string) {
      return this.chain.callReadOnlyFn(`${this.deployer.address}.${lpToken}`, "recognizable-losses-of-read", [
        types.uint(tokenId),
        types.principal(caller),
      ], this.deployer.address);
    }

    getBalance(lpToken: string, tokenId: number, owner: string) {
      return this.chain.callReadOnlyFn(`${this.deployer.address}.${lpToken}`, "get-balance", [
        types.uint(tokenId),
        types.principal(owner),
      ], this.deployer.address);
    }

    getLossesPerShare(lpToken: string, tokenId: number) {
      return this.chain.callReadOnlyFn(`${this.deployer.address}.${lpToken}`, "get-losses-per-share", [
        types.uint(tokenId),
      ], this.deployer.address);
    }
}

export { LPToken };