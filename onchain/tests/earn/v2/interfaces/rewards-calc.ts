import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';

class RewardsCalc {
  static polynomial(
    chain: Chain,
    rewardsCalc: string,
    x: number,
    caller: string,
  ) {
    return chain.mineBlock([
      Tx.contractCall(
        rewardsCalc,
        'polynomial',
        [
          types.int(x),
        ],
        caller
      )
    ]);
  }

  static getMultiplier(
    chain: Chain,
    rewardsCalc: string,
    cycles: number,
    caller: string,
  ) {
    return chain.mineBlock([
      Tx.contractCall(
        rewardsCalc,
        'get-multiplier',
        [
          types.uint(cycles),
        ],
        caller
      )
    ]);
  }
}

export { RewardsCalc };