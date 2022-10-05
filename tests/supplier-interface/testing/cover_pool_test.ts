// deno-lint-ignore-file
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { Pool } from '../../interfaces/pool-v1-0.ts';
import { CoverPool } from '../../interfaces/cover-pool-v1-0.ts';
import { Loan } from '../../interfaces/loan-v1-0.ts';
import { LPToken } from '../../interfaces/lp-token.ts';
import { CPToken } from '../../interfaces/cp-token.ts';
import { Buffer } from "https://deno.land/std@0.110.0/node/buffer.ts";
import { TestUtils } from '../../interfaces/test-utils.ts';
import { Bridge } from '../../interfaces/bridge_real.ts';
import { Globals } from '../../interfaces/globals.ts';
import { SupplierInterface } from '../../interfaces/supplier_interface.ts';
import { CpTokenRewards } from "../../interfaces/cpTokenRewards.ts";
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
  CP_REWARDS_TOKEN,
  COVER_VAULT
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Pool coverage provider can send funds and receive cp and cp-rewards tokens",
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

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    block = pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    block = pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);

    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover.address);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    assertEquals(chain.getAssetsMaps().assets[".cp-rewards-token.cp-rewards-001"][cover.address], 100_000_000_000);
    assertEquals(chain.getAssetsMaps().assets[".cp-token.cp-001"][cover.address], 100_000_000_000);
    let fundsAfterCoverage = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][cover.address];

    chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);
    
    block = pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);
    
    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    chain.mineEmptyBlock(10);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    
    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);

    block = chain.mineBlock([
      Bridge.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);
    
    chain.mineEmptyBlock(1440);

    block = chain.mineBlock([
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);

    let fundsOnBridge_CP = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.bridge`];
    // block = coverPool.withdrawRewards(CP_REWARDS_TOKEN, 0, LIQUIDITY_VAULT, XBTC, cover.address);
    block = chain.mineBlock([SupplierInterface.withdrawCoverRewards(P2PKH_VERSION, HASH, 0, CP_REWARDS_TOKEN, 0, LIQUIDITY_VAULT, XBTC, cover.address)]);

    assert(fundsOnBridge_CP < chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.bridge`])
    
    block = coverPool.withdrawZestRewards(CP_TOKEN, 0, REWARDS_CALC, cover.address);

    assert(chain.getAssetsMaps().assets[".zge000-governance-token.zest"][cover.address] >= 2_100_000_000_000_000n);
  },
});

Clarinet.test({
  name: "Multiple covergage providers can send funds and claim rewards.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2
    let cover_1 = accounts.get("wallet_3") as Account; // Cover_1
    let cover_2 = accounts.get("wallet_4") as Account; // Cover_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);
    let CpToken = new CPToken(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    block = pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    block = pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover_1.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover_2.address);

    let fundsAfterCoverage_1 = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][cover_1.address];
    let fundsAfterCoverage_2 = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][cover_2.address];

    block = chain.mineBlock([
      ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,5),
      Bridge.initializeSwapper(LP_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_2.address,sender,recipient,500,1,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,5),
    ]);

    let fundsOnBridge = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.bridge`];

    block = pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);
    
    block = chain.mineBlock([
      Bridge.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"00",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);
    
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    
    block = chain.mineBlock([
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,2,regularPaymentDue,"01",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);

    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);

    // block = coverPool.withdrawRewards(CP_REWARDS_TOKEN, 0, LIQUIDITY_VAULT, XBTC, cover_1.address);
    block = coverPool.withdrawZestRewards(CP_TOKEN, 0, REWARDS_CALC, cover_1.address);
    // block = coverPool.withdrawRewards(CP_REWARDS_TOKEN, 0, LIQUIDITY_VAULT, XBTC, cover_2.address);
    block = coverPool.withdrawZestRewards(CP_TOKEN, 0, REWARDS_CALC, cover_2.address);

    let fundsOnBridge_CP = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.bridge`];

    block = chain.mineBlock([SupplierInterface.withdrawCoverRewards(P2PKH_VERSION, HASH, 0, CP_REWARDS_TOKEN, 0, LIQUIDITY_VAULT, XBTC, cover_1.address)]);
    assert(fundsOnBridge_CP < chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.bridge`])
    fundsOnBridge_CP = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.bridge`];

    block = chain.mineBlock([SupplierInterface.withdrawCoverRewards(P2PKH_VERSION, HASH, 0, CP_REWARDS_TOKEN, 0, LIQUIDITY_VAULT, XBTC, cover_2.address)]);
    assert(fundsOnBridge_CP < chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.bridge`])

    
    fundsOnBridge_CP = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.bridge`];
    block = chain.mineBlock([SupplierInterface.withdrawRewards(P2PKH_VERSION, HASH, 0, LP_TOKEN, 0, LIQUIDITY_VAULT, XBTC, LP_1.address)]);
    assert(fundsOnBridge_CP < chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.bridge`])

    fundsOnBridge_CP = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.bridge`];
    block = chain.mineBlock([SupplierInterface.withdrawRewards(P2PKH_VERSION, HASH, 0, LP_TOKEN, 0, LIQUIDITY_VAULT, XBTC, LP_2.address)]);
    assert(fundsOnBridge_CP < chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.bridge`])


    assert(fundsOnBridge < chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.bridge`]);

    assert(chain.getAssetsMaps().assets[".zge000-governance-token.zest"][cover_1.address] > 2_100_000_000_000_000n);
    assert(chain.getAssetsMaps().assets[".zge000-governance-token.zest"][cover_2.address] > 0n);
  },
});

