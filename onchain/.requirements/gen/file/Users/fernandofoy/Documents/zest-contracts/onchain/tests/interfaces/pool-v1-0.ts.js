import { Tx, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
class Pool {
    chain;
    deployer;
    constructor(chain, deployer){
        this.chain = chain;
        this.deployer = deployer;
    }
    createPool(delegate, lp, zp, payment, rewardsCalc, stakingFee, delegateFee, liquidityCap, coverCap, minCycles, maxMaturityLength, liquidityVault, coverPoolToken, coverVault, coverRewardsToken, coverToken, open) {
        return this.chain.mineBlock([
            Tx.contractCall('pool-v1-0', 'create-pool', [
                types.principal(delegate),
                types.principal(lp),
                types.principal(zp),
                types.principal(payment),
                types.principal(rewardsCalc),
                types.uint(stakingFee),
                types.uint(delegateFee),
                types.uint(liquidityCap),
                types.uint(coverCap),
                types.uint(minCycles),
                types.uint(maxMaturityLength),
                types.principal(liquidityVault),
                types.principal(coverPoolToken),
                types.principal(coverVault),
                types.principal(coverRewardsToken),
                types.principal(coverToken),
                types.bool(open), 
            ], this.deployer.address)
        ]);
    }
    finalizePool(delegate, lp, zestDist, cp, tokenId) {
        return this.chain.mineBlock([
            Tx.contractCall('pool-v1-0', 'finalize-pool', [
                types.principal(lp),
                types.principal(zestDist),
                types.principal(cp),
                types.uint(tokenId)
            ], delegate)
        ]);
    }
    createLoan(lp, tokenId, amount, asset, collRatio, collToken, apr, loanMaturityLength, paymentPeriod, collVault, fundingVault, borrower) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "create-loan", [
                types.principal(lp),
                types.uint(tokenId),
                types.uint(amount),
                types.principal(asset),
                types.uint(collRatio),
                types.principal(collToken),
                types.uint(apr),
                types.uint(loanMaturityLength),
                types.uint(paymentPeriod),
                types.principal(collVault),
                types.principal(fundingVault), 
            ], borrower)
        ]);
    }
    fundLoan(loanId, lp, tokenId, liquidityVault, fundingVault, xbtc, delegate) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "fund-loan", [
                types.uint(loanId),
                types.principal(lp),
                types.uint(tokenId),
                types.principal(liquidityVault),
                types.principal(fundingVault),
                types.principal(xbtc)
            ], delegate)
        ]);
    }
    triggerDefaultmode(lpToken, tokenId, caller) {
        return this.chain.mineBlock([
            Tx.contractCall("pool-v1-0", "trigger-default-mode", [
                types.principal(lpToken),
                types.uint(tokenId)
            ], caller)
        ]);
    }
    unwind(loanId, lp, tokenId, liquidityVault, fundingVault, xbtc, caller) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "unwind", [
                types.uint(loanId),
                types.principal(lp),
                types.uint(tokenId),
                types.principal(liquidityVault),
                types.principal(fundingVault),
                types.principal(xbtc),
                types.principal(caller)
            ], caller)
        ]);
    }
    enableCover(lpToken, cpToken, tokenId, delegate) {
        return this.chain.mineBlock([
            Tx.contractCall('pool-v1-0', 'enable-cover', [
                types.principal(lpToken),
                types.principal(cpToken),
                types.uint(tokenId), 
            ], delegate)
        ]);
    }
    disableCover(lpToken, cpToken, tokenId, delegate) {
        return this.chain.mineBlock([
            Tx.contractCall('pool-v1-0', 'disable-cover', [
                types.principal(lpToken),
                types.principal(cpToken),
                types.uint(tokenId), 
            ], delegate)
        ]);
    }
    getPool(tokenId) {
        return this.chain.mineBlock([
            Tx.contractCall('pool-v1-0', 'get-pool', [
                types.uint(tokenId)
            ], this.deployer.address)
        ]).receipts[0].result.expectOk().expectTuple();
    }
    getFundsSent(owner, tokenId) {
        return this.chain.callReadOnlyFn(`pool-v1-0`, "get-funds-sent", [
            types.principal(owner),
            types.uint(tokenId), 
        ], this.deployer.address).result;
    }
    signalWithdrawal(lpToken, tokenId, amount, lender) {
        return this.chain.mineBlock([
            Tx.contractCall('pool-v1-0', 'signal-withdrawal', [
                types.principal(lpToken),
                types.uint(tokenId),
                types.uint(amount)
            ], lender)
        ]);
    }
    withdraw(amount, lender) {
        return this.chain.mineBlock([
            Tx.contractCall('pool-v1-0', 'withdraw', [
                types.uint(amount)
            ], lender)
        ]);
    }
    claimInterest(loanId, poolDelegate) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "claim-interest", [
                types.uint(loanId), 
            ], poolDelegate)
        ]);
    }
    withdrawFunds(lender) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "withdraw-funds", [], lender)
        ]);
    }
    addLiquidityProvider(tokenId, lp, delegate) {
        return this.chain.mineBlock([
            Tx.contractCall('pool-v1-0', 'add-liquidity-provider', [
                types.uint(tokenId),
                types.principal(lp), 
            ], delegate)
        ]);
    }
    withdrawZestRewards(tokenId, zestRewardsContract, rewardsCalc, lender) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "withdraw-zest-rewards", [
                types.uint(tokenId),
                types.principal(zestRewardsContract),
                types.principal(rewardsCalc), 
            ], lender)
        ]);
    }
    liquidateLoan(loanId, lpToken, tokenId, lv, collateralVault, collToken, coverToken, spToken, coverVault, swapRouter, xbtc, poolDelegate) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "liquidate-loan", [
                types.uint(loanId),
                types.principal(lpToken),
                types.uint(tokenId),
                types.principal(lv),
                types.principal(collateralVault),
                types.principal(collToken),
                types.principal(coverToken),
                types.principal(spToken),
                types.principal(coverVault),
                types.principal(swapRouter),
                types.principal(xbtc), 
            ], poolDelegate)
        ]);
    }
    declareLoanLiquidated(loanId, lpToken, tokenId, collateralVault, collToken, spToken, coverVault, coverToken, xbtc, governor) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "declare-loan-liquidated", [
                types.uint(loanId),
                types.principal(lpToken),
                types.uint(tokenId),
                types.principal(collateralVault),
                types.principal(collToken),
                types.principal(spToken),
                types.principal(coverVault),
                types.principal(coverToken),
                // types.principal(swapRouter),
                types.principal(xbtc), 
            ], governor)
        ]);
    }
    returnOtcLiquidation(loanId, lpToken, tokenId, collateralVault, collToken, fundsReturned, lv, xbtcRecovered, spToken, coverVault, coverToken, xbtc, governor) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "return-otc-liquidation", [
                types.uint(loanId),
                types.principal(lpToken),
                types.uint(tokenId),
                types.principal(collateralVault),
                types.principal(collToken),
                types.uint(fundsReturned),
                types.principal(lv),
                types.uint(xbtcRecovered),
                types.principal(spToken),
                types.principal(coverVault),
                types.principal(coverToken),
                types.principal(xbtc), 
            ], governor)
        ]);
    }
    acceptRollover(loanId, lpToken, tokenId, lv, fv, xbtc, delegate) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "accept-rollover", [
                types.uint(loanId),
                types.principal(lpToken),
                types.uint(tokenId),
                types.principal(lv),
                types.principal(fv),
                types.principal(xbtc), 
            ], delegate)
        ]);
    }
    approveGovernor(governor, tokenId, delegate) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "approve-governor", [
                types.principal(governor),
                types.uint(tokenId), 
            ], delegate)
        ]);
    }
    removeGovernor(governor, tokenId, delegate) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "removed-governor", [
                types.principal(governor),
                types.uint(tokenId), 
            ], delegate)
        ]);
    }
    setContractOwner(newOwner, owner) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "set-contract-owner", [
                types.principal(newOwner), 
            ], owner)
        ]);
    }
    completeRolloverNoWithdrawal(loanId, lpToken, tokenId, collType, collVault, fundingVault, swapRouter, xbtc, caller) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "complete-rollover-no-withdrawal", [
                types.uint(loanId),
                types.principal(lpToken),
                types.uint(tokenId),
                types.principal(collType),
                types.principal(collVault),
                types.principal(fundingVault),
                types.principal(swapRouter),
                types.principal(xbtc), 
            ], caller)
        ]);
    }
    impairLoan(tokenId, loanId, caller) {
        return this.chain.mineBlock([
            Tx.contractCall(`pool-v1-0`, "impair-loan", [
                types.uint(tokenId),
                types.uint(loanId)
            ], caller)
        ]);
    }
    hasLockedFunds(tokenId, owner, deployer) {
        return this.chain.callReadOnlyFn(`${deployer}.pool-v1-0`, "has-locked-funds", [
            types.uint(tokenId),
            types.principal(owner), 
        ], deployer);
    }
    lockedFundsFor(tokenId, owner, deployer) {
        return this.chain.callReadOnlyFn(`${deployer}.pool-v1-0`, "funds-locked-for", [
            types.uint(tokenId),
            types.principal(owner), 
        ], deployer);
    }
    fundsCommitmentEndsAtHeight(tokenId, owner, deployer) {
        return this.chain.callReadOnlyFn(`${deployer}.pool-v1-0`, "funds-commitment-ends-at-height", [
            types.uint(tokenId),
            types.principal(owner), 
        ], deployer);
    }
    calculateNewCommitment(prevFunds, amount, factor, owner, tokenId, deployer) {
        return this.chain.callReadOnlyFn(`${deployer}.pool-v1-0`, "calculate-new-commitment", [
            types.uint(prevFunds),
            types.uint(amount),
            types.uint(factor),
            types.principal(owner),
            types.uint(tokenId), 
        ], deployer);
    }
    timeLeftUntilWithdrawal(tokenId, owner, deployer) {
        return this.chain.callReadOnlyFn(`${deployer}.pool-v1-0`, "time-left-until-withdrawal", [
            types.uint(tokenId),
            types.principal(owner), 
        ], deployer);
    }
}
export { Pool };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vVXNlcnMvZmVybmFuZG9mb3kvRG9jdW1lbnRzL3plc3QtY29udHJhY3RzL29uY2hhaW4vdGVzdHMvaW50ZXJmYWNlcy9wb29sLXYxLTAudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVHgsIENoYWluLCBBY2NvdW50LCB0eXBlcyB9IGZyb20gJ2h0dHBzOi8vZGVuby5sYW5kL3gvY2xhcmluZXRAdjEuMC4yL2luZGV4LnRzJztcbmltcG9ydCB7IEJ1ZmZlciB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xNTkuMC9ub2RlL2J1ZmZlci50c1wiO1xuXG5jbGFzcyBQb29sIHtcbiAgY2hhaW46IENoYWluO1xuICBkZXBsb3llcjogQWNjb3VudDtcblxuICBjb25zdHJ1Y3RvcihjaGFpbjogQ2hhaW4sIGRlcGxveWVyOiBBY2NvdW50KSB7XG4gICAgICB0aGlzLmNoYWluID0gY2hhaW47XG4gICAgICB0aGlzLmRlcGxveWVyID0gZGVwbG95ZXI7XG4gIH1cblxuICBjcmVhdGVQb29sKFxuICAgIGRlbGVnYXRlOiBzdHJpbmcsXG4gICAgbHA6IHN0cmluZyxcbiAgICB6cDogc3RyaW5nLFxuICAgIHBheW1lbnQ6IHN0cmluZyxcbiAgICByZXdhcmRzQ2FsYzogc3RyaW5nLFxuICAgIHN0YWtpbmdGZWU6IG51bWJlcixcbiAgICBkZWxlZ2F0ZUZlZTogbnVtYmVyLFxuICAgIGxpcXVpZGl0eUNhcDogbnVtYmVyLFxuICAgIGNvdmVyQ2FwOiBudW1iZXIsXG4gICAgbWluQ3ljbGVzOiBudW1iZXIsXG4gICAgbWF4TWF0dXJpdHlMZW5ndGg6IG51bWJlcixcbiAgICBsaXF1aWRpdHlWYXVsdDogc3RyaW5nLFxuICAgIGNvdmVyUG9vbFRva2VuOiBzdHJpbmcsXG4gICAgY292ZXJWYXVsdDogc3RyaW5nLFxuICAgIGNvdmVyUmV3YXJkc1Rva2VuOiBzdHJpbmcsXG4gICAgY292ZXJUb2tlbjogc3RyaW5nLFxuICAgIG9wZW46IGJvb2xlYW4sXG4gICAgKSB7XG4gICAgICByZXR1cm4gdGhpcy5jaGFpbi5taW5lQmxvY2soW1xuICAgICAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICAgICAgJ3Bvb2wtdjEtMCcsXG4gICAgICAgICAgJ2NyZWF0ZS1wb29sJyxcbiAgICAgICAgICBbXG4gICAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoZGVsZWdhdGUpLFxuICAgICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxwKSxcbiAgICAgICAgICAgIHR5cGVzLnByaW5jaXBhbCh6cCksXG4gICAgICAgICAgICB0eXBlcy5wcmluY2lwYWwocGF5bWVudCksXG4gICAgICAgICAgICB0eXBlcy5wcmluY2lwYWwocmV3YXJkc0NhbGMpLFxuICAgICAgICAgICAgdHlwZXMudWludChzdGFraW5nRmVlKSxcbiAgICAgICAgICAgIHR5cGVzLnVpbnQoZGVsZWdhdGVGZWUpLFxuICAgICAgICAgICAgdHlwZXMudWludChsaXF1aWRpdHlDYXApLFxuICAgICAgICAgICAgdHlwZXMudWludChjb3ZlckNhcCksXG4gICAgICAgICAgICB0eXBlcy51aW50KG1pbkN5Y2xlcyksXG4gICAgICAgICAgICB0eXBlcy51aW50KG1heE1hdHVyaXR5TGVuZ3RoKSxcbiAgICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChsaXF1aWRpdHlWYXVsdCksXG4gICAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoY292ZXJQb29sVG9rZW4pLFxuICAgICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNvdmVyVmF1bHQpLFxuICAgICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNvdmVyUmV3YXJkc1Rva2VuKSxcbiAgICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChjb3ZlclRva2VuKSxcbiAgICAgICAgICAgIHR5cGVzLmJvb2wob3BlbiksXG4gICAgICAgICAgXSxcbiAgICAgICAgICB0aGlzLmRlcGxveWVyLmFkZHJlc3NcbiAgICAgICAgKVxuICAgICAgXSk7XG4gICAgfVxuXG4gIGZpbmFsaXplUG9vbChcbiAgICBkZWxlZ2F0ZTogc3RyaW5nLFxuICAgIGxwOiBzdHJpbmcsXG4gICAgemVzdERpc3Q6IHN0cmluZyxcbiAgICBjcDogc3RyaW5nLFxuICAgIHRva2VuSWQ6IG51bWJlcixcbiAgKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgIFR4LmNvbnRyYWN0Q2FsbChcbiAgICAgICAgJ3Bvb2wtdjEtMCcsXG4gICAgICAgICdmaW5hbGl6ZS1wb29sJyxcbiAgICAgICAgW1xuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChscCksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKHplc3REaXN0KSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoY3ApLFxuICAgICAgICAgIHR5cGVzLnVpbnQodG9rZW5JZClcbiAgICAgICAgXSxcbiAgICAgICAgZGVsZWdhdGVcbiAgICAgIClcbiAgICBdKTtcbiAgfVxuXG4gIGNyZWF0ZUxvYW4oXG4gICAgbHA6IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgYW1vdW50OiBudW1iZXIsXG4gICAgYXNzZXQ6IHN0cmluZyxcbiAgICBjb2xsUmF0aW86IG51bWJlcixcbiAgICBjb2xsVG9rZW46IHN0cmluZyxcbiAgICBhcHI6IG51bWJlcixcbiAgICBsb2FuTWF0dXJpdHlMZW5ndGg6IG51bWJlcixcbiAgICBwYXltZW50UGVyaW9kOiBudW1iZXIsXG4gICAgY29sbFZhdWx0OiBzdHJpbmcsXG4gICAgZnVuZGluZ1ZhdWx0OiBzdHJpbmcsXG4gICAgYm9ycm93ZXI6IHN0cmluZ1xuICAgICkge1xuICAgIHJldHVybiB0aGlzLmNoYWluLm1pbmVCbG9jayhbXG4gICAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICAgIGBwb29sLXYxLTBgLFxuICAgICAgICBcImNyZWF0ZS1sb2FuXCIsXG4gICAgICAgIFtcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwobHApLFxuICAgICAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICAgICAgdHlwZXMudWludChhbW91bnQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChhc3NldCksXG4gICAgICAgICAgdHlwZXMudWludChjb2xsUmF0aW8pLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChjb2xsVG9rZW4pLFxuICAgICAgICAgIHR5cGVzLnVpbnQoYXByKSxcbiAgICAgICAgICB0eXBlcy51aW50KGxvYW5NYXR1cml0eUxlbmd0aCksXG4gICAgICAgICAgdHlwZXMudWludChwYXltZW50UGVyaW9kKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoY29sbFZhdWx0KSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoZnVuZGluZ1ZhdWx0KSxcbiAgICAgICAgXSxcbiAgICAgICAgYm9ycm93ZXJcbiAgICAgIClcbiAgICBdKTtcbiAgfVxuXG4gIGZ1bmRMb2FuKFxuICAgIGxvYW5JZDogbnVtYmVyLFxuICAgIGxwOiBzdHJpbmcsXG4gICAgdG9rZW5JZDogbnVtYmVyLFxuICAgIGxpcXVpZGl0eVZhdWx0OiBzdHJpbmcsXG4gICAgZnVuZGluZ1ZhdWx0OiBzdHJpbmcsXG4gICAgeGJ0Yzogc3RyaW5nLFxuICAgIGRlbGVnYXRlOiBzdHJpbmdcbiAgICApIHtcbiAgICByZXR1cm4gdGhpcy5jaGFpbi5taW5lQmxvY2soW1xuICAgICAgVHguY29udHJhY3RDYWxsKFxuICAgICAgICBgcG9vbC12MS0wYCxcbiAgICAgICAgXCJmdW5kLWxvYW5cIixcbiAgICAgICAgW1xuICAgICAgICAgIHR5cGVzLnVpbnQobG9hbklkKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwobHApLFxuICAgICAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxpcXVpZGl0eVZhdWx0KSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoZnVuZGluZ1ZhdWx0KSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoeGJ0YylcbiAgICAgICAgXSxcbiAgICAgICAgZGVsZWdhdGVcbiAgICAgIClcbiAgICBdKTtcbiAgfVxuXG4gIHRyaWdnZXJEZWZhdWx0bW9kZShcbiAgICBscFRva2VuOiBzdHJpbmcsXG4gICAgdG9rZW5JZDogbnVtYmVyLFxuICAgIGNhbGxlcjogc3RyaW5nLFxuICApIHtcbiAgICByZXR1cm4gdGhpcy5jaGFpbi5taW5lQmxvY2soW1xuICAgICAgVHguY29udHJhY3RDYWxsKFxuICAgICAgICBcInBvb2wtdjEtMFwiLFxuICAgICAgICBcInRyaWdnZXItZGVmYXVsdC1tb2RlXCIsXG4gICAgICAgIFtcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwobHBUb2tlbiksXG4gICAgICAgICAgdHlwZXMudWludCh0b2tlbklkKVxuICAgICAgICBdLFxuICAgICAgICBjYWxsZXJcbiAgICAgIClcbiAgICBdKVxuICB9XG5cbiAgdW53aW5kKFxuICAgIGxvYW5JZDogbnVtYmVyLFxuICAgIGxwOiBzdHJpbmcsXG4gICAgdG9rZW5JZDogbnVtYmVyLFxuICAgIGxpcXVpZGl0eVZhdWx0OiBzdHJpbmcsXG4gICAgZnVuZGluZ1ZhdWx0OiBzdHJpbmcsXG4gICAgeGJ0Yzogc3RyaW5nLFxuICAgIGNhbGxlcjogc3RyaW5nLFxuICAgICkge1xuICAgIHJldHVybiB0aGlzLmNoYWluLm1pbmVCbG9jayhbXG4gICAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICAgIGBwb29sLXYxLTBgLFxuICAgICAgICBcInVud2luZFwiLFxuICAgICAgICBbXG4gICAgICAgICAgdHlwZXMudWludChsb2FuSWQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChscCksXG4gICAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwobGlxdWlkaXR5VmF1bHQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChmdW5kaW5nVmF1bHQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbCh4YnRjKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoY2FsbGVyKVxuICAgICAgICBdLFxuICAgICAgICBjYWxsZXJcbiAgICAgIClcbiAgICBdKTtcbiAgfVxuXG4gIGVuYWJsZUNvdmVyKGxwVG9rZW46IHN0cmluZywgY3BUb2tlbjogc3RyaW5nLCB0b2tlbklkOiBudW1iZXIsIGRlbGVnYXRlOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5jaGFpbi5taW5lQmxvY2soW1xuICAgICAgVHguY29udHJhY3RDYWxsKFxuICAgICAgICAncG9vbC12MS0wJyxcbiAgICAgICAgJ2VuYWJsZS1jb3ZlcicsXG4gICAgICAgIFtcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwobHBUb2tlbiksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNwVG9rZW4pLFxuICAgICAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICAgIF0sXG4gICAgICAgIGRlbGVnYXRlXG4gICAgICApXG4gICAgXSk7XG4gIH1cblxuICBkaXNhYmxlQ292ZXIobHBUb2tlbjogc3RyaW5nLCBjcFRva2VuOiBzdHJpbmcsIHRva2VuSWQ6IG51bWJlciwgZGVsZWdhdGU6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmNoYWluLm1pbmVCbG9jayhbXG4gICAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICAgICdwb29sLXYxLTAnLFxuICAgICAgICAnZGlzYWJsZS1jb3ZlcicsXG4gICAgICAgIFtcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwobHBUb2tlbiksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNwVG9rZW4pLFxuICAgICAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICAgIF0sXG4gICAgICAgIGRlbGVnYXRlXG4gICAgICApXG4gICAgXSk7XG4gIH1cblxuICBnZXRQb29sKHRva2VuSWQ6bnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgIFR4LmNvbnRyYWN0Q2FsbChcbiAgICAgICAgJ3Bvb2wtdjEtMCcsXG4gICAgICAgICdnZXQtcG9vbCcsXG4gICAgICAgIFtcbiAgICAgICAgICB0eXBlcy51aW50KHRva2VuSWQpXG4gICAgICAgIF0sXG4gICAgICAgIHRoaXMuZGVwbG95ZXIuYWRkcmVzc1xuICAgICAgKVxuICAgIF0pLnJlY2VpcHRzWzBdLnJlc3VsdC5leHBlY3RPaygpLmV4cGVjdFR1cGxlKCk7XG4gIH1cblxuICBnZXRGdW5kc1NlbnQob3duZXI6IHN0cmluZywgdG9rZW5JZDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hhaW4uY2FsbFJlYWRPbmx5Rm4oXG4gICAgICBgcG9vbC12MS0wYCxcbiAgICAgIFwiZ2V0LWZ1bmRzLXNlbnRcIixcbiAgICAgIFtcbiAgICAgICAgdHlwZXMucHJpbmNpcGFsKG93bmVyKSxcbiAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgIF0sXG4gICAgICB0aGlzLmRlcGxveWVyLmFkZHJlc3NcbiAgICApLnJlc3VsdDtcbiAgfVxuXG4gIHNpZ25hbFdpdGhkcmF3YWwobHBUb2tlbjogc3RyaW5nLCB0b2tlbklkOiBudW1iZXIsIGFtb3VudDogbnVtYmVyLCBsZW5kZXI6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmNoYWluLm1pbmVCbG9jayhbXG4gICAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICAgICdwb29sLXYxLTAnLFxuICAgICAgICAnc2lnbmFsLXdpdGhkcmF3YWwnLFxuICAgICAgICBbXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxwVG9rZW4pLFxuICAgICAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICAgICAgdHlwZXMudWludChhbW91bnQpXG4gICAgICAgIF0sXG4gICAgICAgIGxlbmRlclxuICAgICAgKVxuICAgIF0pO1xuICB9XG5cbiAgd2l0aGRyYXcoYW1vdW50OiBudW1iZXIsIGxlbmRlcjogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgIFR4LmNvbnRyYWN0Q2FsbChcbiAgICAgICAgJ3Bvb2wtdjEtMCcsXG4gICAgICAgICd3aXRoZHJhdycsXG4gICAgICAgIFtcbiAgICAgICAgICB0eXBlcy51aW50KGFtb3VudClcbiAgICAgICAgXSxcbiAgICAgICAgbGVuZGVyXG4gICAgICApXG4gICAgXSk7XG4gIH1cblxuICBjbGFpbUludGVyZXN0KGxvYW5JZDogbnVtYmVyLCBwb29sRGVsZWdhdGU6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmNoYWluLm1pbmVCbG9jayhbXG4gICAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICAgIGBwb29sLXYxLTBgLFxuICAgICAgICBcImNsYWltLWludGVyZXN0XCIsXG4gICAgICAgIFtcbiAgICAgICAgICB0eXBlcy51aW50KGxvYW5JZCksXG4gICAgICAgIF0sXG4gICAgICAgIHBvb2xEZWxlZ2F0ZVxuICAgICAgKVxuICAgIF0pO1xuICB9XG5cbiAgd2l0aGRyYXdGdW5kcyhsZW5kZXI6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmNoYWluLm1pbmVCbG9jayhbXG4gICAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICAgIGBwb29sLXYxLTBgLFxuICAgICAgICBcIndpdGhkcmF3LWZ1bmRzXCIsXG4gICAgICAgIFtdLFxuICAgICAgICBsZW5kZXJcbiAgICAgIClcbiAgICBdKTtcbiAgfVxuXG4gIGFkZExpcXVpZGl0eVByb3ZpZGVyKFxuICAgIHRva2VuSWQ6IG51bWJlcixcbiAgICBscDogc3RyaW5nLFxuICAgIGRlbGVnYXRlOiBzdHJpbmcsXG4gICkge1xuICAgIHJldHVybiB0aGlzLmNoYWluLm1pbmVCbG9jayhbXG4gICAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICAgICdwb29sLXYxLTAnLFxuICAgICAgICAnYWRkLWxpcXVpZGl0eS1wcm92aWRlcicsXG4gICAgICAgIFtcbiAgICAgICAgICB0eXBlcy51aW50KHRva2VuSWQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChscCksXG4gICAgICAgIF0sXG4gICAgICAgIGRlbGVnYXRlXG4gICAgICApXG4gICAgXSk7XG4gIH1cblxuICB3aXRoZHJhd1plc3RSZXdhcmRzKFxuICAgIHRva2VuSWQ6IG51bWJlcixcbiAgICB6ZXN0UmV3YXJkc0NvbnRyYWN0OiBzdHJpbmcsXG4gICAgcmV3YXJkc0NhbGM6IHN0cmluZyxcbiAgICBsZW5kZXI6IHN0cmluZ1xuICAgICkge1xuICAgIHJldHVybiB0aGlzLmNoYWluLm1pbmVCbG9jayhbXG4gICAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICAgIGBwb29sLXYxLTBgLFxuICAgICAgICBcIndpdGhkcmF3LXplc3QtcmV3YXJkc1wiLFxuICAgICAgICBbXG4gICAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoemVzdFJld2FyZHNDb250cmFjdCksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKHJld2FyZHNDYWxjKSxcbiAgICAgICAgXSxcbiAgICAgICAgbGVuZGVyXG4gICAgICApXG4gICAgXSk7XG4gIH1cblxuICBsaXF1aWRhdGVMb2FuKFxuICAgIGxvYW5JZDogbnVtYmVyLFxuICAgIGxwVG9rZW46IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgbHY6IHN0cmluZyxcbiAgICBjb2xsYXRlcmFsVmF1bHQ6IHN0cmluZyxcbiAgICBjb2xsVG9rZW46IHN0cmluZyxcbiAgICBjb3ZlclRva2VuOiBzdHJpbmcsXG4gICAgc3BUb2tlbjogc3RyaW5nLFxuICAgIGNvdmVyVmF1bHQ6IHN0cmluZyxcbiAgICBzd2FwUm91dGVyOiBzdHJpbmcsXG4gICAgeGJ0Yzogc3RyaW5nLFxuICAgIHBvb2xEZWxlZ2F0ZTogc3RyaW5nXG4gICAgKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgIFR4LmNvbnRyYWN0Q2FsbChcbiAgICAgICAgYHBvb2wtdjEtMGAsXG4gICAgICAgIFwibGlxdWlkYXRlLWxvYW5cIixcbiAgICAgICAgW1xuICAgICAgICAgIHR5cGVzLnVpbnQobG9hbklkKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwobHBUb2tlbiksXG4gICAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwobHYpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChjb2xsYXRlcmFsVmF1bHQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChjb2xsVG9rZW4pLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChjb3ZlclRva2VuKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoc3BUb2tlbiksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNvdmVyVmF1bHQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChzd2FwUm91dGVyKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoeGJ0YyksXG4gICAgICAgIF0sXG4gICAgICAgIHBvb2xEZWxlZ2F0ZVxuICAgICAgKVxuICAgIF0pO1xuICB9XG5cbiAgZGVjbGFyZUxvYW5MaXF1aWRhdGVkKFxuICAgIGxvYW5JZDogbnVtYmVyLFxuICAgIGxwVG9rZW46IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgY29sbGF0ZXJhbFZhdWx0OiBzdHJpbmcsXG4gICAgY29sbFRva2VuOiBzdHJpbmcsXG4gICAgc3BUb2tlbjogc3RyaW5nLFxuICAgIGNvdmVyVmF1bHQ6IHN0cmluZyxcbiAgICBjb3ZlclRva2VuOiBzdHJpbmcsXG4gICAgeGJ0Yzogc3RyaW5nLFxuICAgIGdvdmVybm9yOiBzdHJpbmdcbiAgICApIHtcbiAgICByZXR1cm4gdGhpcy5jaGFpbi5taW5lQmxvY2soW1xuICAgICAgVHguY29udHJhY3RDYWxsKFxuICAgICAgICBgcG9vbC12MS0wYCxcbiAgICAgICAgXCJkZWNsYXJlLWxvYW4tbGlxdWlkYXRlZFwiLFxuICAgICAgICBbXG4gICAgICAgICAgdHlwZXMudWludChsb2FuSWQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChscFRva2VuKSxcbiAgICAgICAgICB0eXBlcy51aW50KHRva2VuSWQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChjb2xsYXRlcmFsVmF1bHQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChjb2xsVG9rZW4pLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChzcFRva2VuKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoY292ZXJWYXVsdCksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNvdmVyVG9rZW4pLFxuICAgICAgICAgIC8vIHR5cGVzLnByaW5jaXBhbChzd2FwUm91dGVyKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoeGJ0YyksXG4gICAgICAgIF0sXG4gICAgICAgIGdvdmVybm9yXG4gICAgICApXG4gICAgXSk7XG4gIH1cblxuICByZXR1cm5PdGNMaXF1aWRhdGlvbihcbiAgICBsb2FuSWQ6IG51bWJlcixcbiAgICBscFRva2VuOiBzdHJpbmcsXG4gICAgdG9rZW5JZDogbnVtYmVyLFxuICAgIGNvbGxhdGVyYWxWYXVsdDogc3RyaW5nLFxuICAgIGNvbGxUb2tlbjogc3RyaW5nLFxuICAgIGZ1bmRzUmV0dXJuZWQ6IG51bWJlcixcbiAgICBsdjogc3RyaW5nLFxuICAgIHhidGNSZWNvdmVyZWQ6IG51bWJlcixcbiAgICBzcFRva2VuOiBzdHJpbmcsXG4gICAgY292ZXJWYXVsdDogc3RyaW5nLFxuICAgIGNvdmVyVG9rZW46IHN0cmluZyxcbiAgICB4YnRjOiBzdHJpbmcsXG4gICAgZ292ZXJub3I6IHN0cmluZ1xuICAgICkge1xuICAgIHJldHVybiB0aGlzLmNoYWluLm1pbmVCbG9jayhbXG4gICAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICAgIGBwb29sLXYxLTBgLFxuICAgICAgICBcInJldHVybi1vdGMtbGlxdWlkYXRpb25cIixcbiAgICAgICAgW1xuICAgICAgICAgIHR5cGVzLnVpbnQobG9hbklkKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwobHBUb2tlbiksXG4gICAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoY29sbGF0ZXJhbFZhdWx0KSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoY29sbFRva2VuKSxcbiAgICAgICAgICB0eXBlcy51aW50KGZ1bmRzUmV0dXJuZWQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChsdiksXG4gICAgICAgICAgdHlwZXMudWludCh4YnRjUmVjb3ZlcmVkKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoc3BUb2tlbiksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNvdmVyVmF1bHQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChjb3ZlclRva2VuKSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoeGJ0YyksXG4gICAgICAgIF0sXG4gICAgICAgIGdvdmVybm9yXG4gICAgICApXG4gICAgXSk7XG4gIH1cblxuICBhY2NlcHRSb2xsb3Zlcihsb2FuSWQ6IG51bWJlciwgbHBUb2tlbjogc3RyaW5nLCB0b2tlbklkOiBudW1iZXIsIGx2OiBzdHJpbmcsIGZ2OnN0cmluZywgeGJ0Yzogc3RyaW5nLCBkZWxlZ2F0ZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgIFR4LmNvbnRyYWN0Q2FsbChcbiAgICAgICAgYHBvb2wtdjEtMGAsXG4gICAgICAgIFwiYWNjZXB0LXJvbGxvdmVyXCIsXG4gICAgICAgIFtcbiAgICAgICAgICB0eXBlcy51aW50KGxvYW5JZCksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGxwVG9rZW4pLFxuICAgICAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGx2KSxcbiAgICAgICAgICB0eXBlcy5wcmluY2lwYWwoZnYpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbCh4YnRjKSxcbiAgICAgICAgXSxcbiAgICAgICAgZGVsZWdhdGUpXG4gICAgXSk7XG4gIH1cblxuICBhcHByb3ZlR292ZXJub3IoZ292ZXJub3I6IHN0cmluZywgdG9rZW5JZDogbnVtYmVyLCBkZWxlZ2F0ZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgIFR4LmNvbnRyYWN0Q2FsbChcbiAgICAgICAgYHBvb2wtdjEtMGAsXG4gICAgICAgIFwiYXBwcm92ZS1nb3Zlcm5vclwiLFxuICAgICAgICBbXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGdvdmVybm9yKSxcbiAgICAgICAgICB0eXBlcy51aW50KHRva2VuSWQpLFxuICAgICAgICBdLFxuICAgICAgICBkZWxlZ2F0ZSlcbiAgICBdKTtcbiAgfVxuXG4gIHJlbW92ZUdvdmVybm9yKGdvdmVybm9yOiBzdHJpbmcsIHRva2VuSWQ6IG51bWJlciwgZGVsZWdhdGU6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmNoYWluLm1pbmVCbG9jayhbXG4gICAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICAgIGBwb29sLXYxLTBgLFxuICAgICAgICBcInJlbW92ZWQtZ292ZXJub3JcIixcbiAgICAgICAgW1xuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChnb3Zlcm5vciksXG4gICAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgXSxcbiAgICAgICAgZGVsZWdhdGUpXG4gICAgXSk7XG4gIH1cblxuXG4gIHNldENvbnRyYWN0T3duZXIobmV3T3duZXI6IHN0cmluZywgb3duZXI6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmNoYWluLm1pbmVCbG9jayhbXG4gICAgICBUeC5jb250cmFjdENhbGwoXG4gICAgICAgIGBwb29sLXYxLTBgLFxuICAgICAgICBcInNldC1jb250cmFjdC1vd25lclwiLFxuICAgICAgICBbXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKG5ld093bmVyKSxcbiAgICAgICAgXSxcbiAgICAgICAgb3duZXIpXG4gICAgXSk7XG4gIH1cblxuICBjb21wbGV0ZVJvbGxvdmVyTm9XaXRoZHJhd2FsKFxuICAgIGxvYW5JZDogbnVtYmVyLFxuICAgIGxwVG9rZW46IHN0cmluZyxcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgY29sbFR5cGU6IHN0cmluZyxcbiAgICBjb2xsVmF1bHQ6IHN0cmluZyxcbiAgICBmdW5kaW5nVmF1bHQ6IHN0cmluZyxcbiAgICBzd2FwUm91dGVyOiBzdHJpbmcsXG4gICAgeGJ0Yzogc3RyaW5nLFxuICAgIGNhbGxlcjogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hhaW4ubWluZUJsb2NrKFtcbiAgICAgIFR4LmNvbnRyYWN0Q2FsbChcbiAgICAgICAgYHBvb2wtdjEtMGAsXG4gICAgICAgIFwiY29tcGxldGUtcm9sbG92ZXItbm8td2l0aGRyYXdhbFwiLFxuICAgICAgICBbXG4gICAgICAgICAgdHlwZXMudWludChsb2FuSWQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChscFRva2VuKSxcbiAgICAgICAgICB0eXBlcy51aW50KHRva2VuSWQpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbChjb2xsVHlwZSksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGNvbGxWYXVsdCksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKGZ1bmRpbmdWYXVsdCksXG4gICAgICAgICAgdHlwZXMucHJpbmNpcGFsKHN3YXBSb3V0ZXIpLFxuICAgICAgICAgIHR5cGVzLnByaW5jaXBhbCh4YnRjKSxcbiAgICAgICAgXSxcbiAgICAgICAgY2FsbGVyKVxuICAgIF0pO1xuICB9XG5cbiAgaW1wYWlyTG9hbihcbiAgICB0b2tlbklkOiBudW1iZXIsXG4gICAgbG9hbklkOiBudW1iZXIsXG4gICAgY2FsbGVyOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5jaGFpbi5taW5lQmxvY2soW1xuICAgICAgVHguY29udHJhY3RDYWxsKFxuICAgICAgICBgcG9vbC12MS0wYCxcbiAgICAgICAgXCJpbXBhaXItbG9hblwiLFxuICAgICAgICBbXG4gICAgICAgICAgdHlwZXMudWludCh0b2tlbklkKSxcbiAgICAgICAgICB0eXBlcy51aW50KGxvYW5JZClcbiAgICAgICAgXSxcbiAgICAgICAgY2FsbGVyKVxuICAgIF0pO1xuICB9XG5cbiAgaGFzTG9ja2VkRnVuZHModG9rZW5JZDogbnVtYmVyLCBvd25lcjogc3RyaW5nLCBkZXBsb3llcjogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hhaW4uY2FsbFJlYWRPbmx5Rm4oYCR7ZGVwbG95ZXJ9LnBvb2wtdjEtMGAsIFwiaGFzLWxvY2tlZC1mdW5kc1wiLCBbXG4gICAgICB0eXBlcy51aW50KHRva2VuSWQpLFxuICAgICAgdHlwZXMucHJpbmNpcGFsKG93bmVyKSxcbiAgICBdLCBkZXBsb3llcik7XG4gIH1cblxuICBsb2NrZWRGdW5kc0Zvcih0b2tlbklkOiBudW1iZXIsIG93bmVyOiBzdHJpbmcsIGRlcGxveWVyOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5jaGFpbi5jYWxsUmVhZE9ubHlGbihgJHtkZXBsb3llcn0ucG9vbC12MS0wYCwgXCJmdW5kcy1sb2NrZWQtZm9yXCIsIFtcbiAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICB0eXBlcy5wcmluY2lwYWwob3duZXIpLFxuICAgIF0sIGRlcGxveWVyKTtcbiAgfVxuXG4gIGZ1bmRzQ29tbWl0bWVudEVuZHNBdEhlaWdodCh0b2tlbklkOiBudW1iZXIsIG93bmVyOiBzdHJpbmcsIGRlcGxveWVyOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdGhpcy5jaGFpbi5jYWxsUmVhZE9ubHlGbihgJHtkZXBsb3llcn0ucG9vbC12MS0wYCwgXCJmdW5kcy1jb21taXRtZW50LWVuZHMtYXQtaGVpZ2h0XCIsIFtcbiAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICB0eXBlcy5wcmluY2lwYWwob3duZXIpLFxuICAgIF0sIGRlcGxveWVyKTtcbiAgfVxuXG4gIGNhbGN1bGF0ZU5ld0NvbW1pdG1lbnQocHJldkZ1bmRzOiBudW1iZXIsIGFtb3VudDogbnVtYmVyLCBmYWN0b3I6IG51bWJlciwgb3duZXI6IHN0cmluZywgdG9rZW5JZDogbnVtYmVyLCBkZXBsb3llcjogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuY2hhaW4uY2FsbFJlYWRPbmx5Rm4oYCR7ZGVwbG95ZXJ9LnBvb2wtdjEtMGAsIFwiY2FsY3VsYXRlLW5ldy1jb21taXRtZW50XCIsIFtcbiAgICAgIHR5cGVzLnVpbnQocHJldkZ1bmRzKSxcbiAgICAgIHR5cGVzLnVpbnQoYW1vdW50KSxcbiAgICAgIHR5cGVzLnVpbnQoZmFjdG9yKSxcbiAgICAgIHR5cGVzLnByaW5jaXBhbChvd25lciksXG4gICAgICB0eXBlcy51aW50KHRva2VuSWQpLFxuICAgIF0sIGRlcGxveWVyKTtcbiAgfVxuXG4gIHRpbWVMZWZ0VW50aWxXaXRoZHJhd2FsKHRva2VuSWQ6IG51bWJlciwgb3duZXI6IHN0cmluZywgZGVwbG95ZXI6IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmNoYWluLmNhbGxSZWFkT25seUZuKGAke2RlcGxveWVyfS5wb29sLXYxLTBgLCBcInRpbWUtbGVmdC11bnRpbC13aXRoZHJhd2FsXCIsIFtcbiAgICAgIHR5cGVzLnVpbnQodG9rZW5JZCksXG4gICAgICB0eXBlcy5wcmluY2lwYWwob3duZXIpLFxuICAgIF0sIGRlcGxveWVyKTtcbiAgfVxuXG59XG5cbmV4cG9ydCB7IFBvb2wgfTsiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxFQUFFLEVBQWtCLEtBQUssUUFBUSw4Q0FBOEMsQ0FBQztBQUd6RixNQUFNLElBQUk7SUFDUixLQUFLLENBQVE7SUFDYixRQUFRLENBQVU7SUFFbEIsWUFBWSxLQUFZLEVBQUUsUUFBaUIsQ0FB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