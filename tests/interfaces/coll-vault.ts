import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';

class CollVault {
  static getLoanColl(chain: Chain, collVaultContract: string, loanId: number, caller: string) {
    return chain.callReadOnlyFn(
      collVaultContract,
      "get-loan-coll",
      [
        types.uint(loanId),
      ], caller).result;
  }
}

export { CollVault };