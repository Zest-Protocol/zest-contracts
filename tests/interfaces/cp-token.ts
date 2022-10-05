import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';

class CPToken {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
      this.chain = chain;
      this.deployer = deployer;
  }

  withdrawFunds(cpToken: string, lender: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `${cpToken}`,
        "withdraw-rewards",
        [],
        lender
      )
    ]);
  }

  withdrawableFundsOf(cpToken: string, caller: string) {
    return this.chain.callReadOnlyFn(`${this.deployer.address}.${cpToken}`, "withdrawable-funds-of", [
      types.principal(caller),
    ], this.deployer.address);
  }

  getBalance(cpToken: string, tokenId: number, owner: string) {
    return this.chain.callReadOnlyFn(
      `${this.deployer.address}.${cpToken}`,
      "get-balance",
      [
        types.uint(tokenId),
        types.principal(owner),
      ],
      this.deployer.address
    );
  }

  getCycleStart(cpToken: string, tokenId: number) {
    return this.chain.callReadOnlyFn(
      `${cpToken}`,
      "get-cycle-start",
      [
        types.uint(tokenId),
      ],
      this.deployer.address
    ).result;
  }

  getNextCycleHeight(cpToken: string, tokenId: number) {
    return this.chain.callReadOnlyFn(
      `${cpToken}`,
      "get-next-cycle-height",
      [
        types.uint(tokenId),
      ],
      this.deployer.address
    );
  }

  getCycleRewards(cpToken: string, tokenId: number, cycle: number) {
    return this.chain.callReadOnlyFn(
      `${cpToken}`,
      "get-cycle-rewards",
      [
        types.uint(tokenId),
        types.uint(cycle),
      ],
      this.deployer.address
    ).result;
  }

  getCycleShare(cpToken: string, tokenId: number, cycle: number) {
    return this.chain.callReadOnlyFn(
      `${cpToken}`,
      "get-cycle-share",
      [
        types.uint(tokenId),
        types.uint(cycle),
      ],
      this.deployer.address
    ).result;
  }

  getCycleShareByPrincipal(cpToken: string, tokenId: number, cycle: number, owner: string) {
    return this.chain.callReadOnlyFn(
      `${cpToken}`,
      "get-cycle-share-principal",
      [
        types.uint(tokenId),
        types.uint(cycle),
        types.principal(owner),
      ],
      this.deployer.address
    ).result;
  }

  getCurrentCycle(cpToken: string, tokenId: number) {
    return this.chain.callReadOnlyFn(
      cpToken,
      "get-current-cycle", 
      [
        types.uint(tokenId),
      ],
      this.deployer.address
    );
  }

  getCoverPoolFundsBalance(cpToken: string, tokenId: number, sender: string) {
    return this.chain.callReadOnlyFn(
      cpToken,
      "get-cover-pool-funds-balance", 
      [
        types.uint(tokenId),
        types.principal(sender),
      ],
      this.deployer.address
    );
  }
}

export { CPToken };