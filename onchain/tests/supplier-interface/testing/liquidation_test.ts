
// deno-lint-ignore-file
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.3/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.159.0/testing/asserts.ts';
import { Pool } from '../../interfaces/pool-v1-0.ts';
import { CoverPool } from '../../interfaces/cover-pool-v1-0.ts';
import { Loan } from '../../interfaces/loan-v1-0.ts';
import { LPToken } from '../../interfaces/lp-token.ts';
import { CPToken } from '../../interfaces/cp-token.ts';
import { TestUtils } from '../../interfaces/test-utils.ts';
import { Magic } from '../../interfaces/magic_real.ts';
import { Globals } from '../../interfaces/globals.ts';
import { SupplierInterface } from '../../interfaces/supplier_interface.ts';
import { SwapRouter } from '../../interfaces/swap-router.ts';
import { Payment } from '../../interfaces/payment.ts';
import { ClarityBitcoin } from '../../interfaces/clarity_bitcoin.ts';
import { LiquidityVault } from '../../interfaces/liquidity-vault.ts';
import { CollVault } from '../../interfaces/coll-vault.ts';
import { CoverVault } from '../../interfaces/cover-vault.ts';
import { delay } from 'https://deno.land/x/delay@v0.2.0/mod.ts';
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
  finalizeDrawdown,
  consumeUint,
  makePaymentTxs,
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
  XUSD_CONTRACT_SIMNET,
  USDA_CONTRACT_SIMNET,
  COVER_VAULT
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Loan can be liquidated when payment is missed and Grace period expired",
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

    let block = runBootstrap(chain, deployerWallet);
    block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);
    // loan.addBorrower(wallet_8.address, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover.address);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,0,XBTC,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);
    // console.log(block);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let gracePeriod = consumeUint(globals["grace-period"]);
    let nextPaymentIn = consumeUint(loan.getNextpaymentIn(0).result);
    loan.canLiquidate(0).result.expectBool(false);
    chain.mineEmptyBlock(nextPaymentIn + gracePeriod + 2);
    loan.canLiquidate(0).result.expectBool(true);

    block = pool.liquidateLoan(0, LP_TOKEN, 0, LIQUIDITY_VAULT, COLL_VAULT, XBTC,XBTC, CP_TOKEN,COVER_VAULT, SWAP_ROUTER, XBTC, wallet_7.address);
    block.receipts[0].result.expectOk();
  },
});

Clarinet.test({
  name: "Loan without collateral can be liquidated, if loan is smaller than cover pool, only withdraw loan amount. LPers suffer no losses, can withdraw funds sent at the beginning.",
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
    let LpToken = new LPToken(chain, deployerWallet);

    let block = runBootstrap(chain, deployerWallet);
    block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover.address);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    const LP_1_amount = 100_000_000;

    block = chain.mineBlock([
      Magic.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,LP_1_amount,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1),
      Magic.initializeSwapper(LP_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_2.address,sender,recipient,500,1,LP_1_amount,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,0,XBTC,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let gracePeriod = consumeUint(globals["grace-period"]);
    let nextPaymentIn = consumeUint(loan.getNextpaymentIn(0).result);
    
    chain.mineEmptyBlock(nextPaymentIn + gracePeriod + 2);

    block = pool.liquidateLoan(0, LP_TOKEN, 0, LIQUIDITY_VAULT, COLL_VAULT, XBTC,XBTC, CP_TOKEN,COVER_VAULT, SWAP_ROUTER, XBTC, wallet_7.address);
    block.receipts[0].result.expectOk().expectTuple()["staking-pool-recovered"].expectUint(LOAN_AMOUNT);
    block.receipts[0].result.expectOk().expectTuple()["collateral-recovery"].expectUint(0);

    LpToken.recognizableLossesOf("lp-token", 0, LP_1.address).result.expectUint(0);

    block = pool.signalWithdrawal(LP_TOKEN, 0, LP_1_amount,LP_1.address);
    chain.mineEmptyBlock(consumeUint(pool.timeLeftUntilWithdrawal(0, LP_1.address, deployerWallet.address).result));
    
    block = chain.mineBlock([
      SupplierInterface.withdraw(LP_1_amount, P2PKH_VERSION, HASH, 0, LP_TOKEN,ZP_TOKEN, 0,LIQUIDITY_VAULT, XBTC, LP_1.address)
    ]);

    block = chain.mineBlock([
      ...finalizeOutboundTxs(HASH, LP_1_amount, 1, chain.blockHeight - 1, LP_1.address, deployerWallet.address)
    ]);

    block.receipts[1].result.expectOk();
  },
});

