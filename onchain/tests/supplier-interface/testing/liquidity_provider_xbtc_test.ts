// deno-lint-ignore-file
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.5.4/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.159.0/testing/asserts.ts';
import { Pool } from '../../interfaces/pool-v1-0.ts';
import { CoverPool } from '../../interfaces/cover-pool-v1-0.ts';
import { Loan } from '../../interfaces/loan-v1-0.ts';
import { LPToken } from '../../interfaces/lp-token.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";
import { TestUtils } from '../../interfaces/test-utils.ts';
import { Globals } from '../../interfaces/globals.ts';
import { SupplierInterface } from '../../interfaces/supplier_interface.ts';
import { 
  getHash,
  getReverseTxId,
  getTxId,
  getExpiration,
  swapperBuff,
  generateP2PKHTx
} from "../util.ts";

import {
  setContractOwner,
  initContractOwners,
  bootstrapApprovedContracts,
  addApprovedContract,
  runBootstrap,
  addBorrower,
  sendFundsP2SHTxs,
  registerSupplierTxs,
  finalizeOutboundTxs,
  consumeUint,
  getBP
} from '../../interfaces/common.ts';

import {
  LP_TOKEN,
  ZP_TOKEN,
  PAYMENT,
  REWARDS_CALC,
  LIQUIDITY_VAULT,
  CP_TOKEN,
  XBTC,
  COLL_VAULT,
  FUNDING_VAULT,
  P2PKH_VERSION,
  HASH,
  recipient,
  sender,
  preimage,
  ERRORS,
  ONE_DAY,
  CP_REWARDS_TOKEN,
  SWAP_ROUTER,
  COVER_VAULT,
  CYCLE_LENGTH,
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Liquidity providers can send xBTC and withdraw",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2
    let coverPoolProvider = accounts.get("wallet_3") as Account; // Cover_1
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);

    // Pool is created by Deployer. Pool Delegate is assigned.
    pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    // Cover Pool Provider sends funds to the cover pool of Pool 0.
    pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    
    let block = Globals.setcontingencyPlan(chain, true, deployerWallet.address);
    block = chain.mineBlock([
      SupplierInterface.sendFundsXBTC(1,LP_TOKEN,0,ZP_TOKEN,LIQUIDITY_VAULT,XBTC,100_000_000, REWARDS_CALC, LP_1.address)
    ]);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let cooldownTime = consumeUint(globals["lp-cooldown-period"]);
    let unstakeWindow = consumeUint(globals["lp-unstake-window"]);

    block = pool.signalWithdrawal(LP_TOKEN,0, 100_000_000, LP_1.address);

    chain.mineEmptyBlock(cooldownTime - 11);
    // lockup period in progress even after cooldown period

    block = chain.mineBlock([SupplierInterface.withdrawXBTC(100_000_000,LP_TOKEN,ZP_TOKEN,0,LIQUIDITY_VAULT,XBTC,LP_1.address)]);
    block.receipts[0].result.expectErr().expectUint(ERRORS.ERR_FUNDS_LOCKED);

    // wait arbitraririly large number
    chain.mineEmptyBlock((cooldownTime * 2));

    block = chain.mineBlock([SupplierInterface.withdrawXBTC(100_000_000,LP_TOKEN,ZP_TOKEN,0,LIQUIDITY_VAULT,XBTC,LP_1.address)]);
    block.receipts[0].result.expectErr().expectUint(ERRORS.ERR_UNSTAKE_WINDOW_EXPIRED);

    pool.signalWithdrawal(LP_TOKEN,0, 100_000_000, LP_1.address);
    
    chain.mineEmptyBlock(cooldownTime);

    block = chain.mineBlock([SupplierInterface.withdrawXBTC(100_000_000,LP_TOKEN,ZP_TOKEN,0,LIQUIDITY_VAULT,XBTC,LP_1.address)]);
    block.receipts[0].result.expectOk();
    
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_1.address], 100_000_000_000_000);
  },
});


