
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { Pool } from './interfaces/pool-v1-0.ts';
import { Loan } from './interfaces/loan-v1-0.ts';
import { BridgeTest as Bridge } from './interfaces/bridge.ts';
import { LPToken } from './interfaces/lp-token.ts';

import {
  setContractOwner,
  initContractOwners,
  addBorrower,
  addApprovedContract,
  runBootstrap,
  bootstrapApprovedContracts
} from './interfaces/common.ts';

Clarinet.test({
  name: "Ensure that a borrower can create a loan and the pool can send funds to the bridge",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // lp_1
    let wallet_2 = accounts.get("wallet_2") as Account;
    let wallet_7 = accounts.get("wallet_7") as Account; // pool_delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let bridge = new Bridge(chain, deployerWallet);
    
    bootstrapApprovedContracts(chain, deployerWallet);
    initContractOwners(chain, deployerWallet);
    runBootstrap(chain, deployerWallet);
    
    let block = pool.createPool(
      wallet_7.address,
      `${deployerWallet.address}.lp-token`,
      0,
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.payment-fixed`,
      `${deployerWallet.address}.rewards-calc`,
      50,
      50,
      10_000_000_000,
      `${deployerWallet.address}.liquidity-vault-v1-0`,
      `${deployerWallet.address}.cp-token`,
      true,
    );
    
    block = bridge.addDeposit(600_000_000, 1, wallet_1.address);
    
    block = bridge.depositToPool(
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.liquidity-vault-v1-0`,
      1,
      wallet_1.address);

    block = addBorrower(chain, wallet_8, deployerWallet);

    block = pool.createLoan(
      `${deployerWallet.address}.lp-token`,
      600_000_000,
      0,
      `${deployerWallet.address}.xbtc`,
      300,
      12960,
      1440,
      `${deployerWallet.address}.coll-vault`,
      `${deployerWallet.address}.funding-vault`,
      wallet_8.address);
    
    assertEquals(block.receipts[0].result.expectOk(), "u0");

    block = pool.fundLoan(
      0,
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.liquidity-vault-v1-0`,
      600_000_000,
      wallet_7.address,
    );

    assetMaps = chain.getAssetsMaps();
    // assertEquals(assetMaps.assets[`.loan-token.loan`][`${deployerWallet.address}.lp-token`], 6_000_000_000_000_000_000);

    chain.mineEmptyBlock(5);
    
    block = bridge.drawdown(
      0,
      8,
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.xbtc`,
      `${deployerWallet.address}.coll-vault`,
      `${deployerWallet.address}.funding-vault`,
      wallet_8.address,
    );

    chain.mineEmptyBlock(1400);

    block = bridge.makePayment(
      0,
      5,
      `${deployerWallet.address}.payment-fixed`,
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.cp-token`,
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.swap-router`,
      493150,
      wallet_8.address,
    );

    assetMaps = chain.getAssetsMaps();

    let lp_1_withdrawable_funds = chain.callReadOnlyFn(`${deployerWallet.address}.zest-reward-dist`,
      "withdrawable-funds-of", [ types.principal(wallet_1.address), ], wallet_1.address).result;
    
    lp_1_withdrawable_funds.expectUint(4882185);
    assert(assetMaps.assets[`.zge000-governance-token.zest`][`${wallet_7.address}`] > 0);
    
    chain.mineEmptyBlock(1440);
    block = bridge.makePayment(0, (5 + (1 * 1440)), `${deployerWallet.address}.payment-fixed`, `${deployerWallet.address}.lp-token`, 
    `${deployerWallet.address}.cp-token`,
    `${deployerWallet.address}.zest-reward-dist`,`${deployerWallet.address}.swap-router`, 493150, wallet_8.address);
    chain.mineEmptyBlock(1440);
    block = bridge.makePayment(0, (5 + (2 * 1440)), `${deployerWallet.address}.payment-fixed`, `${deployerWallet.address}.lp-token`,
    `${deployerWallet.address}.cp-token`,
    `${deployerWallet.address}.zest-reward-dist`,`${deployerWallet.address}.swap-router`, 493150, wallet_8.address);
    chain.mineEmptyBlock(1440);
    block = bridge.makePayment(0, (5 + (3 * 1440)), `${deployerWallet.address}.payment-fixed`, `${deployerWallet.address}.lp-token`,
    `${deployerWallet.address}.cp-token`,
    `${deployerWallet.address}.zest-reward-dist`,`${deployerWallet.address}.swap-router`, 493150, wallet_8.address);
    chain.mineEmptyBlock(1440);
    block = bridge.makePayment(0, (5 + (4 * 1440)), `${deployerWallet.address}.payment-fixed`, `${deployerWallet.address}.lp-token`,
    `${deployerWallet.address}.cp-token`,
    `${deployerWallet.address}.zest-reward-dist`,`${deployerWallet.address}.swap-router`, 493150, wallet_8.address);
    chain.mineEmptyBlock(1440);
    block = bridge.makePayment(0, (5 + (5 * 1440)), `${deployerWallet.address}.payment-fixed`, `${deployerWallet.address}.lp-token`,
    `${deployerWallet.address}.cp-token`,
    `${deployerWallet.address}.zest-reward-dist`,`${deployerWallet.address}.swap-router`, 493150, wallet_8.address);
    chain.mineEmptyBlock(1440);
    block = bridge.makePayment(0, (5 + (6 * 1440)), `${deployerWallet.address}.payment-fixed`, `${deployerWallet.address}.lp-token`,
    `${deployerWallet.address}.cp-token`,
    `${deployerWallet.address}.zest-reward-dist`,`${deployerWallet.address}.swap-router`, 493150, wallet_8.address);
    chain.mineEmptyBlock(1440);
    block = bridge.makePayment(0, (5 + (7 * 1440)), `${deployerWallet.address}.payment-fixed`, `${deployerWallet.address}.lp-token`,
    `${deployerWallet.address}.cp-token`,
    `${deployerWallet.address}.zest-reward-dist`,`${deployerWallet.address}.swap-router`, 493150, wallet_8.address);
    chain.mineEmptyBlock(1440);
    block = bridge.makePayment(
      0,
      (5 + (8 * 1440)),
      `${deployerWallet.address}.payment-fixed`,
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.cp-token`,
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.swap-router`,
      (600_000_000 + 493150),
      wallet_8.address
    );

    assertEquals(block.receipts[0].result.expectOk().expectTuple().repayment, "true");
    assertEquals(block.receipts[0].result.expectOk().expectTuple().reward, "u493150");
    // console.log(assetMaps);
    // console.log(block);
    // console.log(block);
    // chain.mineEmptyBlock(12960);
    // console.log(block.receipts[0].result);
    
  },
});


