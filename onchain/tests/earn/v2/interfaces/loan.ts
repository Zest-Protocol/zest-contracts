import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

class Loan {
    chain: Chain;
    deployer: Account;

    constructor(chain: Chain, deployer: Account) {
        this.chain = chain;
        this.deployer = deployer;
    }

    createLoan(
        amount: number,
        collAmount: number,
        collVaultDest: string,
        apr: number,
        paymentPeriod: number,
        loanMaturityLength: number,
        debtDest: string,
        collDest: string,
        borrower: string) {
        return this.chain.mineBlock([
            Tx.contractCall(
                `loan`,
                "create-loan",
                [
                    types.uint(amount),
                    types.uint(collAmount),
                    collVaultDest === "" ? types.none() : types.some(types.principal(collVaultDest)),
                    types.uint(apr),
                    types.uint(paymentPeriod),
                    types.uint(loanMaturityLength),
                    types.principal(debtDest),
                    types.principal(collDest),
                ],
                borrower
            )
        ]);
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

    verifyPayment(loanId: number, blockHeight: number, borrower: string) {
        return this.chain.mineBlock([
            Tx.contractCall(
                `loan`,
                "verify-payment",
                [
                    types.uint(loanId),
                    types.uint(blockHeight)
                ],
                borrower
            )
        ]);
    }

    getLoanData(loanId: number): any {
        return this.chain.callReadOnlyFn(`${this.deployer.address}.loan`, "get-loan", [
            types.uint(loanId)
        ], this.deployer.address).result;
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
}

export { Loan };