import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';

class ZestRewardDist {
  static getCurrentCycle(tokenId: number, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.zest-reward-dist`, "get-current-cycle", [
      types.uint(tokenId),
    ], deployer);
  }

  static getNextCycleHeight(tokenId: number, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.zest-reward-dist`, "get-next-cycle-height", [
      types.uint(tokenId),
    ], deployer);
  }

  static getCycleRewards(tokenId: number, cycle: number, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.zest-reward-dist`, "get-cycle-rewards", [
      types.uint(tokenId),
      types.uint(cycle)
    ], deployer);
  }

  static getWithdrawableFundsOf(tokenId: number, owner: string, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.zest-reward-dist`, "withdrawable-funds-of-read", [
      types.uint(tokenId),
      types.principal(owner)
    ], deployer);
  }

  static getFundsSentCycle(tokenId: number, cycle: number, owner: string, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.zest-reward-dist`, "get-funds-sent-cycle", [
      types.uint(tokenId),
      types.uint(cycle),
      types.principal(owner)
    ], deployer);
  }

  static getCycleShare(tokenId: number, cycle: number, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.zest-reward-dist`, "get-cycle-share", [
      types.uint(tokenId),
      types.uint(cycle)
    ], deployer);
  }

  static getCycleSharePrincipal(tokenId: number, cycle: number, user: string, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.zest-reward-dist`, "get-cycle-share-principal", [
      types.uint(tokenId),
      types.uint(cycle),
      types.principal(user),
    ], deployer);
  }

  static getSumCycles(startCycle: number, endCycle: number, tokenId: number, user: string, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.zest-reward-dist`, "get-sum-cycles", [
      types.uint(startCycle),
      types.uint(endCycle),
      types.uint(tokenId),
      types.principal(user),
    ], deployer);
  }

  static getWithdrawableRewards(tokenId: number, recipient: string, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.zest-reward-dist`, "get-withdrawable-rewards", [
      types.uint(tokenId),
      types.principal(recipient),
    ], deployer);
  }

  static getallCycleRewardsOf(tokenId: number, recipient: string, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.zest-reward-dist`, "get-all-cycle-rewards-of", [
      types.uint(tokenId),
      types.principal(recipient),
    ], deployer);
  }

  static getClaimableRewardsBy(tokenId: number, recipient: string, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.zest-reward-dist`, "get-claimable-rewards-by", [
      types.uint(tokenId),
      types.principal(recipient),
    ], deployer);
  }

  static getBalanceUint(tokenId: number, owner: string, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.zest-reward-dist`, "get-balance-uint", [
      types.uint(tokenId),
      types.principal(owner),
    ], deployer);
  }

  static getPointsPerShare(tokenId: number, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.zest-reward-dist`, "get-points-per-share", [
      types.uint(tokenId),
    ], deployer);
  }

  // remove this
  static withdrawZestRewardsTemp(
    tokenId: number,
    chain: Chain,
    lender: string
    ) {
    return chain.mineBlock([
      Tx.contractCall(
        `zest-reward-dist`,
        "withdraw-cycle-rewards-temp",
        [
          types.uint(tokenId),
        ],
        lender
      )
    ]);
  }


}

export { ZestRewardDist };