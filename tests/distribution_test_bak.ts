
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { Pool } from './interfaces/pool-v1-0.ts';
import { Loan } from './interfaces/loan-v1-0.ts';
import { BridgeTest as Bridge } from './interfaces/bridge.ts';
import { LPToken } from './interfaces/lp-token.ts';

import {
  setContractOwner,
  initContractOwners,
  bootstrapApprovedContracts,
  addApprovedContract,
  runBootstrap,
  addBorrower,
} from './interfaces/common.ts';

Clarinet.test({
  name: "Ensure that zest rewards are minted to pool delegate and are available to mint by liquidity providers",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // lp_1
    let wallet_2 = accounts.get("wallet_2") as Account; // lp_2
    let wallet_7 = accounts.get("wallet_7") as Account; // pool_delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let bridge = new Bridge(chain, deployerWallet);
    let lpToken = new LPToken(chain, deployerWallet);
    
    // bootstrapApprovedContracts(chain, deployerWallet);
    let block = runBootstrap(chain, deployerWallet);
    block = initContractOwners(chain, deployerWallet);
    
    block = pool.createPool(
      wallet_7.address,
      `${deployerWallet.address}.lp-token`,
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.payment-fixed`,
      `${deployerWallet.address}.rewards-calc`,
      1000,
      1000,
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
      wallet_1.address
    );

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
      wallet_8.address
    );

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
    // console.log(block.receipts[0].events);

    assetMaps = chain.getAssetsMaps();

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
    block.receipts[0].result.expectOk();

    block = pool.withdrawZestRewards(
      `${deployerWallet.address}.zest-reward-dist`,
      `${deployerWallet.address}.rewards-calc`,
      wallet_1.address
    );
    block.receipts[0].result.expectOk();
    assetMaps = chain.getAssetsMaps();
    assert(assetMaps["assets"][".zge000-governance-token.zest"][wallet_1.address] >= 3945199);
  },
});