Clarinet.test({
  name: "Ensure can repay early with an added late fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // lp_1
    let wallet_2 = accounts.get("wallet_2") as Account;
    let wallet_7 = accounts.get("wallet_7") as Account; // pool_delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let bridge = new Bridge(chain, deployerWallet);
    
    bootstrapApprovedContracts(chain, deployerWallet);
    initContractOwners(chain, deployerWallet);
    runBootstrap(chain, deployerWallet);
    
    let block = pool.createPool(
      wallet_7.address,
      `${deployerWallet.address}.lp-token`,
      0,
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.payment-fixed`,
      `${deployerWallet.address}.rewards-calc`,
      50,
      50,
      10_000_000_000,
      `${deployerWallet.address}.liquidity-vault-v1-0`,
      `${deployerWallet.address}.cp-token`,
      true,
    );
    
    block = bridge.addDeposit(600_000_000, 1, wallet_1.address);
    
    block = bridge.depositToPool(
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.liquidity-vault-v1-0`,
      1,
      wallet_1.address);

    block = addBorrower(chain, wallet_8, deployerWallet);

    block = pool.createLoan(
      `${deployerWallet.address}.lp-token`,
      600_000_000,
      0,
      `${deployerWallet.address}.xbtc`,
      300,
      12960,
      1440,
      `${deployerWallet.address}.coll-vault`,
      `${deployerWallet.address}.funding-vault`,
      wallet_8.address);

    block = pool.fundLoan(
      0,
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.liquidity-vault-v1-0`,
      600_000_000,
      wallet_7.address,
    );

    assetMaps = chain.getAssetsMaps();

    chain.mineEmptyBlock(5);
    
    block = bridge.drawdown(
      0,
      8,
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.xbtc`,
      `${deployerWallet.address}.coll-vault`,
      `${deployerWallet.address}.funding-vault`,
      wallet_8.address,
    );

    chain.mineEmptyBlock(1400);

    block = bridge.makePayment(
      0,
      5,
      `${deployerWallet.address}.payment-fixed`,
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.cp-token`,
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.swap-router`,
      493150,
      wallet_8.address,
    );

    assetMaps = chain.getAssetsMaps();
    

    chain.mineEmptyBlock(1440);
    block = bridge.makeFullPayment(
      0,
      (5 + (1 * 1440)),
      `${deployerWallet.address}.payment-fixed`,
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.cp-token`,
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.swap-router`,
      (600_000_000 + 493643),
      wallet_8.address
    );
    
    assetMaps = chain.getAssetsMaps();

    let lp_1_withdrawable_funds = chain.callReadOnlyFn(`${deployerWallet.address}.zest-reward-dist`,
      "withdrawable-funds-of", [ types.principal(wallet_1.address), ], wallet_1.address).result;
    lp_1_withdrawable_funds.expectUint(9769251);

    assertEquals(block.receipts[0].result.expectOk().expectTuple()["full-payment"], "u600000000");
    assertEquals(block.receipts[0].result.expectOk().expectTuple()["reward"], "u493643");
  },
});

