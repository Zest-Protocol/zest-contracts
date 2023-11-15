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

  static getExitAt(chain: Chain, tokenId: number, user: string, contractAddress: string, contractName: string, caller: string) {
    return chain.callReadOnlyFn(
      `${contractAddress}.${contractName}`,
      "get-exit-at",
      [
        types.uint(tokenId),
        types.principal(user)
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

  static getRedeemeableAmounts(
    chain: Chain,
    lpToken: string,
    tokenId: number,
    liquidityVault: string,
    asset: string,
    requestedShares: number,
    owner: string,
    contractAddress: string,
    contractName: string,
    caller: string) {
    return chain.callReadOnlyFn(
      `${contractAddress}.${contractName}`,
      "get-redeemeable-amounts-1",
      [
        types.principal(lpToken),
        types.uint(tokenId),
        types.principal(liquidityVault),
        types.principal(asset),
        types.uint(requestedShares),
        types.principal(owner)
      ],
      caller);
  }
}

export { WithdrawalManager };