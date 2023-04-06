import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';

class WithdrawalManager {
  static getCycleShares(chain: Chain, tokenId: number, cycle: number, contractAddress: string, contractName: string, caller: string) {
    return chain.callReadOnlyFn(
      `${contractAddress}.${contractName}`,
      "get-cycle-shares",
      [
        types.uint(tokenId),
        types.uint(cycle)
      ],
      caller
    );
  }

  static getCycleSharesByPrincipal(chain: Chain, tokenId: number, user: string, contractAddress: string, contractName: string, caller: string) {
    return chain.callReadOnlyFn(
      `${contractAddress}.${contractName}`,
      "get-cycle-shares-by-principal",
      [
        types.uint(tokenId),
        types.principal(user)
      ],
      caller
    );
  }

  static getFundsUnlockedAt(chain: Chain, tokenId: number, user: string, contractAddress: string, contractName: string, caller: string) {
    return chain.callReadOnlyFn(
      `${contractAddress}.${contractName}`,
      "get-funds-unlocked-at",
      [
        types.uint(tokenId),
        types.principal(user)
      ],
      caller
    );
  }

  static getExitAt(chain: Chain, tokenId: number, cycle: string, contractAddress: string, contractName: string, caller: string) {
    return chain.callReadOnlyFn(
      `${contractAddress}.${contractName}`,
      "get-exit-at",
      [
        types.uint(tokenId),
        types.uint(cycle)
      ],
      caller
    )
  }


  static getNextExitCycle(chain: Chain, tokenId: number, contractAddress: string, contractName: string, caller: string) {
    return chain.callReadOnlyFn(
      `${contractAddress}.${contractName}`,
      "get-next-exit-cycle",
      [
        types.uint(tokenId),
      ],
      caller
    )
  }

  static withdrawableFundsOf(chain: Chain, contractAddress: string, contractName: string, caller: string) {
    return chain.callReadOnlyFn(`${contractAddress}.${contractName}`, "withdrawable-funds-of", [], caller);
  }
}

export { WithdrawalManager };