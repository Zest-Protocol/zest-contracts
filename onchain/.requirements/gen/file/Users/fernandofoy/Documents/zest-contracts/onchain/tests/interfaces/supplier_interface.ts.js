import { Tx, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";
class SupplierInterface {
    static sendFunds(block, prevBlocks, tx, proof, outputIndex, sender, recipient, expirationBuff, hash, swapperBuff, supplierId, minToReceive, caller) {
        return Tx.contractCall("supplier-interface", 'send-funds', [
            types.tuple({
                header: types.buff(Buffer.from(block.header, "hex")),
                height: types.uint(block.height)
            }),
            types.list(prevBlocks.map((val)=>types.buff(Buffer.from(val, "hex")))),
            types.buff(Buffer.from(tx, "hex")),
            types.tuple({
                "tx-index": types.uint(proof['tx-index']),
                "hashes": types.list(proof.hashes.map((val)=>types.buff(Buffer.from(val, "hex")))),
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
        ], caller);
    }
    static sendFundsWrap(block, prevBlocks, tx, proof, outputIndex, sender, recipient, expirationBuff, hash, swapperBuff, supplierId, minToReceive, preimage, factor, lpToken, tokenId, zpToken, liquidityVault, xbtc, rewardsCalc, caller) {
        return Tx.contractCall("supplier-interface", 'send-funds-wrap', [
            types.tuple({
                header: types.buff(Buffer.from(block.header, "hex")),
                height: types.uint(block.height)
            }),
            types.list(prevBlocks.map((val)=>types.buff(Buffer.from(val, "hex")))),
            types.buff(Buffer.from(tx, "hex")),
            types.tuple({
                "tx-index": types.uint(proof['tx-index']),
                "hashes": types.list(proof.hashes.map((val)=>types.buff(Buffer.from(val, "hex")))),
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
            types.buff(Buffer.from(preimage, "hex")),
            types.uint(factor),
            types.principal(lpToken),
            types.uint(tokenId),
            types.principal(zpToken),
            types.principal(liquidityVault),
            types.principal(xbtc),
            types.principal(rewardsCalc), 
        ], caller);
    }
    static sendFundsXBTC(factor, lpToken, tokenId, zpToken, lv, xbtcFt, amount, rewardsCalc, caller) {
        return Tx.contractCall("supplier-interface", 'send-funds-xbtc', [
            types.uint(factor),
            types.principal(lpToken),
            types.uint(tokenId),
            types.principal(zpToken),
            types.principal(lv),
            types.principal(xbtcFt),
            types.uint(amount),
            types.principal(rewardsCalc), 
        ], caller);
    }
    static makePaymentXBTC(amount, loanId, payment, lpToken, lv, tokenId, cpToken, cpRewards, zpToken, swapRouter, xbtcFt, caller) {
        return Tx.contractCall("supplier-interface", 'make-payment-xbtc', [
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
        ], caller);
    }
    static sendFundsFinalize(txid, preimage, factor, lpToken, tokenId, zpToken, liquidityVault, xbtc, rewardsCalc, caller) {
        return Tx.contractCall("supplier-interface", 'send-funds-finalize', [
            types.buff(Buffer.from(txid, "hex")),
            types.buff(Buffer.from(preimage, "hex")),
            types.uint(factor),
            types.principal(lpToken),
            types.uint(tokenId),
            types.principal(zpToken),
            types.principal(liquidityVault),
            types.principal(xbtc),
            types.principal(rewardsCalc), 
        ], caller);
    }
    static sendFundsFinalizeCompleted(txid, factor, lpToken, tokenId, zpToken, liquidityVault, xbtc, rewardsCalc, caller) {
        return Tx.contractCall("supplier-interface", 'send-funds-finalize-completed', [
            types.buff(Buffer.from(txid, "hex")),
            types.uint(factor),
            types.principal(lpToken),
            types.uint(tokenId),
            types.principal(zpToken),
            types.principal(liquidityVault),
            types.principal(xbtc),
            types.principal(rewardsCalc), 
        ], caller);
    }
    static makePaymentVerify(txid, preimage, loanId, payment, lpToken, lv, tokenId, cpToken, cpRewards, zpToken, swapRouter, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'make-payment-verify', [
            types.buff(Buffer.from(txid, "hex")),
            types.buff(Buffer.from(preimage, "hex")),
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
        ], caller);
    }
    static makePaymentVerifyCompleted(txid, loanId, payment, lpToken, lv, tokenId, cpToken, cpRewards, zpToken, swapRouter, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'make-payment-verify-completed', [
            types.buff(Buffer.from(txid, "hex")),
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
        ], caller);
    }
    static makePayment(txid, preimage, loanId, payment, lpToken, lv, tokenId, cpToken, cpRewards, zpToken, swapRouter, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'make-payment', [
            types.buff(Buffer.from(txid, "hex")),
            types.buff(Buffer.from(preimage, "hex")),
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
        ], caller);
    }
    static makePaymentCompleted(txid, loanId, payment, lpToken, lv, tokenId, cpToken, cpRewards, zpToken, swapRouter, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'make-payment-completed', [
            types.buff(Buffer.from(txid, "hex")),
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
        ], caller);
    }
    static makeResidualPayment(txid, preimage, loanId, lpToken, lv, tokenId, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'make-residual-payment', [
            types.buff(Buffer.from(txid, "hex")),
            types.buff(Buffer.from(preimage, "hex")),
            types.uint(loanId),
            types.principal(lpToken),
            types.principal(lv),
            types.uint(tokenId),
            types.principal(xbtc), 
        ], caller);
    }
    static makeResidualPaymentCompleted(txid, loanId, lpToken, lv, tokenId, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'make-residual-payment-completed', [
            types.buff(Buffer.from(txid, "hex")),
            types.uint(loanId),
            types.principal(lpToken),
            types.principal(lv),
            types.uint(tokenId),
            types.principal(xbtc), 
        ], caller);
    }
    static makeFullPayment(txid, preimage, loanId, payment, lpToken, lv, tokenId, cpToken, cpRewards, zpToken, swapRouter, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'make-full-payment', [
            types.buff(Buffer.from(txid, "hex")),
            types.buff(Buffer.from(preimage, "hex")),
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
        ], caller);
    }
    static makeFullPaymentCompleted(txid, loanId, payment, lpToken, lv, tokenId, cpToken, cpRewards, zpToken, swapRouter, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'make-full-payment-completed', [
            types.buff(Buffer.from(txid, "hex")),
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
        ], caller);
    }
    static withdraw(xbtc, btcVersion, btcHash, supplierId, lpToken, zpToken, tokenId, liquidityVault, xbtcFt, caller) {
        return Tx.contractCall("supplier-interface", 'withdraw', [
            types.uint(xbtc),
            types.buff(Buffer.from(btcVersion, "hex")),
            types.buff(Buffer.from(btcHash, "hex")),
            types.uint(supplierId),
            types.principal(lpToken),
            types.principal(zpToken),
            types.uint(tokenId),
            types.principal(liquidityVault),
            types.principal(xbtcFt), 
        ], caller);
    }
    static withdrawXBTC(xbtc, lpToken, zpToken, tokenId, liquidityVault, xbtcFt, caller) {
        return Tx.contractCall("supplier-interface", 'withdraw-xbtc', [
            types.uint(xbtc),
            types.principal(lpToken),
            types.principal(zpToken),
            types.uint(tokenId),
            types.principal(liquidityVault),
            types.principal(xbtcFt), 
        ], caller);
    }
    static withdrawRewards(btcVersion, btcHash, supplierId, lpToken, tokenId, liquidityVault, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'withdraw-rewards', [
            types.buff(Buffer.from(btcVersion, "hex")),
            types.buff(Buffer.from(btcHash, "hex")),
            types.uint(supplierId),
            types.principal(lpToken),
            types.uint(tokenId),
            types.principal(liquidityVault),
            types.principal(xbtc), 
        ], caller);
    }
    static withdrawCoverRewards(btcVersion, btcHash, supplierId, cpRewards, tokenId, liquidityVault, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'withdraw-cover-rewards', [
            types.buff(Buffer.from(btcVersion, "hex")),
            types.buff(Buffer.from(btcHash, "hex")),
            types.uint(supplierId),
            types.principal(cpRewards),
            types.uint(tokenId),
            types.principal(liquidityVault),
            types.principal(xbtc), 
        ], caller);
    }
    static withdrawRewardsXBTC(lpToken, tokenId, liquidityVault, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'withdraw-rewards-xbtc', [
            types.principal(lpToken),
            types.uint(tokenId),
            types.principal(liquidityVault),
            types.principal(xbtc), 
        ], caller);
    }
    static withdrawCoverRewardsXBTC(cpRewards, tokenId, liquidityVault, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'withdraw-cover-rewards-xbtc', [
            types.principal(cpRewards),
            types.uint(tokenId),
            types.principal(liquidityVault),
            types.principal(xbtc), 
        ], caller);
    }
    static drawdownVerify(loanId, lpToken, tokenId, collToken, collVault, fundingVault, btcVersion, btcHash, supplierId, swapRouter, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'drawdown-verify', [
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
        ], caller);
    }
    static drawdown(loanId, lpToken, tokenId, collToken, collVault, fundingVault, btcVersion, btcHash, supplierId, swapRouter, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'drawdown', [
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
        ], caller);
    }
    static completeRollover(loanId, lpToken, tokenId, collToken, collVault, fundingVault, btcVersion, btcHash, supplierId, swapRouter, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'complete-rollover', [
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
        ], caller);
    }
    static finalizeRollover(loanId, lpToken, tokenId, collToken, collVault, fv, xbtcFt, block, prevBlocks, tx, proof, outputIndex, swapId, caller) {
        return Tx.contractCall("supplier-interface", 'finalize-rollover', [
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
            types.list(prevBlocks.map((val)=>types.buff(Buffer.from(val, "hex")))),
            types.buff(Buffer.from(tx, "hex")),
            types.tuple({
                "tx-index": types.uint(proof['tx-index']),
                "hashes": types.list(proof.hashes.map((val)=>types.buff(Buffer.from(val, "hex")))),
                "tree-depth": types.uint(proof['tree-depth'])
            }),
            types.uint(outputIndex),
            types.uint(swapId), 
        ], caller);
    }
    static finalizeDrawdown(loanId, lpToken, tokenId, collToken, collVault, fv, xbtcFt, block, prevBlocks, tx, proof, outputIndex, swapId, caller) {
        return Tx.contractCall("supplier-interface", 'finalize-drawdown', [
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
            types.list(prevBlocks.map((val)=>types.buff(Buffer.from(val, "hex")))),
            types.buff(Buffer.from(tx, "hex")),
            types.tuple({
                "tx-index": types.uint(proof['tx-index']),
                "hashes": types.list(proof.hashes.map((val)=>types.buff(Buffer.from(val, "hex")))),
                "tree-depth": types.uint(proof['tree-depth'])
            }),
            types.uint(outputIndex),
            types.uint(swapId), 
        ], caller);
    }
    static drawdownXBTC(loanId, lpToken, tokenId, collToken, collVault, fundingVault, swapRouter, xbtc, caller) {
        return Tx.contractCall("supplier-interface", 'drawdown-xbtc', [
            types.uint(loanId),
            types.principal(lpToken),
            types.uint(tokenId),
            types.principal(collToken),
            types.principal(collVault),
            types.principal(fundingVault),
            types.principal(swapRouter),
            types.principal(xbtc), 
        ], caller);
    }
    static cancelDrawdown(loanId, lpToken, tokenId, collToken, collVault, fundingVault, xbtc, swapId, caller) {
        return Tx.contractCall("supplier-interface", 'cancel-drawdown', [
            types.uint(loanId),
            types.principal(lpToken),
            types.uint(tokenId),
            types.principal(collToken),
            types.principal(collVault),
            types.principal(fundingVault),
            types.principal(xbtc),
            types.uint(swapId), 
        ], caller);
    }
    static cancelRollover(loanId, lpToken, tokenId, collToken, collVault, fundingVault, xbtc, swapId, caller) {
        return Tx.contractCall("supplier-interface", 'cancel-rollover', [
            types.uint(loanId),
            types.principal(lpToken),
            types.uint(tokenId),
            types.principal(collToken),
            types.principal(collVault),
            types.principal(fundingVault),
            types.principal(xbtc),
            types.uint(swapId), 
        ], caller);
    }
    static finalizeOutbound(block, prevBlocks, tx, proof, outputIndex, swapId, caller) {
        return Tx.contractCall("supplier-interface", 'finalize-outbound', [
            types.tuple({
                header: types.buff(Buffer.from(block.header, "hex")),
                height: types.uint(block.height)
            }),
            types.list(prevBlocks.map((val)=>types.buff(Buffer.from(val, "hex")))),
            types.buff(Buffer.from(tx, "hex")),
            types.tuple({
                "tx-index": types.uint(proof['tx-index']),
                "hashes": types.list(proof.hashes.map((val)=>types.buff(Buffer.from(val, "hex")))),
                "tree-depth": types.uint(proof['tree-depth'])
            }),
            types.uint(outputIndex),
            types.uint(swapId), 
        ], caller);
    }
    static registerSupplier(publicKey, inboundFee, outboundFee, outboundBaseFee, inboundBaseFee, name, funds, caller) {
        return Tx.contractCall("supplier-interface", 'register-supplier', [
            types.buff(Buffer.from(publicKey, "hex")),
            types.some(types.int(inboundFee)),
            types.some(types.int(outboundFee)),
            types.int(outboundBaseFee),
            types.int(inboundBaseFee),
            types.ascii(name),
            types.uint(funds), 
        ], caller);
    }
    static updateLiquidity(height, liquidity, caller) {
        return Tx.contractCall("supplier-interface", 'update-liquidity', [
            types.uint(height),
            types.uint(liquidity), 
        ], caller);
    }
    static getCurrentLiquidity(chain, caller) {
        return chain.callReadOnlyFn(`supplier-interface`, "get-current-liquidity", [], caller).result;
    }
    static getOutboundSwap(chain, swapId, caller) {
        return chain.callReadOnlyFn(`magic-protocol`, "get-outbound-swap", [
            types.uint(swapId)
        ], caller).result;
    }
}
export { SupplierInterface };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZmVybmFuZG9mb3kvRG9jdW1lbnRzL3plc3QtY29udHJhY3RzL29uY2hhaW4vdGVzdHMvaW50ZXJmYWNlcy9zdXBwbGllcl9pbnRlcmZhY2UudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVHgsIENoYWluLCBBY2NvdW50LCB0eXBlcyB9IGZyb20gJ2h0dHBzOi8vZGVuby5sYW5kL3gvY2xhcmluZXRAdjEuMC4yL2luZGV4LnRzJztcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xNTkuMC9ub2RlL2J1ZmZlci50c1wiO1xuXG5jbGFzcyBTdXBwbGllckludGVyZmFjZSB7XG4gIHN0YXRpYyBzZW5kRnVuZHMoXG4gICAgYmxvY2s6IHsgaGVhZGVyOiBzdHJpbmcsIGhlaWdodDogbnVtYmVyIH0sXG4gICAgcHJldkJsb2Nrczogc3RyaW5nW10sXG4gICAgdHg6IHN0cmluZyxcbiAgICBwcm9vZjogeyBcInR4LWluZGV4XCI6IG51bWJlciwgXCJoYXNoZXNcIjogc3RyaW5nW10sIFwidHJlZS1kZXB0aFwiOiBudW1iZXIgfSxcbiAgICBvdXRwdXRJbmRleDogbnVtYmVyLFxuICAgIHNlbmRlcjogc3RyaW5nLFxuICAgIHJlY2lwaWVudDogc3RyaW5nLFxuICAgIGV4cGlyYXRpb25CdWZmOiBzdHJpbmcsXG4gICAgaGFzaDogc3RyaW5nLFxuICAgIHN3YXBwZXJCdWZmOiBzdHJpbmcsXG4gICAgc3VwcGxpZXJJZDogbnVtYmVyLFxuICAgIG1pblRvUmVjZWl2ZTogbnVtYmVyLFxuICAgIGNhbGxlcjogc3RyaW5nLFxuICAgICkge1xuICAgIHJldHVybiBUeC5jb250cmFjdENhbGwoXG4gICAgICBcInN1cHBsaWVyLWludGVyZmFjZVwiLFxuICAgICAgJ3NlbmQtZnVuZHMnLFxuICAgICAgW1xuICAgICAgICB0eXBlcy50dXBsZSh7XG4gICAgICAgICAgaGVhZGVyOiB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKGJsb2NrLmhlYWRlciwgXCJoZXhcIikpLFxuICAgICAgICAgIGhlaWdodDogdHlwZXMudWludChibG9jay5oZWlnaHQpXG4gICAgICAgIH0pLFxuICAgICAgICB0eXBlcy5saXN0KHByZXZCbG9ja3MubWFwKCh2YWwpID0+IHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20odmFsLCBcImhleFwiKSkpKSxcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbSh0eCwgXCJoZXhcIikpLFxuICAgICAgICB0eXBlcy50dXBsZSh7XG4gICAgICAgICAgXCJ0eC1pbmRleFwiOiB0eXBlcy51aW50KHByb29mWyd0eC1pbmRleCddKSxcbiAgICAgICAgICBcImhhc2hlc1wiOiB0eXBlcy5saXN0KHByb29mLmhhc2hlcy5tYXAodmFsID0+IHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20odmFsLCBcImhleFwiKSkpKSxcbiAgICAgICAgICBcInRyZWUtZGVwdGhcIjogdHlwZXMudWludChwcm9vZlsndHJlZS1kZXB0aCddKVxuICAgICAgICB9KSxcbiAgICAgICAgdHlwZXMudWludChvdXRwdXRJbmRleCksXG4gICAgICAgIHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20oc2VuZGVyLCBcImhleFwiKSksXG4gICAgICAgIHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20ocmVjaXBpZW50LCBcImhleFwiKSksXG4gICAgICAgIHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20oZXhwaXJhdGlvbkJ1ZmYsIFwiaGV4XCIpKSxcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbShoYXNoLCBcImhleFwiKSksXG4gICAgICAgIHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20oc3dhcHBlckJ1ZmYsIFwiaGV4XCIpKSxcbiAgICAgICAgdHlwZXMudWludChzdXBwbGllcklkKSxcbiAgICAgICAgdHlwZXMudWludChtaW5Ub1JlY2VpdmUpLFxuICAgICAgXSxcbiAgICAgIGNhbGxlcik7XG4gIH1cblxuICBzdGF0aWMgc2VuZEZ1bmRzV3JhcChcbiAgICBibG9jazogeyBoZWFkZXI6IHN0cmluZywgaGVpZ2h0OiBudW1iZXIgfSxcbiAgICBwcmV2QmxvY2tzOiBzdHJpbmdbXSxcbiAgICB0eDogc3RyaW5nLFxuICAgIHByb29mOiB7IFwidHgtaW5kZXhcIjogbnVtYmVyLCBcImhhc2hlc1wiOiBzdHJpbmdbXSwgXCJ0cmVlLWRlcHRoXCI6IG51bWJlciB9LFxuICAgIG91dHB1dEluZGV4OiBudW1iZXIsXG4gICAgc2VuZGVyOiBzdHJpbmcsXG4gICAgcmVjaXBpZW50OiBzdHJpbmcsXG4gICAgZXhwaXJhdGlvbkJ1ZmY6IHN0cmluZyxcbiAgICBoYXNoOiBzdHJpbmcsXG4gICAgc3dhcHBlckJ1ZmY6IHN0cmluZyxcbiAgICBzdXBwbGllcklkOiBudW1iZXIsXG4gICAgbWluVG9SZWNlaXZlOiBudW1iZXIsXG4gICAgcHJlaW1hZ2U6IHN0cmluZyxcbiAgICBmYWN0b3I6IG51bWJlcixcbiAgICBscFRva2VuOiBzdHJpbmcsXG4gICAgdG9rZW5JZDogbnVtYmVyLFxuICAgIHpwVG9rZW46IHN0cmluZyxcbiAgICBsaXF1aWRpdHlWYXVsdDogc3RyaW5nLFxuICAgIHhidGM6IHN0cmluZyxcbiAgICByZXdhcmRzQ2FsYzogc3RyaW5nLFxuICAgIGNhbGxlcjogc3RyaW5nLFxuICAgICkge1xuICAgIHJldHVybiBUeC5jb250cmFjdENhbGwoXG4gICAgICBcInN1cHBsaWVyLWludGVyZmFjZVwiLFxuICAgICAgJ3NlbmQtZnVuZHMtd3JhcCcsXG4gICAgICBbXG4gICAgICAgIHR5cGVzLnR1cGxlKHtcbiAgICAgICAgICBoZWFkZXI6IHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20oYmxvY2suaGVhZGVyLCBcImhleFwiKSksXG4gICAgICAgICAgaGVpZ2h0OiB0eXBlcy51aW50KGJsb2NrLmhlaWdodClcbiAgICAgICAgfSksXG4gICAgICAgIHR5cGVzLmxpc3QocHJldkJsb2Nrcy5tYXAoKHZhbCkgPT4gdHlwZXMuYnVmZihCdWZmZXIuZnJvbSh2YWwsIFwiaGV4XCIpKSkpLFxuICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKHR4LCBcImhleFwiKSksXG4gICAgICAgIHR5cGVzLnR1cGxlKHtcbiAgICAgICAgICBcInR4LWluZGV4XCI6IHR5cGVzLnVpbnQocHJvb2ZbJ3R4LWluZGV4J10pLFxuICAgICAgICAgIFwiaGFzaGVzXCI6IHR5cGVzLmxpc3QocHJvb2YuaGFzaGVzLm1hcCh2YWwgPT4gdHlwZXMuYnVmZihCdWZmZXIuZnJvbSh2YWwsIFwiaGV4XCIpKSkpLFxuICAgICAgICAgIFwidHJlZS1kZXB0aFwiOiB0eXBlcy51aW50KHByb29mWyd0cmVlLWRlcHRoJ10pXG4gICAgICAgIH0pLFxuICAgICAgICB0eXBlcy51aW50KG91dHB1dEluZGV4KSxcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbShzZW5kZXIsIFwiaGV4XCIpKSxcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbShyZWNpcGllbnQsIFwiaGV4XCIpKSxcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbShleHBpcmF0aW9uQnVmZiwgXCJoZXhcIikpLFxuICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKGhhc2gsIFwiaGV4XCIpKSxcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbShzd2FwcGVyQnVmZiwgXCJoZXhcIikpLFxuICAgICAgICB0eXBlcy51aW50KHN1cHBsaWVySWQpLFxuICAgICAgICB0eXBlcy51aW50KG1pblRvUmVjZWl2ZSksXG4gICAgICAgIHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20ocHJlaW1hZ2UsXCJoZXhcIikpLFxuICAgICAgICB0eXBlcy51aW50KGZhY3RvciksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChscFRva2VuKSxcbiAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHpwVG9rZW4pLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwobGlxdWlkaXR5VmF1bHQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoeGJ0YyksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChyZXdhcmRzQ2FsYyksXG4gICAgICBdLFxuICAgICAgY2FsbGVyKTtcbiAgfVxuXG4gIHN0YXRpYyBzZW5kRnVuZHNYQlRDKFxuICAgICAgZmFjdG9yOiBudW1iZXIsXG4gICAgICBscFRva2VuOiBzdHJpbmcsXG4gICAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgICB6cFRva2VuOiBzdHJpbmcsXG4gICAgICBsdjogc3RyaW5nLFxuICAgICAgeGJ0Y0Z0OiBzdHJpbmcsXG4gICAgICBhbW91bnQ6IG51bWJlcixcbiAgICAgIHJld2FyZHNDYWxjOiBzdHJpbmcsXG4gICAgICBjYWxsZXI6IHN0cmluZyxcbiAgICApIHtcbiAgICByZXR1cm4gVHguY29udHJhY3RDYWxsKFxuICAgICAgXCJzdXBwbGllci1pbnRlcmZhY2VcIixcbiAgICAgICdzZW5kLWZ1bmRzLXhidGMnLFxuICAgICAgW1xuICAgICAgICB0eXBlcy51aW50KGZhY3RvciksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChscFRva2VuKSxcbiAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHpwVG9rZW4pLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwobHYpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoeGJ0Y0Z0KSxcbiAgICAgICAgdHlwZXMudWludChhbW91bnQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwocmV3YXJkc0NhbGMpLFxuICAgICAgXSxcbiAgICAgIGNhbGxlcik7XG4gIH1cblxuICBzdGF0aWMgbWFrZVBheW1lbnRYQlRDKFxuICAgICAgYW1vdW50OiBudW1iZXIsXG4gICAgICBsb2FuSWQ6IG51bWJlcixcbiAgICAgIHBheW1lbnQ6IHN0cmluZyxcbiAgICAgIGxwVG9rZW46IHN0cmluZyxcbiAgICAgIGx2OiBzdHJpbmcsXG4gICAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgICBjcFRva2VuOiBzdHJpbmcsXG4gICAgICBjcFJld2FyZHM6IHN0cmluZyxcbiAgICAgIHpwVG9rZW46IHN0cmluZyxcbiAgICAgIHN3YXBSb3V0ZXI6IHN0cmluZyxcbiAgICAgIHhidGNGdDogc3RyaW5nLFxuICAgICAgY2FsbGVyOiBzdHJpbmcsXG4gICAgKSB7XG4gICAgcmV0dXJuIFR4LmNvbnRyYWN0Q2FsbChcbiAgICAgIFwic3VwcGxpZXItaW50ZXJmYWNlXCIsXG4gICAgICAnbWFrZS1wYXltZW50LXhidGMnLFxuICAgICAgW1xuICAgICAgICB0eXBlcy51aW50KGFtb3VudCksXG4gICAgICAgIHR5cGVzLnVpbnQobG9hbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHBheW1lbnQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwobHBUb2tlbiksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChsdiksXG4gICAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChjcFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNwUmV3YXJkcyksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbCh6cFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHN3YXBSb3V0ZXIpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoeGJ0Y0Z0KSxcbiAgICAgIF0sXG4gICAgICBjYWxsZXIpO1xuICB9XG5cbiAgc3RhdGljIHNlbmRGdW5kc0ZpbmFsaXplKFxuICAgIHR4aWQ6IHN0cmluZyxcbiAgICBwcmVpbWFnZTogc3RyaW5nLFxuICAgIGZhY3RvcjogbnVtYmVyLFxuICAgIGxwVG9rZW46IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgenBUb2tlbjogc3RyaW5nLFxuICAgIGxpcXVpZGl0eVZhdWx0OiBzdHJpbmcsXG4gICAgeGJ0Yzogc3RyaW5nLFxuICAgIHJld2FyZHNDYWxjOiBzdHJpbmcsXG4gICAgY2FsbGVyOiBzdHJpbmcsXG4gICkge1xuICAgIHJldHVybiBUeC5jb250cmFjdENhbGwoXG4gICAgICAgIFwic3VwcGxpZXItaW50ZXJmYWNlXCIsXG4gICAgICAgICdzZW5kLWZ1bmRzLWZpbmFsaXplJyxcbiAgICAgICAgW1xuICAgICAgICAgIHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20odHhpZCxcImhleFwiKSksXG4gICAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbShwcmVpbWFnZSxcImhleFwiKSksXG4gICAgICAgICAgdHlwZXMudWludChmYWN0b3IpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChscFRva2VuKSxcbiAgICAgICAgICB0eXBlcy51aW50KHRva2VuSWQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbCh6cFRva2VuKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwobGlxdWlkaXR5VmF1bHQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbCh4YnRjKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwocmV3YXJkc0NhbGMpLFxuICAgICAgICBdLFxuICAgICAgICBjYWxsZXJcbiAgICAgICk7XG4gIH1cblxuICBzdGF0aWMgc2VuZEZ1bmRzRmluYWxpemVDb21wbGV0ZWQoXG4gICAgdHhpZDogc3RyaW5nLFxuICAgIGZhY3RvcjogbnVtYmVyLFxuICAgIGxwVG9rZW46IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgenBUb2tlbjogc3RyaW5nLFxuICAgIGxpcXVpZGl0eVZhdWx0OiBzdHJpbmcsXG4gICAgeGJ0Yzogc3RyaW5nLFxuICAgIHJld2FyZHNDYWxjOiBzdHJpbmcsXG4gICAgY2FsbGVyOiBzdHJpbmcsXG4gICkge1xuICAgIHJldHVybiBUeC5jb250cmFjdENhbGwoXG4gICAgICAgIFwic3VwcGxpZXItaW50ZXJmYWNlXCIsXG4gICAgICAgICdzZW5kLWZ1bmRzLWZpbmFsaXplLWNvbXBsZXRlZCcsXG4gICAgICAgIFtcbiAgICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKHR4aWQsXCJoZXhcIikpLFxuICAgICAgICAgIHR5cGVzLnVpbnQoZmFjdG9yKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwobHBUb2tlbiksXG4gICAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoenBUb2tlbiksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxpcXVpZGl0eVZhdWx0KSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoeGJ0YyksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKHJld2FyZHNDYWxjKSxcbiAgICAgICAgXSxcbiAgICAgICAgY2FsbGVyXG4gICAgICApO1xuICB9XG5cbiAgc3RhdGljIG1ha2VQYXltZW50VmVyaWZ5KFxuICAgIHR4aWQ6IHN0cmluZyxcbiAgICBwcmVpbWFnZTogc3RyaW5nLFxuICAgIGxvYW5JZDogbnVtYmVyLFxuICAgIHBheW1lbnQ6IHN0cmluZyxcbiAgICBscFRva2VuOiBzdHJpbmcsXG4gICAgbHY6IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgY3BUb2tlbjogc3RyaW5nLFxuICAgIGNwUmV3YXJkczogc3RyaW5nLFxuICAgIHpwVG9rZW46IHN0cmluZyxcbiAgICBzd2FwUm91dGVyOiBzdHJpbmcsXG4gICAgeGJ0Yzogc3RyaW5nLFxuICAgIGNhbGxlcjogc3RyaW5nXG4gICkge1xuICAgIHJldHVybiBUeC5jb250cmFjdENhbGwoXG4gICAgICBcInN1cHBsaWVyLWludGVyZmFjZVwiLFxuICAgICAgJ21ha2UtcGF5bWVudC12ZXJpZnknLFxuICAgICAgW1xuICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKHR4aWQsXCJoZXhcIikpLFxuICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKHByZWltYWdlLFwiaGV4XCIpKSxcbiAgICAgICAgdHlwZXMudWludChsb2FuSWQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwocGF5bWVudCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChscFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGx2KSxcbiAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNwVG9rZW4pLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoY3BSZXdhcmRzKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHpwVG9rZW4pLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoc3dhcFJvdXRlciksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbCh4YnRjKSxcbiAgICAgIF0sXG4gICAgICBjYWxsZXJcbiAgICApO1xuICB9XG5cbiAgc3RhdGljIG1ha2VQYXltZW50VmVyaWZ5Q29tcGxldGVkKFxuICAgIHR4aWQ6IHN0cmluZyxcbiAgICBsb2FuSWQ6IG51bWJlcixcbiAgICBwYXltZW50OiBzdHJpbmcsXG4gICAgbHBUb2tlbjogc3RyaW5nLFxuICAgIGx2OiBzdHJpbmcsXG4gICAgdG9rZW5JZDogbnVtYmVyLFxuICAgIGNwVG9rZW46IHN0cmluZyxcbiAgICBjcFJld2FyZHM6IHN0cmluZyxcbiAgICB6cFRva2VuOiBzdHJpbmcsXG4gICAgc3dhcFJvdXRlcjogc3RyaW5nLFxuICAgIHhidGM6IHN0cmluZyxcbiAgICBjYWxsZXI6IHN0cmluZ1xuICApIHtcbiAgICByZXR1cm4gVHguY29udHJhY3RDYWxsKFxuICAgICAgXCJzdXBwbGllci1pbnRlcmZhY2VcIixcbiAgICAgICdtYWtlLXBheW1lbnQtdmVyaWZ5LWNvbXBsZXRlZCcsXG4gICAgICBbXG4gICAgICAgIHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20odHhpZCxcImhleFwiKSksXG4gICAgICAgIHR5cGVzLnVpbnQobG9hbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHBheW1lbnQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwobHBUb2tlbiksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChsdiksXG4gICAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChjcFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNwUmV3YXJkcyksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbCh6cFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHN3YXBSb3V0ZXIpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoeGJ0YyksXG4gICAgICBdLFxuICAgICAgY2FsbGVyXG4gICAgKTtcbiAgfVxuXG4gIHN0YXRpYyBtYWtlUGF5bWVudChcbiAgICB0eGlkOiBzdHJpbmcsXG4gICAgcHJlaW1hZ2U6IHN0cmluZyxcbiAgICBsb2FuSWQ6IG51bWJlcixcbiAgICBwYXltZW50OiBzdHJpbmcsXG4gICAgbHBUb2tlbjogc3RyaW5nLFxuICAgIGx2OiBzdHJpbmcsXG4gICAgdG9rZW5JZDogbnVtYmVyLFxuICAgIGNwVG9rZW46IHN0cmluZyxcbiAgICBjcFJld2FyZHM6IHN0cmluZyxcbiAgICB6cFRva2VuOiBzdHJpbmcsXG4gICAgc3dhcFJvdXRlcjogc3RyaW5nLFxuICAgIHhidGM6IHN0cmluZyxcbiAgICBjYWxsZXI6IHN0cmluZ1xuICApIHtcbiAgICByZXR1cm4gVHguY29udHJhY3RDYWxsKFxuICAgICAgXCJzdXBwbGllci1pbnRlcmZhY2VcIixcbiAgICAgICdtYWtlLXBheW1lbnQnLFxuICAgICAgW1xuICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKHR4aWQsXCJoZXhcIikpLFxuICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKHByZWltYWdlLFwiaGV4XCIpKSxcbiAgICAgICAgdHlwZXMudWludChsb2FuSWQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwocGF5bWVudCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChscFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGx2KSxcbiAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNwVG9rZW4pLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoY3BSZXdhcmRzKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHpwVG9rZW4pLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoc3dhcFJvdXRlciksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbCh4YnRjKSxcbiAgICAgIF0sXG4gICAgICBjYWxsZXJcbiAgICApO1xuICB9XG5cblxuICBzdGF0aWMgbWFrZVBheW1lbnRDb21wbGV0ZWQoXG4gICAgdHhpZDogc3RyaW5nLFxuICAgIGxvYW5JZDogbnVtYmVyLFxuICAgIHBheW1lbnQ6IHN0cmluZyxcbiAgICBscFRva2VuOiBzdHJpbmcsXG4gICAgbHY6IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgY3BUb2tlbjogc3RyaW5nLFxuICAgIGNwUmV3YXJkczogc3RyaW5nLFxuICAgIHpwVG9rZW46IHN0cmluZyxcbiAgICBzd2FwUm91dGVyOiBzdHJpbmcsXG4gICAgeGJ0Yzogc3RyaW5nLFxuICAgIGNhbGxlcjogc3RyaW5nXG4gICkge1xuICAgIHJldHVybiBUeC5jb250cmFjdENhbGwoXG4gICAgICBcInN1cHBsaWVyLWludGVyZmFjZVwiLFxuICAgICAgJ21ha2UtcGF5bWVudC1jb21wbGV0ZWQnLFxuICAgICAgW1xuICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKHR4aWQsXCJoZXhcIikpLFxuICAgICAgICB0eXBlcy51aW50KGxvYW5JZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChwYXltZW50KSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxwVG9rZW4pLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwobHYpLFxuICAgICAgICB0eXBlcy51aW50KHRva2VuSWQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoY3BUb2tlbiksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChjcFJld2FyZHMpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoenBUb2tlbiksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChzd2FwUm91dGVyKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHhidGMpLFxuICAgICAgXSxcbiAgICAgIGNhbGxlclxuICAgICk7XG4gIH1cblxuICBzdGF0aWMgbWFrZVJlc2lkdWFsUGF5bWVudChcbiAgICB0eGlkOiBzdHJpbmcsXG4gICAgcHJlaW1hZ2U6IHN0cmluZyxcbiAgICBsb2FuSWQ6IG51bWJlcixcbiAgICBscFRva2VuOiBzdHJpbmcsXG4gICAgbHY6IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgeGJ0Yzogc3RyaW5nLFxuICAgIGNhbGxlcjogc3RyaW5nLFxuICApIHtcbiAgICByZXR1cm4gVHguY29udHJhY3RDYWxsKFxuICAgICAgXCJzdXBwbGllci1pbnRlcmZhY2VcIixcbiAgICAgICdtYWtlLXJlc2lkdWFsLXBheW1lbnQnLFxuICAgICAgW1xuICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKHR4aWQsXCJoZXhcIikpLFxuICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKHByZWltYWdlLFwiaGV4XCIpKSxcbiAgICAgICAgdHlwZXMudWludChsb2FuSWQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwobHBUb2tlbiksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChsdiksXG4gICAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbCh4YnRjKSxcbiAgICAgIF0sXG4gICAgICBjYWxsZXJcbiAgICApO1xuICB9XG5cbiAgc3RhdGljIG1ha2VSZXNpZHVhbFBheW1lbnRDb21wbGV0ZWQoXG4gICAgdHhpZDogc3RyaW5nLFxuICAgIGxvYW5JZDogbnVtYmVyLFxuICAgIGxwVG9rZW46IHN0cmluZyxcbiAgICBsdjogc3RyaW5nLFxuICAgIHRva2VuSWQ6IG51bWJlcixcbiAgICB4YnRjOiBzdHJpbmcsXG4gICAgY2FsbGVyOiBzdHJpbmcsXG4gICkge1xuICAgIHJldHVybiBUeC5jb250cmFjdENhbGwoXG4gICAgICBcInN1cHBsaWVyLWludGVyZmFjZVwiLFxuICAgICAgJ21ha2UtcmVzaWR1YWwtcGF5bWVudC1jb21wbGV0ZWQnLFxuICAgICAgW1xuICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKHR4aWQsXCJoZXhcIikpLFxuICAgICAgICB0eXBlcy51aW50KGxvYW5JZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChscFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGx2KSxcbiAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHhidGMpLFxuICAgICAgXSxcbiAgICAgIGNhbGxlclxuICAgICk7XG4gIH1cblxuICBzdGF0aWMgbWFrZUZ1bGxQYXltZW50KFxuICAgIHR4aWQ6IHN0cmluZyxcbiAgICBwcmVpbWFnZTogc3RyaW5nLFxuICAgIGxvYW5JZDogbnVtYmVyLFxuICAgIHBheW1lbnQ6IHN0cmluZyxcbiAgICBscFRva2VuOiBzdHJpbmcsXG4gICAgbHY6IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgY3BUb2tlbjogc3RyaW5nLFxuICAgIGNwUmV3YXJkczogc3RyaW5nLFxuICAgIHpwVG9rZW46IHN0cmluZyxcbiAgICBzd2FwUm91dGVyOiBzdHJpbmcsXG4gICAgeGJ0Yzogc3RyaW5nLFxuICAgIGNhbGxlcjogc3RyaW5nXG4gICkge1xuICAgIHJldHVybiBUeC5jb250cmFjdENhbGwoXG4gICAgICBcInN1cHBsaWVyLWludGVyZmFjZVwiLFxuICAgICAgJ21ha2UtZnVsbC1wYXltZW50JyxcbiAgICAgIFtcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbSh0eGlkLFwiaGV4XCIpKSxcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbShwcmVpbWFnZSxcImhleFwiKSksXG4gICAgICAgIHR5cGVzLnVpbnQobG9hbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHBheW1lbnQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwobHBUb2tlbiksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChsdiksXG4gICAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChjcFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNwUmV3YXJkcyksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbCh6cFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHN3YXBSb3V0ZXIpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoeGJ0YyksXG4gICAgICBdLFxuICAgICAgY2FsbGVyXG4gICAgKTtcbiAgfVxuXG4gIHN0YXRpYyBtYWtlRnVsbFBheW1lbnRDb21wbGV0ZWQoXG4gICAgdHhpZDogc3RyaW5nLFxuICAgIGxvYW5JZDogbnVtYmVyLFxuICAgIHBheW1lbnQ6IHN0cmluZyxcbiAgICBscFRva2VuOiBzdHJpbmcsXG4gICAgbHY6IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgY3BUb2tlbjogc3RyaW5nLFxuICAgIGNwUmV3YXJkczogc3RyaW5nLFxuICAgIHpwVG9rZW46IHN0cmluZyxcbiAgICBzd2FwUm91dGVyOiBzdHJpbmcsXG4gICAgeGJ0Yzogc3RyaW5nLFxuICAgIGNhbGxlcjogc3RyaW5nXG4gICkge1xuICAgIHJldHVybiBUeC5jb250cmFjdENhbGwoXG4gICAgICBcInN1cHBsaWVyLWludGVyZmFjZVwiLFxuICAgICAgJ21ha2UtZnVsbC1wYXltZW50LWNvbXBsZXRlZCcsXG4gICAgICBbXG4gICAgICAgIHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20odHhpZCxcImhleFwiKSksXG4gICAgICAgIHR5cGVzLnVpbnQobG9hbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHBheW1lbnQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwobHBUb2tlbiksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChsdiksXG4gICAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChjcFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNwUmV3YXJkcyksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbCh6cFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHN3YXBSb3V0ZXIpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoeGJ0YyksXG4gICAgICBdLFxuICAgICAgY2FsbGVyXG4gICAgKTtcbiAgfVxuXG4gIHN0YXRpYyB3aXRoZHJhdyhcbiAgICB4YnRjOiBudW1iZXIsXG4gICAgYnRjVmVyc2lvbjogc3RyaW5nLFxuICAgIGJ0Y0hhc2g6IHN0cmluZyxcbiAgICBzdXBwbGllcklkOiBudW1iZXIsXG4gICAgbHBUb2tlbjogc3RyaW5nLFxuICAgIHpwVG9rZW46IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgbGlxdWlkaXR5VmF1bHQ6IHN0cmluZyxcbiAgICB4YnRjRnQ6IHN0cmluZyxcbiAgICBjYWxsZXI6IHN0cmluZyxcbiAgKSB7XG4gICAgcmV0dXJuIFR4LmNvbnRyYWN0Q2FsbChcbiAgICAgIFwic3VwcGxpZXItaW50ZXJmYWNlXCIsXG4gICAgICAnd2l0aGRyYXcnLFxuICAgICAgW1xuICAgICAgICB0eXBlcy51aW50KHhidGMpLFxuICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKGJ0Y1ZlcnNpb24sIFwiaGV4XCIpKSxcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbShidGNIYXNoLCBcImhleFwiKSksXG4gICAgICAgIHR5cGVzLnVpbnQoc3VwcGxpZXJJZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChscFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHpwVG9rZW4pLFxuICAgICAgICB0eXBlcy51aW50KHRva2VuSWQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwobGlxdWlkaXR5VmF1bHQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoeGJ0Y0Z0KSxcbiAgICAgIF0sXG4gICAgICBjYWxsZXJcbiAgICApO1xuICB9XG4gIFxuICBzdGF0aWMgd2l0aGRyYXdYQlRDKFxuICAgIHhidGM6IG51bWJlcixcbiAgICBscFRva2VuOiBzdHJpbmcsXG4gICAgenBUb2tlbjogc3RyaW5nLFxuICAgIHRva2VuSWQ6IG51bWJlcixcbiAgICBsaXF1aWRpdHlWYXVsdDogc3RyaW5nLFxuICAgIHhidGNGdDogc3RyaW5nLFxuICAgIGNhbGxlcjogc3RyaW5nLFxuICApIHtcbiAgICByZXR1cm4gVHguY29udHJhY3RDYWxsKFxuICAgICAgXCJzdXBwbGllci1pbnRlcmZhY2VcIixcbiAgICAgICd3aXRoZHJhdy14YnRjJyxcbiAgICAgIFtcbiAgICAgICAgdHlwZXMudWludCh4YnRjKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxwVG9rZW4pLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoenBUb2tlbiksXG4gICAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChsaXF1aWRpdHlWYXVsdCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbCh4YnRjRnQpLFxuICAgICAgXSxcbiAgICAgIGNhbGxlclxuICAgICk7XG4gIH1cblxuICBzdGF0aWMgd2l0aGRyYXdSZXdhcmRzKFxuICAgIGJ0Y1ZlcnNpb246IHN0cmluZyxcbiAgICBidGNIYXNoOiBzdHJpbmcsXG4gICAgc3VwcGxpZXJJZDogbnVtYmVyLFxuICAgIGxwVG9rZW46IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgbGlxdWlkaXR5VmF1bHQ6IHN0cmluZyxcbiAgICB4YnRjOiBzdHJpbmcsXG4gICAgY2FsbGVyOiBzdHJpbmcsXG4gICkge1xuICAgIHJldHVybiBUeC5jb250cmFjdENhbGwoXG4gICAgICBcInN1cHBsaWVyLWludGVyZmFjZVwiLFxuICAgICAgJ3dpdGhkcmF3LXJld2FyZHMnLFxuICAgICAgW1xuICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKGJ0Y1ZlcnNpb24sIFwiaGV4XCIpKSxcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbShidGNIYXNoLCBcImhleFwiKSksXG4gICAgICAgIHR5cGVzLnVpbnQoc3VwcGxpZXJJZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChscFRva2VuKSxcbiAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxpcXVpZGl0eVZhdWx0KSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHhidGMpLFxuICAgICAgXSxcbiAgICAgIGNhbGxlclxuICAgICk7XG4gIH1cblxuICBzdGF0aWMgd2l0aGRyYXdDb3ZlclJld2FyZHMoXG4gICAgYnRjVmVyc2lvbjogc3RyaW5nLFxuICAgIGJ0Y0hhc2g6IHN0cmluZyxcbiAgICBzdXBwbGllcklkOiBudW1iZXIsXG4gICAgY3BSZXdhcmRzOiBzdHJpbmcsXG4gICAgdG9rZW5JZDogbnVtYmVyLFxuICAgIGxpcXVpZGl0eVZhdWx0OiBzdHJpbmcsXG4gICAgeGJ0Yzogc3RyaW5nLFxuICAgIGNhbGxlcjogc3RyaW5nLFxuICApIHtcbiAgICByZXR1cm4gVHguY29udHJhY3RDYWxsKFxuICAgICAgXCJzdXBwbGllci1pbnRlcmZhY2VcIixcbiAgICAgICd3aXRoZHJhdy1jb3Zlci1yZXdhcmRzJyxcbiAgICAgIFtcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbShidGNWZXJzaW9uLCBcImhleFwiKSksXG4gICAgICAgIHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20oYnRjSGFzaCwgXCJoZXhcIikpLFxuICAgICAgICB0eXBlcy51aW50KHN1cHBsaWVySWQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoY3BSZXdhcmRzKSxcbiAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxpcXVpZGl0eVZhdWx0KSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHhidGMpLFxuICAgICAgXSxcbiAgICAgIGNhbGxlclxuICAgICk7XG4gIH1cbiAgXG4gIHN0YXRpYyB3aXRoZHJhd1Jld2FyZHNYQlRDKFxuICAgIGxwVG9rZW46IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgbGlxdWlkaXR5VmF1bHQ6IHN0cmluZyxcbiAgICB4YnRjOiBzdHJpbmcsXG4gICAgY2FsbGVyOiBzdHJpbmcsXG4gICkge1xuICAgIHJldHVybiBUeC5jb250cmFjdENhbGwoXG4gICAgICBcInN1cHBsaWVyLWludGVyZmFjZVwiLFxuICAgICAgJ3dpdGhkcmF3LXJld2FyZHMteGJ0YycsXG4gICAgICBbXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChscFRva2VuKSxcbiAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxpcXVpZGl0eVZhdWx0KSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHhidGMpLFxuICAgICAgXSxcbiAgICAgIGNhbGxlclxuICAgICk7XG4gIH1cbiAgXG4gIHN0YXRpYyB3aXRoZHJhd0NvdmVyUmV3YXJkc1hCVEMoXG4gICAgY3BSZXdhcmRzOiBzdHJpbmcsXG4gICAgdG9rZW5JZDogbnVtYmVyLFxuICAgIGxpcXVpZGl0eVZhdWx0OiBzdHJpbmcsXG4gICAgeGJ0Yzogc3RyaW5nLFxuICAgIGNhbGxlcjogc3RyaW5nLFxuICApIHtcbiAgICByZXR1cm4gVHguY29udHJhY3RDYWxsKFxuICAgICAgXCJzdXBwbGllci1pbnRlcmZhY2VcIixcbiAgICAgICd3aXRoZHJhdy1jb3Zlci1yZXdhcmRzLXhidGMnLFxuICAgICAgW1xuICAgICAgICB0eXBlcy5wcmluY2lwYWwoY3BSZXdhcmRzKSxcbiAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxpcXVpZGl0eVZhdWx0KSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHhidGMpLFxuICAgICAgXSxcbiAgICAgIGNhbGxlclxuICAgICk7XG4gIH1cbiAgc3RhdGljIGRyYXdkb3duVmVyaWZ5KFxuICAgIGxvYW5JZDogbnVtYmVyLFxuICAgIGxwVG9rZW46IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgY29sbFRva2VuOiBzdHJpbmcsXG4gICAgY29sbFZhdWx0OiBzdHJpbmcsXG4gICAgZnVuZGluZ1ZhdWx0OiBzdHJpbmcsXG4gICAgYnRjVmVyc2lvbjogc3RyaW5nLFxuICAgIGJ0Y0hhc2g6IHN0cmluZyxcbiAgICBzdXBwbGllcklkOiBudW1iZXIsXG4gICAgc3dhcFJvdXRlcjogc3RyaW5nLFxuICAgIHhidGM6IHN0cmluZyxcbiAgICBjYWxsZXI6IHN0cmluZ1xuICApIHtcbiAgICByZXR1cm4gVHguY29udHJhY3RDYWxsKFxuICAgICAgXCJzdXBwbGllci1pbnRlcmZhY2VcIixcbiAgICAgICdkcmF3ZG93bi12ZXJpZnknLFxuICAgICAgW1xuICAgICAgICB0eXBlcy51aW50KGxvYW5JZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChscFRva2VuKSxcbiAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNvbGxUb2tlbiksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChjb2xsVmF1bHQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoZnVuZGluZ1ZhdWx0KSxcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbShidGNWZXJzaW9uLCBcImhleFwiKSksXG4gICAgICAgIHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20oYnRjSGFzaCwgXCJoZXhcIikpLFxuICAgICAgICB0eXBlcy51aW50KHN1cHBsaWVySWQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoc3dhcFJvdXRlciksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbCh4YnRjKSxcbiAgICAgIF0sXG4gICAgICBjYWxsZXJcbiAgICApO1xuICB9XG5cbiAgc3RhdGljIGRyYXdkb3duKFxuICAgIGxvYW5JZDogbnVtYmVyLFxuICAgIGxwVG9rZW46IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgY29sbFRva2VuOiBzdHJpbmcsXG4gICAgY29sbFZhdWx0OiBzdHJpbmcsXG4gICAgZnVuZGluZ1ZhdWx0OiBzdHJpbmcsXG4gICAgYnRjVmVyc2lvbjogc3RyaW5nLFxuICAgIGJ0Y0hhc2g6IHN0cmluZyxcbiAgICBzdXBwbGllcklkOiBudW1iZXIsXG4gICAgc3dhcFJvdXRlcjogc3RyaW5nLFxuICAgIHhidGM6IHN0cmluZyxcbiAgICBjYWxsZXI6IHN0cmluZ1xuICApIHtcbiAgICByZXR1cm4gVHguY29udHJhY3RDYWxsKFxuICAgICAgXCJzdXBwbGllci1pbnRlcmZhY2VcIixcbiAgICAgICdkcmF3ZG93bicsXG4gICAgICBbXG4gICAgICAgIHR5cGVzLnVpbnQobG9hbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxwVG9rZW4pLFxuICAgICAgICB0eXBlcy51aW50KHRva2VuSWQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoY29sbFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNvbGxWYXVsdCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChmdW5kaW5nVmF1bHQpLFxuICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKGJ0Y1ZlcnNpb24sIFwiaGV4XCIpKSxcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbShidGNIYXNoLCBcImhleFwiKSksXG4gICAgICAgIHR5cGVzLnVpbnQoc3VwcGxpZXJJZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChzd2FwUm91dGVyKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHhidGMpLFxuICAgICAgXSxcbiAgICAgIGNhbGxlclxuICAgICk7XG4gIH1cblxuICBzdGF0aWMgY29tcGxldGVSb2xsb3ZlcihcbiAgICBsb2FuSWQ6IG51bWJlcixcbiAgICBscFRva2VuOiBzdHJpbmcsXG4gICAgdG9rZW5JZDogbnVtYmVyLFxuICAgIGNvbGxUb2tlbjogc3RyaW5nLFxuICAgIGNvbGxWYXVsdDogc3RyaW5nLFxuICAgIGZ1bmRpbmdWYXVsdDogc3RyaW5nLFxuICAgIGJ0Y1ZlcnNpb246IHN0cmluZyxcbiAgICBidGNIYXNoOiBzdHJpbmcsXG4gICAgc3VwcGxpZXJJZDogbnVtYmVyLFxuICAgIHN3YXBSb3V0ZXI6IHN0cmluZyxcbiAgICB4YnRjOiBzdHJpbmcsXG4gICAgY2FsbGVyOiBzdHJpbmdcbiAgKSB7XG4gICAgcmV0dXJuIFR4LmNvbnRyYWN0Q2FsbChcbiAgICAgIFwic3VwcGxpZXItaW50ZXJmYWNlXCIsXG4gICAgICAnY29tcGxldGUtcm9sbG92ZXInLFxuICAgICAgW1xuICAgICAgICB0eXBlcy51aW50KGxvYW5JZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChscFRva2VuKSxcbiAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNvbGxUb2tlbiksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChjb2xsVmF1bHQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoZnVuZGluZ1ZhdWx0KSxcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbShidGNWZXJzaW9uLCBcImhleFwiKSksXG4gICAgICAgIHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20oYnRjSGFzaCwgXCJoZXhcIikpLFxuICAgICAgICB0eXBlcy51aW50KHN1cHBsaWVySWQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoc3dhcFJvdXRlciksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbCh4YnRjKSxcbiAgICAgIF0sXG4gICAgICBjYWxsZXJcbiAgICApO1xuICB9XG5cbiAgc3RhdGljIGZpbmFsaXplUm9sbG92ZXIoXG4gICAgbG9hbklkOiBudW1iZXIsXG4gICAgbHBUb2tlbjogc3RyaW5nLFxuICAgIHRva2VuSWQ6IG51bWJlcixcbiAgICBjb2xsVG9rZW46IHN0cmluZyxcbiAgICBjb2xsVmF1bHQ6IHN0cmluZyxcbiAgICBmdjogc3RyaW5nLFxuICAgIHhidGNGdDogc3RyaW5nLFxuICAgIGJsb2NrOiB7IGhlYWRlcjogc3RyaW5nLCBoZWlnaHQ6IG51bWJlciB9LFxuICAgIHByZXZCbG9ja3M6IHN0cmluZ1tdLFxuICAgIHR4OiBzdHJpbmcsXG4gICAgcHJvb2Y6IHsgXCJ0eC1pbmRleFwiOiBudW1iZXIsIFwiaGFzaGVzXCI6IHN0cmluZ1tdLCBcInRyZWUtZGVwdGhcIjogbnVtYmVyIH0sXG4gICAgb3V0cHV0SW5kZXg6IG51bWJlcixcbiAgICBzd2FwSWQ6IG51bWJlcixcbiAgICBjYWxsZXI6IHN0cmluZ1xuICApIHtcbiAgICByZXR1cm4gVHguY29udHJhY3RDYWxsKFxuICAgICAgXCJzdXBwbGllci1pbnRlcmZhY2VcIixcbiAgICAgICdmaW5hbGl6ZS1yb2xsb3ZlcicsXG4gICAgICBbXG4gICAgICAgIHR5cGVzLnVpbnQobG9hbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxwVG9rZW4pLFxuICAgICAgICB0eXBlcy51aW50KHRva2VuSWQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoY29sbFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNvbGxWYXVsdCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChmdiksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbCh4YnRjRnQpLFxuICAgICAgICB0eXBlcy50dXBsZSh7XG4gICAgICAgICAgaGVhZGVyOiB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKGJsb2NrLmhlYWRlciwgXCJoZXhcIikpLFxuICAgICAgICAgIGhlaWdodDogdHlwZXMudWludChibG9jay5oZWlnaHQpXG4gICAgICAgIH0pLFxuICAgICAgICB0eXBlcy5saXN0KHByZXZCbG9ja3MubWFwKCh2YWwpID0+IHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20odmFsLCBcImhleFwiKSkpKSxcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbSh0eCwgXCJoZXhcIikpLFxuICAgICAgICB0eXBlcy50dXBsZSh7XG4gICAgICAgICAgXCJ0eC1pbmRleFwiOiB0eXBlcy51aW50KHByb29mWyd0eC1pbmRleCddKSxcbiAgICAgICAgICBcImhhc2hlc1wiOiB0eXBlcy5saXN0KHByb29mLmhhc2hlcy5tYXAodmFsID0+IHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20odmFsLCBcImhleFwiKSkpKSxcbiAgICAgICAgICBcInRyZWUtZGVwdGhcIjogdHlwZXMudWludChwcm9vZlsndHJlZS1kZXB0aCddKVxuICAgICAgICB9KSxcbiAgICAgICAgdHlwZXMudWludChvdXRwdXRJbmRleCksXG4gICAgICAgIHR5cGVzLnVpbnQoc3dhcElkKSxcbiAgICAgIF0sXG4gICAgICBjYWxsZXJcbiAgICApO1xuICB9XG5cbiAgc3RhdGljIGZpbmFsaXplRHJhd2Rvd24oXG4gICAgbG9hbklkOiBudW1iZXIsXG4gICAgbHBUb2tlbjogc3RyaW5nLFxuICAgIHRva2VuSWQ6IG51bWJlcixcbiAgICBjb2xsVG9rZW46IHN0cmluZyxcbiAgICBjb2xsVmF1bHQ6IHN0cmluZyxcbiAgICBmdjogc3RyaW5nLFxuICAgIHhidGNGdDogc3RyaW5nLFxuICAgIGJsb2NrOiB7IGhlYWRlcjogc3RyaW5nLCBoZWlnaHQ6IG51bWJlciB9LFxuICAgIHByZXZCbG9ja3M6IHN0cmluZ1tdLFxuICAgIHR4OiBzdHJpbmcsXG4gICAgcHJvb2Y6IHsgXCJ0eC1pbmRleFwiOiBudW1iZXIsIFwiaGFzaGVzXCI6IHN0cmluZ1tdLCBcInRyZWUtZGVwdGhcIjogbnVtYmVyIH0sXG4gICAgb3V0cHV0SW5kZXg6IG51bWJlcixcbiAgICBzd2FwSWQ6IG51bWJlcixcbiAgICBjYWxsZXI6IHN0cmluZ1xuICApIHtcbiAgICByZXR1cm4gVHguY29udHJhY3RDYWxsKFxuICAgICAgXCJzdXBwbGllci1pbnRlcmZhY2VcIixcbiAgICAgICdmaW5hbGl6ZS1kcmF3ZG93bicsXG4gICAgICBbXG4gICAgICAgIHR5cGVzLnVpbnQobG9hbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxwVG9rZW4pLFxuICAgICAgICB0eXBlcy51aW50KHRva2VuSWQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoY29sbFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNvbGxWYXVsdCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChmdiksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbCh4YnRjRnQpLFxuICAgICAgICB0eXBlcy50dXBsZSh7XG4gICAgICAgICAgaGVhZGVyOiB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKGJsb2NrLmhlYWRlciwgXCJoZXhcIikpLFxuICAgICAgICAgIGhlaWdodDogdHlwZXMudWludChibG9jay5oZWlnaHQpXG4gICAgICAgIH0pLFxuICAgICAgICB0eXBlcy5saXN0KHByZXZCbG9ja3MubWFwKCh2YWwpID0+IHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20odmFsLCBcImhleFwiKSkpKSxcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbSh0eCwgXCJoZXhcIikpLFxuICAgICAgICB0eXBlcy50dXBsZSh7XG4gICAgICAgICAgXCJ0eC1pbmRleFwiOiB0eXBlcy51aW50KHByb29mWyd0eC1pbmRleCddKSxcbiAgICAgICAgICBcImhhc2hlc1wiOiB0eXBlcy5saXN0KHByb29mLmhhc2hlcy5tYXAodmFsID0+IHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20odmFsLCBcImhleFwiKSkpKSxcbiAgICAgICAgICBcInRyZWUtZGVwdGhcIjogdHlwZXMudWludChwcm9vZlsndHJlZS1kZXB0aCddKVxuICAgICAgICB9KSxcbiAgICAgICAgdHlwZXMudWludChvdXRwdXRJbmRleCksXG4gICAgICAgIHR5cGVzLnVpbnQoc3dhcElkKSxcbiAgICAgIF0sXG4gICAgICBjYWxsZXJcbiAgICApO1xuICB9XG5cbiAgc3RhdGljIGRyYXdkb3duWEJUQyhcbiAgICBsb2FuSWQ6IG51bWJlcixcbiAgICBscFRva2VuOiBzdHJpbmcsXG4gICAgdG9rZW5JZDogbnVtYmVyLFxuICAgIGNvbGxUb2tlbjogc3RyaW5nLFxuICAgIGNvbGxWYXVsdDogc3RyaW5nLFxuICAgIGZ1bmRpbmdWYXVsdDogc3RyaW5nLFxuICAgIHN3YXBSb3V0ZXI6IHN0cmluZyxcbiAgICB4YnRjOiBzdHJpbmcsXG4gICAgY2FsbGVyOiBzdHJpbmdcbiAgKSB7XG4gICAgcmV0dXJuIFR4LmNvbnRyYWN0Q2FsbChcbiAgICAgIFwic3VwcGxpZXItaW50ZXJmYWNlXCIsXG4gICAgICAnZHJhd2Rvd24teGJ0YycsXG4gICAgICBbXG4gICAgICAgIHR5cGVzLnVpbnQobG9hbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxwVG9rZW4pLFxuICAgICAgICB0eXBlcy51aW50KHRva2VuSWQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoY29sbFRva2VuKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNvbGxWYXVsdCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChmdW5kaW5nVmF1bHQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoc3dhcFJvdXRlciksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbCh4YnRjKSxcbiAgICAgIF0sXG4gICAgICBjYWxsZXJcbiAgICApO1xuICB9XG4gIFxuICBzdGF0aWMgY2FuY2VsRHJhd2Rvd24oXG4gICAgbG9hbklkOiBudW1iZXIsXG4gICAgbHBUb2tlbjogc3RyaW5nLFxuICAgIHRva2VuSWQ6IG51bWJlcixcbiAgICBjb2xsVG9rZW46IHN0cmluZyxcbiAgICBjb2xsVmF1bHQ6IHN0cmluZyxcbiAgICBmdW5kaW5nVmF1bHQ6IHN0cmluZyxcbiAgICB4YnRjOiBzdHJpbmcsXG4gICAgc3dhcElkOiBudW1iZXIsXG4gICAgY2FsbGVyOiBzdHJpbmdcbiAgKSB7XG4gICAgcmV0dXJuIFR4LmNvbnRyYWN0Q2FsbChcbiAgICAgIFwic3VwcGxpZXItaW50ZXJmYWNlXCIsXG4gICAgICAnY2FuY2VsLWRyYXdkb3duJyxcbiAgICAgIFtcbiAgICAgICAgdHlwZXMudWludChsb2FuSWQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwobHBUb2tlbiksXG4gICAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChjb2xsVG9rZW4pLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoY29sbFZhdWx0KSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGZ1bmRpbmdWYXVsdCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbCh4YnRjKSxcbiAgICAgICAgdHlwZXMudWludChzd2FwSWQpLFxuICAgICAgXSxcbiAgICAgIGNhbGxlclxuICAgICk7XG4gIH1cbiAgXG4gIHN0YXRpYyBjYW5jZWxSb2xsb3ZlcihcbiAgICBsb2FuSWQ6IG51bWJlcixcbiAgICBscFRva2VuOiBzdHJpbmcsXG4gICAgdG9rZW5JZDogbnVtYmVyLFxuICAgIGNvbGxUb2tlbjogc3RyaW5nLFxuICAgIGNvbGxWYXVsdDogc3RyaW5nLFxuICAgIGZ1bmRpbmdWYXVsdDogc3RyaW5nLFxuICAgIHhidGM6IHN0cmluZyxcbiAgICBzd2FwSWQ6IG51bWJlcixcbiAgICBjYWxsZXI6IHN0cmluZ1xuICApIHtcbiAgICByZXR1cm4gVHguY29udHJhY3RDYWxsKFxuICAgICAgXCJzdXBwbGllci1pbnRlcmZhY2VcIixcbiAgICAgICdjYW5jZWwtcm9sbG92ZXInLFxuICAgICAgW1xuICAgICAgICB0eXBlcy51aW50KGxvYW5JZCksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChscFRva2VuKSxcbiAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNvbGxUb2tlbiksXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChjb2xsVmF1bHQpLFxuICAgICAgICB0eXBlcy5wcmluY2lwYWwoZnVuZGluZ1ZhdWx0KSxcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKHhidGMpLFxuICAgICAgICB0eXBlcy51aW50KHN3YXBJZCksXG4gICAgICBdLFxuICAgICAgY2FsbGVyXG4gICAgKTtcbiAgfVxuXG4gIHN0YXRpYyBmaW5hbGl6ZU91dGJvdW5kKFxuICAgIGJsb2NrOiB7IGhlYWRlcjogc3RyaW5nLCBoZWlnaHQ6IG51bWJlciB9LFxuICAgIHByZXZCbG9ja3M6IHN0cmluZ1tdLFxuICAgIHR4OiBzdHJpbmcsXG4gICAgcHJvb2Y6IHsgXCJ0eC1pbmRleFwiOiBudW1iZXIsIFwiaGFzaGVzXCI6IHN0cmluZ1tdLCBcInRyZWUtZGVwdGhcIjogbnVtYmVyIH0sXG4gICAgb3V0cHV0SW5kZXg6IG51bWJlcixcbiAgICBzd2FwSWQ6IG51bWJlcixcbiAgICBjYWxsZXI6IHN0cmluZ1xuICApIHtcbiAgICByZXR1cm4gVHguY29udHJhY3RDYWxsKFxuICAgICAgXCJzdXBwbGllci1pbnRlcmZhY2VcIixcbiAgICAgICdmaW5hbGl6ZS1vdXRib3VuZCcsXG4gICAgICBbXG4gICAgICAgIHR5cGVzLnR1cGxlKHtcbiAgICAgICAgICBoZWFkZXI6IHR5cGVzLmJ1ZmYoQnVmZmVyLmZyb20oYmxvY2suaGVhZGVyLCBcImhleFwiKSksXG4gICAgICAgICAgaGVpZ2h0OiB0eXBlcy51aW50KGJsb2NrLmhlaWdodClcbiAgICAgICAgfSksXG4gICAgICAgIHR5cGVzLmxpc3QocHJldkJsb2Nrcy5tYXAoKHZhbCkgPT4gdHlwZXMuYnVmZihCdWZmZXIuZnJvbSh2YWwsIFwiaGV4XCIpKSkpLFxuICAgICAgICB0eXBlcy5idWZmKEJ1ZmZlci5mcm9tKHR4LCBcImhleFwiKSksXG4gICAgICAgIHR5cGVzLnR1cGxlKHtcbiAgICAgICAgICBcInR4LWluZGV4XCI6IHR5cGVzLnVpbnQocHJvb2ZbJ3R4LWluZGV4J10pLFxuICAgICAgICAgIFwiaGFzaGVzXCI6IHR5cGVzLmxpc3QocHJvb2YuaGFzaGVzLm1hcCh2YWwgPT4gdHlwZXMuYnVmZihCdWZmZXIuZnJvbSh2YWwsIFwiaGV4XCIpKSkpLFxuICAgICAgICAgIFwidHJlZS1kZXB0aFwiOiB0eXBlcy51aW50KHByb29mWyd0cmVlLWRlcHRoJ10pXG4gICAgICAgIH0pLFxuICAgICAgICB0eXBlcy51aW50KG91dHB1dEluZGV4KSxcbiAgICAgICAgdHlwZXMudWludChzd2FwSWQpLFxuICAgICAgXSxcbiAgICAgIGNhbGxlclxuICAgICk7XG4gIH1cblxuICBzdGF0aWMgcmVnaXN0ZXJTdXBwbGllcihcbiAgICBwdWJsaWNLZXk6IHN0cmluZyxcbiAgICBpbmJvdW5kRmVlOiBudW1iZXIsXG4gICAgb3V0Ym91bmRGZWU6IG51bWJlcixcbiAgICBvdXRib3VuZEJhc2VGZWU6IG51bWJlcixcbiAgICBpbmJvdW5kQmFzZUZlZTogbnVtYmVyLFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBmdW5kczogbnVtYmVyLFxuICAgIGNhbGxlcjogc3RyaW5nXG4gICkge1xuICAgIHJldHVybiBUeC5jb250cmFjdENhbGwoXG4gICAgICBcInN1cHBsaWVyLWludGVyZmFjZVwiLFxuICAgICAgJ3JlZ2lzdGVyLXN1cHBsaWVyJyxcbiAgICAgIFtcbiAgICAgICAgdHlwZXMuYnVmZihCdWZmZXIuZnJvbShwdWJsaWNLZXksIFwiaGV4XCIpKSxcbiAgICAgICAgdHlwZXMuc29tZSh0eXBlcy5pbnQoaW5ib3VuZEZlZSkpLFxuICAgICAgICB0eXBlcy5zb21lKHR5cGVzLmludChvdXRib3VuZEZlZSkpLFxuICAgICAgICB0eXBlcy5pbnQob3V0Ym91bmRCYXNlRmVlKSxcbiAgICAgICAgdHlwZXMuaW50KGluYm91bmRCYXNlRmVlKSxcbiAgICAgICAgdHlwZXMuYXNjaWkobmFtZSksXG4gICAgICAgIHR5cGVzLnVpbnQoZnVuZHMpLFxuICAgICAgXSxcbiAgICAgIGNhbGxlcik7XG4gIH1cblxuICBzdGF0aWMgdXBkYXRlTGlxdWlkaXR5KFxuICAgIGhlaWdodDogbnVtYmVyLFxuICAgIGxpcXVpZGl0eTogbnVtYmVyLFxuICAgIGNhbGxlcjogc3RyaW5nXG4gICkge1xuICAgIHJldHVybiBUeC5jb250cmFjdENhbGwoXG4gICAgICBcInN1cHBsaWVyLWludGVyZmFjZVwiLFxuICAgICAgJ3VwZGF0ZS1saXF1aWRpdHknLFxuICAgICAgW1xuICAgICAgICB0eXBlcy51aW50KGhlaWdodCksXG4gICAgICAgIHR5cGVzLnVpbnQobGlxdWlkaXR5KSxcbiAgICAgIF0sXG4gICAgICBjYWxsZXIpO1xuICB9XG5cbiAgc3RhdGljIGdldEN1cnJlbnRMaXF1aWRpdHkoY2hhaW46IENoYWluLCBjYWxsZXI6IHN0cmluZykge1xuICAgIHJldHVybiBjaGFpbi5jYWxsUmVhZE9ubHlGbihgc3VwcGxpZXItaW50ZXJmYWNlYCwgXCJnZXQtY3VycmVudC1saXF1aWRpdHlcIiwgWyBdLCBjYWxsZXIpLnJlc3VsdDtcbiAgfVxuXG4gIHN0YXRpYyBnZXRPdXRib3VuZFN3YXAoY2hhaW46IENoYWluLCBzd2FwSWQ6IG51bWJlciwgY2FsbGVyOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gY2hhaW4uY2FsbFJlYWRPbmx5Rm4oYG1hZ2ljLXByb3RvY29sYCwgXCJnZXQtb3V0Ym91bmQtc3dhcFwiLCBbIHR5cGVzLnVpbnQoc3dhcElkKSBdLCBjYWxsZXIpLnJlc3VsdDtcbiAgfVxuXG5cblxufVxuXG5leHBvcnQgeyBTdXBwbGllckludGVyZmFjZSB9OyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLEVBQUUsRUFBa0IsS0FBSyxRQUFRLDhDQUE4QyxDQUFDO0FBQ3pGLFNBQVMsTUFBTSxRQUFRLDhDQUE4QyxDQUFDO0FBRXRFLE1BQU0saUJBQWlCO0lBQ3JCLE9BQU8sU0FBUyxDQUNkLEtBQXlDLEVBQ3pDLFVBQW9CLEVBQ3BCLEVBQVUs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