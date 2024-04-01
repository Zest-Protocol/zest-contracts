import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';

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