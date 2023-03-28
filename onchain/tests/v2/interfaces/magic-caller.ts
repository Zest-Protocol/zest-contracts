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
    action: string,
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
        types.buff(Buffer.from(action, "hex")),
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

  static makePaymentLoan(
    txid: string,
    preimage: string,
    payment: string,
    lpToken: string,
    liquidityVault: string,
    cpToken: string,
    cpRewardsToken: string,
    zpToken: string,
    swapRouter: string,
    xbtc: string,
    supplierController: string,
    caller: string,
    contractAddress: string,
    contractName: string,
  ) {
    return Tx.contractCall(
      `${contractAddress}.${contractName}`,
      'make-payment-loan',
        [
          types.buff(Buffer.from(txid,"hex")),
          types.buff(Buffer.from(preimage,"hex")),
          types.principal(payment),
          types.principal(lpToken),
          types.principal(liquidityVault),
          types.principal(cpToken),
          types.principal(cpRewardsToken),
          types.principal(zpToken),
          types.principal(swapRouter),
          types.principal(xbtc),
          types.principal(supplierController),
          
        ],
        caller
      );
  }
}

export { MagicCaller };