// deno-lint-ignore-file
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.5.4/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.159.0/testing/asserts.ts';
import { Pool } from '../../interfaces/pool-v1-0.ts';
import { CoverPool } from '../../interfaces/cover-pool-v1-0.ts';
import { Loan } from '../../interfaces/loan-v1-0.ts';
import { LPToken } from '../../interfaces/lp-token.ts';
import { CPToken } from '../../interfaces/cp-token.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";
import { TestUtils } from '../../interfaces/test-utils.ts';
import { Magic } from '../../interfaces/magic_real.ts';
import { Globals } from '../../interfaces/globals.ts';
import { SupplierInterface } from '../../interfaces/supplier_interface.ts';
import { CpTokenRewards } from "../../interfaces/cpTokenRewards.ts"
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
  ZEST_TOKEN,
  CP_REWARDS_TOKEN
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Pool coverage provider can claim cycle rewards in the middle of a commitment",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2
    let cover = accounts.get("wallet_3") as Account; // Cover_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);
    let CpToken = new CPToken(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, deployerWallet.address);

    let coverSent = 10_000_000_000;

    let DAY = consumeUint(Globals.getDayLengthDefault(chain, deployerWallet.address));
    let CYCLE = consumeUint(Globals.getCycleLengthDefault(chain, deployerWallet.address));

    block = pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,coverSent,coverSent,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,XBTC,true,false);
    
    block = pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    let creationHeight = (chain.blockHeight);
    block = pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);
    block = coverPool.sendFunds(CP_TOKEN,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 4, REWARDS_CALC, cover.address);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,10,chain.blockHeight - 1)
    ]);

    CpToken.getCycleStart(CP_TOKEN, 0).expectUint(creationHeight);
    assertEquals(consumeUint(CpToken.getCycleShare(CP_TOKEN, 0, 1)) %  coverSent, 0);

    block = pool.createLoan(LP_TOKEN,0,100_000_000,0,XBTC,300,DAY * 10 * 9,DAY * 10,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, LIQUIDITY_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99000000, 0, 28, wallet_8.address, deployerWallet.address)]);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let minToReceive = Math.floor(regularPaymentDue * fee / 10_000);
    let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);

    // console.log(block);
    
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);
    
    coverPool.withdrawZestRewards(CP_TOKEN, 0, REWARDS_CALC, cover.address);
    
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"02",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);
    
    block = coverPool.withdrawZestRewards(CP_TOKEN, 0, REWARDS_CALC, cover.address)
    
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"03",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"04",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);

    block = coverPool.withdrawZestRewards(CP_TOKEN, 0, REWARDS_CALC, cover.address);

    block = coverPool.sendFunds(CP_TOKEN,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 8, REWARDS_CALC, cover.address);

    // console.log(CpToken.getCurrentCycle(CP_TOKEN, 0));
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 4, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 5, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 6, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 7, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 8, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 9, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 10, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 11, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 12, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 13, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 14, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 15, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 16, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 17, cover.address).expectUint(0);


    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"05",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);

    block = coverPool.withdrawZestRewards(CP_TOKEN, 0, REWARDS_CALC, cover.address);

    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"05",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);

  },
});

// Clarinet.test({
//   name: "Can send funds after end of commitment. Claims rewards and locks ALL funds for the new set commitment. Then, multiple liquidity providers can claim funds.",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployerWallet = accounts.get("deployer") as Account;
//     let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
//     let wallet_2 = accounts.get("wallet_2") as Account; // LP_2
//     let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
//     let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
//     let wallet_9 = accounts.get("wallet_9") as Account; // borrower_2

//     let assetMaps = chain.getAssetsMaps();
//     let pool = new Pool(chain, deployerWallet);
//     let loan = new Loan(chain, deployerWallet);
//     let lpToken = new LPToken(chain, deployerWallet);

//     let block = Globals.onboardUser(chain, wallet_8.address, deployerWallet.address);

//     pool.createPool(wallet_7.address,LP_TOKEN,0,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,1,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,XBTC,true);
//     pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

//     block = chain.mineBlock([
//       ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
//       Magic.initializeSwapper(wallet_1.address),
//       ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,300_000_000,preimage,0,8,5),
//       Magic.initializeSwapper(wallet_2.address),
//       ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_2.address,sender,recipient,500,1,300_000_000,preimage,0,8,5)
//     ]);

//     pool.createLoan(LP_TOKEN,0,100_000_000,0,XBTC,300,51840,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
//     pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,100_000_000,XBTC,wallet_7.address);
//     chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
//     block = chain.mineBlock([
//       SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, LIQUIDITY_VAULT, P2PKH_VERSION, HASH, 0, XBTC, wallet_8.address)
//     ]);

//     chain.mineEmptyBlock(10);
    
//     block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99000000, 0, 28, wallet_8.address, deployerWallet.address)]);

//     chain.mineEmptyBlock(1300);

//     block = chain.mineBlock([
//       Magic.initializeSwapper(wallet_8.address),
//       ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"00",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,1318, XBTC)
//     ]);

