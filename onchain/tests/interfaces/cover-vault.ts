import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';

class CoverVault {
  static getAsset(chain: Chain, coverVaultContract: string, tokenId: number, caller: string) {
    return chain.callReadOnlyFn(
      coverVaultContract,
      "get-asset",
      [
        types.uint(tokenId),
      ], caller);
  }
}

export { CoverVault };