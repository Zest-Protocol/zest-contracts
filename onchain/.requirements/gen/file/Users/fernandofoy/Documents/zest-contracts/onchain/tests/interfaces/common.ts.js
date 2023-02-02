import { Tx, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { SupplierInterface } from '../interfaces/supplier_interface.ts';
import { TestUtils } from '../interfaces/test-utils.ts';
import { getHash, getTxId, generateP2SHTx, generateP2PKHTx, getExpiration, swapperBuff } from "../supplier-interface/util.ts";
function setContractOwner(chain, contract, newOwner, deployer) {
    return chain.mineBlock([
        Tx.contractCall(`${deployer.address}.${contract}`, 'set-contract-owner', [
            types.principal(`${deployer.address}.${newOwner}`)
        ], deployer.address)
    ]);
}
function addBorrower(chain, borrower, deployer) {
    return chain.mineBlock([
        Tx.contractCall(`${deployer.address}.loan-v1-0`, 'add-borrower', [
            types.principal(borrower.address), 
        ], deployer.address)
    ]);
}
function addApprovedContract(chain, contract, newContract, deployer) {
    return chain.mineBlock([
        Tx.contractCall(`${deployer.address}.${contract}`, 'add-contract', [
            types.principal(`${deployer.address}.${newContract}`), 
        ], deployer.address)
    ]);
}
function setPoolContract(chain, contract, newContract, deployer) {
    return chain.mineBlock([
        Tx.contractCall(`${deployer.address}.${contract}`, 'set-pool-contract', [
            types.principal(`${deployer.address}.${newContract}`), 
        ], deployer.address)
    ]);
}
function getBP(amount, bps) {
    return Math.floor(bps * amount / 10_000);
}
function initContractOwners(chain, deployer) {
    return chain.mineBlock([
        Tx.contractCall(`${deployer.address}.funding-vault`, 'set-contract-owner', [
            types.principal(`${deployer.address}.loan-v1-0`)
        ], deployer.address),
        // Tx.contractCall(
        //   `${deployer.address}.coll-vault`,
        //   'set-loan-contract',
        //   [
        //     types.principal(`${deployer.address}.loan-v1-0`)
        //   ],
        //   deployer.address
        // ),
        Tx.contractCall(`${deployer.address}.loan-v1-0`, 'set-pool-contract', [
            types.principal(`${deployer.address}.pool-v1-0`)
        ], deployer.address), 
    ]);
}
function runBootstrap(chain, deployer) {
    return chain.mineBlock([
        Tx.contractCall(`${deployer.address}.executor-dao`, 'construct', [
            types.principal(`${deployer.address}.zgp000-bootstrap`)
        ], deployer.address), 
    ]);
}
function registerSupplierTxs(deployer, supplierAddress, recipient, inboundFee, outboundFee, outboundBaseFee, inboundBaseFee, name, funds) {
    return [
        Tx.contractCall("Wrapped-Bitcoin", "transfer", [
            types.uint(funds),
            types.principal(supplierAddress),
            types.principal(`${deployer}.supplier-interface`),
            types.none(), 
        ], supplierAddress),
        SupplierInterface.registerSupplier(recipient, inboundFee, outboundFee, outboundBaseFee, inboundBaseFee, name, funds, deployer), 
    ];
}
function sendFundsP2SHTxs(deployer, tokenId, stxSender, sender, recipient, expiration, swapperId, outputValue, preimage, supplierId, minToReceive, factor, height) {
    let hash = getHash(preimage);
    let tx1 = generateP2SHTx(sender, recipient, expiration, hash, swapperId, outputValue);
    let txid1 = getTxId(tx1);
    return [
        TestUtils.setMinedTx(txid1, deployer),
        SupplierInterface.sendFunds({
            header: "",
            height
        }, [], tx1, {
            "tx-index": 0,
            "hashes": [],
            "tree-depth": 0
        }, 0, sender, recipient, getExpiration(expiration), hash, swapperBuff(swapperId), supplierId, minToReceive, stxSender),
        SupplierInterface.sendFundsFinalize(txid1, preimage, factor, `${deployer}.lp-token`, tokenId, `${deployer}.zest-reward-dist`, `${deployer}.liquidity-vault-v1-0`, `${deployer}.Wrapped-Bitcoin`, `${deployer}.rewards-calc`, stxSender)
    ];
}
function sendFundsP2SHTxsWrap(deployer, tokenId, stxSender, sender, recipient, expiration, swapperId, outputValue, preimage, supplierId, minToReceive, factor, height) {
    let hash = getHash(preimage);
    let tx1 = generateP2SHTx(sender, recipient, expiration, hash, swapperId, outputValue);
    let txid1 = getTxId(tx1);
    return [
        TestUtils.setMinedTx(txid1, deployer),
        SupplierInterface.sendFundsWrap({
            header: "",
            height
        }, [], tx1, {
            "tx-index": 0,
            "hashes": [],
            "tree-depth": 0
        }, 0, sender, recipient, getExpiration(expiration), hash, swapperBuff(swapperId), supplierId, minToReceive, preimage, factor, `${deployer}.lp-token`, tokenId, `${deployer}.zest-reward-dist`, `${deployer}.liquidity-vault-v1-0`, `${deployer}.Wrapped-Bitcoin`, `${deployer}.rewards-calc`, stxSender)
    ];
}
function makePaymentTxs(deployer, stxSender, sender, recipient, expiration, swapperId, outputValue, preimage, supplierId, minToReceive, loanId, payment, lpToken, lv, tokenId, cpToken, cpRewards, zpToken, swapRouter, height, xbtc) {
    const hash = getHash(preimage);
    const tx1 = generateP2SHTx(sender, recipient, expiration, hash, swapperId, outputValue);
    const txid1 = getTxId(tx1);
    return [
        TestUtils.setMinedTx(txid1, deployer),
        // 1. Send Bitcoin to supplier address.
        // 2. Liquidity Provider sends Stacks Transaction to confirm Bitcoin transaction happened.
        SupplierInterface.sendFunds({
            header: "",
            height
        }, [], tx1, {
            "tx-index": 0,
            "hashes": [],
            "tree-depth": 0
        }, 0, sender, recipient, getExpiration(expiration), hash, swapperBuff(swapperId), supplierId, minToReceive, stxSender),
        // 3. Liquidity Provider send Stacks transaction to send funds to pool
        SupplierInterface.makePayment(txid1, preimage, loanId, payment, lpToken, lv, tokenId, cpToken, cpRewards, zpToken, swapRouter, xbtc, stxSender)
    ];
}
function makePaymentVerifyTxs(deployer, stxSender, sender, recipient, expiration, swapperId, outputValue, preimage, supplierId, minToReceive, loanId, payment, lpToken, lv, tokenId, cpToken, cpRewards, zpToken, swapRouter, height, xbtc) {
    const hash = getHash(preimage);
    const tx1 = generateP2SHTx(sender, recipient, expiration, hash, swapperId, outputValue);
    const txid1 = getTxId(tx1);
    return [
        TestUtils.setMinedTx(txid1, deployer),
        // 1. Send Bitcoin to supplier address.
        // 2. Liquidity Provider sends Stacks Transaction to confirm Bitcoin transaction happened.
        SupplierInterface.sendFunds({
            header: "",
            height
        }, [], tx1, {
            "tx-index": 0,
            "hashes": [],
            "tree-depth": 0
        }, 0, sender, recipient, getExpiration(expiration), hash, swapperBuff(swapperId), supplierId, minToReceive, stxSender),
        // 3. Liquidity Provider send Stacks transaction to send funds to pool
        SupplierInterface.makePaymentVerify(txid1, preimage, loanId, payment, lpToken, lv, tokenId, cpToken, cpRewards, zpToken, swapRouter, xbtc, stxSender)
    ];
}
function makeFullPaymentTxs(deployer, stxSender, sender, recipient, expiration, swapperId, outputValue, preimage, supplierId, minToReceive, loanId, payment, lpToken, lv, tokenId, cpToken, cpRewards, zpToken, swapRouter, height, xbtc) {
    const hash = getHash(preimage);
    const tx1 = generateP2SHTx(sender, recipient, expiration, hash, swapperId, outputValue);
    const txid1 = getTxId(tx1);
    return [
        TestUtils.setMinedTx(txid1, deployer),
        // 1. Send Bitcoin to supplier address.
        // 2. Liquidity Provider sends Stacks Transaction to confirm Bitcoin transaction happened.
        SupplierInterface.sendFunds({
            header: "",
            height
        }, [], tx1, {
            "tx-index": 0,
            "hashes": [],
            "tree-depth": 0
        }, 0, sender, recipient, getExpiration(expiration), hash, swapperBuff(swapperId), supplierId, minToReceive, stxSender),
        // 3. Liquidity Provider send Stacks transaction to send funds to pool
        SupplierInterface.makeFullPayment(txid1, preimage, loanId, payment, lpToken, lv, tokenId, cpToken, cpRewards, zpToken, swapRouter, xbtc, stxSender)
    ];
}
function makeResidualPayment(deployer, stxSender, sender, recipient, expiration, swapperId, outputValue, preimage, supplierId, minToReceive, loanId, // payment: string,
lpToken, lv, tokenId, // cpToken: string,
// cpRewards: string,
// zpToken: string,
// swapRouter: string,
height, xbtc) {
    const hash = getHash(preimage);
    const tx1 = generateP2SHTx(sender, recipient, expiration, hash, swapperId, outputValue);
    const txid1 = getTxId(tx1);
    return [
        TestUtils.setMinedTx(txid1, deployer),
        // 1. Send Bitcoin to supplier address.
        // 2. Liquidity Provider sends Stacks Transaction to confirm Bitcoin transaction happened.
        SupplierInterface.sendFunds({
            header: "",
            height
        }, [], tx1, {
            "tx-index": 0,
            "hashes": [],
            "tree-depth": 0
        }, 0, sender, recipient, getExpiration(expiration), hash, swapperBuff(swapperId), supplierId, minToReceive, stxSender),
        // 3. Liquidity Provider send Stacks transaction to send funds to pool
        SupplierInterface.makeResidualPayment(txid1, preimage, loanId, lpToken, lv, tokenId, xbtc, stxSender)
    ];
}
function finalizeOutboundTxs(pubkeyHash, outputValue, swapId, height, stxSender, deployer) {
    let tx1 = generateP2PKHTx(pubkeyHash, outputValue);
    let txid1 = getTxId(tx1);
    return [
        TestUtils.setMinedTx(txid1, deployer),
        SupplierInterface.finalizeOutbound({
            header: "",
            height
        }, [], tx1, {
            "tx-index": 0,
            "hashes": [],
            "tree-depth": 0
        }, 0, swapId, stxSender)
    ];
}
function finalizeDrawdown(loanId, lpToken, tokenId, collToken, collVault, fv, xbtcFt, pubkeyHash, outputValue, swapId, height, stxSender, deployer) {
    let tx1 = generateP2PKHTx(pubkeyHash, outputValue);
    let txid1 = getTxId(tx1);
    return [
        TestUtils.setMinedTx(txid1, deployer),
        SupplierInterface.finalizeDrawdown(loanId, lpToken, tokenId, collToken, collVault, fv, xbtcFt, {
            header: "",
            height
        }, [], tx1, {
            "tx-index": 0,
            "hashes": [],
            "tree-depth": 0
        }, 0, swapId, stxSender)
    ];
}
function finalizeRollover(loanId, lpToken, tokenId, collToken, collVault, fv, xbtcFt, pubkeyHash, outputValue, swapId, height, stxSender, deployer) {
    let tx1 = generateP2PKHTx(pubkeyHash, outputValue);
    let txid1 = getTxId(tx1);
    return [
        TestUtils.setMinedTx(txid1, deployer),
        SupplierInterface.finalizeRollover(loanId, lpToken, tokenId, collToken, collVault, fv, xbtcFt, {
            header: "",
            height
        }, [], tx1, {
            "tx-index": 0,
            "hashes": [],
            "tree-depth": 0
        }, 0, swapId, stxSender)
    ];
}
function bootstrapApprovedContracts(chain, deployer) {
    addApprovedContract(chain, "zest-reward-dist", "loan-v1-0", deployer);
    addApprovedContract(chain, "zest-reward-dist", "pool-v1-0", deployer);
    addApprovedContract(chain, "zest-reward-dist", "payment-fixed", deployer);
    addApprovedContract(chain, "lp-token", "loan-v1-0", deployer);
    addApprovedContract(chain, "lp-token", "pool-v1-0", deployer);
    addApprovedContract(chain, "lp-token", "payment-fixed", deployer);
    addApprovedContract(chain, "lp-token", "supplier-interface", deployer);
    addApprovedContract(chain, "payment-fixed", "loan-v1-0", deployer);
    addApprovedContract(chain, "liquidity-vault-v1-0", "lp-token", deployer);
    addApprovedContract(chain, "liquidity-vault-v1-0", "pool-v1-0", deployer);
    addApprovedContract(chain, "cp-token", "payment-fixed", deployer);
    addApprovedContract(chain, "cp-token", "pool-v1-0", deployer);
    addApprovedContract(chain, "cp-token", "staking-pool-v1-0", deployer);
    addApprovedContract(chain, "rewards-calc", "pool-v1-0", deployer);
    addApprovedContract(chain, "rewards-calc", "cover-pool-v1-0", deployer);
    addApprovedContract(chain, "funding-vault", "loan-v1-0", deployer);
    addApprovedContract(chain, "coll-vault", "loan-v1-0", deployer);
    setPoolContract(chain, "loan-v1-0", "pool-v1-0", deployer);
    setPoolContract(chain, "cover-pool-v1-0", "pool-v1-0", deployer);
}
function consumeUint(uint) {
    return Number(uint.replace("u", ""));
}
export { setContractOwner, initContractOwners, addBorrower, addApprovedContract, runBootstrap, bootstrapApprovedContracts, sendFundsP2SHTxs, registerSupplierTxs, setPoolContract, finalizeOutboundTxs, makePaymentTxs, consumeUint, finalizeDrawdown, finalizeRollover, getBP, sendFundsP2SHTxsWrap, makeFullPaymentTxs, makeResidualPayment, makePaymentVerifyTxs };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZmVybmFuZG9mb3kvRG9jdW1lbnRzL3plc3QtY29udHJhY3RzL29uY2hhaW4vdGVzdHMvaW50ZXJmYWNlcy9jb21tb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVHgsIENoYWluLCBBY2NvdW50LCB0eXBlcyB9IGZyb20gJ2h0dHBzOi8vZGVuby5sYW5kL3gvY2xhcmluZXRAdjEuMC4yL2luZGV4LnRzJztcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xNTkuMC9ub2RlL2J1ZmZlci50c1wiO1xuaW1wb3J0IHsgU3VwcGxpZXJJbnRlcmZhY2UgfSBmcm9tICcuLi9pbnRlcmZhY2VzL3N1cHBsaWVyX2ludGVyZmFjZS50cyc7XG5pbXBvcnQgeyBUZXN0VXRpbHMgfSBmcm9tICcuLi9pbnRlcmZhY2VzL3Rlc3QtdXRpbHMudHMnO1xuaW1wb3J0IHsgTWFnaWMgfSBmcm9tICcuLi9pbnRlcmZhY2VzL21hZ2ljX3JlYWwudHMnO1xuXG5pbXBvcnQgeyBcbiAgZ2V0SGFzaCxcbiAgZ2V0UmV2ZXJzZVR4SWQsXG4gIGdldFR4SWQsXG4gIGdlbmVyYXRlUDJTSFR4LFxuICBnZW5lcmF0ZVAyUEtIVHgsXG4gIGdldEV4cGlyYXRpb24sXG4gIHN3YXBwZXJCdWZmXG59IGZyb20gXCIuLi9zdXBwbGllci1pbnRlcmZhY2UvdXRpbC50c1wiO1xuXG5cbmZ1bmN0aW9uIHNldENvbnRyYWN0T3duZXIoY2hhaW46IENoYWluLCBjb250cmFjdDogc3RyaW5nLCBuZXdPd25lcjogc3RyaW5nLCBkZXBsb3llcjogQWNjb3VudCkge1xuICByZXR1cm4gY2hhaW4ubWluZUJsb2NrKFtcbiAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICBgJHtkZXBsb3llci5hZGRyZXNzfS4ke2NvbnRyYWN0fWAsXG4gICAgICAnc2V0LWNvbnRyYWN0LW93bmVyJyxcbiAgICAgICAgW1xuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChgJHtkZXBsb3llci5hZGRyZXNzfS4ke25ld093bmVyfWApXG4gICAgICAgIF0sXG4gICAgICAgIGRlcGxveWVyLmFkZHJlc3NcbiAgICApXG4gIF0pO1xufVxuXG5mdW5jdGlvbiBhZGRCb3Jyb3dlcihjaGFpbjogQ2hhaW4sIGJvcnJvd2VyOiBBY2NvdW50LCBkZXBsb3llcjogQWNjb3VudCkge1xuICByZXR1cm4gY2hhaW4ubWluZUJsb2NrKFtcbiAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICBgJHtkZXBsb3llci5hZGRyZXNzfS5sb2FuLXYxLTBgLFxuICAgICAgJ2FkZC1ib3Jyb3dlcicsXG4gICAgICAgIFtcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoYm9ycm93ZXIuYWRkcmVzcyksXG4gICAgICAgIF0sXG4gICAgICAgIGRlcGxveWVyLmFkZHJlc3NcbiAgICApXG4gIF0pO1xufVxuXG5mdW5jdGlvbiBhZGRBcHByb3ZlZENvbnRyYWN0KGNoYWluOiBDaGFpbiwgY29udHJhY3Q6IHN0cmluZywgbmV3Q29udHJhY3Q6IHN0cmluZywgZGVwbG95ZXI6IEFjY291bnQpIHtcbiAgcmV0dXJuIGNoYWluLm1pbmVCbG9jayhbXG4gICAgVHguY29udHJhY3RDYWxsKFxuICAgICAgYCR7ZGVwbG95ZXIuYWRkcmVzc30uJHtjb250cmFjdH1gLFxuICAgICAgJ2FkZC1jb250cmFjdCcsXG4gICAgICAgIFtcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoYCR7ZGVwbG95ZXIuYWRkcmVzc30uJHtuZXdDb250cmFjdH1gKSxcbiAgICAgICAgXSxcbiAgICAgICAgZGVwbG95ZXIuYWRkcmVzc1xuICAgIClcbiAgXSk7XG59XG5cbmZ1bmN0aW9uIHNldFBvb2xDb250cmFjdChjaGFpbjogQ2hhaW4sIGNvbnRyYWN0OiBzdHJpbmcsIG5ld0NvbnRyYWN0OiBzdHJpbmcsIGRlcGxveWVyOiBBY2NvdW50KSB7XG4gIHJldHVybiBjaGFpbi5taW5lQmxvY2soW1xuICAgIFR4LmNvbnRyYWN0Q2FsbChcbiAgICAgIGAke2RlcGxveWVyLmFkZHJlc3N9LiR7Y29udHJhY3R9YCxcbiAgICAgICdzZXQtcG9vbC1jb250cmFjdCcsXG4gICAgICBbXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChgJHtkZXBsb3llci5hZGRyZXNzfS4ke25ld0NvbnRyYWN0fWApLFxuICAgICAgXSxcbiAgICAgIGRlcGxveWVyLmFkZHJlc3NcbiAgICApXG4gIF0pO1xufVxuXG5mdW5jdGlvbiBnZXRCUChhbW91bnQ6IG51bWJlciwgYnBzOiBudW1iZXIpIHtcbiAgcmV0dXJuIE1hdGguZmxvb3IoYnBzICogYW1vdW50IC8gMTBfMDAwKTtcbn1cblxuZnVuY3Rpb24gaW5pdENvbnRyYWN0T3duZXJzKGNoYWluOiBDaGFpbiwgZGVwbG95ZXI6IEFjY291bnQpIHtcbiAgcmV0dXJuIGNoYWluLm1pbmVCbG9jayhbXG4gICAgVHguY29udHJhY3RDYWxsKFxuICAgICAgYCR7ZGVwbG95ZXIuYWRkcmVzc30uZnVuZGluZy12YXVsdGAsXG4gICAgICAnc2V0LWNvbnRyYWN0LW93bmVyJyxcbiAgICAgIFtcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGAke2RlcGxveWVyLmFkZHJlc3N9LmxvYW4tdjEtMGApXG4gICAgICBdLFxuICAgICAgZGVwbG95ZXIuYWRkcmVzc1xuICAgICksXG4gICAgLy8gVHguY29udHJhY3RDYWxsKFxuICAgIC8vICAgYCR7ZGVwbG95ZXIuYWRkcmVzc30uY29sbC12YXVsdGAsXG4gICAgLy8gICAnc2V0LWxvYW4tY29udHJhY3QnLFxuICAgIC8vICAgW1xuICAgIC8vICAgICB0eXBlcy5wcmluY2lwYWwoYCR7ZGVwbG95ZXIuYWRkcmVzc30ubG9hbi12MS0wYClcbiAgICAvLyAgIF0sXG4gICAgLy8gICBkZXBsb3llci5hZGRyZXNzXG4gICAgLy8gKSxcbiAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICBgJHtkZXBsb3llci5hZGRyZXNzfS5sb2FuLXYxLTBgLFxuICAgICAgJ3NldC1wb29sLWNvbnRyYWN0JyxcbiAgICAgIFtcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKGAke2RlcGxveWVyLmFkZHJlc3N9LnBvb2wtdjEtMGApXG4gICAgICBdLFxuICAgICAgZGVwbG95ZXIuYWRkcmVzc1xuICAgICksXG4gIF0pO1xufVxuXG5mdW5jdGlvbiBydW5Cb290c3RyYXAoY2hhaW46IENoYWluLCBkZXBsb3llcjogQWNjb3VudCkge1xuICByZXR1cm4gY2hhaW4ubWluZUJsb2NrKFtcbiAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICBgJHtkZXBsb3llci5hZGRyZXNzfS5leGVjdXRvci1kYW9gLFxuICAgICAgJ2NvbnN0cnVjdCcsXG4gICAgICBbXG4gICAgICAgIHR5cGVzLnByaW5jaXBhbChgJHtkZXBsb3llci5hZGRyZXNzfS56Z3AwMDAtYm9vdHN0cmFwYClcbiAgICAgIF0sXG4gICAgICBkZXBsb3llci5hZGRyZXNzXG4gICAgKSxcbiAgXSk7XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyU3VwcGxpZXJUeHMoXG4gIGRlcGxveWVyOiBzdHJpbmcsXG4gIHN1cHBsaWVyQWRkcmVzczogc3RyaW5nLFxuICByZWNpcGllbnQ6IHN0cmluZyxcbiAgaW5ib3VuZEZlZTogbnVtYmVyLFxuICBvdXRib3VuZEZlZTogbnVtYmVyLFxuICBvdXRib3VuZEJhc2VGZWU6IG51bWJlcixcbiAgaW5ib3VuZEJhc2VGZWU6IG51bWJlcixcbiAgbmFtZTogc3RyaW5nLFxuICBmdW5kczogbnVtYmVyLFxuICApIHtcbiAgICByZXR1cm4gW1xuICAgICAgVHguY29udHJhY3RDYWxsKFxuICAgICAgICBcIldyYXBwZWQtQml0Y29pblwiLFxuICAgICAgICBcInRyYW5zZmVyXCIsXG4gICAgICAgIFtcbiAgICAgICAgICB0eXBlcy51aW50KGZ1bmRzKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoc3VwcGxpZXJBZGRyZXNzKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoYCR7ZGVwbG95ZXJ9LnN1cHBsaWVyLWludGVyZmFjZWApLFxuICAgICAgICAgIHR5cGVzLm5vbmUoKSxcbiAgICAgICAgXSxcbiAgICAgICAgc3VwcGxpZXJBZGRyZXNzXG4gICAgICApLFxuICAgICAgU3VwcGxpZXJJbnRlcmZhY2UucmVnaXN0ZXJTdXBwbGllcihcbiAgICAgICAgcmVjaXBpZW50LFxuICAgICAgICBpbmJvdW5kRmVlLFxuICAgICAgICBvdXRib3VuZEZlZSxcbiAgICAgICAgb3V0Ym91bmRCYXNlRmVlLFxuICAgICAgICBpbmJvdW5kQmFzZUZlZSxcbiAgICAgICAgbmFtZSxcbiAgICAgICAgZnVuZHMsXG4gICAgICAgIGRlcGxveWVyXG4gICAgICApLFxuICAgIF07XG59XG5cbmZ1bmN0aW9uIHNlbmRGdW5kc1AyU0hUeHMoXG4gIGRlcGxveWVyOiBzdHJpbmcsXG4gIHRva2VuSWQ6IG51bWJlcixcbiAgc3R4U2VuZGVyOiBzdHJpbmcsXG4gIHNlbmRlcjogc3RyaW5nLFxuICByZWNpcGllbnQ6IHN0cmluZyxcbiAgZXhwaXJhdGlvbjogbnVtYmVyLFxuICBzd2FwcGVySWQ6IG51bWJlcixcbiAgb3V0cHV0VmFsdWU6IG51bWJlcixcbiAgcHJlaW1hZ2U6IHN0cmluZyxcbiAgc3VwcGxpZXJJZDogbnVtYmVyLFxuICBtaW5Ub1JlY2VpdmU6IG51bWJlcixcbiAgZmFjdG9yOiBudW1iZXIsXG4gIGhlaWdodDogbnVtYmVyXG4gICkge1xuICBsZXQgaGFzaCA9IGdldEhhc2gocHJlaW1hZ2UpO1xuICBsZXQgdHgxID0gZ2VuZXJhdGVQMlNIVHgoc2VuZGVyLCByZWNpcGllbnQsIGV4cGlyYXRpb24sIGhhc2gsIHN3YXBwZXJJZCwgb3V0cHV0VmFsdWUpO1xuICBsZXQgdHhpZDEgPSBnZXRUeElkKHR4MSk7XG4gIHJldHVybiBbXG4gICAgVGVzdFV0aWxzLnNldE1pbmVkVHgodHhpZDEsIGRlcGxveWVyKSxcbiAgICBTdXBwbGllckludGVyZmFjZS5zZW5kRnVuZHMoXG4gICAgICB7IGhlYWRlcjogXCJcIiwgaGVpZ2h0IH0sXG4gICAgICBbXSxcbiAgICAgIHR4MSxcbiAgICAgIHsgXCJ0eC1pbmRleFwiOiAwLCBcImhhc2hlc1wiOiBbXSwgXCJ0cmVlLWRlcHRoXCI6IDAgfSxcbiAgICAgIDAsXG4gICAgICBzZW5kZXIsXG4gICAgICByZWNpcGllbnQsXG4gICAgICBnZXRFeHBpcmF0aW9uKGV4cGlyYXRpb24pLFxuICAgICAgaGFzaCxcbiAgICAgIHN3YXBwZXJCdWZmKHN3YXBwZXJJZCksXG4gICAgICBzdXBwbGllcklkLFxuICAgICAgbWluVG9SZWNlaXZlLFxuICAgICAgc3R4U2VuZGVyLFxuICAgICksXG4gICAgU3VwcGxpZXJJbnRlcmZhY2Uuc2VuZEZ1bmRzRmluYWxpemUoXG4gICAgICB0eGlkMSxcbiAgICAgIHByZWltYWdlLFxuICAgICAgZmFjdG9yLFxuICAgICAgYCR7ZGVwbG95ZXJ9LmxwLXRva2VuYCxcbiAgICAgIHRva2VuSWQsXG4gICAgICBgJHtkZXBsb3llcn0uemVzdC1yZXdhcmQtZGlzdGAsXG4gICAgICBgJHtkZXBsb3llcn0ubGlxdWlkaXR5LXZhdWx0LXYxLTBgLFxuICAgICAgYCR7ZGVwbG95ZXJ9LldyYXBwZWQtQml0Y29pbmAsXG4gICAgICBgJHtkZXBsb3llcn0ucmV3YXJkcy1jYWxjYCxcbiAgICAgIHN0eFNlbmRlclxuICAgIClcbiAgXTtcbn1cblxuXG5mdW5jdGlvbiBzZW5kRnVuZHNQMlNIVHhzV3JhcChcbiAgZGVwbG95ZXI6IHN0cmluZyxcbiAgdG9rZW5JZDogbnVtYmVyLFxuICBzdHhTZW5kZXI6IHN0cmluZyxcbiAgc2VuZGVyOiBzdHJpbmcsXG4gIHJlY2lwaWVudDogc3RyaW5nLFxuICBleHBpcmF0aW9uOiBudW1iZXIsXG4gIHN3YXBwZXJJZDogbnVtYmVyLFxuICBvdXRwdXRWYWx1ZTogbnVtYmVyLFxuICBwcmVpbWFnZTogc3RyaW5nLFxuICBzdXBwbGllcklkOiBudW1iZXIsXG4gIG1pblRvUmVjZWl2ZTogbnVtYmVyLFxuICBmYWN0b3I6IG51bWJlcixcbiAgaGVpZ2h0OiBudW1iZXJcbiAgKSB7XG4gIGxldCBoYXNoID0gZ2V0SGFzaChwcmVpbWFnZSk7XG4gIGxldCB0eDEgPSBnZW5lcmF0ZVAyU0hUeChzZW5kZXIsIHJlY2lwaWVudCwgZXhwaXJhdGlvbiwgaGFzaCwgc3dhcHBlcklkLCBvdXRwdXRWYWx1ZSk7XG4gIGxldCB0eGlkMSA9IGdldFR4SWQodHgxKTtcbiAgcmV0dXJuIFtcbiAgICBUZXN0VXRpbHMuc2V0TWluZWRUeCh0eGlkMSwgZGVwbG95ZXIpLFxuICAgIFN1cHBsaWVySW50ZXJmYWNlLnNlbmRGdW5kc1dyYXAoXG4gICAgICB7IGhlYWRlcjogXCJcIiwgaGVpZ2h0IH0sXG4gICAgICBbXSxcbiAgICAgIHR4MSxcbiAgICAgIHsgXCJ0eC1pbmRleFwiOiAwLCBcImhhc2hlc1wiOiBbXSwgXCJ0cmVlLWRlcHRoXCI6IDAgfSxcbiAgICAgIDAsXG4gICAgICBzZW5kZXIsXG4gICAgICByZWNpcGllbnQsXG4gICAgICBnZXRFeHBpcmF0aW9uKGV4cGlyYXRpb24pLFxuICAgICAgaGFzaCxcbiAgICAgIHN3YXBwZXJCdWZmKHN3YXBwZXJJZCksXG4gICAgICBzdXBwbGllcklkLFxuICAgICAgbWluVG9SZWNlaXZlLFxuICAgICAgcHJlaW1hZ2UsXG4gICAgICBmYWN0b3IsXG4gICAgICBgJHtkZXBsb3llcn0ubHAtdG9rZW5gLFxuICAgICAgdG9rZW5JZCxcbiAgICAgIGAke2RlcGxveWVyfS56ZXN0LXJld2FyZC1kaXN0YCxcbiAgICAgIGAke2RlcGxveWVyfS5saXF1aWRpdHktdmF1bHQtdjEtMGAsXG4gICAgICBgJHtkZXBsb3llcn0uV3JhcHBlZC1CaXRjb2luYCxcbiAgICAgIGAke2RlcGxveWVyfS5yZXdhcmRzLWNhbGNgLFxuICAgICAgc3R4U2VuZGVyXG4gICAgKVxuICBdO1xufVxuXG5mdW5jdGlvbiBtYWtlUGF5bWVudFR4cyhcbiAgZGVwbG95ZXI6IHN0cmluZyxcbiAgc3R4U2VuZGVyOiBzdHJpbmcsXG4gIHNlbmRlcjogc3RyaW5nLFxuICByZWNpcGllbnQ6IHN0cmluZyxcbiAgZXhwaXJhdGlvbjogbnVtYmVyLFxuICBzd2FwcGVySWQ6IG51bWJlcixcbiAgb3V0cHV0VmFsdWU6IG51bWJlcixcbiAgcHJlaW1hZ2U6IHN0cmluZyxcbiAgc3VwcGxpZXJJZDogbnVtYmVyLFxuICBtaW5Ub1JlY2VpdmU6IG51bWJlcixcbiAgbG9hbklkOiBudW1iZXIsXG4gIHBheW1lbnQ6IHN0cmluZyxcbiAgbHBUb2tlbjogc3RyaW5nLFxuICBsdjogc3RyaW5nLFxuICB0b2tlbklkOiBudW1iZXIsXG4gIGNwVG9rZW46IHN0cmluZyxcbiAgY3BSZXdhcmRzOiBzdHJpbmcsXG4gIHpwVG9rZW46IHN0cmluZyxcbiAgc3dhcFJvdXRlcjogc3RyaW5nLFxuICBoZWlnaHQ6IG51bWJlcixcbiAgeGJ0Yzogc3RyaW5nLFxuICApIHtcbiAgY29uc3QgaGFzaCA9IGdldEhhc2gocHJlaW1hZ2UpO1xuICBjb25zdCB0eDEgPSBnZW5lcmF0ZVAyU0hUeChzZW5kZXIsIHJlY2lwaWVudCwgZXhwaXJhdGlvbiwgaGFzaCwgc3dhcHBlcklkLCBvdXRwdXRWYWx1ZSk7XG4gIGNvbnN0IHR4aWQxID0gZ2V0VHhJZCh0eDEpO1xuICByZXR1cm4gW1xuICAgIFRlc3RVdGlscy5zZXRNaW5lZFR4KHR4aWQxLCBkZXBsb3llciksXG5cbiAgICAvLyAxLiBTZW5kIEJpdGNvaW4gdG8gc3VwcGxpZXIgYWRkcmVzcy5cbiAgICAvLyAyLiBMaXF1aWRpdHkgUHJvdmlkZXIgc2VuZHMgU3RhY2tzIFRyYW5zYWN0aW9uIHRvIGNvbmZpcm0gQml0Y29pbiB0cmFuc2FjdGlvbiBoYXBwZW5lZC5cbiAgICBTdXBwbGllckludGVyZmFjZS5zZW5kRnVuZHMoXG4gICAgICB7IGhlYWRlcjogXCJcIiwgaGVpZ2h0IH0sXG4gICAgICBbXSxcbiAgICAgIHR4MSxcbiAgICAgIHsgXCJ0eC1pbmRleFwiOiAwLCBcImhhc2hlc1wiOiBbXSwgXCJ0cmVlLWRlcHRoXCI6IDAgfSxcbiAgICAgIDAsXG4gICAgICBzZW5kZXIsXG4gICAgICByZWNpcGllbnQsXG4gICAgICBnZXRFeHBpcmF0aW9uKGV4cGlyYXRpb24pLFxuICAgICAgaGFzaCxcbiAgICAgIHN3YXBwZXJCdWZmKHN3YXBwZXJJZCksXG4gICAgICBzdXBwbGllcklkLFxuICAgICAgbWluVG9SZWNlaXZlLFxuICAgICAgc3R4U2VuZGVyXG4gICAgKSxcbiAgICAvLyAzLiBMaXF1aWRpdHkgUHJvdmlkZXIgc2VuZCBTdGFja3MgdHJhbnNhY3Rpb24gdG8gc2VuZCBmdW5kcyB0byBwb29sXG4gICAgU3VwcGxpZXJJbnRlcmZhY2UubWFrZVBheW1lbnQoXG4gICAgICB0eGlkMSxcbiAgICAgIHByZWltYWdlLFxuICAgICAgbG9hbklkLFxuICAgICAgcGF5bWVudCxcbiAgICAgIGxwVG9rZW4sXG4gICAgICBsdixcbiAgICAgIHRva2VuSWQsXG4gICAgICBjcFRva2VuLFxuICAgICAgY3BSZXdhcmRzLFxuICAgICAgenBUb2tlbixcbiAgICAgIHN3YXBSb3V0ZXIsXG4gICAgICB4YnRjLFxuICAgICAgc3R4U2VuZGVyXG4gICAgKVxuICBdO1xufVxuXG5cbmZ1bmN0aW9uIG1ha2VQYXltZW50VmVyaWZ5VHhzKFxuICBkZXBsb3llcjogc3RyaW5nLFxuICBzdHhTZW5kZXI6IHN0cmluZyxcbiAgc2VuZGVyOiBzdHJpbmcsXG4gIHJlY2lwaWVudDogc3RyaW5nLFxuICBleHBpcmF0aW9uOiBudW1iZXIsXG4gIHN3YXBwZXJJZDogbnVtYmVyLFxuICBvdXRwdXRWYWx1ZTogbnVtYmVyLFxuICBwcmVpbWFnZTogc3RyaW5nLFxuICBzdXBwbGllcklkOiBudW1iZXIsXG4gIG1pblRvUmVjZWl2ZTogbnVtYmVyLFxuICBsb2FuSWQ6IG51bWJlcixcbiAgcGF5bWVudDogc3RyaW5nLFxuICBscFRva2VuOiBzdHJpbmcsXG4gIGx2OiBzdHJpbmcsXG4gIHRva2VuSWQ6IG51bWJlcixcbiAgY3BUb2tlbjogc3RyaW5nLFxuICBjcFJld2FyZHM6IHN0cmluZyxcbiAgenBUb2tlbjogc3RyaW5nLFxuICBzd2FwUm91dGVyOiBzdHJpbmcsXG4gIGhlaWdodDogbnVtYmVyLFxuICB4YnRjOiBzdHJpbmcsXG4gICkge1xuICBjb25zdCBoYXNoID0gZ2V0SGFzaChwcmVpbWFnZSk7XG4gIGNvbnN0IHR4MSA9IGdlbmVyYXRlUDJTSFR4KHNlbmRlciwgcmVjaXBpZW50LCBleHBpcmF0aW9uLCBoYXNoLCBzd2FwcGVySWQsIG91dHB1dFZhbHVlKTtcbiAgY29uc3QgdHhpZDEgPSBnZXRUeElkKHR4MSk7XG4gIHJldHVybiBbXG4gICAgVGVzdFV0aWxzLnNldE1pbmVkVHgodHhpZDEsIGRlcGxveWVyKSxcblxuICAgIC8vIDEuIFNlbmQgQml0Y29pbiB0byBzdXBwbGllciBhZGRyZXNzLlxuICAgIC8vIDIuIExpcXVpZGl0eSBQcm92aWRlciBzZW5kcyBTdGFja3MgVHJhbnNhY3Rpb24gdG8gY29uZmlybSBCaXRjb2luIHRyYW5zYWN0aW9uIGhhcHBlbmVkLlxuICAgIFN1cHBsaWVySW50ZXJmYWNlLnNlbmRGdW5kcyhcbiAgICAgIHsgaGVhZGVyOiBcIlwiLCBoZWlnaHQgfSxcbiAgICAgIFtdLFxuICAgICAgdHgxLFxuICAgICAgeyBcInR4LWluZGV4XCI6IDAsIFwiaGFzaGVzXCI6IFtdLCBcInRyZWUtZGVwdGhcIjogMCB9LFxuICAgICAgMCxcbiAgICAgIHNlbmRlcixcbiAgICAgIHJlY2lwaWVudCxcbiAgICAgIGdldEV4cGlyYXRpb24oZXhwaXJhdGlvbiksXG4gICAgICBoYXNoLFxuICAgICAgc3dhcHBlckJ1ZmYoc3dhcHBlcklkKSxcbiAgICAgIHN1cHBsaWVySWQsXG4gICAgICBtaW5Ub1JlY2VpdmUsXG4gICAgICBzdHhTZW5kZXJcbiAgICApLFxuICAgIC8vIDMuIExpcXVpZGl0eSBQcm92aWRlciBzZW5kIFN0YWNrcyB0cmFuc2FjdGlvbiB0byBzZW5kIGZ1bmRzIHRvIHBvb2xcbiAgICBTdXBwbGllckludGVyZmFjZS5tYWtlUGF5bWVudFZlcmlmeShcbiAgICAgIHR4aWQxLFxuICAgICAgcHJlaW1hZ2UsXG4gICAgICBsb2FuSWQsXG4gICAgICBwYXltZW50LFxuICAgICAgbHBUb2tlbixcbiAgICAgIGx2LFxuICAgICAgdG9rZW5JZCxcbiAgICAgIGNwVG9rZW4sXG4gICAgICBjcFJld2FyZHMsXG4gICAgICB6cFRva2VuLFxuICAgICAgc3dhcFJvdXRlcixcbiAgICAgIHhidGMsXG4gICAgICBzdHhTZW5kZXJcbiAgICApXG4gIF07XG59XG5cbmZ1bmN0aW9uIG1ha2VGdWxsUGF5bWVudFR4cyhcbiAgZGVwbG95ZXI6IHN0cmluZyxcbiAgc3R4U2VuZGVyOiBzdHJpbmcsXG4gIHNlbmRlcjogc3RyaW5nLFxuICByZWNpcGllbnQ6IHN0cmluZyxcbiAgZXhwaXJhdGlvbjogbnVtYmVyLFxuICBzd2FwcGVySWQ6IG51bWJlcixcbiAgb3V0cHV0VmFsdWU6IG51bWJlcixcbiAgcHJlaW1hZ2U6IHN0cmluZyxcbiAgc3VwcGxpZXJJZDogbnVtYmVyLFxuICBtaW5Ub1JlY2VpdmU6IG51bWJlcixcbiAgbG9hbklkOiBudW1iZXIsXG4gIHBheW1lbnQ6IHN0cmluZyxcbiAgbHBUb2tlbjogc3RyaW5nLFxuICBsdjogc3RyaW5nLFxuICB0b2tlbklkOiBudW1iZXIsXG4gIGNwVG9rZW46IHN0cmluZyxcbiAgY3BSZXdhcmRzOiBzdHJpbmcsXG4gIHpwVG9rZW46IHN0cmluZyxcbiAgc3dhcFJvdXRlcjogc3RyaW5nLFxuICBoZWlnaHQ6IG51bWJlcixcbiAgeGJ0Yzogc3RyaW5nLFxuICApIHtcbiAgY29uc3QgaGFzaCA9IGdldEhhc2gocHJlaW1hZ2UpO1xuICBjb25zdCB0eDEgPSBnZW5lcmF0ZVAyU0hUeChzZW5kZXIsIHJlY2lwaWVudCwgZXhwaXJhdGlvbiwgaGFzaCwgc3dhcHBlcklkLCBvdXRwdXRWYWx1ZSk7XG4gIGNvbnN0IHR4aWQxID0gZ2V0VHhJZCh0eDEpO1xuICByZXR1cm4gW1xuICAgIFRlc3RVdGlscy5zZXRNaW5lZFR4KHR4aWQxLCBkZXBsb3llciksXG5cbiAgICAvLyAxLiBTZW5kIEJpdGNvaW4gdG8gc3VwcGxpZXIgYWRkcmVzcy5cbiAgICAvLyAyLiBMaXF1aWRpdHkgUHJvdmlkZXIgc2VuZHMgU3RhY2tzIFRyYW5zYWN0aW9uIHRvIGNvbmZpcm0gQml0Y29pbiB0cmFuc2FjdGlvbiBoYXBwZW5lZC5cbiAgICBTdXBwbGllckludGVyZmFjZS5zZW5kRnVuZHMoXG4gICAgICB7IGhlYWRlcjogXCJcIiwgaGVpZ2h0IH0sXG4gICAgICBbXSxcbiAgICAgIHR4MSxcbiAgICAgIHsgXCJ0eC1pbmRleFwiOiAwLCBcImhhc2hlc1wiOiBbXSwgXCJ0cmVlLWRlcHRoXCI6IDAgfSxcbiAgICAgIDAsXG4gICAgICBzZW5kZXIsXG4gICAgICByZWNpcGllbnQsXG4gICAgICBnZXRFeHBpcmF0aW9uKGV4cGlyYXRpb24pLFxuICAgICAgaGFzaCxcbiAgICAgIHN3YXBwZXJCdWZmKHN3YXBwZXJJZCksXG4gICAgICBzdXBwbGllcklkLFxuICAgICAgbWluVG9SZWNlaXZlLFxuICAgICAgc3R4U2VuZGVyXG4gICAgKSxcbiAgICAvLyAzLiBMaXF1aWRpdHkgUHJvdmlkZXIgc2VuZCBTdGFja3MgdHJhbnNhY3Rpb24gdG8gc2VuZCBmdW5kcyB0byBwb29sXG4gICAgU3VwcGxpZXJJbnRlcmZhY2UubWFrZUZ1bGxQYXltZW50KFxuICAgICAgdHhpZDEsXG4gICAgICBwcmVpbWFnZSxcbiAgICAgIGxvYW5JZCxcbiAgICAgIHBheW1lbnQsXG4gICAgICBscFRva2VuLFxuICAgICAgbHYsXG4gICAgICB0b2tlbklkLFxuICAgICAgY3BUb2tlbixcbiAgICAgIGNwUmV3YXJkcyxcbiAgICAgIHpwVG9rZW4sXG4gICAgICBzd2FwUm91dGVyLFxuICAgICAgeGJ0YyxcbiAgICAgIHN0eFNlbmRlclxuICAgIClcbiAgXTtcbn1cblxuZnVuY3Rpb24gbWFrZVJlc2lkdWFsUGF5bWVudChcbiAgZGVwbG95ZXI6IHN0cmluZyxcbiAgc3R4U2VuZGVyOiBzdHJpbmcsXG4gIHNlbmRlcjogc3RyaW5nLFxuICByZWNpcGllbnQ6IHN0cmluZyxcbiAgZXhwaXJhdGlvbjogbnVtYmVyLFxuICBzd2FwcGVySWQ6IG51bWJlcixcbiAgb3V0cHV0VmFsdWU6IG51bWJlcixcbiAgcHJlaW1hZ2U6IHN0cmluZyxcbiAgc3VwcGxpZXJJZDogbnVtYmVyLFxuICBtaW5Ub1JlY2VpdmU6IG51bWJlcixcbiAgbG9hbklkOiBudW1iZXIsXG4gIC8vIHBheW1lbnQ6IHN0cmluZyxcbiAgbHBUb2tlbjogc3RyaW5nLFxuICBsdjogc3RyaW5nLFxuICB0b2tlbklkOiBudW1iZXIsXG4gIC8vIGNwVG9rZW46IHN0cmluZyxcbiAgLy8gY3BSZXdhcmRzOiBzdHJpbmcsXG4gIC8vIHpwVG9rZW46IHN0cmluZyxcbiAgLy8gc3dhcFJvdXRlcjogc3RyaW5nLFxuICBoZWlnaHQ6IG51bWJlcixcbiAgeGJ0Yzogc3RyaW5nLFxuICApIHtcbiAgY29uc3QgaGFzaCA9IGdldEhhc2gocHJlaW1hZ2UpO1xuICBjb25zdCB0eDEgPSBnZW5lcmF0ZVAyU0hUeChzZW5kZXIsIHJlY2lwaWVudCwgZXhwaXJhdGlvbiwgaGFzaCwgc3dhcHBlcklkLCBvdXRwdXRWYWx1ZSk7XG4gIGNvbnN0IHR4aWQxID0gZ2V0VHhJZCh0eDEpO1xuICByZXR1cm4gW1xuICAgIFRlc3RVdGlscy5zZXRNaW5lZFR4KHR4aWQxLCBkZXBsb3llciksXG5cbiAgICAvLyAxLiBTZW5kIEJpdGNvaW4gdG8gc3VwcGxpZXIgYWRkcmVzcy5cbiAgICAvLyAyLiBMaXF1aWRpdHkgUHJvdmlkZXIgc2VuZHMgU3RhY2tzIFRyYW5zYWN0aW9uIHRvIGNvbmZpcm0gQml0Y29pbiB0cmFuc2FjdGlvbiBoYXBwZW5lZC5cbiAgICBTdXBwbGllckludGVyZmFjZS5zZW5kRnVuZHMoXG4gICAgICB7IGhlYWRlcjogXCJcIiwgaGVpZ2h0IH0sXG4gICAgICBbXSxcbiAgICAgIHR4MSxcbiAgICAgIHsgXCJ0eC1pbmRleFwiOiAwLCBcImhhc2hlc1wiOiBbXSwgXCJ0cmVlLWRlcHRoXCI6IDAgfSxcbiAgICAgIDAsXG4gICAgICBzZW5kZXIsXG4gICAgICByZWNpcGllbnQsXG4gICAgICBnZXRFeHBpcmF0aW9uKGV4cGlyYXRpb24pLFxuICAgICAgaGFzaCxcbiAgICAgIHN3YXBwZXJCdWZmKHN3YXBwZXJJZCksXG4gICAgICBzdXBwbGllcklkLFxuICAgICAgbWluVG9SZWNlaXZlLFxuICAgICAgc3R4U2VuZGVyXG4gICAgKSxcbiAgICAvLyAzLiBMaXF1aWRpdHkgUHJvdmlkZXIgc2VuZCBTdGFja3MgdHJhbnNhY3Rpb24gdG8gc2VuZCBmdW5kcyB0byBwb29sXG4gICAgU3VwcGxpZXJJbnRlcmZhY2UubWFrZVJlc2lkdWFsUGF5bWVudChcbiAgICAgIHR4aWQxLFxuICAgICAgcHJlaW1hZ2UsXG4gICAgICBsb2FuSWQsXG4gICAgICBscFRva2VuLFxuICAgICAgbHYsXG4gICAgICB0b2tlbklkLFxuICAgICAgeGJ0YyxcbiAgICAgIHN0eFNlbmRlclxuICAgIClcbiAgXTtcbn1cblxuZnVuY3Rpb24gZmluYWxpemVPdXRib3VuZFR4cyhcbiAgcHVia2V5SGFzaDogc3RyaW5nLFxuICBvdXRwdXRWYWx1ZTogbnVtYmVyLFxuICBzd2FwSWQ6IG51bWJlcixcbiAgaGVpZ2h0OiBudW1iZXIsXG4gIHN0eFNlbmRlcjogc3RyaW5nLFxuICBkZXBsb3llcjogc3RyaW5nLFxuICApIHtcbiAgbGV0IHR4MSA9IGdlbmVyYXRlUDJQS0hUeChwdWJrZXlIYXNoLCBvdXRwdXRWYWx1ZSk7XG4gIGxldCB0eGlkMSA9IGdldFR4SWQodHgxKTtcblxuICByZXR1cm4gW1xuICAgIFRlc3RVdGlscy5zZXRNaW5lZFR4KHR4aWQxLCBkZXBsb3llciksXG4gICAgU3VwcGxpZXJJbnRlcmZhY2UuZmluYWxpemVPdXRib3VuZChcbiAgICAgIHsgaGVhZGVyOiBcIlwiLCBoZWlnaHQgfSxcbiAgICAgIFtdLFxuICAgICAgdHgxLFxuICAgICAgeyBcInR4LWluZGV4XCI6IDAsIFwiaGFzaGVzXCI6IFtdLCBcInRyZWUtZGVwdGhcIjogMCB9LFxuICAgICAgMCxcbiAgICAgIHN3YXBJZCxcbiAgICAgIHN0eFNlbmRlclxuICAgIClcbiAgXVxufVxuXG5mdW5jdGlvbiBmaW5hbGl6ZURyYXdkb3duKFxuICBsb2FuSWQ6IG51bWJlcixcbiAgbHBUb2tlbjogc3RyaW5nLFxuICB0b2tlbklkOiBudW1iZXIsXG4gIGNvbGxUb2tlbjogc3RyaW5nLFxuICBjb2xsVmF1bHQ6IHN0cmluZyxcbiAgZnY6IHN0cmluZyxcbiAgeGJ0Y0Z0OiBzdHJpbmcsXG4gIHB1YmtleUhhc2g6IHN0cmluZyxcbiAgb3V0cHV0VmFsdWU6IG51bWJlcixcbiAgc3dhcElkOiBudW1iZXIsXG4gIGhlaWdodDogbnVtYmVyLFxuICBzdHhTZW5kZXI6IHN0cmluZyxcbiAgZGVwbG95ZXI6IHN0cmluZyxcbiAgKSB7XG4gIGxldCB0eDEgPSBnZW5lcmF0ZVAyUEtIVHgocHVia2V5SGFzaCwgb3V0cHV0VmFsdWUpO1xuICBsZXQgdHhpZDEgPSBnZXRUeElkKHR4MSk7XG5cbiAgcmV0dXJuIFtcbiAgICBUZXN0VXRpbHMuc2V0TWluZWRUeCh0eGlkMSwgZGVwbG95ZXIpLFxuICAgIFN1cHBsaWVySW50ZXJmYWNlLmZpbmFsaXplRHJhd2Rvd24oXG4gICAgICBsb2FuSWQsXG4gICAgICBscFRva2VuLFxuICAgICAgdG9rZW5JZCxcbiAgICAgIGNvbGxUb2tlbixcbiAgICAgIGNvbGxWYXVsdCxcbiAgICAgIGZ2LFxuICAgICAgeGJ0Y0Z0LFxuICAgICAgeyBoZWFkZXI6IFwiXCIsIGhlaWdodCB9LFxuICAgICAgW10sXG4gICAgICB0eDEsXG4gICAgICB7IFwidHgtaW5kZXhcIjogMCwgXCJoYXNoZXNcIjogW10sIFwidHJlZS1kZXB0aFwiOiAwIH0sXG4gICAgICAwLFxuICAgICAgc3dhcElkLFxuICAgICAgc3R4U2VuZGVyXG4gICAgKVxuICBdXG59XG5cbmZ1bmN0aW9uIGZpbmFsaXplUm9sbG92ZXIoXG4gIGxvYW5JZDogbnVtYmVyLFxuICBscFRva2VuOiBzdHJpbmcsXG4gIHRva2VuSWQ6IG51bWJlcixcbiAgY29sbFRva2VuOiBzdHJpbmcsXG4gIGNvbGxWYXVsdDogc3RyaW5nLFxuICBmdjogc3RyaW5nLFxuICB4YnRjRnQ6IHN0cmluZyxcbiAgcHVia2V5SGFzaDogc3RyaW5nLFxuICBvdXRwdXRWYWx1ZTogbnVtYmVyLFxuICBzd2FwSWQ6IG51bWJlcixcbiAgaGVpZ2h0OiBudW1iZXIsXG4gIHN0eFNlbmRlcjogc3RyaW5nLFxuICBkZXBsb3llcjogc3RyaW5nLFxuICApIHtcbiAgbGV0IHR4MSA9IGdlbmVyYXRlUDJQS0hUeChwdWJrZXlIYXNoLCBvdXRwdXRWYWx1ZSk7XG4gIGxldCB0eGlkMSA9IGdldFR4SWQodHgxKTtcblxuICByZXR1cm4gW1xuICAgIFRlc3RVdGlscy5zZXRNaW5lZFR4KHR4aWQxLCBkZXBsb3llciksXG4gICAgU3VwcGxpZXJJbnRlcmZhY2UuZmluYWxpemVSb2xsb3ZlcihcbiAgICAgIGxvYW5JZCxcbiAgICAgIGxwVG9rZW4sXG4gICAgICB0b2tlbklkLFxuICAgICAgY29sbFRva2VuLFxuICAgICAgY29sbFZhdWx0LFxuICAgICAgZnYsXG4gICAgICB4YnRjRnQsXG4gICAgICB7IGhlYWRlcjogXCJcIiwgaGVpZ2h0IH0sXG4gICAgICBbXSxcbiAgICAgIHR4MSxcbiAgICAgIHsgXCJ0eC1pbmRleFwiOiAwLCBcImhhc2hlc1wiOiBbXSwgXCJ0cmVlLWRlcHRoXCI6IDAgfSxcbiAgICAgIDAsXG4gICAgICBzd2FwSWQsXG4gICAgICBzdHhTZW5kZXJcbiAgICApXG4gIF1cbn1cblxuZnVuY3Rpb24gYm9vdHN0cmFwQXBwcm92ZWRDb250cmFjdHMoY2hhaW46IENoYWluLCBkZXBsb3llcjogQWNjb3VudCkge1xuICBhZGRBcHByb3ZlZENvbnRyYWN0KGNoYWluLCBcInplc3QtcmV3YXJkLWRpc3RcIiwgXCJsb2FuLXYxLTBcIiwgZGVwbG95ZXIpO1xuICBhZGRBcHByb3ZlZENvbnRyYWN0KGNoYWluLCBcInplc3QtcmV3YXJkLWRpc3RcIiwgXCJwb29sLXYxLTBcIiwgZGVwbG95ZXIpO1xuICBhZGRBcHByb3ZlZENvbnRyYWN0KGNoYWluLCBcInplc3QtcmV3YXJkLWRpc3RcIiwgXCJwYXltZW50LWZpeGVkXCIsIGRlcGxveWVyKTtcbiAgYWRkQXBwcm92ZWRDb250cmFjdChjaGFpbiwgXCJscC10b2tlblwiLCBcImxvYW4tdjEtMFwiLCBkZXBsb3llcik7XG4gIGFkZEFwcHJvdmVkQ29udHJhY3QoY2hhaW4sIFwibHAtdG9rZW5cIiwgXCJwb29sLXYxLTBcIiwgZGVwbG95ZXIpO1xuICBhZGRBcHByb3ZlZENvbnRyYWN0KGNoYWluLCBcImxwLXRva2VuXCIsIFwicGF5bWVudC1maXhlZFwiLCBkZXBsb3llcik7XG4gIGFkZEFwcHJvdmVkQ29udHJhY3QoY2hhaW4sIFwibHAtdG9rZW5cIiwgXCJzdXBwbGllci1pbnRlcmZhY2VcIiwgZGVwbG95ZXIpO1xuICBhZGRBcHByb3ZlZENvbnRyYWN0KGNoYWluLCBcInBheW1lbnQtZml4ZWRcIiwgXCJsb2FuLXYxLTBcIiwgZGVwbG95ZXIpO1xuICBhZGRBcHByb3ZlZENvbnRyYWN0KGNoYWluLCBcImxpcXVpZGl0eS12YXVsdC12MS0wXCIsIFwibHAtdG9rZW5cIiwgZGVwbG95ZXIpO1xuICBhZGRBcHByb3ZlZENvbnRyYWN0KGNoYWluLCBcImxpcXVpZGl0eS12YXVsdC12MS0wXCIsIFwicG9vbC12MS0wXCIsIGRlcGxveWVyKTtcbiAgYWRkQXBwcm92ZWRDb250cmFjdChjaGFpbiwgXCJjcC10b2tlblwiLCBcInBheW1lbnQtZml4ZWRcIiwgZGVwbG95ZXIpO1xuICBhZGRBcHByb3ZlZENvbnRyYWN0KGNoYWluLCBcImNwLXRva2VuXCIsIFwicG9vbC12MS0wXCIsIGRlcGxveWVyKTtcbiAgYWRkQXBwcm92ZWRDb250cmFjdChjaGFpbiwgXCJjcC10b2tlblwiLCBcInN0YWtpbmctcG9vbC12MS0wXCIsIGRlcGxveWVyKTtcbiAgYWRkQXBwcm92ZWRDb250cmFjdChjaGFpbiwgXCJyZXdhcmRzLWNhbGNcIiwgXCJwb29sLXYxLTBcIiwgZGVwbG95ZXIpO1xuICBhZGRBcHByb3ZlZENvbnRyYWN0KGNoYWluLCBcInJld2FyZHMtY2FsY1wiLCBcImNvdmVyLXBvb2wtdjEtMFwiLCBkZXBsb3llcik7XG4gIGFkZEFwcHJvdmVkQ29udHJhY3QoY2hhaW4sIFwiZnVuZGluZy12YXVsdFwiLCBcImxvYW4tdjEtMFwiLCBkZXBsb3llcik7XG4gIGFkZEFwcHJvdmVkQ29udHJhY3QoY2hhaW4sIFwiY29sbC12YXVsdFwiLCBcImxvYW4tdjEtMFwiLCBkZXBsb3llcik7XG5cbiAgc2V0UG9vbENvbnRyYWN0KGNoYWluLCBcImxvYW4tdjEtMFwiLCBcInBvb2wtdjEtMFwiLCBkZXBsb3llcik7XG4gIHNldFBvb2xDb250cmFjdChjaGFpbiwgXCJjb3Zlci1wb29sLXYxLTBcIiwgXCJwb29sLXYxLTBcIiwgZGVwbG95ZXIpO1xufVxuXG5mdW5jdGlvbiBjb25zdW1lVWludCh1aW50OiBzdHJpbmcgfCBTdHJpbmcpIHtcbiAgcmV0dXJuIE51bWJlcih1aW50LnJlcGxhY2UoXCJ1XCIsIFwiXCIpKTtcbn1cblxuZXhwb3J0IHtcbiAgc2V0Q29udHJhY3RPd25lcixcbiAgaW5pdENvbnRyYWN0T3duZXJzLFxuICBhZGRCb3Jyb3dlcixcbiAgYWRkQXBwcm92ZWRDb250cmFjdCxcbiAgcnVuQm9vdHN0cmFwLFxuICBib290c3RyYXBBcHByb3ZlZENvbnRyYWN0cyxcbiAgc2VuZEZ1bmRzUDJTSFR4cyxcbiAgcmVnaXN0ZXJTdXBwbGllclR4cyxcbiAgc2V0UG9vbENvbnRyYWN0LFxuICBmaW5hbGl6ZU91dGJvdW5kVHhzLFxuICBtYWtlUGF5bWVudFR4cyxcbiAgY29uc3VtZVVpbnQsXG4gIGZpbmFsaXplRHJhd2Rvd24sXG4gIGZpbmFsaXplUm9sbG92ZXIsXG4gIGdldEJQLFxuICBzZW5kRnVuZHNQMlNIVHhzV3JhcCxcbiAgbWFrZUZ1bGxQYXltZW50VHhzLFxuICBtYWtlUmVzaWR1YWxQYXltZW50LFxuICBtYWtlUGF5bWVudFZlcmlmeVR4cyxcbn07Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsRUFBRSxFQUFrQixLQUFLLFFBQVEsOENBQThDLENBQUM7QUFFekYsU0FBUyxpQkFBaUIsUUFBUSxxQ0FBcUMsQ0FBQztBQUN4RSxTQUFTLFNBQVMsUUFBUSw2QkFBNkIsQ0FBQztBQUd4RCxTQUNFLE9BQU8sRUFFUCxPQUFPLEVBQ1AsY0FBYyxFQUNkLGVBQWUsRUFDZixhQUFhLEVBQ2IsV0FBVyxRQUNOLCtCQUErQixDQUFDO0FBR3ZDLFNBQVMsZ0JBQWdCLENBQUMsS0FBWSxFQUFFLFFBQWdCLEVBQUUsUUFBZ0IsRUFBRSxRQUFpQixFQUFFO0lBQzdGLE9BQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQztRQUNyQixFQUFFLENBQUMsWUFBWSxDQUNiLENBQUMsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUNqQyxvQkFBb0IsRUFDbEI7WUFDRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1NBQ25ELEVBQ0QsUUFBUSxDQUFDLE9BQU8sQ0FDbkI7S0FDRixDQUFDLENBQUM7Q0FDSjtBQUVELFNBQVMsV0FBVyxDQUFDLEtBQVksRUFBRSxRQUFpQixFQUFFLFFBQWlCLEVBQUU7SUFDdkUsT0FBTyxLQUFLLENBQUMsU0FBUyxDQUFDO1FBQ3JCLEVBQUUsQ0FBQyxZQUFZLENBQ2IsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQy9CLGNBQWMsRUFDWjtZQUNFLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQztTQUNsQyxFQUNELFFBQVEsQ0FBQyxPQUFPLENBQ25CO0tBQ0YsQ0FBQyxDQUFDO0NBQ0o7QUFF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