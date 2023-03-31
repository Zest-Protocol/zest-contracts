import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';

class WithdrawalManager {
  static getCycleShares(chain: Chain, tokenId: number, cycle: number, contractAddress: string, contractName: string, caller: string) {
    return chain.mineBlock([
      Tx.contractCall(
        `${contractAddress}.${contractName}`,
        "get-cycle-shares",
        [ types.uint(tokenId), types.uint(cycle) ],
        caller
      )
    ]);
  }

  static getCycleSharesByPrincipal(chain: Chain, tokenId: number, user: string, contractAddress: string, contractName: string, caller: string) {
    return chain.callReadOnlyFn(
      `${contractAddress}.${contractName}`,
      "get-cycle-shares-by-principal",
      [
        types.uint(tokenId),
        types.uint(user)
      ],
      caller
    );
  }

  static getExitAt(chain: Chain, tokenId: number, user: string, contractAddress: string, contractName: string, caller: string) {
    return chain.callReadOnlyFn(
      `${contractAddress}.${contractName}`,
      "get-exit-at",
      [
        types.uint(tokenId),
        types.uint(user)
      ],
      caller
    )
  }

  static withdrawableFundsOf(chain: Chain, contractAddress: string, contractName: string, caller: string) {
    return chain.callReadOnlyFn(`${contractAddress}.${contractName}`, "withdrawable-funds-of", [], caller);
  }
}

export { WithdrawalManager };