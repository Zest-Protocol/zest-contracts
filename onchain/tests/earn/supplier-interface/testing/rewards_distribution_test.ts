// deno-lint-ignore-file
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.5.4/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.159.0/testing/asserts.ts';
import { Pool } from '../../interfaces/pool-v1-0.ts';
import { CoverPool } from '../../interfaces/cover-pool-v1-0.ts';
import { Loan } from '../../interfaces/loan-v1-0.ts';
import { LPToken } from '../../interfaces/lp-token.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";
import { TestUtils } from '../../interfaces/test-utils.ts';
import { Magic } from '../../interfaces/magic_real.ts';
import { Globals } from '../../interfaces/globals.ts';
import { SupplierInterface } from '../../interfaces/supplier_interface.ts';
import { ZestRewardDist } from '../../interfaces/zestRewardDist.ts';
import { Payment } from '../../interfaces/payment.ts';
import { RewardsCalc } from '../../interfaces/rewards-calc.ts';
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
  makePaymentTxs,
  consumeUint,
  getBP,
  finalizeDrawdown
} from '../../interfaces/common.ts';

import {
  LP_TOKEN,
  ZP_TOKEN,
  PAYMENT,
  REWARDS_CALC,
  LIQUIDITY_VAULT,
  CP_TOKEN,
  COLL_VAULT,
  FUNDING_VAULT,
  P2PKH_VERSION,
  HASH,
  XBTC,
  SWAP_ROUTER,
  recipient,
  sender,
  preimage,
  ONE_DAY,
  CP_REWARDS_TOKEN,
  COVER_VAULT
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Liquidity providers get the correct share of the zest rewards pool.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_2 = accounts.get("wallet_2") as Account; // LP_2
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
    let wallet_9 = accounts.get("wallet_9") as Account; // borrower_2

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,300_000_000,preimage,supplierId,300_000_000 * fee / 10_000,8,5),
      Magic.initializeSwapper(wallet_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_2.address,sender,recipient,500,1,300_000_000,preimage,supplierId,300_000_000 * fee / 10_000,8,5)
    ]);

    // ZestRewardDist.getCycleSharePrincipal(0, 0, wallet_1.address, chain, deployerWallet.address).result.expectUint(0);
    // ZestRewardDist.getCycleSharePrincipal(0, 1, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000);
    // ZestRewardDist.getCycleSharePrincipal(0, 2, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000);
    // ZestRewardDist.getCycleSharePrincipal(0, 3, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000);
    // ZestRewardDist.getCycleSharePrincipal(0, 4, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000);
    // ZestRewardDist.getCycleSharePrincipal(0, 5, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000);
    // ZestRewardDist.getCycleSharePrincipal(0, 6, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000);
    // ZestRewardDist.getCycleSharePrincipal(0, 7, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000);
    // ZestRewardDist.getCycleSharePrincipal(0, 8, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000);
    // ZestRewardDist.getCycleSharePrincipal(0, 9, wallet_1.address, chain, deployerWallet.address).result.expectUint(0);
  },
});

Clarinet.test({
  name: "Liquidity providers can claim rewards after 2 cycles",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    // let block = runBootstrap(chain, deployerWallet);
    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    
    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,100_000_000,preimage,supplierId,100_000_000 * fee / 10_000,8,chain.blockHeight - 1)
    ]);

    // console.log(ZestRewardDist.getCycleShare(0, 1, chain, wallet_1.address));

  },
});