Clarinet.test({
  name: "Ensure that liquidity providers can claim rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // lp_1
    let wallet_2 = accounts.get("wallet_2") as Account;
    let wallet_7 = accounts.get("wallet_7") as Account; // pool_delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let bridge = new Bridge(chain, deployerWallet);
    let lpToken = new LPToken(chain, deployerWallet);
    
    bootstrapApprovedContracts(chain, deployerWallet);
    let block = initContractOwners(chain, deployerWallet);
    block = runBootstrap(chain, deployerWallet);
    
    block = pool.createPool(
      wallet_7.address,
      `${deployerWallet.address}.lp-token`,
      0,
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.payment-fixed`,
      `${deployerWallet.address}.rewards-calc`,
      50,
      50,
      10_000_000_000,
      `${deployerWallet.address}.liquidity-vault-v1-0`,
      `${deployerWallet.address}.cp-token`,
      true,
    );
    
    block = bridge.addDeposit(600_000_000, 1, wallet_1.address);
    
    block = bridge.depositToPool(
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.liquidity-vault-v1-0`,
      1,
      wallet_1.address);

    block = addBorrower(chain, wallet_8, deployerWallet);

    block = pool.createLoan(
      `${deployerWallet.address}.lp-token`,
      600_000_000,
      0,
      `${deployerWallet.address}.xbtc`,
      300,
      12960,
      1440,
      `${deployerWallet.address}.coll-vault`,
      `${deployerWallet.address}.funding-vault`,
      wallet_8.address);
    
    assertEquals(block.receipts[0].result.expectOk(), "u0");

    block = pool.fundLoan(
      0,
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.liquidity-vault-v1-0`,
      600_000_000,
      wallet_7.address,
    );

    chain.mineEmptyBlock(5);
    
    block = bridge.drawdown(
      0,
      8,
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.xbtc`,
      `${deployerWallet.address}.coll-vault`,
      `${deployerWallet.address}.funding-vault`,
      wallet_8.address,
    );

    chain.mineEmptyBlock(1400);

    block = bridge.makePayment(0, 5, `${deployerWallet.address}.payment-fixed`, `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.cp-token`,
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.swap-router`,
      493150,
      wallet_8.address
    );
    block = lpToken.withdrawFunds("lp-token", wallet_1.address);
    
    block = lpToken.withdrawFunds("zest-reward-dist", wallet_1.address);
    assetMaps = chain.getAssetsMaps();

    let lp_1_withdrawable_funds = chain.callReadOnlyFn(`${deployerWallet.address}.zest-reward-dist`,
      "withdrawable-funds-of", [ types.principal(wallet_1.address), ], wallet_1.address).result;
    lp_1_withdrawable_funds.expectUint(4882185);
    // assert(assetMaps.assets[".zge000-governance-token.zest"][wallet_1.address] >= 488219);

    block.receipts[0].result.expectErr();

    chain.mineEmptyBlock(1400);

    block = bridge.makePayment(0, 5, `${deployerWallet.address}.payment-fixed`, `${deployerWallet.address}.lp-token`,
    `${deployerWallet.address}.cp-token`,
    `${deployerWallet.address}.zest-reward-dist`, `${deployerWallet.address}.swap-router`, 493150, wallet_8.address);
    block = lpToken.withdrawFunds("lp-token", wallet_1.address);
    block = lpToken.withdrawFunds("zest-reward-dist", wallet_1.address);
    assetMaps = chain.getAssetsMaps();
    

    lp_1_withdrawable_funds = chain.callReadOnlyFn(`${deployerWallet.address}.zest-reward-dist`,
      "withdrawable-funds-of", [ types.principal(wallet_1.address), ], wallet_1.address).result;
    lp_1_withdrawable_funds.expectUint(9764371);
    
    block.receipts[0].result.expectErr();
  },
});

Clarinet.test({
  name: "Ensure that liquidation refunds pool with losses",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // lp_1
    let wallet_2 = accounts.get("wallet_2") as Account;
    let wallet_7 = accounts.get("wallet_7") as Account; // pool_delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let bridge = new Bridge(chain, deployerWallet);
    let lpToken = new LPToken(chain, deployerWallet);
    
    bootstrapApprovedContracts(chain, deployerWallet);
    let block = initContractOwners(chain, deployerWallet);
    block = runBootstrap(chain, deployerWallet);
    
    block = pool.createPool(
      wallet_7.address,
      `${deployerWallet.address}.lp-token`,
      0,
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.payment-fixed`,
      `${deployerWallet.address}.rewards-calc`,
      50,
      50,
      10_000_000_000,
      `${deployerWallet.address}.liquidity-vault-v1-0`,
      `${deployerWallet.address}.cp-token`,
      true,
    );

    block = chain.mineBlock([
      Tx.contractCall(
        "xbtc",
        "transfer",
        [
          types.uint(375000000),
          types.principal(deployerWallet.address),
          types.principal(`${deployerWallet.address}.cover-pool-v1-0`),
          types.none(),
        ],
        deployerWallet.address
      )
    ]);
    
    block = bridge.addDeposit(600_000_000, 1, wallet_1.address);
    
    block = bridge.depositToPool(
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.liquidity-vault-v1-0`,
      1,
      wallet_1.address);

    block = addBorrower(chain, wallet_8, deployerWallet);

    block = pool.createLoan(
      `${deployerWallet.address}.lp-token`,
      600_000_000,
      5_000,
      `${deployerWallet.address}.xbtc`,
      300,
      12960,
      1440,
      `${deployerWallet.address}.coll-vault`,
      `${deployerWallet.address}.funding-vault`,
      wallet_8.address);
    
    assertEquals(block.receipts[0].result.expectOk(), "u0");

    block = pool.fundLoan(
      0,
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.liquidity-vault-v1-0`,
      600_000_000,
      wallet_7.address,
    );

    chain.mineEmptyBlock(5);
    
    block = bridge.drawdown(
      0,
      8,
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.xbtc`,
      `${deployerWallet.address}.coll-vault`,
      `${deployerWallet.address}.funding-vault`,
      wallet_8.address,
    );

    // console.log(block);
    chain.mineEmptyBlock(2142);


    block = pool.liquidateLoan(
      0,
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.coll-vault`,
      `${deployerWallet.address}.xbtc`,
      `${deployerWallet.address}.cp-token`,
      wallet_7.address,
    );
    assetMaps = chain.getAssetsMaps();
    
    // assert(assetMaps.assets[".xbtc.xbtc"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"] >= 375000000);
    // console.log(assetMaps.assets[".xbtc.xbtc"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"]);

    // console.log(assetMaps.assets[".lp-token.lp"][`${wallet_1.address}`]);
  },
});