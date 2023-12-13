import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

class Loan {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
      this.chain = chain;
      this.deployer = deployer;
  }

  getLoanData(loanId: number) {
    return this.chain.callReadOnlyFn(`${this.deployer.address}.loan-v1-0`, "get-loan-read", [
        types.uint(loanId),
    ], this.deployer.address).result.expectTuple();
  }

  getRolloverData(loanId: number) {
    return this.chain.callReadOnlyFn(`${this.deployer.address}.loan-v1-0`, "get-rollover-progress-read", [
        types.uint(loanId),
    ], this.deployer.address);
  }

  getRolloverDataOptional(loanId: number) {
    return this.chain.callReadOnlyFn(`${this.deployer.address}.loan-v1-0`, "get-rollover-progress-optional", [
        types.uint(loanId),
    ], this.deployer.address);
  }

  getNextpaymentIn(loanId: number) {
    return this.chain.callReadOnlyFn(`${this.deployer.address}.loan-v1-0`, "next-payment-in", [
        types.uint(loanId),
    ], this.deployer.address);
  }

  canLiquidate(loanId: number) {
    return this.chain.callReadOnlyFn(`${this.deployer.address}.loan-v1-0`, "can-liquidate", [
        types.uint(loanId),
    ], this.deployer.address);
  }

  drawdown(loanId: number, blockHeight: number, collType: string, collVault: string, borrower: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `loan`,
        "drawdown",
        [
          types.uint(loanId),
          types.uint(blockHeight),
          types.principal(collType),
          types.principal(collVault),
        ],
        borrower
      )
    ]);
  }

  drawdownVerify(
    loanId: number,
    collToken: string,
    collVault: string,
    fundingVault: string,
    lpToken: string,
    tokenId: number,
    poolDelegate: string,
    delegateFee: number,
    swapRouter: string,
    xbtc: string,
    sender: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `loan-v1-0`,
        "drawdown-verify",
        [
          types.uint(loanId),
          types.principal(collToken),
          types.principal(collVault),
          types.principal(fundingVault),
          types.principal(lpToken),
          types.uint(tokenId),
          types.principal(poolDelegate),
          types.uint(delegateFee),
          types.principal(swapRouter),
          types.principal(xbtc),
          types.principal(sender)
        ],
        sender
      )
    ]);
  }

  makePayment(loanId: number, height: number, payment: string, lpToken: string, amount: number, borrower: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `loan-v1-0`,
        "make-payment",
        [
          types.uint(loanId),
          types.uint(height),
          types.principal(payment),
          types.principal(lpToken),
          types.uint(amount),
        ],
        borrower
      )
    ]);
  }

  addBorrower(borrower: string, contractOwner: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `loan-v1-0`,
        "add-borrower",
        [
          types.principal(borrower),
        ],
        contractOwner
      )
    ]);
  }

  isBorrower(borrower: string, caller: string) {
    return this.chain.callReadOnlyFn(
      "loan-v1-0",
      "is-borrower",
      [
        types.principal(borrower),
      ],
      caller
    )
  }

  liquidate(loanId: number, collateralVault: string, poolDelgate: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `loan`,
        "liquidate",
        [
          types.uint(loanId),
          types.principal(collateralVault),
        ],
        poolDelgate
      )
    ]);
  }

  withdrawCollateralLoan(
    loanId: number,
    amount: number,
    swapRouter: string,
    collToken: string,
    xbtc: string,
    collateralVault: string,
    caller: string,
    ) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `loan-v1-0`,
        "withdraw-collateral-loan",
        [
          types.uint(loanId),
          types.uint(amount),
          types.principal(swapRouter),
          types.principal(collToken),
          types.principal(xbtc),
          types.principal(collateralVault)
        ],
        caller
      )
    ]);
  }


  requestRollover(
    loanId: number,
    apr: number | null,
    newAmount: number | null,
    maturityLength: number | null,
    paymentPeriod: number | null,
    collRatio: number | null,
    collType: string,
    borrower: string,
  ) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `loan-v1-0`,
        "request-rollover",
        [
          types.uint(loanId),
          apr ? types.some(types.uint(apr)) : types.none(),
          newAmount ? types.some(types.uint(newAmount)) : types.none(),
          maturityLength ? types.some(types.uint(maturityLength)) : types.none(),
          paymentPeriod ? types.some(types.uint(paymentPeriod)) : types.none(),
          collRatio ? types.some(types.uint(collRatio)): types.none(),
          types.principal(collType),
        ],
        borrower
      )
    ]);
  }
}

export { Loan };