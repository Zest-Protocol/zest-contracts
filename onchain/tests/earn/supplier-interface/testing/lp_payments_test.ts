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
import { Payment } from '../../interfaces/payment.ts';
import { LiquidityVault } from '../../interfaces/liquidity-vault.ts';
import { 
  getHash,
  getReverseTxId,
  getTxId,
  getExpiration,
  swapperBuff,
  generateP2PKHTx,
generateP2SHTx
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
  makeFullPaymentTxs,
  finalizeDrawdown,
  getBP,
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
  SWAP_ROUTER,
  ONE_DAY,
  CP_REWARDS_TOKEN,
  COVER_VAULT
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Borrower can make a payment",
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

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,100_000_000,preimage,supplierId, 100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);

    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)
    ]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    // chain.mineEmptyBlock(10);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    // console.log(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]));

    // chain.mineEmptyBlock(1300);

    let prev = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"];

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    // console.log(regularPaymentDue);
    let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);
    // console.log(block);

    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"] - prev, regularPaymentDue - delegateFee);
    
    chain.mineEmptyBlock(1440);

    prev = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"];

    block = chain.mineBlock([
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"] - prev, regularPaymentDue - delegateFee);
  },
});

Clarinet.test({
  name: "Borrower can make late payments",
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
    // loan.addBorrower(wallet_8.address, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    
    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address, 0, wallet_1.address,sender,recipient,500,0,100_000_000,preimage,supplierId,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    block = chain.mineBlock([Payment.triggerLatePayment(0, 0, wallet_7.address)]);
    Payment.isPayingLateFees(chain, wallet_8.address).result.expectBool(true);

    chain.mineEmptyBlock(1442);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);
    
    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 2, XBTC)
    ]);
    assertEquals(consumeUint(block.receipts[3].result.expectOk().expectTuple()["reward"]), regularPaymentDue);
  },
});

Clarinet.test({
  name: "Borrower can make late payments, next payment is back to regular amount",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);
    let DAY = consumeUint(Globals.getDayLengthDefault(chain, deployerWallet.address));

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    
    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address, 0, wallet_1.address,sender,recipient,500,0,100_000_000,preimage,supplierId,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,DAY * 10 * 9,DAY * 10,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    block = chain.mineBlock([Payment.triggerLatePayment(0, 0, wallet_7.address)]);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    
    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 2, XBTC)
    ]);

    Payment.isPayingLateFees(chain, wallet_8.address).result.expectBool(false);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));

    block = chain.mineBlock([
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 2, XBTC)
    ]);
    
    assertEquals(consumeUint(block.receipts[2].result.expectOk().expectTuple()["reward"]), regularPaymentDue);
  },
});

Clarinet.test({
  name: "Only Pool delegate can trigger a late fee",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
    let wallet_9 = accounts.get("wallet_9") as Account; // random_wallet

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    // let block = runBootstrap(chain, deployerWallet);
    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);
    // loan.addBorrower(wallet_8.address, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    
    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    chain.mineBlock([
      ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address, 0, wallet_1.address,sender,recipient,500,0,100_000_000,preimage,supplierId,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99000000, 0, 28, wallet_8.address, deployerWallet.address)]);

    chain.mineBlock([Payment.triggerLatePayment(0, 0, deployerWallet.address)]);
    Payment.isPayingLateFees(chain, wallet_8.address).result.expectBool(false);
    Payment.isPayingLateFees(chain, wallet_9.address).result.expectBool(false);
    chain.mineBlock([Payment.triggerLatePayment(0, 0, wallet_1.address)]);
    Payment.isPayingLateFees(chain, wallet_8.address).result.expectBool(false);
    Payment.isPayingLateFees(chain, wallet_9.address).result.expectBool(false);
    chain.mineBlock([Payment.triggerLatePayment(0, 0, wallet_8.address)]);
    Payment.isPayingLateFees(chain, wallet_8.address).result.expectBool(false);
    Payment.isPayingLateFees(chain, wallet_9.address).result.expectBool(false);
  },
});

