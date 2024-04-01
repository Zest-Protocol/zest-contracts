import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';

class Payment {

  static getLateFee(chain: Chain, amount: number, paymentPeriod: number, apr: number, height: number, nextPayment: number, caller: string) {
    return chain.callReadOnlyFn(
      `payment-fixed`,
      "get-payment",
      [
        types.uint(amount),
        types.uint(paymentPeriod),
        types.uint(apr),
        types.uint(height),
        types.uint(nextPayment),
        types.principal(caller),
      ], caller).result;
  }

  static getPayment(chain: Chain, amount: number, paymentPeriod: number, apr: number, height: number, nextPayment: number, caller: string) {
    return chain.callReadOnlyFn(
      `payment-fixed`,
      "get-payment",
      [
        types.uint(amount),
        types.uint(paymentPeriod),
        types.uint(apr),
        types.uint(height),
        types.uint(nextPayment),
        types.principal(caller),
      ], caller).result;
  }

  static triggerLatePayment(loanId: number, tokenId: number, caller: string) {
    return Tx.contractCall(
      `payment-fixed`,
      "trigger-late-payment",
      [
        types.uint(loanId),
        types.uint(tokenId),
      ], caller
    );
  }

  static setContractOwner(
    newOwner: string,
    owner: string) {
    return Tx.contractCall(
      "payment-fixed",
      "set-contract-owner",
      [
        types.principal(newOwner),
      ],
      owner
    )
  }

  static setLateFee(lateFee: number, caller: string) {
    return Tx.contractCall(
      `payment-fixed`,
      "set-late-fee",
      [
        types.uint(lateFee),
      ], caller
    );
  }

  static getCurrentLoanPaymentAt(chain: Chain, loanId: number, height: number, caller: string) {
    return chain.callReadOnlyFn(
      `payment-fixed`,
      "get-loan-payment-at-height",
      [
        types.uint(loanId),
        types.uint(height),
        types.principal(caller),
      ], caller);
  }

  static isPayingLateFees(chain: Chain, caller: string) {
    return chain.callReadOnlyFn(
      `payment-fixed`,
      "is-paying-late-fees",
      [types.principal(caller)],
      caller);
  }

  static getCurrentLoanPayment(chain: Chain, loanId: number, caller: string) {
    return chain.callReadOnlyFn(
      `payment-fixed`,
      "get-current-loan-payment",
      [
        types.uint(loanId),
        types.principal(caller),
      ], caller).result;
  }

  static getEarlyRepaymentAmount(chain: Chain, loanId: number, caller: string) {
    return chain.callReadOnlyFn(
      `payment-fixed`,
      "get-early-repayment-amount"
      ,[
        types.uint(loanId),
        types.principal(caller),
      ], caller).result;
  }
}

export { Payment };