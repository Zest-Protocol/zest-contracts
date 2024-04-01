import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';

class CpTokenRewards {
  static getWithdrawableFundsOf(tokenId: number, owner: string, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.cp-rewards-token`, "withdrawable-funds-of", [
      types.uint(tokenId),
      types.principal(owner)
    ], deployer);
  }
}

export { CpTokenRewards };