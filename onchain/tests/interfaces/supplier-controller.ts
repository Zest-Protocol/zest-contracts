import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

class SupplierController {
  static registerSupplier(
    pubKey: string,
    inboundFee: number,
    outboundFee: number,
    outboundBaseFee: number,
    inboundBaseFee: number,
    funds: number,
    caller: string,
    contractAddress: string,
    contractName: string,
    ) {
    return Tx.contractCall(
      `${contractAddress}.${contractName}`,
      'register-supplier',
      [
        types.buff(Buffer.from(pubKey, "hex")),
        types.some(types.int(inboundFee)),
        types.some(types.int(outboundFee)),
        types.int(outboundBaseFee),
        types.int(inboundBaseFee),
        types.uint(funds),
      ],
      caller);
  }
}

export { SupplierController };