Clarinet.test({
  name: "Loan with collateral can be liquidated, if loan is smaller than value of collateral, only withdraw loan amount. The Cover Pool funds are used as well.\
  LPers suffer no losses, can withdraw funds sent at the beginning.",
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
    let LpToken = new LPToken(chain, deployerWallet);

    let block = runBootstrap(chain, deployerWallet);
    block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);
    block = Globals.addCollateralContract(chain, USDA_CONTRACT_SIMNET, deployerWallet.address);
    block = Globals.addCollateralContract(chain, XUSD_CONTRACT_SIMNET, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover.address);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    const LP_1_amount = 100_000_000;

    block = chain.mineBlock([
      Magic.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,LP_1_amount,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;
    
    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,5000,XUSD_CONTRACT_SIMNET,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    
    // console.log(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, LOAN_AMOUNT, deployerWallet.address)]);

    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);
    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);
    
    let gracePeriod = consumeUint(globals["grace-period"]);
    let nextPaymentIn = consumeUint(loan.getNextpaymentIn(0).result);
    
    chain.mineEmptyBlock(nextPaymentIn + gracePeriod + 2);

    const coverPoolFunds = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.cover-vault`];
    const collVaultFunds = chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"][`${deployerWallet.address}.coll-vault`];
    
    block = pool.liquidateLoan(0, LP_TOKEN, 0, LIQUIDITY_VAULT, COLL_VAULT, XUSD_CONTRACT_SIMNET, XBTC, CP_TOKEN,COVER_VAULT,SWAP_ROUTER, XBTC, wallet_7.address);
    // console.log(block);
    // console.log(consumeUint(block.receipts[0].result.expectOk().expectTuple()["collateral-recovery"]));
    const coverPoolRecovered = (consumeUint(block.receipts[0].result.expectOk().expectTuple()["staking-pool-recovered"]));
    // console.log(block.receipts[0].events);
    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.cover-pool-v1-0`]);

    assertEquals(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"][`${deployerWallet.address}.coll-vault`], 0);
    assertEquals(coverPoolFunds - chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.cover-vault`], coverPoolRecovered);

    LpToken.recognizableLossesOf("lp-token", 0, LP_1.address).result.expectUint(0);

    block = pool.signalWithdrawal(LP_TOKEN, 0, LP_1_amount,LP_1.address);
    chain.mineEmptyBlock(consumeUint(pool.timeLeftUntilWithdrawal(0, LP_1.address, deployerWallet.address).result));
    
    block = chain.mineBlock([
      SupplierInterface.withdraw(LP_1_amount, P2PKH_VERSION, HASH, 0, LP_TOKEN,ZP_TOKEN, 0,LIQUIDITY_VAULT, XBTC, LP_1.address)
    ]);

    block = chain.mineBlock([
      ...finalizeOutboundTxs(HASH, LP_1_amount, 1, chain.blockHeight - 1, LP_1.address, deployerWallet.address)
    ]);

  },
});

Clarinet.test({
  name: "Borrower can withdraw collateral if value of collateral increases",
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

    let block = runBootstrap(chain, deployerWallet);
    block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);
    block = Globals.addCollateralContract(chain, XUSD_CONTRACT_SIMNET, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover.address);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,1000,XUSD_CONTRACT_SIMNET,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    chain.mineEmptyBlock(40);

    block = loan.withdrawCollateralLoan(0, 1, SWAP_ROUTER, XUSD_CONTRACT_SIMNET, XBTC, COLL_VAULT, wallet_8.address);
    block.receipts[0].result.expectErr().expectUint(4017);

    let pairValue = SwapRouter.getPairValue(chain, SWAP_ROUTER, XBTC,XUSD_CONTRACT_SIMNET,deployerWallet.address);
    block = SwapRouter.setPairValue(chain,SWAP_ROUTER,XBTC,XUSD_CONTRACT_SIMNET,consumeUint(pairValue.expectSome()) * 5000 / 10000,deployerWallet.address);

    block = loan.withdrawCollateralLoan(0, 98634500001, SWAP_ROUTER, XUSD_CONTRACT_SIMNET, XBTC, COLL_VAULT, wallet_8.address);
    block.receipts[0].result.expectErr().expectUint(4022);

    block = loan.withdrawCollateralLoan(0, 98634500000, SWAP_ROUTER, XUSD_CONTRACT_SIMNET, XBTC, COLL_VAULT, wallet_8.address);
    block.receipts[0].result.expectOk().expectUint(98634500000);
    await delay(5_000);
  },
});

Clarinet.test({
  name: "Can do OTC liquidation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2
    let cover = accounts.get("wallet_3") as Account; // Cover_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
    let wallet_9 = accounts.get("wallet_9") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);
    let lv  = new LiquidityVault(chain, LIQUIDITY_VAULT, deployerWallet);

    let block = runBootstrap(chain, deployerWallet);
    block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);
    block = Globals.addCollateralContract(chain, XUSD_CONTRACT_SIMNET, deployerWallet.address);
    block = Globals.addGovernor(chain, wallet_9.address, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover.address);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    const LOAN_AMOUNT = 100_000_000;

    block = chain.mineBlock([
      Magic.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,LOAN_AMOUNT,preimage,0,LOAN_AMOUNT * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,1000,XUSD_CONTRACT_SIMNET,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));
    let gracePeriod = consumeUint(globals["grace-period"]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) + gracePeriod + 1);

    block = pool.approveGovernor(wallet_9.address, 0, wallet_7.address);

    block = pool.declareLoanLiquidated(0, LP_TOKEN, 0, COLL_VAULT, XUSD_CONTRACT_SIMNET, CP_TOKEN, COVER_VAULT, XBTC, XBTC, wallet_9.address);

    block = pool.returnOtcLiquidation(0, LP_TOKEN, 0, COLL_VAULT, XUSD_CONTRACT_SIMNET, 100000000000, LIQUIDITY_VAULT, 100000000, CP_TOKEN, COVER_VAULT, XBTC, XBTC, wallet_9.address);
    lv.getAsset(0).result.expectOk().expectSome().expectUint(LOAN_AMOUNT);
    CoverVault.getAsset(chain, COVER_VAULT, 0, deployerWallet.address).result.expectOk().expectSome().expectUint(100000000000);
    block = pool.removeGovernor(wallet_9.address, 0, wallet_7.address);
    await delay(10_000);
  },
});
