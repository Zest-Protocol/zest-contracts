import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

class MagicCaller {
  static commitFunds(
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
    minToReceive: number,
    tokenId: number,
    loanId: number,
    caller: string,
    contractAddress: string,
    contractName: string,
    ) {
    return Tx.contractCall(
      `${contractAddress}.${contractName}`,
      'commit-funds',
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
        types.uint(minToReceive),
        types.uint(tokenId),
        types.uint(loanId),
      ],
      caller);
  }

  static sendFundsToPool(
    txid: string,
    preimage: string,
    lpToken: string,
    liquidityVault: string,
    xbtc: string,
    rewardsCalc: string,
    supplierController: string,
    caller: string,
    contractAddress: string,
    contractName: string,
  ) {
    return Tx.contractCall(
      `${contractAddress}.${contractName}`,
      'send-funds-to-pool',
        [
          types.buff(Buffer.from(txid,"hex")),
          types.buff(Buffer.from(preimage,"hex")),
          types.principal(lpToken),
          types.principal(liquidityVault),
          types.principal(xbtc),
          types.principal(rewardsCalc),
          types.principal(supplierController),
          
        ],
        caller
      );
  }
}

export { MagicCaller };