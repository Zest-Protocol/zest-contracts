import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

class SupplierInterface {
  static sendFunds(
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
    caller: string,
    ) {
    return Tx.contractCall(
      "supplier-interface",
      'send-funds',
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
      ],
      caller);
  }

  static sendFundsWrap(
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
    preimage: string,
    factor: number,
    lpToken: string,
    tokenId: number,
    zpToken: string,
    liquidityVault: string,
    xbtc: string,
    rewardsCalc: string,
    caller: string,
    ) {
    return Tx.contractCall(
      "supplier-interface",
      'send-funds-wrap',
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
        types.buff(Buffer.from(preimage,"hex")),
        types.uint(factor),
        types.principal(lpToken),
        types.uint(tokenId),
        types.principal(zpToken),
        types.principal(liquidityVault),
        types.principal(xbtc),
        types.principal(rewardsCalc),
      ],
      caller);
  }

  static sendFundsXBTC(
      factor: number,
      lpToken: string,
      tokenId: number,
      zpToken: string,
      lv: string,
      xbtcFt: string,
      amount: number,
      rewardsCalc: string,
      caller: string,
    ) {
    return Tx.contractCall(
      "supplier-interface",
      'send-funds-xbtc',
      [
        types.uint(factor),
        types.principal(lpToken),
        types.uint(tokenId),
        types.principal(zpToken),
        types.principal(lv),
        types.principal(xbtcFt),
        types.uint(amount),
        types.principal(rewardsCalc),
      ],
      caller);
  }

  static makePaymentXBTC(
      amount: number,
      loanId: number,
      payment: string,
      lpToken: string,
      lv: string,
      tokenId: number,
      cpToken: string,
      cpRewards: string,
      zpToken: string,
      swapRouter: string,
      xbtcFt: string,
      caller: string,
    ) {
    return Tx.contractCall(
      "supplier-interface",
      'make-payment-xbtc',
      [
        types.uint(amount),
        types.uint(loanId),
        types.principal(payment),
        types.principal(lpToken),
        types.principal(lv),
        types.uint(tokenId),
        types.principal(cpToken),
        types.principal(cpRewards),
        types.principal(zpToken),
        types.principal(swapRouter),
        types.principal(xbtcFt),
      ],
      caller);
  }

  static sendFundsFinalize(
    txid: string,
    preimage: string,
    factor: number,
    lpToken: string,
    tokenId: number,
    zpToken: string,
    liquidityVault: string,
    xbtc: string,
    rewardsCalc: string,
    caller: string,
  ) {
    return Tx.contractCall(
        "supplier-interface",
        'send-funds-finalize',
        [
          types.buff(Buffer.from(txid,"hex")),
          types.buff(Buffer.from(preimage,"hex")),
          types.uint(factor),
          types.principal(lpToken),
          types.uint(tokenId),
          types.principal(zpToken),
          types.principal(liquidityVault),
          types.principal(xbtc),
          types.principal(rewardsCalc),
        ],
        caller
      );
  }

  static makePaymentVerify(
    txid: string,
    preimage: string,
    loanId: number,
    payment: string,
    lpToken: string,
    lv: string,
    tokenId: number,
    cpToken: string,
    cpRewards: string,
    zpToken: string,
    swapRouter: string,
    xbtc: string,
    caller: string
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'make-payment-verify',
      [
        types.buff(Buffer.from(txid,"hex")),
        types.buff(Buffer.from(preimage,"hex")),
        types.uint(loanId),
        types.principal(payment),
        types.principal(lpToken),
        types.principal(lv),
        types.uint(tokenId),
        types.principal(cpToken),
        types.principal(cpRewards),
        types.principal(zpToken),
        types.principal(swapRouter),
        types.principal(xbtc),
      ],
      caller
    );
  }

  static makePayment(
    txid: string,
    preimage: string,
    loanId: number,
    payment: string,
    lpToken: string,
    lv: string,
    tokenId: number,
    cpToken: string,
    cpRewards: string,
    zpToken: string,
    swapRouter: string,
    xbtc: string,
    caller: string
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'make-payment',
      [
        types.buff(Buffer.from(txid,"hex")),
        types.buff(Buffer.from(preimage,"hex")),
        types.uint(loanId),
        types.principal(payment),
        types.principal(lpToken),
        types.principal(lv),
        types.uint(tokenId),
        types.principal(cpToken),
        types.principal(cpRewards),
        types.principal(zpToken),
        types.principal(swapRouter),
        types.principal(xbtc),
      ],
      caller
    );
  }

  static makeResidualPayment(
    txid: string,
    preimage: string,
    loanId: number,
    lpToken: string,
    lv: string,
    tokenId: number,
    xbtc: string,
    caller: string,
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'make-residual-payment',
      [
        types.buff(Buffer.from(txid,"hex")),
        types.buff(Buffer.from(preimage,"hex")),
        types.uint(loanId),
        types.principal(lpToken),
        types.principal(lv),
        types.uint(tokenId),
        types.principal(xbtc),
      ],
      caller
    );
  }

  static makeFullPayment(
    txid: string,
    preimage: string,
    loanId: number,
    payment: string,
    lpToken: string,
    lv: string,
    tokenId: number,
    cpToken: string,
    cpRewards: string,
    zpToken: string,
    swapRouter: string,
    xbtc: string,
    caller: string
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'make-full-payment',
      [
        types.buff(Buffer.from(txid,"hex")),
        types.buff(Buffer.from(preimage,"hex")),
        types.uint(loanId),
        types.principal(payment),
        types.principal(lpToken),
        types.principal(lv),
        types.uint(tokenId),
        types.principal(cpToken),
        types.principal(cpRewards),
        types.principal(zpToken),
        types.principal(swapRouter),
        types.principal(xbtc),
      ],
      caller
    );
  }

  static withdraw(
    xbtc: number,
    btcVersion: string,
    btcHash: string,
    supplierId: number,
    lpToken: string,
    zpToken: string,
    tokenId: number,
    liquidityVault: string,
    xbtcFt: string,
    caller: string,
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'withdraw',
      [
        types.uint(xbtc),
        types.buff(Buffer.from(btcVersion, "hex")),
        types.buff(Buffer.from(btcHash, "hex")),
        types.uint(supplierId),
        types.principal(lpToken),
        types.principal(zpToken),
        types.uint(tokenId),
        types.principal(liquidityVault),
        types.principal(xbtcFt),
      ],
      caller
    );
  }
  
  static withdrawXBTC(
    xbtc: number,
    lpToken: string,
    zpToken: string,
    tokenId: number,
    liquidityVault: string,
    xbtcFt: string,
    caller: string,
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'withdraw-xbtc',
      [
        types.uint(xbtc),
        types.principal(lpToken),
        types.principal(zpToken),
        types.uint(tokenId),
        types.principal(liquidityVault),
        types.principal(xbtcFt),
      ],
      caller
    );
  }

  static withdrawRewards(
    btcVersion: string,
    btcHash: string,
    supplierId: number,
    lpToken: string,
    tokenId: number,
    liquidityVault: string,
    xbtc: string,
    caller: string,
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'withdraw-rewards',
      [
        types.buff(Buffer.from(btcVersion, "hex")),
        types.buff(Buffer.from(btcHash, "hex")),
        types.uint(supplierId),
        types.principal(lpToken),
        types.uint(tokenId),
        types.principal(liquidityVault),
        types.principal(xbtc),
      ],
      caller
    );
  }

  static withdrawCoverRewards(
    btcVersion: string,
    btcHash: string,
    supplierId: number,
    cpRewards: string,
    tokenId: number,
    liquidityVault: string,
    xbtc: string,
    caller: string,
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'withdraw-cover-rewards',
      [
        types.buff(Buffer.from(btcVersion, "hex")),
        types.buff(Buffer.from(btcHash, "hex")),
        types.uint(supplierId),
        types.principal(cpRewards),
        types.uint(tokenId),
        types.principal(liquidityVault),
        types.principal(xbtc),
      ],
      caller
    );
  }
  
  static withdrawRewardsXBTC(
    lpToken: string,
    tokenId: number,
    liquidityVault: string,
    xbtc: string,
    caller: string,
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'withdraw-rewards-xbtc',
      [
        types.principal(lpToken),
        types.uint(tokenId),
        types.principal(liquidityVault),
        types.principal(xbtc),
      ],
      caller
    );
  }
  
  static withdrawCoverRewardsXBTC(
    cpRewards: string,
    tokenId: number,
    liquidityVault: string,
    xbtc: string,
    caller: string,
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'withdraw-cover-rewards-xbtc',
      [
        types.principal(cpRewards),
        types.uint(tokenId),
        types.principal(liquidityVault),
        types.principal(xbtc),
      ],
      caller
    );
  }
  static drawdownVerify(
    loanId: number,
    lpToken: string,
    tokenId: number,
    collToken: string,
    collVault: string,
    fundingVault: string,
    btcVersion: string,
    btcHash: string,
    supplierId: number,
    swapRouter: string,
    xbtc: string,
    caller: string
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'drawdown-verify',
      [
        types.uint(loanId),
        types.principal(lpToken),
        types.uint(tokenId),
        types.principal(collToken),
        types.principal(collVault),
        types.principal(fundingVault),
        types.buff(Buffer.from(btcVersion, "hex")),
        types.buff(Buffer.from(btcHash, "hex")),
        types.uint(supplierId),
        types.principal(swapRouter),
        types.principal(xbtc),
      ],
      caller
    );
  }

  static drawdown(
    loanId: number,
    lpToken: string,
    tokenId: number,
    collToken: string,
    collVault: string,
    fundingVault: string,
    btcVersion: string,
    btcHash: string,
    supplierId: number,
    swapRouter: string,
    xbtc: string,
    caller: string
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'drawdown',
      [
        types.uint(loanId),
        types.principal(lpToken),
        types.uint(tokenId),
        types.principal(collToken),
        types.principal(collVault),
        types.principal(fundingVault),
        types.buff(Buffer.from(btcVersion, "hex")),
        types.buff(Buffer.from(btcHash, "hex")),
        types.uint(supplierId),
        types.principal(swapRouter),
        types.principal(xbtc),
      ],
      caller
    );
  }

  static completeRollover(
    loanId: number,
    lpToken: string,
    tokenId: number,
    collToken: string,
    collVault: string,
    fundingVault: string,
    btcVersion: string,
    btcHash: string,
    supplierId: number,
    swapRouter: string,
    xbtc: string,
    caller: string
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'complete-rollover',
      [
        types.uint(loanId),
        types.principal(lpToken),
        types.uint(tokenId),
        types.principal(collToken),
        types.principal(collVault),
        types.principal(fundingVault),
        types.buff(Buffer.from(btcVersion, "hex")),
        types.buff(Buffer.from(btcHash, "hex")),
        types.uint(supplierId),
        types.principal(swapRouter),
        types.principal(xbtc),
      ],
      caller
    );
  }

  static finalizeRollover(
    loanId: number,
    lpToken: string,
    tokenId: number,
    collToken: string,
    collVault: string,
    fv: string,
    xbtcFt: string,
    block: { header: string, height: number },
    prevBlocks: string[],
    tx: string,
    proof: { "tx-index": number, "hashes": string[], "tree-depth": number },
    outputIndex: number,
    swapId: number,
    caller: string
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'finalize-rollover',
      [
        types.uint(loanId),
        types.principal(lpToken),
        types.uint(tokenId),
        types.principal(collToken),
        types.principal(collVault),
        types.principal(fv),
        types.principal(xbtcFt),
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
        types.uint(swapId),
      ],
      caller
    );
  }

  static finalizeDrawdown(
    loanId: number,
    lpToken: string,
    tokenId: number,
    collToken: string,
    collVault: string,
    fv: string,
    xbtcFt: string,
    block: { header: string, height: number },
    prevBlocks: string[],
    tx: string,
    proof: { "tx-index": number, "hashes": string[], "tree-depth": number },
    outputIndex: number,
    swapId: number,
    caller: string
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'finalize-drawdown',
      [
        types.uint(loanId),
        types.principal(lpToken),
        types.uint(tokenId),
        types.principal(collToken),
        types.principal(collVault),
        types.principal(fv),
        types.principal(xbtcFt),
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
        types.uint(swapId),
      ],
      caller
    );
  }

  static drawdownXBTC(
    loanId: number,
    lpToken: string,
    tokenId: number,
    collToken: string,
    collVault: string,
    fundingVault: string,
    swapRouter: string,
    xbtc: string,
    caller: string
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'drawdown-xbtc',
      [
        types.uint(loanId),
        types.principal(lpToken),
        types.uint(tokenId),
        types.principal(collToken),
        types.principal(collVault),
        types.principal(fundingVault),
        types.principal(swapRouter),
        types.principal(xbtc),
      ],
      caller
    );
  }
  
  static cancelDrawdown(
    loanId: number,
    lpToken: string,
    tokenId: number,
    collToken: string,
    collVault: string,
    fundingVault: string,
    xbtc: string,
    swapId: number,
    caller: string
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'cancel-drawdown',
      [
        types.uint(loanId),
        types.principal(lpToken),
        types.uint(tokenId),
        types.principal(collToken),
        types.principal(collVault),
        types.principal(fundingVault),
        types.principal(xbtc),
        types.uint(swapId),
      ],
      caller
    );
  }
  
  static cancelRollover(
    loanId: number,
    lpToken: string,
    tokenId: number,
    collToken: string,
    collVault: string,
    fundingVault: string,
    xbtc: string,
    swapId: number,
    caller: string
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'cancel-rollover',
      [
        types.uint(loanId),
        types.principal(lpToken),
        types.uint(tokenId),
        types.principal(collToken),
        types.principal(collVault),
        types.principal(fundingVault),
        types.principal(xbtc),
        types.uint(swapId),
      ],
      caller
    );
  }

  static finalizeOutbound(
    block: { header: string, height: number },
    prevBlocks: string[],
    tx: string,
    proof: { "tx-index": number, "hashes": string[], "tree-depth": number },
    outputIndex: number,
    swapId: number,
    caller: string
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'finalize-outbound',
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
        types.uint(swapId),
      ],
      caller
    );
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
      "supplier-interface",
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

  static updateLiquidity(
    height: number,
    liquidity: number,
    caller: string
  ) {
    return Tx.contractCall(
      "supplier-interface",
      'update-liquidity',
      [
        types.uint(height),
        types.uint(liquidity),
      ],
      caller);
  }

  static getCurrentLiquidity(chain: Chain, caller: string) {
    return chain.callReadOnlyFn(`supplier-interface`, "get-current-liquidity", [ ], caller).result;
  }

  static getOutboundSwap(chain: Chain, swapId: number, caller: string) {
    return chain.callReadOnlyFn(`magic-protocol`, "get-outbound-swap", [ types.uint(swapId) ], caller).result;
  }



}

export { SupplierInterface };