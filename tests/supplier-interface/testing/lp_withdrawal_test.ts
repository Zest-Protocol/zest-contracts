// deno-lint-ignore-file
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { Pool } from '../../interfaces/pool-v1-0.ts';
import { CoverPool } from '../../interfaces/cover-pool-v1-0.ts';
import { Loan } from '../../interfaces/loan-v1-0.ts';
import { LPToken } from '../../interfaces/lp-token.ts';
import { Buffer } from "https://deno.land/std@0.110.0/node/buffer.ts";
import { TestUtils } from '../../interfaces/test-utils.ts';
import { Bridge } from '../../interfaces/bridge_real.ts';
import { Globals } from '../../interfaces/globals.ts';
import { SupplierInterface } from '../../interfaces/supplier_interface.ts';
import { ZestRewardDist } from '../../interfaces/zestRewardDist.ts';
import { Payment } from '../../interfaces/payment.ts';
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
  makePaymentTxs,
  setPoolContract,
  finalizeDrawdown
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
  SWAP_ROUTER,
  CYCLE_LENGTH,
  CP_REWARDS_TOKEN,
  COVER_VAULT
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Liquidity Provider can withdraw funds sent to a pool",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    
    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let cooldownTime = consumeUint(globals["lp-cooldown-period"]);
    let unstakeWindow = consumeUint(globals["lp-unstake-window"]);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,2,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,100_000_000,preimage,supplierId,100_000_000 * fee / 10_000,2,chain.blockHeight - 1)
    ]);

    chain.mineEmptyBlock(consumeUint(pool.fundsCommitmentEndsAtHeight(0, wallet_1.address, deployerWallet.address).result));
    block = pool.signalWithdrawal(LP_TOKEN,0, 100_000_000, wallet_1.address);
    
    chain.mineEmptyBlock(cooldownTime);

    block = chain.mineBlock([
      SupplierInterface.withdraw(100_000_000, P2PKH_VERSION, HASH, 0, LP_TOKEN,ZP_TOKEN, 0,LIQUIDITY_VAULT, XBTC, wallet_1.address)
    ]);

    assetMaps = chain.getAssetsMaps();
    assertEquals(assetMaps.assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bridge"], 10000000000);
  },
});

Clarinet.test({
  name: "Liquidity Provider cannot withdraw before lockup period and after unstake window expired",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,2,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    
    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,100_000_000,preimage,supplierId, 100_000_000 * fee / 10_000,2,chain.blockHeight - 1)
    ]);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let cooldownTime = consumeUint(globals["lp-cooldown-period"]);
    let unstakeWindow = consumeUint(globals["lp-unstake-window"]);

    block = pool.signalWithdrawal(LP_TOKEN,0, 100_000_000, wallet_1.address);

    chain.mineEmptyBlock(cooldownTime - 10);
    // lockup period in progress even after cooldown period
    block = chain.mineBlock([SupplierInterface.withdraw(100_000_000, P2PKH_VERSION, HASH, 0, LP_TOKEN,ZP_TOKEN, 0, LIQUIDITY_VAULT, XBTC, wallet_1.address)]);
    block.receipts[0].result.expectErr().expectUint(ERRORS.ERR_FUNDS_LOCKED);
    

    // wait arbitraririly large number
    chain.mineEmptyBlock((cooldownTime * 2));

    block = chain.mineBlock([SupplierInterface.withdraw(100_000_000, P2PKH_VERSION, HASH, 0, LP_TOKEN,ZP_TOKEN, 0, LIQUIDITY_VAULT, XBTC, wallet_1.address)]);
    block.receipts[0].result.expectErr().expectUint(ERRORS.ERR_UNSTAKE_WINDOW_EXPIRED);

    pool.signalWithdrawal(LP_TOKEN,0, 100_000_000, wallet_1.address);
    block = chain.mineBlock([SupplierInterface.withdraw(100_000_000, P2PKH_VERSION, HASH, 0, LP_TOKEN,ZP_TOKEN, 0, LIQUIDITY_VAULT, XBTC, wallet_1.address)]);

    block.receipts[0].result.expectErr().expectUint(ERRORS.ERR_COOLDOWN_ONGOING);

    chain.mineEmptyBlock((cooldownTime) + unstakeWindow);
    block = chain.mineBlock([SupplierInterface.withdraw(100_000_000, P2PKH_VERSION, HASH, 0, LP_TOKEN,ZP_TOKEN, 0, LIQUIDITY_VAULT, XBTC, wallet_1.address)]);
    block.receipts[0].result.expectErr().expectUint(ERRORS.ERR_UNSTAKE_WINDOW_EXPIRED);

    pool.signalWithdrawal(LP_TOKEN,0, 100_000_000, wallet_1.address);
    chain.mineEmptyBlock(cooldownTime);
    block = chain.mineBlock([SupplierInterface.withdraw(100_000_000, P2PKH_VERSION, HASH, 0, LP_TOKEN,ZP_TOKEN, 0, LIQUIDITY_VAULT, XBTC, wallet_1.address)]);

    block.receipts[0].result.expectOk();
  },
});

