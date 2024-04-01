import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

class Magic {
    static escrowSwap(
      block: { header: string, height: number },
      prevBlocks: string[],
      tx: string,
      proof: { "tx-index": number, "hashes": string[], "tree-depth": number },
      outputIndex: number,
      sender: string,
      recipient: string,
      expirationBuff: string,
      hash: string,
      swapperBuff: string,
      supplierId: number,
      caller: string,
      ) {
      return Tx.contractCall(
        "magic-protocol",
        'escrow-swap',
        [
          types.tuple({
            header: types.buff(Buffer.from(block.header, "hex")),
            height: types.uint(block.height)
          }),
          types.list(prevBlocks.map((val) => types.buff(Buffer.from(val, "hex")))),
          types.buff(Buffer.from(tx, "hex")),
          types.tuple({
            "tx-index": types.uint(proof['tx-index']),
            "hashes": types.list(proof.hashes.map(val => types.buff(Buffer.from(val, "hex")))),
            "tree-depth": types.uint(proof['tree-depth'])
          }),
          types.uint(outputIndex),
          types.buff(Buffer.from(sender, "hex")),
          types.buff(Buffer.from(recipient, "hex")),
          types.buff(Buffer.from(expirationBuff, "hex")),
          types.buff(Buffer.from(hash, "hex")),
          types.buff(Buffer.from(swapperBuff, "hex")),
          types.uint(supplierId),
        ],
        caller);
    }

    static registerSupplier(
      publicKey: string,
      inboundFee: number,
      outboundFee: number,
      outboundBaseFee: number,
      inboundBaseFee: number,
      name: string,
      funds: number,
      caller: string
    ) {
      return Tx.contractCall(
        "magic-protocol",
        'register-supplier',
        [
          types.buff(Buffer.from(publicKey, "hex")),
          types.some(types.int(inboundFee)),
          types.some(types.int(outboundFee)),
          types.int(outboundBaseFee),
          types.int(inboundBaseFee),
          types.ascii(name),
          types.uint(funds),
        ],
        caller);
    }

    static initializeSwapper(
      caller: string
    ) {
      return Tx.contractCall(
          "magic-protocol",
          'initialize-swapper',
          [],
          caller
        );
    }

    static finalizeSwap(
      txid: string,
      preimage: string,
      caller: string
    ) {
      return Tx.contractCall(
          "magic-protocol",
          'finalize-swap',
          [
            types.buff(Buffer.from(txid,"hex")),
            types.buff(Buffer.from(preimage,"hex")),
          ],
          caller
        );
    }

    static burnBlockHeader(chain: Chain, height: number, header: string, caller: string) {
      return chain.callReadOnlyFn(`test-utils`, "was-mined", [ types.uint(height), types.buff(Buffer.from(header, "hex")) ], caller).result;
    }

    static getSupplier(chain:Chain, supplierId: number, caller: string) {
      return chain.callReadOnlyFn(`magic-protocol`, "get-supplier", [ types.uint(supplierId) ], caller).result;
    }

}

export { Magic };