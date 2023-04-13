import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

class FT {
  static transfer(
    chain: Chain,
    tokenContractAddress: string,
    tokenContractName: string,
    amount: number,
    sender: string,
    recipient: string,
    memo: string,
    caller: string,
  ) {
    return chain.mineBlock([
      Tx.contractCall(
        `${tokenContractAddress}.${tokenContractName}`,
        'transfer',
        [
          types.uint(amount),
          types.principal(sender),
          types.principal(recipient),
          memo.length ? types.some(types.buff(Buffer.from(memo, "hex"))) : types.none(),
        ],
        caller
      )
    ]);
  }
}

export { FT };