Clarinet.test({
  name: "Liquidity providers can send xBTC, but withdrawal is blocked when lockup is still ongoing",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2
    let coverPoolProvider = accounts.get("wallet_3") as Account; // Cover_1
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);
    
    // Pool is created by Deployer. Pool Delegate is assigned.
    let block = pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,6,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    // Cover Pool Provider sends funds to the cover pool of Pool 0.
    block = pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    
    block = Globals.setcontingencyPlan(chain, true, deployerWallet.address);
    block = chain.mineBlock([
      SupplierInterface.sendFundsXBTC(6,LP_TOKEN,0,ZP_TOKEN,LIQUIDITY_VAULT,XBTC,100_000_000, REWARDS_CALC, LP_1.address)
    ]);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let cooldownTime = consumeUint(globals["lp-cooldown-period"]);
    let unstakeWindow = consumeUint(globals["lp-unstake-window"]);

    block = pool.signalWithdrawal(LP_TOKEN,0, 100_000_000, LP_1.address);

    // wait a cycle length
    chain.mineEmptyBlock(CYCLE_LENGTH);

    block = chain.mineBlock([SupplierInterface.withdrawXBTC(100_000_000,LP_TOKEN,ZP_TOKEN,0,LIQUIDITY_VAULT,XBTC,LP_1.address)]);
    block.receipts[0].result.expectErr().expectUint(ERRORS.ERR_UNSTAKE_WINDOW_EXPIRED);

    pool.signalWithdrawal(LP_TOKEN,0, 100_000_000, LP_1.address);
    
    // wait a cooldown cycle
    chain.mineEmptyBlock(cooldownTime);

    block = chain.mineBlock([SupplierInterface.withdrawXBTC(100_000_000,LP_TOKEN,ZP_TOKEN,0,LIQUIDITY_VAULT,XBTC,LP_1.address)]);
    block.receipts[0].result.expectErr().expectUint(ERRORS.ERR_FUNDS_LOCKED);

    // nothing moved
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_1.address], 100_000_000_000_000 - 100_000_000);

    // wait the remaining commitment time minus the passed time and a cooldown period ahead of time
    chain.mineEmptyBlock((CYCLE_LENGTH * 5) - (2 * cooldownTime));
    pool.signalWithdrawal(LP_TOKEN,0, 100_000_000, LP_1.address);

    chain.mineEmptyBlock(cooldownTime);
    
    block = chain.mineBlock([SupplierInterface.withdrawXBTC(100_000_000,LP_TOKEN,ZP_TOKEN,0,LIQUIDITY_VAULT,XBTC,LP_1.address)]);
    
    // funds moved to LP_1
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_1.address], 100_000_000_000_000);
  },
});

Clarinet.test({
  name: "Borrower can drawdown funds in pool using xBTC",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    
    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    let amountBegin = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP"]

    pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    block = Globals.setcontingencyPlan(chain, true, deployerWallet.address);
    block = chain.mineBlock([SupplierInterface.sendFundsXBTC(1,LP_TOKEN,0,ZP_TOKEN,LIQUIDITY_VAULT,XBTC,100_000_000, REWARDS_CALC, LP_1.address)]);
    
    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_1.address);

    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdownXBTC(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT,SWAP_ROUTER,XBTC, borrower_1.address)]);
    
    let amountSent = consumeUint(block.receipts[0].result.expectOk().expectTuple().sats);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP"], amountBegin + amountSent);
  },
});

Clarinet.test({
  name: "Borrower cannot drawdown funds in pool using xBTC if contingency plan activated and then deactivated",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    
    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    let amountBegin = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP"];

    pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    block = chain.mineBlock([SupplierInterface.sendFundsXBTC(1,LP_TOKEN,0,ZP_TOKEN,LIQUIDITY_VAULT,XBTC,100_000_000, REWARDS_CALC, LP_1.address)]);
    block.receipts[0].result.expectErr();
    block = Globals.setcontingencyPlan(chain, true, deployerWallet.address);
    block = chain.mineBlock([SupplierInterface.sendFundsXBTC(1,LP_TOKEN,0,ZP_TOKEN,LIQUIDITY_VAULT,XBTC,100_000_000, REWARDS_CALC, LP_1.address)]);
    block.receipts[0].result.expectOk();
    
    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_1.address);

    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = Globals.setcontingencyPlan(chain, false, deployerWallet.address);
    block = chain.mineBlock([SupplierInterface.drawdownXBTC(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT,SWAP_ROUTER,XBTC, borrower_1.address)]);
    block.receipts[0].result.expectErr();

    block = Globals.setcontingencyPlan(chain, true, deployerWallet.address);
    block = chain.mineBlock([SupplierInterface.drawdownXBTC(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT,SWAP_ROUTER,XBTC, borrower_1.address)]);
    block.receipts[0].result.expectOk();
    
    
    let amountSent = consumeUint(block.receipts[0].result.expectOk().expectTuple().sats);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP"], amountBegin + amountSent);
  },
});