Clarinet.test({
  name: "Liquidity providers can claim rewards after 2 cycles",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,100_000_000,preimage,supplierId,100_000_000 * fee / 10_000,8,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);

    // console.log(chain.mineEmptyBlock(2712));
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);

    // block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);
    // console.log(ZestRewardDist.getCycleRewards(0, 1, chain, deployerWallet.address));

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"02",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"03",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);

    chain.mineEmptyBlockUntil(consumeUint(ZestRewardDist.getNextCycleHeight(0, chain, deployerWallet.address).result.expectSome() as string));
    
    // console.log(chain.blockHeight);
    // console.log(loan.getLoanData(0).result.expectTuple()["next-payment"]);
    // console.log(ZestRewardDist.getNextCycleHeight(0, chain, deployerWallet.address).result.expectSome());
    // console.log(ZestRewardDist.getCurrentCycle(0, chain, deployerWallet.address).result.expectSome());

    // let sum = (consumeUint(ZestRewardDist.getCycleRewards(0, 0, chain, deployerWallet.address).result));
    let sum = (consumeUint(ZestRewardDist.getCycleRewards(0, 1, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 2, chain, deployerWallet.address).result));

    let res = ZestRewardDist.getWithdrawableRewards(0, wallet_1.address, chain, deployerWallet.address);
    // console.log(res)
    block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);
    // console.log(block);
    // console.log(block.receipts[0].events);
    // console.log(block.receipts);
    // console.log(Math.floor(sum * 120 / 10_000));
    // assertEquals(chain.getAssetsMaps().assets[".zge000-governance-token.zest"]["ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"], Math.floor(sum * 120 / 10_000));
    // console.log(Math.floor(sum * 120 / 10_000));
    let DAY = consumeUint(Globals.getDayLengthDefault(chain, deployerWallet.address));
    let outcome = 23671;

    assertEquals(chain.getAssetsMaps().assets[".zge000-governance-token.zest"]["ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"], outcome);
  },
});

Clarinet.test({
  name: "Liquidity providers can claim rewards at the end of commitment",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,100_000_000,preimage,supplierId, 100_000_000 * fee / 10_000,8,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);

    // block = chain.mineBlock([
    //   ...finalizeOutboundTxs(HASH, 99000000, 0, 43, wallet_8.address, deployerWallet.address)
    // ]);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);

    
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);

    // block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);
    // console.log(ZestRewardDist.getCycleRewards(0, 1, chain, deployerWallet.address));
    
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"02",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"03",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"04",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"05",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"06",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"07",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue + 100_000_000,"08",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlockUntil(consumeUint(ZestRewardDist.getNextCycleHeight(0, chain, deployerWallet.address).result.expectSome() as string));
    chain.mineEmptyBlockUntil(consumeUint(ZestRewardDist.getNextCycleHeight(0, chain, deployerWallet.address).result.expectSome() as string));

    // console.log(loan.getLoanData(0).result.expectTuple());
    // console.log(chain.blockHeight);
    // console.log(loan.getLoanData(0).result.expectTuple()["next-payment"]);
    // console.log(ZestRewardDist.getNextCycleHeight(0, chain, deployerWallet.address).result.expectSome());
    // console.log(ZestRewardDist.getCurrentCycle(0, chain, deployerWallet.address).result.expectSome());

    let sum = (consumeUint(ZestRewardDist.getCycleRewards(0, 1, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 2, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 3, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 4, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 5, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 6, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 7, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 8, chain, deployerWallet.address).result));

    block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);

    // assertEquals(chain.getAssetsMaps().assets[".zge000-governance-token.zest"]["ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"], Math.floor(sum * 120 / 10_000));
    let DAY = consumeUint(Globals.getDayLengthDefault(chain, deployerWallet.address));
    let outcome = DAY % 144 ? 94684 : 63122;
    assertEquals(chain.getAssetsMaps().assets[".zge000-governance-token.zest"]["ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"], outcome);
    // console.log(chain.getAssetsMaps().assets[".zge000-governance-token.zest"]);
  },
});