//     // console.log(ZestRewardDist.getClaimableRewardsBy(0, wallet_1.address, chain, deployerWallet.address));
//     // console.log(ZestRewardDist.getWithdrawableFundsOf(0, wallet_1.address, chain, deployerWallet.address));
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
//     // console.log(ZestRewardDist.getPointsPerShare(0, chain, deployerWallet.address));
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"01",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     // console.log(ZestRewardDist.getClaimableRewardsBy(0, wallet_1.address, chain, deployerWallet.address));
//     // console.log(ZestRewardDist.getWithdrawableFundsOf(0, wallet_1.address, chain, deployerWallet.address));
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"02",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"03",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"04",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"05",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"06",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"07",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"08",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"09",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"10",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"11",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"12",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);


//     let cycleShareBy = (consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 1, wallet_1.address, chain, deployerWallet.address).result))
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 2, wallet_1.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 3, wallet_1.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 4, wallet_1.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 5, wallet_1.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 6, wallet_1.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 7, wallet_1.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 8, wallet_1.address, chain, deployerWallet.address).result)

//     let totalCycleAmount = consumeUint(ZestRewardDist.getCycleShare(0, 1, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 2, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 3, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 4, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 5, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 6, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 7, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 8, chain, deployerWallet.address).result)

//     let cycleRewards = consumeUint(ZestRewardDist.getCycleRewards(0, 1, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 2, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 3, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 4, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 5, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 6, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 7, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 8, chain, deployerWallet.address).result);

//     let resultFinal = cycleRewards * cycleShareBy / totalCycleAmount;

//     // ZestRewardDist.getClaimableRewardsBy(0, wallet_1.address, chain, deployerWallet.address).result.expectOk().expectUint(resultFinal);
//     // assertEquals(resultFinal, consumeUint(ZestRewardDist.getallCycleRewardsOf(0, wallet_1.address, chain, deployerWallet.address).result));
//     // ZestRewardDist.getWithdrawableRewards(0, wallet_1.address, chain, deployerWallet.address).result.expectTuple()["cycle-rewards"].expectUint(resultFinal);

//     // cycle 10
//     block = chain.mineBlock([...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,600_000_000,"00",0,6,chain.blockHeight - 2)]);

//     let funds = (consumeUint(lpToken.getBalance("lp-token", 0, wallet_1.address).result.expectOk() as string));
    
//     // assertEquals(chain.getAssetsMaps().assets[".zge000-governance-token.zest"][wallet_1.address], 49971);
//     ZestRewardDist.getCycleSharePrincipal(0, 9, wallet_1.address, chain, deployerWallet.address).result.expectUint(0);
//     ZestRewardDist.getCycleSharePrincipal(0, 10, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
//     ZestRewardDist.getCycleSharePrincipal(0, 11, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
//     ZestRewardDist.getCycleSharePrincipal(0, 12, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
//     ZestRewardDist.getCycleSharePrincipal(0, 13, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
//     ZestRewardDist.getCycleSharePrincipal(0, 14, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
//     ZestRewardDist.getCycleSharePrincipal(0, 15, wallet_1.address, chain, deployerWallet.address).result.expectUint(funds);
//     ZestRewardDist.getCycleSharePrincipal(0, 16, wallet_1.address, chain, deployerWallet.address).result.expectUint(0);

//     // console.log("===========")
//     // console.log(ZestRewardDist.getClaimableRewardsBy(0, wallet_1.address, chain, deployerWallet.address));
//     // console.log(ZestRewardDist.getWithdrawableFundsOf(0, wallet_1.address, chain, deployerWallet.address));

//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"13",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     // console.log(ZestRewardDist.getClaimableRewardsBy(0, wallet_1.address, chain, deployerWallet.address));
//     // console.log(ZestRewardDist.getWithdrawableFundsOf(0, wallet_1.address, chain, deployerWallet.address));
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"14",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     // console.log(ZestRewardDist.getClaimableRewardsBy(0, wallet_1.address, chain, deployerWallet.address));
//     // console.log(ZestRewardDist.getWithdrawableFundsOf(0, wallet_1.address, chain, deployerWallet.address));
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1)
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"15",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"16",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"17",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"18",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"19",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"20",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
//     block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,82191,"21",0,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

//     cycleShareBy = (consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 10, wallet_1.address, chain, deployerWallet.address).result))
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 11, wallet_1.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 12, wallet_1.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 13, wallet_1.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 14, wallet_1.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 15, wallet_1.address, chain, deployerWallet.address).result)

//     totalCycleAmount = consumeUint(ZestRewardDist.getCycleShare(0, 10, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 11, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 12, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 13, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 14, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 15, chain, deployerWallet.address).result)

//     cycleRewards = consumeUint(ZestRewardDist.getCycleRewards(0, 10, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 11, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 12, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 13, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 14, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 15, chain, deployerWallet.address).result);

//     let result_1 = cycleRewards * cycleShareBy / totalCycleAmount;

