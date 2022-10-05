import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';
import { Buffer } from "https://deno.land/std@0.110.0/node/buffer.ts";

class ClarityBitcoin {
  static getSupplierById(chain: Chain, tx: string, caller: string) {
    return chain.mineBlock([
      Tx.contractCall(
        `clarity-bitcoin`,
        "parse-tx",
        [
          types.buff(Buffer.from(tx, "hex")),
        ],
        caller
      )
    ]);
  }
}

export { ClarityBitcoin };