Clarinet.test({
  name: "Pool coverage provider can send funds in the middle of cmmitment and claim zest rewards",
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

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    let coverSent = 10_000_000_000;

    let DAY = consumeUint(Globals.getDayLengthDefault(chain, deployerWallet.address));
    let CYCLE = consumeUint(Globals.getCycleLengthDefault(chain, deployerWallet.address));

    block = pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,coverSent,coverSent,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    let creationHeight = (chain.blockHeight);
    block = pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 4, REWARDS_CALC, cover.address);

    block = chain.mineBlock([
      ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,10,chain.blockHeight - 1)
    ]);

    CpToken.getCycleStart(CP_TOKEN, 0).expectUint(creationHeight);
    assertEquals(consumeUint(CpToken.getCycleShare(CP_TOKEN, 0, 1)) %  coverSent, 0);

    block = pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,DAY * 10 * 9,DAY * 10,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);
    
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);
    
    block = chain.mineBlock([
      Bridge.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);
    
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 1, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 2, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 3, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 4, cover.address).expectUint(100_000_000_000);

    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);
    
    coverPool.withdrawZestRewards(CP_TOKEN, 0, REWARDS_CALC, cover.address).receipts[0].result.expectOk();
    
    // console.log(CpToken.getCurrentCycle(CP_TOKEN, 0));
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 1, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 2, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 3, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 4, cover.address).expectUint(100_000_000_000);
    
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"02",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);
    
    block = coverPool.withdrawZestRewards(CP_TOKEN, 0, REWARDS_CALC, cover.address)
    block.receipts[0].result.expectOk();
    
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 1, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 2, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 3, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 4, cover.address).expectUint(100_000_000_000);
    
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"03",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"04",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);

    block = coverPool.withdrawZestRewards(CP_TOKEN, 0, REWARDS_CALC, cover.address);
    block.receipts[0].result.expectOk();

    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 1, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 2, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 3, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 4, cover.address).expectUint(100_000_000_000);

    CpToken.getCycleRewards(CP_TOKEN, 0, 1);
    CpToken.getCycleRewards(CP_TOKEN, 0, 2);
    CpToken.getCycleRewards(CP_TOKEN, 0, 3).expectUint(consumeUint(CpToken.getCycleRewards(CP_TOKEN, 0, 2)) * 2);

    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"05",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);

    block = coverPool.withdrawZestRewards(CP_TOKEN, 0, REWARDS_CALC, cover.address);

    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 1, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 2, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 3, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 4, cover.address).expectUint(0);
  },
});


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

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    let coverSent = 10_000_000_000;
    let DAY = consumeUint(Globals.getDayLengthDefault(chain, deployerWallet.address));

    block = pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,coverSent,coverSent,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    let creationHeight = (chain.blockHeight);
    block = pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 4, REWARDS_CALC, cover.address);

    block = chain.mineBlock([
      ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,10,chain.blockHeight - 1)
    ]);

    CpToken.getCycleStart(CP_TOKEN, 0).expectUint(creationHeight);
    assertEquals(consumeUint(CpToken.getCycleShare(CP_TOKEN, 0, 1)) %  coverSent, 0);

    block = pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,DAY * 10 * 9,DAY * 10,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);
    
    block = chain.mineBlock([
      Bridge.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,82191,"00",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 1, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 2, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 3, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 4, cover.address).expectUint(100_000_000_000);

    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);
    
    coverPool.withdrawZestRewards(CP_TOKEN, 0, REWARDS_CALC, cover.address).receipts[0].result.expectOk();
    
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 1, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 2, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 3, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 4, cover.address).expectUint(100_000_000_000);
    
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"02",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);
    
    block = coverPool.withdrawZestRewards(CP_TOKEN, 0, REWARDS_CALC, cover.address)
    block.receipts[0].result.expectOk();
    
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 1, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 2, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 3, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 4, cover.address).expectUint(100_000_000_000);
    
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"03",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"04",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);

    // console.log(CpToken.getCurrentCycle(CP_TOKEN, 0));
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 4, REWARDS_CALC, cover.address);
    // console.log(block.receipts[0].events)

    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 4, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 5, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 6, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 7, cover.address).expectUint(100_000_000_000);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 8, cover.address).expectUint(0);
    CpToken.getCycleShareByPrincipal(CP_TOKEN, 0, 9, cover.address).expectUint(0);
  },
});

Clarinet.test({
  name: "Pool coverage provider can claim cycle rewards after the commitment is done",
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

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    let coverSent = 10_000_000_000;

    block = pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,coverSent,coverSent,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    let creationHeight = (chain.blockHeight);
    block = pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 4, REWARDS_CALC, cover.address);

    block = chain.mineBlock([
      ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,5,chain.blockHeight - 1)
    ]);

    CpToken.getCycleStart(CP_TOKEN, 0).expectUint(creationHeight);
    assertEquals(consumeUint(CpToken.getCycleShare(CP_TOKEN, 0, 1)) %  coverSent, 0);

    block = pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    
    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);

    block = chain.mineBlock([
      Bridge.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"02",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);    
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"03",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"04",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"05",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"06",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"07",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"08",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(CpToken.getNextCycleHeight(CP_TOKEN, 0).result.expectSome() as string) + 1);

    block = coverPool.withdrawZestRewards(CP_TOKEN, 0, REWARDS_CALC, cover.address);
    let DAY = consumeUint(Globals.getDayLengthDefault(chain, deployerWallet.address));
    let outcome = DAY % 144 ? 3550 : 4438;

    block.receipts[0].result.expectOk().expectTuple()["zest-base-rewards"].expectUint(0);
    block.receipts[0].result.expectOk().expectTuple()["zest-cycle-rewards"].expectUint(outcome);
  }
});
