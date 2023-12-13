import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';

class SwapRouter {
  static getXgivenY(chain: Chain, xToken: string, yToken: string, dy: number, caller: string) {
    return chain.callReadOnlyFn(
      `swap-router`,
      "get-x-given-y",
      [
        types.principal(xToken),
        types.principal(yToken),
        types.uint(dy),
      ], caller).result;
  }

  static getPairValue(
    chain: Chain,
    swapRouter: string,
    xToken: string,
    yToken: string,
    caller: string) {
    return chain.callReadOnlyFn(
      swapRouter,
      "get-pair",
      [
        types.principal(xToken),
        types.principal(yToken),
      ], caller).result;
  }

  static setPairValue(
    chain: Chain,
    swapRouter: string,
    xToken: string,
    yToken: string,
    newVal: number,
    caller: string,
  ) {
    return chain.mineBlock([
      Tx.contractCall(
        swapRouter,
        'set-pair-value',
        [
          types.principal(xToken),
          types.principal(yToken),
          types.uint(newVal)
        ],
        caller
      )
    ]);
  }
}

export { SwapRouter };