Clarinet.test({
  name: "Liquidity providers can claim rewards at the end of commitment with multiplier and the rest uses a base rewards multiplier",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,300_000_000,preimage,supplierId,300_000_000*fee/10_000,8,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,25920,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([ SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address) ]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);


    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight, XBTC)
    ]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"02",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"03",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"04",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"05",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"06",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"07",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"08",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"09",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"10",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"11",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"12",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"13",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    // console.log(loan.getLoanData(0).result.expectTuple());
    // console.log(chain.blockHeight);
    // console.log(loan.getLoanData(0).result.expectTuple()["next-payment"]);
    // console.log(ZestRewardDist.getNextCycleHeight(0, chain, deployerWallet.address).result.expectSome());
    // console.log(ZestRewardDist.getCurrentCycle(0, chain, deployerWallet.address));

    let sum = (consumeUint(ZestRewardDist.getCycleRewards(0, 1, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 2, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 3, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 4, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 5, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 6, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 7, chain, deployerWallet.address).result));
    sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 8, chain, deployerWallet.address).result));
    sum = (consumeUint(ZestRewardDist.getallCycleRewardsOf(0, wallet_1.address, chain, deployerWallet.address).result));
    // let withdrawableFunds = (consumeUint(ZestRewardDist.getWithdrawableFundsOf(0, wallet_1.address, chain, deployerWallet.address).result));

    let withdrawableRewards = (consumeUint(ZestRewardDist.getWithdrawableRewards(0, wallet_1.address, chain, deployerWallet.address).result));
    // let passive = (withdrawableFunds - sum);

    // console.log(withdrawableRewards);
    // console.log(pool.getFundsSent(wallet_1.address, 0));
    block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);
    let commitment = (consumeUint(ZestRewardDist.getBalanceUint(0, wallet_1.address, chain, deployerWallet.address).result));
    const HALF_ZEST = 100;
    let delta = 2;
    let passiveRewards = commitment * delta / 10000 / HALF_ZEST;

    assertEquals(chain.getAssetsMaps().assets[".zge000-governance-token.zest"]["ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"], (Math.floor(sum * 120 / 10_000) + passiveRewards));
  },
});

Clarinet.test({
  name: "Liquidity providers can claim rewards after the end of commitment and receive only passive rewards.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,300_000_000,preimage,supplierId,300_000_000*fee/10_000,8,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,25920,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"02",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"03",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"04",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"05",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"06",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"07",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"08",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"09",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"10",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"11",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"12",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"13",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);

    // console.log(chain.blockHeight);
    // console.log(loan.getLoanData(0).result.expectTuple()["next-payment"]);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"14",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"15",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"16",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    // let passive = (consumeUint(ZestRewardDist.getWithdrawableFundsOf(0, wallet_1.address, chain, deployerWallet.address).result));
    let previous = (chain.getAssetsMaps().assets[".zge000-governance-token.zest"]["ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"]);
    block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);
    // console.log(block.receipts[0].events);


    let commitment = (consumeUint(ZestRewardDist.getBalanceUint(0, wallet_1.address, chain, deployerWallet.address).result));
    const HALF_ZEST = 100;
    let delta = 2;
    let passiveRewards = commitment * delta / 10000 / HALF_ZEST;

    // TODO: add back when passive rewards are activated
    assertEquals(chain.getAssetsMaps().assets[".zge000-governance-token.zest"]["ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"] - previous, Math.floor(passiveRewards));
  },
});

Clarinet.test({
  name: "Liquidity providers receives passive rewards after the end of commitment. After claiming passive rewards, continue earning passive rewards.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,300_000_000,preimage,supplierId,300_000_000*fee/10_000,8,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,51840,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);
    
    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"02",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"03",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"04",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"05",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"06",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"07",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"08",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"09",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"10",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"11",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"12",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"13",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"14",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"15",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"16",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"17",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"18",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"19",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    let passive = (consumeUint(ZestRewardDist.getWithdrawableFundsOf(0, wallet_1.address, chain, deployerWallet.address).result));
    let previous = (chain.getAssetsMaps().assets[".zge000-governance-token.zest"]["ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"]);

    let commitment = (consumeUint(ZestRewardDist.getBalanceUint(0, wallet_1.address, chain, deployerWallet.address).result));
    const HALF_ZEST = 100;
    let delta = 2;
    let passiveRewards = commitment * delta / 10000 / HALF_ZEST;

    // console.log(passive);
    // console.log(block.receipts[0].events);
    // console.log(block);

    // console.log(RewardsCalc.polynomial(chain, "rewards-calc", 8, deployerWallet.address));
    // console.log(RewardsCalc.getMultiplier(chain, "rewards-calc", 8, deployerWallet.address));

    block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);
    // TODO: add back when passive rewards are activated
    assertEquals(chain.getAssetsMaps().assets[".zge000-governance-token.zest"]["ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"] - previous, Math.floor(passiveRewards));
  },
});

