
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
import { Payment } from '../../interfaces/payment.ts';
import { ClarityBitcoin } from '../../interfaces/clarity_bitcoin.ts';
import { SwapRouter } from '../../interfaces/swapRouter.ts';
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
  USDA_CONTRACT,
  USDA_CONTRACT_SIMNET,
  XUSD_CONTRACT_SIMNET,
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

    // let block = runBootstrap(chain, deployerWallet);
    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);
    // loan.addBorrower(wallet_8.address, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover.address);
    // console.log(block);
    
    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());
    
    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
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
    loan.canLiquidate(0).result.expectBool(false);
    chain.mineEmptyBlock(nextPaymentIn + gracePeriod + 1);
    loan.canLiquidate(0).result.expectBool(true);

    block = pool.liquidateLoan(0, LP_TOKEN, 0, COLL_VAULT, XBTC,XBTC, CP_TOKEN,COVER_VAULT, SWAP_ROUTER, XBTC, wallet_7.address);
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    const LP_1_amount = 100_000_000;

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,LP_1_amount,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1),
      Bridge.initializeSwapper(LP_2.address),
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
    
    chain.mineEmptyBlock(nextPaymentIn + gracePeriod + 1);

    block = pool.liquidateLoan(0, LP_TOKEN, 0, COLL_VAULT, XBTC,XBTC, CP_TOKEN,COVER_VAULT, SWAP_ROUTER, XBTC, wallet_7.address);
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    const LP_1_amount = 100_000_000;

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
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
    
    chain.mineEmptyBlock(nextPaymentIn + gracePeriod + 1);

    const coverPoolFunds = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.cover-vault`];
    const collVaultFunds = chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"][`${deployerWallet.address}.coll-vault`];
    
    block = pool.liquidateLoan(0, LP_TOKEN, 0, COLL_VAULT, XUSD_CONTRACT_SIMNET, XBTC, CP_TOKEN,COVER_VAULT,SWAP_ROUTER, XBTC, wallet_7.address);

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