Clarinet.test({
  name: "Borrower can make late payment even after grace period expired",
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
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,100_000_000,preimage,supplierId,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    chain.mineEmptyBlock(10);

    chain.mineEmptyBlock(1440);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);
    
    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,block.height + 1440, XBTC)
    ]);

    let gracePeriod = consumeUint(globals["grace-period"]);

    chain.mineEmptyBlock(gracePeriod + 1440);

    block = chain.mineBlock([
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,block.height + 1440 + gracePeriod, XBTC)
    ]);

    block.receipts[2].result.expectOk();
  },
});

Clarinet.test({
  name: "Borrower can make a full payment with a premium",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let lv  = new LiquidityVault(chain, LIQUIDITY_VAULT, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);
    let DAY = consumeUint(Globals.getDayLengthDefault(chain, deployerWallet.address));

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,100_000_000,preimage,supplierId,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,DAY * 10 * 9,DAY * 10,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    let regularPaymentDue = (consumeUint(Payment.getEarlyRepaymentAmount(chain, 0, wallet_8.address)));
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);
    
    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makeFullPaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 2, XBTC)
    ]);
    block.receipts[3].result.expectOk();

    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.magic-protocol"], 9999700000 - regularPaymentDue);
  },
});

Clarinet.test({
  name: "Borrower can make a full payment with a premium with a leaked preimage",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
    let wallet_9 = accounts.get("wallet_9") as Account;

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let lv  = new LiquidityVault(chain, LIQUIDITY_VAULT, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);
    let DAY = consumeUint(Globals.getDayLengthDefault(chain, deployerWallet.address));

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,100_000_000,preimage,supplierId,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,DAY * 10 * 9,DAY * 10,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);

    let regularPaymentDue = (consumeUint(Payment.getEarlyRepaymentAmount(chain, 0, wallet_8.address)));
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);

    let expiration = 500;
    let swapperId = 1;
    let outputValue = regularPaymentDue;
    let minToReceive = minPaymentToReceive
    let hash = getHash("01");
    let tx1 = generateP2SHTx(sender, recipient, expiration, hash, swapperId, outputValue);
    let txid1 = getTxId(tx1);
    
    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      TestUtils.setMinedTx(txid1, deployerWallet.address),
      // called by different Stacks address
      SupplierInterface.sendFunds(
        { header: "", height: chain.blockHeight - 1 },
        [],
        tx1,
        { "tx-index": 0, "hashes": [], "tree-depth": 0 },
        0,
        sender,
        recipient,
        getExpiration(expiration),
        hash,
        swapperBuff(swapperId),
        supplierId,
        minToReceive,
        wallet_8.address,
      ),
      // wrong address finalizes
      Magic.finalizeSwap(txid1, "01", wallet_9.address),
      ...makeFullPaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 2, XBTC),
      SupplierInterface.makeFullPaymentCompleted(txid1, 0, PAYMENT, LP_TOKEN, LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER, XBTC, wallet_8.address),
    ]);
    block.receipts[3].result.expectOk();
    block.receipts[5].result.expectErr();
    block.receipts[7].result.expectOk();
  },
});

Clarinet.test({
  name: "Can make all the payments for the loan after missing multiple payments.",
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

      pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
      pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
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

      chain.mineEmptyBlock(10);

      let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
      let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

      block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

      let gracePeriod = consumeUint(globals["grace-period"]);
      let nextPaymentIn = consumeUint(loan.getNextpaymentIn(0).result);
      chain.mineEmptyBlock(nextPaymentIn);
      chain.mineEmptyBlock(nextPaymentIn);
      chain.mineEmptyBlock(nextPaymentIn);
      chain.mineEmptyBlock(nextPaymentIn);
      chain.mineEmptyBlock(nextPaymentIn);

      let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
      let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);
      let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);

      block = chain.mineBlock([
        Magic.initializeSwapper(wallet_8.address),
        ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 2, XBTC)
      ]);

      block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 2, XBTC)]);
      block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"02",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 2, XBTC)]);
      block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue + LOAN_AMOUNT,"03",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 2, XBTC)]);
      block.receipts[2].result.expectOk().expectTuple()["repayment"].expectBool(true);
      let loanResult = loan.getLoanData(0).result.expectTuple();
      loanResult["remaining-payments"].expectUint(0);
      loanResult["status"].expectBuff(Buffer.from("05", "hex"));
  },
});