Clarinet.test({
  name: "Can send funds in the middle of commitment. Claims cycle rewards that have not been claimed, set to amount of new factor calculated and set new cycles.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_2 = accounts.get("wallet_2") as Account; // LP_2
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
    let wallet_9 = accounts.get("wallet_9") as Account; // borrower_2

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let lpToken = new LPToken(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);
    let DAY = consumeUint(Globals.getDayLengthDefault(chain, deployerWallet.address));

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,300_000_000,preimage,supplierId,300_000_000*fee/10_000,8,chain.blockHeight - 1),
      Magic.initializeSwapper(wallet_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_2.address,sender,recipient,500,1,300_000_000,preimage,supplierId,300_000_000*fee/10_000,8,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,DAY * 10 * 36,DAY * 10,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);
    
    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"02",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"03",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"04",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"05",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"06",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"07",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"08",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"09",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"10",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);


    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 1, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 2, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 3, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 4, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 5, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 6, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 7, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 8, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 9, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 10, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 11, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 12, wallet_1.address, chain, deployerWallet.address));
    // cycle 7
    // pool.withdrawZestRewards(0, ZP_TOKEN, REWARDS_CALC, wallet_1.address);
    block = chain.mineBlock([...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,300_000_000,"00",supplierId,300_000_000*fee/10_000,4,chain.blockHeight - 2)]);
    // console.log(ZestRewardDist.getCurrentCycle(0, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 1, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 2, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 3, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 4, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 5, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 6, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 7, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 8, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 9, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 10, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 11, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getCycleSharePrincipal(0, 12, wallet_1.address, chain, deployerWallet.address));
    
    // console.log(block.receipts[2].events);
    
    let funds = (consumeUint(lpToken.getBalance("lp-token", 0, wallet_1.address).result.expectOk() as string));
    
    assert(chain.getAssetsMaps().assets[".zge000-governance-token.zest"][wallet_1.address] > 0);

    ZestRewardDist.getCycleSharePrincipal(0, 7, wallet_1.address, chain, deployerWallet.address).result.expectUint(0);
    ZestRewardDist.getCycleSharePrincipal(0, 8, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 9, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 10, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 11, wallet_1.address, chain, deployerWallet.address).result.expectUint(0);
  },
});

Clarinet.test({
  name: "Can send funds after end of commitment. Claims rewards and locks ALL funds for the new set commitment",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_2 = accounts.get("wallet_2") as Account; // LP_2
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
    let wallet_9 = accounts.get("wallet_9") as Account; // borrower_2

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let lpToken = new LPToken(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);
    let DAY = consumeUint(Globals.getDayLengthDefault(chain, deployerWallet.address));

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,300_000_000,preimage,supplierId,300_000_000*fee/10_000,8,chain.blockHeight - 1),
      Magic.initializeSwapper(wallet_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_2.address,sender,recipient,500,1,300_000_000,preimage,supplierId,300_000_000*fee/10_000,8,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,DAY * 10 * 36,DAY * 10,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);

    
    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"02",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"03",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"04",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"05",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"06",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"07",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"08",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"09",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"10",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"11",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"12",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    // cycle 10

    let sum = (consumeUint(ZestRewardDist.getCycleRewards(0, 1, chain, deployerWallet.address).result));
    // sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 2, chain, deployerWallet.address).result));
    // sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 3, chain, deployerWallet.address).result));
    // sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 4, chain, deployerWallet.address).result));
    // sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 5, chain, deployerWallet.address).result));
    // sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 6, chain, deployerWallet.address).result));
    // sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 7, chain, deployerWallet.address).result));
    // sum += (consumeUint(ZestRewardDist.getCycleRewards(0, 8, chain, deployerWallet.address).result));

    sum = (consumeUint(ZestRewardDist.getallCycleRewardsOf(0, wallet_1.address, chain, deployerWallet.address).result));

    let commitment = (consumeUint(ZestRewardDist.getBalanceUint(0, wallet_1.address, chain, deployerWallet.address).result));
    block = chain.mineBlock([...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,600_000_000,"00",supplierId,600_000_000*fee/10_000,6,chain.blockHeight - 2)]);
    // console.log(block);
    // console.log(block.receipts[2].events);
    
    const HALF_ZEST = 100;
    let delta = 1;
    let passiveRewards = commitment * delta / 10000 / HALF_ZEST;
    
    let multiplier = consumeUint(RewardsCalc.getMultiplier(chain, "rewards-calc", 8, deployerWallet.address).receipts[0].result);
    // console.log(Math.floor(sum * multiplier/ 10_000));
    // console.log(passiveRewards);
    // console.log(multiplier)

    let funds = (consumeUint(lpToken.getBalance("lp-token", 0, wallet_1.address).result.expectOk() as string));

    assertEquals(chain.getAssetsMaps().assets[".zge000-governance-token.zest"][wallet_1.address], Math.floor(sum * multiplier / 10_000) + passiveRewards);
    ZestRewardDist.getCycleSharePrincipal(0, 9, wallet_1.address, chain, deployerWallet.address).result.expectUint(0);
    ZestRewardDist.getCycleSharePrincipal(0, 10, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 11, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 12, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 13, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 14, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 15, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 16, wallet_1.address, chain, deployerWallet.address).result.expectUint(0);
  },
});