Clarinet.test({
  name: "Liquidity Provider can withdraw Zest and xBTC rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);
    // initContractOwners(chain, deployerWallet);

    block = pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    block = pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    
    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,100_000_000,preimage,supplierId,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    chain.mineEmptyBlock(1300);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);
    
    block = chain.mineBlock([
      Bridge.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1,XBTC)
    ]);

    // chain.mineEmptyBlock(697);
    chain.mineEmptyBlockUntil(consumeUint(ZestRewardDist.getNextCycleHeight(0, chain, deployerWallet.address).result.expectSome() as string));
    chain.mineEmptyBlockUntil(consumeUint(ZestRewardDist.getNextCycleHeight(0, chain, deployerWallet.address).result.expectSome() as string));

    // console.log(ZestRewardDist.getNextCycleHeight(0, chain, deployerWallet.address).result.expectSome());
    // console.log(ZestRewardDist.getCurrentCycle(0, chain, deployerWallet.address).result.expectSome());

    block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);
    // console.log(block);
    // console.log(block.receipts[0].events);
    
    // assetMaps = chain.getAssetsMaps();
    // // TODO: correct to use cycle rewards
    // assert(assetMaps.assets[".zge000-governance-token.zest"][wallet_1.address] > 0);

    let before = (chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bridge"]);
    block = chain.mineBlock([SupplierInterface.withdrawRewards(P2PKH_VERSION, HASH, 0, LP_TOKEN, 0, LIQUIDITY_VAULT, XBTC, wallet_1.address)]);
    let result = chain.callReadOnlyFn("lp-token", "withdrawable-funds-of", [ types.uint(0), types.principal(wallet_1.address) ], deployerWallet.address);
    
    let difference = (consumeUint(String(block.receipts[0].result.expectOk())));
    let after = (chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bridge"]);
    
    assertEquals(after - before, difference);
  },
});

// Clarinet.test({
//   name: "Liquidity Provider",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployerWallet = accounts.get("deployer") as Account;
//     let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
//     let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
//     let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

//     let assetMaps = chain.getAssetsMaps();
//     let pool = new Pool(chain, deployerWallet);
//     let loan = new Loan(chain, deployerWallet);

//     let block = runBootstrap(chain, deployerWallet);

//     block = Globals.onboardUserAddress(chain, wallet_8.address, deployerWallet.address);
    
//     initContractOwners(chain, deployerWallet);

//     block = pool.createPool(wallet_7.address,LP_TOKEN,0,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,1,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,XBTC,true);
//     console.log(block);
//     pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
//     chain.mineEmptyBlock(2);

//     block = chain.mineBlock([
//       ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
//       Bridge.initializeSwapper(wallet_1.address),
//       ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,100_000_000,preimage,0,1,29)
//     ]);

//     pool.createLoan(LP_TOKEN,0,100_000_000,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
//     pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,XBTC,wallet_7.address);
//     block = chain.mineBlock([
//       SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, XBTC, wallet_8.address)
//     ]);

//     chain.mineEmptyBlock(10);

//     block = chain.mineBlock([
//       ...finalizeOutboundTxs(HASH, 99000000, 0, 43, wallet_8.address, deployerWallet.address)
//     ]);

//     chain.mineEmptyBlock(1300);
    
//     block = chain.mineBlock([
//       Bridge.initializeSwapper(wallet_8.address),
//       ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,82191,"00",0,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,1343, XBTC)
//     ]);

//     chain.mineEmptyBlock(697);

//     block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);
//     // console.log(block.receipts[0].events);
    
//     assetMaps = chain.getAssetsMaps();
//     // TODO: correct to use cycle rewards
//     // assert(assetMaps.assets[".zge000-governance-token.zest"][wallet_1.address] > 0);

//     let before = (chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bridge"]);
//     block = chain.mineBlock([
//       SupplierInterface.withdrawRewards(P2PKH_VERSION, HASH, 0, LP_TOKEN, 0, LIQUIDITY_VAULT, XBTC, wallet_1.address)
//     ]);
//     let result = chain.callReadOnlyFn("lp-token", "withdrawable-funds-of", [ types.uint(0), types.principal(wallet_1.address) ], deployerWallet.address);
//     // console.log(chain.getAssetsMaps());
//     let difference = (consumeUint(String(block.receipts[0].result.expectOk())));
//     let after = (chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bridge"]);
    
//     assertEquals(after - before, difference);
//   },
// });