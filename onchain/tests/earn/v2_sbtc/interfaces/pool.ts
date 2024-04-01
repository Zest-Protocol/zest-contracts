import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

class Pool {
    chain: Chain;
    deployer: Account;

    constructor(chain: Chain, deployer: Account) {
        this.chain = chain;
        this.deployer = deployer;
    }

    deposit(amount: number, lender: string) {
        return this.chain.mineBlock([
            Tx.contractCall(
                'pool',
                'deposit',
                [
                    types.uint(amount)
                ],
                lender
            )
        ]);
    }

    withdraw(amount: number, lender: string) {
        return this.chain.mineBlock([
            Tx.contractCall(
                'pool',
                'withdraw',
                [
                    types.uint(amount)
                ],
                lender
            )
        ]);
    }

    fundLoan(loanId: number) {
        return this.chain.mineBlock([
            Tx.contractCall(
                'pool',
                'fund-loan',
                [
                    types.uint(loanId)
                ],
                this.deployer.address
            )
        ]);
    }

    claimInterest(loanId: number, poolDelegate: string) {
        return this.chain.mineBlock([
            Tx.contractCall(
                `pool`,
                "claim-interest",
                [
                    types.uint(loanId),
                ],
                poolDelegate
            )
        ]);
    }

    withdrawFunds(lender: string) {
        return this.chain.mineBlock([
            Tx.contractCall(
                `pool`,
                "withdraw-funds",
                [],
                lender
            )
        ]);
    }

    liquidate(loanId: number, collateralVault: string, poolDelegate: string) {
        return this.chain.mineBlock([
            Tx.contractCall(
                `pool`,
                "liquidate",
                [
                    types.uint(loanId),
                    types.principal(collateralVault),
                ],
                poolDelegate
            )
        ]);
    }
}

export { Pool };