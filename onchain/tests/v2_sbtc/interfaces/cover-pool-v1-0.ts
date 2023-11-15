import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.5.4/index.ts';

class CoverPool {
  chain: Chain;
  deployer: Account;

  constructor(chain: Chain, deployer: Account) {
      this.chain = chain;
      this.deployer = deployer;
  }

  getPool(
    tokenId: number
  ) {
    return this.chain.mineBlock([
      Tx.contractCall(
        'cover-pool-v1-0',
        'get-pool',
        [
          types.uint(tokenId)
        ],
        this.deployer.address
      )
    ]).receipts[0].result.expectOk().expectTuple();
  }

  sendFunds(
    cp: string,
    coverVault: string,
    cpRewards: string,
    coverToken: string,
    tokenId: number,
    amount: bigint,
    cycles: number,
    rewardsCalc: string,
    sender: string,
  ) {
    return this.chain.mineBlock([
      Tx.contractCall(
        'cover-pool-v1-0',
        'send-funds',
        [
          types.principal(cp),
          types.principal(coverVault),
          types.principal(cpRewards),
          types.principal(coverToken),
          types.uint(tokenId),
          types.uint(amount),
          types.uint(cycles),
          types.principal(rewardsCalc),
          types.principal(sender),
        ],
        sender
      )
    ]);
  }

  withdrawZestRewards(
    cp: string,
    tokenId: number,
    rewardsCalc: string,
    caller: string,
  ) {
    return this.chain.mineBlock([
      Tx.contractCall(
        'cover-pool-v1-0',
        'withdraw-zest-rewards',
        [
          types.principal(cp),
          types.uint(tokenId),
          types.principal(rewardsCalc)
        ],
        caller
      )
    ]);
  }

  signalWithdrawal(
    cp: string,
    tokenId: number,
    amount: number,
    caller: string,
  ) {
    return this.chain.mineBlock([
      Tx.contractCall(
        'cover-pool-v1-0',
        'signal-withdrawal',
        [
          types.principal(cp),
          types.uint(tokenId),
          types.uint(amount)
        ],
        caller
      )
    ]);
  }

  withdraw(
    cp: string,
    cpRewards: string,
    coverToken: string,
    tokenId: number,
    amount: number,
    coverVault: string,
    caller: string,
  ) {
    return this.chain.mineBlock([
      Tx.contractCall(
        'cover-pool-v1-0',
        'withdraw',
        [
          types.principal(cp),
          types.principal(cpRewards),
          types.principal(coverToken),
          types.uint(tokenId),
          types.uint(amount),
          types.principal(coverVault),
        ],
        caller
      )
    ]);
  }

  withdrawRewards(
    cpRewards: string,
    tokenId: number,
    lv: string,
    xbtcFt: string,
    caller: string,
  ) {
    return this.chain.mineBlock([
      Tx.contractCall(
        'cover-pool-v1-0',
        'withdraw-rewards',
        [
          types.principal(cpRewards),
          types.uint(tokenId),
          types.principal(lv),
          types.principal(xbtcFt),
        ],
      caller)
    ]);
  }

  hasCommittedFunds(tokenId: number, sender: string) {
    return this.chain.callReadOnlyFn(
      'cover-pool-v1-0',
      "has-committed-funds",
      [
        types.uint(tokenId),
        types.principal(sender),
      ],
      this.deployer.address
    );
  }

  timeLeftUntilWithdrawal(tokenId: number, sender: string) {
    return this.chain.callReadOnlyFn(
      'cover-pool-v1-0',
      "time-left-until-withdrawal",
      [
        types.uint(tokenId),
        types.principal(sender),
      ],
      this.deployer.address
    );
  }

  timeLeftForWithdrawal(tokenId: number, sender: string) {
    return this.chain.callReadOnlyFn(
      'cover-pool-v1-0',
      "time-left-for-withdrawal",
      [
        types.uint(tokenId),
        types.principal(sender),
      ],
      this.deployer.address
    );
  }

  fundsCommitmentEndsAt(tokenId: number, sender: string) {
    return this.chain.callReadOnlyFn(
      'cover-pool-v1-0',
      "funds-commitment-ends-at-height", 
      [
        types.uint(tokenId),
        types.principal(sender),
      ],
      this.deployer.address
    );
  }

  timeUntilCommitmentEnds(tokenId: number, sender: string) {
    return this.chain.callReadOnlyFn(
      'cover-pool-v1-0',
      "time-until-commitment-ends", 
      [
        types.uint(tokenId),
        types.principal(sender),
      ],
      this.deployer.address
    );
  }

}

export { CoverPool };