Clarinet.test({
  name: "Can send funds after end of commitment. Claims rewards and locks ALL funds for the new set commitment. Then, multiple liquidity providers can claim funds.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_2 = accounts.get("wallet_2") as Account; // LP_2
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
    let wallet_9 = accounts.get("wallet_9") as Account; // borrower_2

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let lpToken = new LPToken(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);
    let DAY = consumeUint(Globals.getDayLengthDefault(chain, deployerWallet.address));

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,300_000_000,preimage,supplierId,300_000_000*fee/10_000,8,chain.blockHeight - 1),
      Magic.initializeSwapper(wallet_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_2.address,sender,recipient,500,1,300_000_000,preimage,supplierId,300_000_000*fee/10_000,8,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,DAY * 10 * 36,DAY * 10,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"02",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"03",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"04",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"05",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"06",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"07",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"08",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"09",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"10",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"11",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"12",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    // cycle 10
    let sum = (consumeUint(ZestRewardDist.getallCycleRewardsOf(0, wallet_1.address, chain, deployerWallet.address).result));

    let commitment = (consumeUint(ZestRewardDist.getBalanceUint(0, wallet_1.address, chain, deployerWallet.address).result));
    
    block = chain.mineBlock([...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,600_000_000,"00",supplierId,600_000_000*fee/10_000,6,chain.blockHeight - 2)]);
    // console.log(block.receipts[2].events);
    
    let funds = (consumeUint(lpToken.getBalance("lp-token", 0, wallet_1.address).result.expectOk() as string));
    let multiplier = consumeUint(RewardsCalc.getMultiplier(chain, "rewards-calc", 8, deployerWallet.address).receipts[0].result);

    const HALF_ZEST = 100;
    let delta = 1;
    let passiveRewards = commitment * delta / 10000 / HALF_ZEST;

    // console.log(passiveRewards);
    
    assertEquals(chain.getAssetsMaps().assets[".zge000-governance-token.zest"][wallet_1.address], Math.floor(sum * 120/ 10_000) + passiveRewards);
    // TODO: add back when passive rewards are activated
    // assertEquals(chain.getAssetsMaps().assets[".zge000-governance-token.zest"][wallet_1.address], 49971);
    ZestRewardDist.getCycleSharePrincipal(0, 9, wallet_1.address, chain, deployerWallet.address).result.expectUint(0);
    ZestRewardDist.getCycleSharePrincipal(0, 10, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 11, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 12, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 13, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 14, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 15, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
    ZestRewardDist.getCycleSharePrincipal(0, 16, wallet_1.address, chain, deployerWallet.address).result.expectUint(0);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"13",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"14",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1)
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"15",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"16",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"17",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"18",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"19",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"20",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"21",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    let cycleShareBy = (consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 10, wallet_1.address, chain, deployerWallet.address).result))
    cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 11, wallet_1.address, chain, deployerWallet.address).result)
    cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 12, wallet_1.address, chain, deployerWallet.address).result)
    cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 13, wallet_1.address, chain, deployerWallet.address).result)
    cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 14, wallet_1.address, chain, deployerWallet.address).result)
    cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 15, wallet_1.address, chain, deployerWallet.address).result)

    let totalCycleAmount = consumeUint(ZestRewardDist.getCycleShare(0, 10, chain, deployerWallet.address).result)
    totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 11, chain, deployerWallet.address).result)
    totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 12, chain, deployerWallet.address).result)
    totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 13, chain, deployerWallet.address).result)
    totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 14, chain, deployerWallet.address).result)
    totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 15, chain, deployerWallet.address).result)

    let cycleRewards = consumeUint(ZestRewardDist.getCycleRewards(0, 10, chain, deployerWallet.address).result);
    cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 11, chain, deployerWallet.address).result);
    cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 12, chain, deployerWallet.address).result);
    cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 13, chain, deployerWallet.address).result);
    cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 14, chain, deployerWallet.address).result);
    cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 15, chain, deployerWallet.address).result);

    let result_1 = cycleRewards * cycleShareBy / totalCycleAmount;

    cycleShareBy = (consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 1, wallet_2.address, chain, deployerWallet.address).result))
    cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 2, wallet_2.address, chain, deployerWallet.address).result)
    cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 3, wallet_2.address, chain, deployerWallet.address).result)
    cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 4, wallet_2.address, chain, deployerWallet.address).result)
    cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 5, wallet_2.address, chain, deployerWallet.address).result)
    cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 6, wallet_2.address, chain, deployerWallet.address).result)
    cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 7, wallet_2.address, chain, deployerWallet.address).result)
    cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 8, wallet_2.address, chain, deployerWallet.address).result)
    
    totalCycleAmount = consumeUint(ZestRewardDist.getCycleShare(0, 1, chain, deployerWallet.address).result)
    totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 2, chain, deployerWallet.address).result)
    totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 3, chain, deployerWallet.address).result)
    totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 4, chain, deployerWallet.address).result)
    totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 5, chain, deployerWallet.address).result)
    totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 6, chain, deployerWallet.address).result)
    totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 7, chain, deployerWallet.address).result)
    totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 8, chain, deployerWallet.address).result)

    cycleRewards = consumeUint(ZestRewardDist.getCycleRewards(0, 1, chain, deployerWallet.address).result);
    cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 2, chain, deployerWallet.address).result);
    cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 3, chain, deployerWallet.address).result);
    cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 4, chain, deployerWallet.address).result);
    cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 5, chain, deployerWallet.address).result);
    cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 6, chain, deployerWallet.address).result);
    cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 7, chain, deployerWallet.address).result);
    cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 8, chain, deployerWallet.address).result);

    let result_2 = cycleRewards * cycleShareBy / totalCycleAmount;

    chain.mineEmptyBlockUntil(consumeUint(ZestRewardDist.getNextCycleHeight(0, chain, deployerWallet.address).result.expectSome() as string));
    chain.mineEmptyBlockUntil(consumeUint(ZestRewardDist.getNextCycleHeight(0, chain, deployerWallet.address).result.expectSome() as string));

    // console.log(ZestRewardDist.getCurrentCycle(0, chain, deployerWallet.address));

    // console.log(ZestRewardDist.getCurrentCycle(0, chain, deployerWallet.address));
    block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);
    // console.log(block.receipts[0].events);
    // console.log(block);

    // console.log(RewardsCalc.polynomial(chain, "rewards-calc", 8, deployerWallet.address));
    // console.log(RewardsCalc.getMultiplier(chain, "rewards-calc", 8, deployerWallet.address));

    let prev = (chain.getAssetsMaps().assets[".zge000-governance-token.zest"][wallet_1.address]);
    block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);
    // console.log(block);
    let after = chain.getAssetsMaps().assets[".zge000-governance-token.zest"][wallet_1.address];

    block.receipts[0].result.expectOk()
    // block.receipts[0].result.expectOk().expectTuple()["zest-cycle-rewards"].expectUint(after - prev);
    // console.log(block.receipts[0].events);
    
    // block.receipts[0].result.expectOk().expectTuple()["cycle-rewards"].expectUint(result_1)
    // block.receipts[0].result.expectOk().expectTuple()["cycle-rewards"].expectUint(5917752);

    prev  = 0;
    block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_2.address);
    after = chain.getAssetsMaps().assets[".zge000-governance-token.zest"][wallet_2.address];
    block.receipts[0].result.expectOk()
    // block.receipts[0].result.expectOk().expectTuple()["zest-cycle-rewards"].expectUint(after - prev);
    
    // block.receipts[0].result.expectOk().expectTuple()["cycle-rewards"].expectUint(result_2);
    // block.receipts[0].result.expectOk().expectTuple()["cycle-rewards"].expectUint(3616404);
  },
});
