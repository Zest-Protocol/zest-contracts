import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';
import { Buffer } from "https://deno.land/std@0.110.0/node/buffer.ts";

class Pool {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
      this.chain = chain;
      this.deployer = deployer;
  }

  createPool(
    delegate: string,
    lp: string,
    zp: string,
    payment: string,
    rewardsCalc: string,
    stakingFee: number,
    delegateFee: number,
    liquidityCap: number,
    coverCap: number,
    minCycles: number,
    maxMaturityLength: number,
    liquidityVault: string,
    coverPoolToken: string,
    coverVault: string,
    coverRewardsToken: string,
    coverToken: string,
    open: boolean,
    ) {
      return this.chain.mineBlock([
        Tx.contractCall(
          'pool-v1-0',
          'create-pool',
          [
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
          ],
          this.deployer.address
        )
      ]);
    }

  finalizePool(
    delegate: string,
    lp: string,
    zestDist: string,
    cp: string,
    tokenId: number,
  ) {
    return this.chain.mineBlock([
      Tx.contractCall(
        'pool-v1-0',
        'finalize-pool',
        [
          types.principal(lp),
          types.principal(zestDist),
          types.principal(cp),
          types.uint(tokenId)
        ],
        delegate
      )
    ]);
  }

  createLoan(
    lp: string,
    tokenId: number,
    amount: number,
    asset: string,
    collRatio: number,
    collToken: string,
    apr: number,
    loanMaturityLength: number,
    paymentPeriod: number,
    collVault: string,
    fundingVault: string,
    borrower: string
    ) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `pool-v1-0`,
        "create-loan",
        [
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
        ],
        borrower
      )
    ]);
  }

  fundLoan(
    loanId: number,
    lp: string,
    tokenId: number,
    liquidityVault: string,
    fundingVault: string,
    xbtc: string,
    delegate: string
    ) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `pool-v1-0`,
        "fund-loan",
        [
          types.uint(loanId),
          types.principal(lp),
          types.uint(tokenId),
          types.principal(liquidityVault),
          types.principal(fundingVault),
          types.principal(xbtc)
        ],
        delegate
      )
    ]);
  }

  unwind(
    loanId: number,
    lp: string,
    tokenId: number,
    liquidityVault: string,
    xbtc: string,
    delegate: string
    ) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `pool-v1-0`,
        "unwind",
        [
          types.uint(loanId),
          types.principal(lp),
          types.uint(tokenId),
          types.principal(liquidityVault),
          types.principal(xbtc)
        ],
        delegate
      )
    ]);
  }

  enableCover(lpToken: string, cpToken: string, tokenId: number, delegate: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        'pool-v1-0',
        'enable-cover',
        [
          types.principal(lpToken),
          types.principal(cpToken),
          types.uint(tokenId),
        ],
        delegate
      )
    ]);
  }

  disableCover(lpToken: string, cpToken: string, tokenId: number, delegate: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        'pool-v1-0',
        'disable-cover',
        [
          types.principal(lpToken),
          types.principal(cpToken),
          types.uint(tokenId),
        ],
        delegate
      )
    ]);
  }

  getPool(tokenId:number) {
    return this.chain.mineBlock([
      Tx.contractCall(
        'pool-v1-0',
        'get-pool',
        [
          types.uint(tokenId)
        ],
        this.deployer.address
      )
    ]).receipts[0].result.expectOk().expectTuple();
  }

  getFundsSent(owner: string, tokenId: number) {
    return this.chain.callReadOnlyFn(
      `pool-v1-0`,
      "get-funds-sent",
      [
        types.principal(owner),
        types.uint(tokenId),
      ],
      this.deployer.address
    ).result;
  }

  signalWithdrawal(lpToken: string, tokenId: number, amount: number, lender: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        'pool-v1-0',
        'signal-withdrawal',
        [
          types.principal(lpToken),
          types.uint(tokenId),
          types.uint(amount)
        ],
        lender
      )
    ]);
  }

  withdraw(amount: number, lender: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        'pool-v1-0',
        'withdraw',
        [
          types.uint(amount)
        ],
        lender
      )
    ]);
  }

  claimInterest(loanId: number, poolDelegate: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `pool-v1-0`,
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
        `pool-v1-0`,
        "withdraw-funds",
        [],
        lender
      )
    ]);
  }

  withdrawZestRewards(
    tokenId: number,
    zestRewardsContract: string,
    rewardsCalc: string,
    lender: string
    ) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `pool-v1-0`,
        "withdraw-zest-rewards",
        [
          types.uint(tokenId),
          types.principal(zestRewardsContract),
          types.principal(rewardsCalc),
        ],
        lender
      )
    ]);
  }

  liquidateLoan(
    loanId: number,
    lpToken: string,
    tokenId: number,
    collateralVault: string,
    collToken: string,
    coverToken: string,
    spToken: string,
    coverVault: string,
    swapRouter: string,
    xbtc: string,
    poolDelegate: string
    ) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `pool-v1-0`,
        "liquidate-loan",
        [
          types.uint(loanId),
          types.principal(lpToken),
          types.uint(tokenId),
          types.principal(collateralVault),
          types.principal(collToken),
          types.principal(coverToken),
          types.principal(spToken),
          types.principal(coverVault),
          types.principal(swapRouter),
          types.principal(xbtc),
        ],
        poolDelegate
      )
    ]);
  }

  acceptRollover(loanId: number, lpToken: string, tokenId: number, lv: string, fv:string, xbtc: string, delegate: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `pool-v1-0`,
        "accept-rollover",
        [
          types.uint(loanId),
          types.principal(lpToken),
          types.uint(tokenId),
          types.principal(lv),
          types.principal(fv),
          types.principal(xbtc),
        ],
        delegate)
    ]);
  }

  completeRolloverNoWithdrawal(
    loanId: number,
    lpToken: string,
    tokenId: number,
    collType: string,
    collVault: string,
    fundingVault: string,
    swapRouter: string,
    xbtc: string,
    caller: string) {
    return this.chain.mineBlock([
      Tx.contractCall(
        `pool-v1-0`,
        "complete-rollover-no-withdrawal",
        [
          types.uint(loanId),
          types.principal(lpToken),
          types.uint(tokenId),
          types.principal(collType),
          types.principal(collVault),
          types.principal(fundingVault),
          types.principal(swapRouter),
          types.principal(xbtc),
        ],
        caller)
    ]);
  }

  hasLockedFunds(tokenId: number, owner: string, deployer: string) {
    return this.chain.callReadOnlyFn(`${deployer}.pool-v1-0`, "has-locked-funds", [
      types.uint(tokenId),
      types.principal(owner),
    ], deployer);
  }

  lockedFundsFor(tokenId: number, owner: string, deployer: string) {
    return this.chain.callReadOnlyFn(`${deployer}.pool-v1-0`, "funds-locked-for", [
      types.uint(tokenId),
      types.principal(owner),
    ], deployer);
  }

  fundsCommitmentEndsAtHeight(tokenId: number, owner: string, deployer: string) {
    return this.chain.callReadOnlyFn(`${deployer}.pool-v1-0`, "funds-commitment-ends-at-height", [
      types.uint(tokenId),
      types.principal(owner),
    ], deployer);
  }

  calculateNewCommitment(prevFunds: number, amount: number, factor: number, owner: string, tokenId: number, deployer: string) {
    return this.chain.callReadOnlyFn(`${deployer}.pool-v1-0`, "calculate-new-commitment", [
      types.uint(prevFunds),
      types.uint(amount),
      types.uint(factor),
      types.principal(owner),
      types.uint(tokenId),
    ], deployer);
  }

  timeLeftUntilWithdrawal(tokenId: number, owner: string, deployer: string) {
    return this.chain.callReadOnlyFn(`${deployer}.pool-v1-0`, "time-left-until-withdrawal", [
      types.uint(tokenId),
      types.principal(owner),
    ], deployer);
  }

}

export { Pool };