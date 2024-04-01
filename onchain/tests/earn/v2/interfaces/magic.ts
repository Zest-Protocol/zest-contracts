import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

class MagicTest {
  chain: Chain;
  deployer: Account;
  depositNumber = 0;

  constructor(chain: Chain, deployer: Account) {
    this.chain = chain;
    this.deployer = deployer;
  }

  depositToPool(
    lpToken: string,
    zpToken: string,
    liquidityVault: string,
    factor: number,
    lender: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        "bridge-router-test",
        'deposit-to-pool',
        [
          types.principal(lpToken),
          types.principal(zpToken),
          types.principal(liquidityVault),
          types.uint(factor),
        ],
        lender
      )
    ]);
  }

  withdrawFromPool(lpToken: string, liquidityVault: string, amount: number, lender: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        "bridge-router-test",
        'withdraw-from-pool',
        [
          types.principal(lpToken),
          types.principal(liquidityVault),
          types.uint(amount),
        ],
        lender
      )
    ]);
  }

  drawdown(loanId: number, height: number, lpToken:string, collToken: string, collVault: string, fundingVault: string, lender: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        "bridge-router-test",
        'drawdown',
        [
          types.uint(loanId),
          types.uint(height),
          types.principal(lpToken),
          types.principal(collToken),
          types.principal(collVault),
          types.principal(fundingVault),
        ],
        lender
      )
    ]);
  }

  addDeposit(amount: number, height: number, address: string) {
    let block =  this.chain.mineBlock([
      Tx.contractCall(
        "bridge-router-test",
        'add-deposit',
        [
          types.uint(this.depositNumber),
          types.uint(amount),
          types.uint(height),
        ],
        address
      )
    ]);
    this.depositNumber++;
    return block;
  }


  makePayment(loanId: number, height: number, payment: string, lpToken: string, spToken: string, zdToken: string, rewardsCalc: string, amount: number, borrower: string) {
    return this.chain.mineBlock([
        Tx.contractCall(
            `bridge-router-test`,
            "verify-payment",
            [
                types.uint(loanId),
                types.uint(height),
                types.principal(payment),
                types.principal(lpToken),
                types.principal(spToken),
                types.principal(zdToken),
                types.principal(rewardsCalc),
                types.uint(amount),
            ],
            borrower
        )
    ]);
  }

  makeFullPayment(loanId: number, height: number, payment: string, lpToken: string, spToken: string, zdToken: string, rewardsCalc: string, amount: number, borrower: string) {
    return this.chain.mineBlock([
        Tx.contractCall(
            `bridge-router-test`,
            "verify-full-payment",
            [
                types.uint(loanId),
                types.uint(height),
                types.principal(payment),
                types.principal(lpToken),
                types.principal(spToken),
                types.principal(zdToken),
                types.principal(rewardsCalc),
                types.uint(amount),
            ],
            borrower
        )
    ]);
  }

  getSupplierById(supplerId: number, borrower: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
          `magic-protocol`,
          "get-supplier",
          [
              types.uint(supplerId),
          ],
          borrower
      )
    ]);
  }
}

export { MagicTest };