//     cycleShareBy = (consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 1, wallet_2.address, chain, deployerWallet.address).result))
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 2, wallet_2.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 3, wallet_2.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 4, wallet_2.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 5, wallet_2.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 6, wallet_2.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 7, wallet_2.address, chain, deployerWallet.address).result)
//     cycleShareBy += consumeUint(ZestRewardDist.getCycleSharePrincipal(0, 8, wallet_2.address, chain, deployerWallet.address).result)
    
//     totalCycleAmount = consumeUint(ZestRewardDist.getCycleShare(0, 1, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 2, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 3, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 4, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 5, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 6, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 7, chain, deployerWallet.address).result)
//     totalCycleAmount += consumeUint(ZestRewardDist.getCycleShare(0, 8, chain, deployerWallet.address).result)

//     cycleRewards = consumeUint(ZestRewardDist.getCycleRewards(0, 1, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 2, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 3, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 4, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 5, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 6, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 7, chain, deployerWallet.address).result);
//     cycleRewards += consumeUint(ZestRewardDist.getCycleRewards(0, 8, chain, deployerWallet.address).result);

//     let result_2 = cycleRewards * cycleShareBy / totalCycleAmount;

//     chain.mineEmptyBlockUntil(consumeUint(ZestRewardDist.getNextCycleHeight(0, chain, deployerWallet.address).result.expectSome() as string));
//     chain.mineEmptyBlockUntil(consumeUint(ZestRewardDist.getNextCycleHeight(0, chain, deployerWallet.address).result.expectSome() as string));

//     // console.log(ZestRewardDist.getCurrentCycle(0, chain, deployerWallet.address));
//     // console.log(ZestRewardDist.getallCycleRewardsOf(0, wallet_1.address, chain, deployerWallet.address));
//     // console.log(ZestRewardDist.getClaimableRewardsBy(0, wallet_1.address, chain, deployerWallet.address));
//     // console.log(ZestRewardDist.getWithdrawableFundsOf(0, wallet_1.address, chain, deployerWallet.address));
//     // console.log(ZestRewardDist.getWithdrawableRewards(0, wallet_1.address, chain, deployerWallet.address));

//     console.log(ZestRewardDist.getCurrentCycle(0, chain, deployerWallet.address));

//     // block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);
//     // console.log(block.receipts[0].events);
//     // block.receipts[0].result.expectOk().expectTuple()["cycle-rewards"].expectUint(result_1);
//     // block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_2.address);
//     // console.log(block.receipts[0].events);
//     // block.receipts[0].result.expectOk().expectTuple()["cycle-rewards"].expectUint(result_2);
//   },
// });

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

    let block = Globals.onboardUserAddress(chain, wallet_8.address, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,XBTC,true,false);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    chain.mineBlock([
      ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
    ])

    let fee = Number(Magic.getSupplier(chain, 0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,300_000_000,preimage,0,300_000_000 * fee /10_000,8,chain.blockHeight - 1),
      Magic.initializeSwapper(wallet_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_2.address,sender,recipient,500,1,300_000_000,preimage,0,300_000_000 * fee /10_000,8,chain.blockHeight - 1)
    ]);

    // console.log(ZestRewardDist.getBalanceUint(0, wallet_1.address, chain, deployerWallet.address));

    pool.createLoan(LP_TOKEN,0,100_000_000,0,XBTC,300,51840,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, LIQUIDITY_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);

    chain.mineEmptyBlock(10);
    
    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99000000, 0, 28, wallet_8.address, deployerWallet.address)]);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let minToReceive = Math.floor(regularPaymentDue * fee / 10_000);
    let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"00",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,1318, XBTC)
    ]);
    // console.log("========================================================");
    // console.log(ZestRewardDist.getallCycleRewardsOf(0, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getWithdrawableFundsOf(0, wallet_1.address, chain, deployerWallet.address));

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"01",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"02",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"03",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"04",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"05",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"06",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"07",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"08",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"09",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"10",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"11",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"12",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    // console.log(ZestRewardDist.getCurrentCycle(0, chain, deployerWallet.address));

    // console.log(ZestRewardDist.getallCycleRewardsOf(0, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getWithdrawableFundsOf(0, wallet_1.address, chain, deployerWallet.address));

    block = chain.mineBlock([...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,600_000_000,"00",0, 600_000_000 * 10 / 10_000,6,chain.blockHeight - 2)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"13",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"14",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"15",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"16",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"17",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"18",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"19",0,minToReceive,0, PAYMENT, LP_TOKEN, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    // console.log("========================================================");
    // console.log(ZestRewardDist.getallCycleRewardsOf(0, wallet_1.address, chain, deployerWallet.address));
    // console.log(ZestRewardDist.getWithdrawableFundsOf(0, wallet_1.address, chain, deployerWallet.address));

    // block = pool.withdrawZestRewards(0,ZP_TOKEN, REWARDS_CALC, wallet_1.address);
    // console.log(block);
  },
});
