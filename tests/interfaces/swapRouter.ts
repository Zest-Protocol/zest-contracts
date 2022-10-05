import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';

class SwapRouter {
  static getYgivenX(xToken: string, yToken: string, dx: number, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.swap-router`, "get-y-given-x", [
      types.principal(xToken),
      types.principal(yToken),
      types.uint(dx)
    ], deployer);
  }

  static getXgivenY(xToken: string, yToken: string, dy: number, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.swap-router`, "get-x-given-y", [
      types.principal(xToken),
      types.principal(yToken),
      types.uint(dy)
    ], deployer);
  }

  static getRelativeValueBp(xToken: string, yToken: string, dy: number, chain: Chain, deployer: string) {
    return chain.callReadOnlyFn(`${deployer}.swap-router`, "get-relative-value-bp", [
      types.principal(xToken),
      types.principal(yToken),
      types.uint(dy)
    ], deployer);
  }

}

export { SwapRouter };