// deno-lint-ignore-file
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';
import { Buffer } from "https://deno.land/std@0.110.0/node/buffer.ts";
import { assertEquals, assert } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { Pool } from '../../interfaces/pool-v1-0.ts';
import { CoverPool } from '../../interfaces/cover-pool-v1-0.ts';
import { Loan } from '../../interfaces/loan-v1-0.ts';
import { LPToken } from '../../interfaces/lp-token.ts';
import { CPToken } from '../../interfaces/cp-token.ts';
import { TestUtils } from '../../interfaces/test-utils.ts';
import { Bridge } from '../../interfaces/bridge_real.ts';
import { Globals } from '../../interfaces/globals.ts';
import { SupplierInterface } from '../../interfaces/supplier_interface.ts';
import { Payment } from '../../interfaces/payment.ts';
import { SwapRouter } from '../../interfaces/swap-router.ts';
import { CollVault } from '../../interfaces/coll-vault.ts';
import { ClarityBitcoin } from '../../interfaces/clarity_bitcoin.ts';
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
  getBP,
  finalizeRollover,
  makeResidualPayment
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
  name: "Borrower can request rollover on an existing loan with a larger amount.",
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
    pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover.address);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,500_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,0,XBTC,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 500_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let createdAt = chain.blockHeight;
    const REQUESTED_AMOUNT = LOAN_AMOUNT + LOAN_AMOUNT + LOAN_AMOUNT;
    block = loan.requestRollover(0, null, REQUESTED_AMOUNT, null, null, 0, XBTC, wallet_8.address);
    let loanDataBefore = (loan.getLoanData(0).result.expectTuple());
    block.receipts[0].result.expectOk();
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    // console.log(rolloverData);
    rolloverData["apr"].expectUint(300);
    rolloverData["coll-ratio"].expectUint(0);
    rolloverData["coll-type"].expectPrincipal(XBTC);
    rolloverData["created-at"].expectUint(createdAt);
    rolloverData["maturity-length"].expectUint(5760);
    rolloverData["payment-period"].expectUint(1440);
    rolloverData["status"].expectBuff(Buffer.from("00", "hex"));

    let fvFunds = (chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.funding-vault"]);

    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.funding-vault"] -  fvFunds, REQUESTED_AMOUNT - LOAN_AMOUNT);

    block = chain.mineBlock([
      SupplierInterface.completeRollover(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER, XBTC, wallet_8.address)
    ])

    rolloverData = (loan.getRolloverData(0).result.expectTuple());
    rolloverData["status"].expectBuff(Buffer.from("03", "hex"));
    rolloverData["moved-collateral"].expectInt(0);

    let swapId = consumeUint(block.receipts[0].result.expectOk());
    let treasuryHoldingsBefore = (chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.protocol-treasury"]);
    let treasuryFee = getBP(REQUESTED_AMOUNT - LOAN_AMOUNT, consumeUint(globals["treasury-fee"]));

    block = chain.mineBlock([...finalizeRollover(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 199400000, swapId, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address )]);
    block.receipts[1].result.expectOk();

    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.protocol-treasury"] - treasuryHoldingsBefore, treasuryFee);
    loan.getRolloverDataOptional(0).result.expectNone();
    let loanDataAfter = (loan.getLoanData(0).result.expectTuple());
    loanDataAfter['loan-amount'].expectUint(REQUESTED_AMOUNT);
    loanDataAfter['remaining-payments'].expectUint(consumeUint(loanDataBefore["remaining-payments"]));
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan, when the loan amount is the same as previous. Nothing changed.",
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
    pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover.address);

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
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);
    // console.log(block);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let loanDataBefore = (loan.getLoanData(0).result.expectTuple());

    const REQUESTED_AMOUNT = LOAN_AMOUNT;
    block = loan.requestRollover(0, null, REQUESTED_AMOUNT, null, null, 0, XBTC, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    rolloverData["status"].expectBuff(Buffer.from("02", "hex"));
    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);
    // rolloverData = (loan.getRolloverData(0).result.expectTuple());
    // rolloverData["moved-collateral"].expectInt(0);

    let loanDataAfter = (loan.getLoanData(0).result.expectTuple());

    assertEquals({ ...loanDataBefore, ...{ "next-payment": "u1468" }}, loanDataAfter);
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan, when the loan amount is the same as previous. Change apr.",
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
    pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover.address);

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
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);
    // console.log(block);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let loanDataBefore = (loan.getLoanData(0).result.expectTuple());

    const REQUESTED_AMOUNT = LOAN_AMOUNT;
    block = loan.requestRollover(0, 350, null, null, null, 0, XBTC, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    rolloverData["status"].expectBuff(Buffer.from("02", "hex"));
    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);
    // rolloverData = (loan.getRolloverData(0).result.expectTuple());
    // rolloverData["moved-collateral"].expectInt(0);

    let loanDataAfter = (loan.getLoanData(0).result.expectTuple());

    assertEquals({ ...loanDataBefore, ...{ "next-payment": "u1468", "apr": "u350" }}, loanDataAfter);
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan, when the loan amount is the same as previous. Change maturity-length and payment-period.",
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
    pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover.address);

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
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);
    // console.log(block);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let loanDataBefore = (loan.getLoanData(0).result.expectTuple());

    const REQUESTED_AMOUNT = LOAN_AMOUNT;
    block = loan.requestRollover(0, null, null, 51840, 4320, 0, XBTC, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    rolloverData["status"].expectBuff(Buffer.from("02", "hex"));
    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);
    // rolloverData = (loan.getRolloverData(0).result.expectTuple());
    // rolloverData["moved-collateral"].expectInt(0);

    let loanDataAfter = (loan.getLoanData(0).result.expectTuple());
    assertEquals({ ...loanDataBefore, ...{ "next-payment": "u4348", "remaining-payments": "u12", "payment-period": "u4320" }}, loanDataAfter);
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan, with a smaller loan amount.",
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
    pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover.address);

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
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    const REQUESTED_AMOUNT = LOAN_AMOUNT / 2;
    const RESIDUAL = LOAN_AMOUNT - REQUESTED_AMOUNT;
    block = loan.requestRollover(0, null, REQUESTED_AMOUNT, null, null, 0, XBTC, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    rolloverData["status"].expectBuff(Buffer.from("02", "hex"));
    rolloverData["residual"].expectUint(RESIDUAL);

    let minPaymentToReceive =  Math.floor(RESIDUAL * fee / 10_000);

    block = chain.mineBlock([
      Bridge.initializeSwapper(wallet_8.address),
      ...makeResidualPayment(deployerWallet.address, wallet_8.address,sender,recipient,500,1,RESIDUAL,"01",0,minPaymentToReceive,0,LP_TOKEN,0,chain.blockHeight - 1, XBTC)
    ])
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"], RESIDUAL);
    rolloverData = (loan.getRolloverData(0).result.expectTuple());
    rolloverData["residual"].expectUint(0);
    rolloverData["sent-funds"].expectInt(-RESIDUAL);

    let renewheight = chain.blockHeight;
    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);
    // rolloverData["moved-collateral"].expectInt(0);
    // block.receipts[0].result.expectOk().expectUint(0);

    let loanData = (loan.getLoanData(0).result.expectTuple());
    loanData["next-payment"].expectUint(renewheight + consumeUint(loanData["payment-period"]));
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan, with a smaller loan amount. Fails at completing rollover when residual is not paid.",
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
    pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover.address);

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
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    const REQUESTED_AMOUNT = LOAN_AMOUNT / 2;
    const RESIDUAL = LOAN_AMOUNT - REQUESTED_AMOUNT;
    block = loan.requestRollover(0, null, REQUESTED_AMOUNT, null, null, 0, XBTC, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    // try Rollover without withdrawing
    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);
    // let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    // rolloverData["moved-collateral"].expectInt(0);

    block.receipts[0].result.expectErr().expectUint(4019);
    // try Rollover if withdrawing
    block = chain.mineBlock([SupplierInterface.completeRollover(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER, XBTC, wallet_8.address)]);
    block.receipts[0].result.expectErr().expectUint(4019);
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan without collateral, new terms uses a collateral. No coll -> Yes coll",
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,0,XBTC,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let COLL_RATIO = 5000;
    block = loan.requestRollover(0, null, null, null, null, COLL_RATIO, XUSD_CONTRACT_SIMNET, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    rolloverData["coll-ratio"].expectUint(5000);
    rolloverData["coll-type"].expectPrincipal(XUSD_CONTRACT_SIMNET);
    rolloverData["status"].expectBuff(Buffer.from("02", "hex"));

    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);
    // rolloverData = (loan.getRolloverData(0).result.expectTuple());
    
    let collateralAmount = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"], collateralAmount);

    loan.getRolloverDataOptional(0).result.expectNone();
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan without collateral, No coll -> Yes coll. Loan is created with a different collateral than the one used in rollover.",
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,0,XUSD_CONTRACT_SIMNET,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let COLL_RATIO = 5000;
    block = loan.requestRollover(0, null, null, null, null, COLL_RATIO, XUSD_CONTRACT_SIMNET, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    rolloverData["coll-ratio"].expectUint(5000);
    rolloverData["coll-type"].expectPrincipal(XUSD_CONTRACT_SIMNET);
    rolloverData["status"].expectBuff(Buffer.from("02", "hex"));

    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);
    // rolloverData = (loan.getRolloverData(0).result.expectTuple());
    
    let collateralAmount = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);
    // rolloverData["moved-collateral"].expectInt(collateralAmount);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"], collateralAmount);

    loan.getRolloverDataOptional(0).result.expectNone();
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan with collateral, new terms uses more collateral ratio. Yes coll -> More coll",
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
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

    let COLL_RATIO = 5000;
    block = loan.requestRollover(0, null, null, null, null, COLL_RATIO, XUSD_CONTRACT_SIMNET, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    rolloverData["coll-ratio"].expectUint(5000);
    rolloverData["coll-type"].expectPrincipal(XUSD_CONTRACT_SIMNET);
    rolloverData["status"].expectBuff(Buffer.from("02", "hex"));

    // let collateralAmountAtLoanCreation = (chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"]);
    let collateralAmountAtLoanCreation = consumeUint(CollVault.getLoanColl(chain, COLL_VAULT, 0, deployerWallet.address).expectOk().expectTuple()["amount"]);
    let expectedFinalCollateral = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);
    
    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);
    let collateralAfterRollover = consumeUint(CollVault.getLoanColl(chain, COLL_VAULT, 0, deployerWallet.address).expectOk().expectTuple()["amount"]);

    let loanDataAfter = (loan.getLoanData(0).result.expectTuple());
    loanDataAfter["coll-ratio"].expectUint(COLL_RATIO);
    loan.getRolloverDataOptional(0).result.expectNone();
    assertEquals(collateralAfterRollover, expectedFinalCollateral);
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan with collateral, new terms uses less collateral ratio. Yes coll -> Less coll",
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,4000,XUSD_CONTRACT_SIMNET,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let COLL_RATIO = 2000;
    block = loan.requestRollover(0, null, null, null, null, COLL_RATIO, XUSD_CONTRACT_SIMNET, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    rolloverData["coll-ratio"].expectUint(2000);
    rolloverData["coll-type"].expectPrincipal(XUSD_CONTRACT_SIMNET);
    rolloverData["status"].expectBuff(Buffer.from("02", "hex"));

    // let collateralAmountAtLoanCreation = (chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"]);
    let collateralAmountAtLoanCreation = consumeUint(CollVault.getLoanColl(chain, COLL_VAULT, 0, deployerWallet.address).expectOk().expectTuple()["amount"]);
    let expectedFinalCollateral = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);

    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);
    let collateralAfterRollover = consumeUint(CollVault.getLoanColl(chain, COLL_VAULT, 0, deployerWallet.address).expectOk().expectTuple()["amount"]);

    let loanDataAfter = (loan.getLoanData(0).result.expectTuple());
    loanDataAfter["coll-ratio"].expectUint(COLL_RATIO);
    loan.getRolloverDataOptional(0).result.expectNone();
    assertEquals(collateralAfterRollover, expectedFinalCollateral);
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan with collateral, new terms uses same coll-ratio. XBTC value is lower relative to XUSD",
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,4000,XUSD_CONTRACT_SIMNET,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let COLL_RATIO = 4000;
    block = loan.requestRollover(0, null, null, null, null, null, XUSD_CONTRACT_SIMNET, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    let loanData = (loan.getLoanData(0).result.expectTuple());
    rolloverData["coll-ratio"].expectUint(4000);
    rolloverData["coll-type"].expectPrincipal(XUSD_CONTRACT_SIMNET);
    rolloverData["status"].expectBuff(Buffer.from("02", "hex"));
    loanData["coll-ratio"].expectUint(4000);

    let collateralRequiredBeforeChange = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);

    let pairValue = SwapRouter.getPairValue(chain, SWAP_ROUTER, XBTC,XUSD_CONTRACT_SIMNET,deployerWallet.address);
    block = SwapRouter.setPairValue(chain,SWAP_ROUTER,XBTC,XUSD_CONTRACT_SIMNET,consumeUint(pairValue.expectSome()) * 5000 / 10000,deployerWallet.address);

    let collateralRequiredAfter = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);

    assertEquals(collateralRequiredBeforeChange * 0.5, collateralRequiredAfter);

    let collateralInVault = (chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"]);

    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);

    // half of collateral is removed from the collateral vault
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"], collateralRequiredAfter);
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan with collateral, new terms uses same coll-ratio. XBTC value is higher relative to XUSD",
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,4000,XUSD_CONTRACT_SIMNET,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let COLL_RATIO = 4000;
    block = loan.requestRollover(0, null, null, null, null, null, XUSD_CONTRACT_SIMNET, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    let loanData = (loan.getLoanData(0).result.expectTuple());
    rolloverData["coll-ratio"].expectUint(4000);
    rolloverData["coll-type"].expectPrincipal(XUSD_CONTRACT_SIMNET);
    rolloverData["status"].expectBuff(Buffer.from("02", "hex"));
    loanData["coll-ratio"].expectUint(4000);

    let collateralRequiredBeforeChange = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);

    let pairValue = SwapRouter.getPairValue(chain, SWAP_ROUTER, XBTC,XUSD_CONTRACT_SIMNET,deployerWallet.address);
    block = SwapRouter.setPairValue(chain,SWAP_ROUTER,XBTC,XUSD_CONTRACT_SIMNET,consumeUint(pairValue.expectSome()) * 15000 / 10000,deployerWallet.address);

    let collateralRequiredAfter = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);
    assertEquals(collateralRequiredBeforeChange * 1.5, collateralRequiredAfter);
    
    let collateralInVault = (chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"]);
    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);

    assertEquals(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"], collateralRequiredAfter);
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan with collateral, new terms uses more coll-ratio. XBTC value is higher relative to XUSD",
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,4000,XUSD_CONTRACT_SIMNET,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let COLL_RATIO = 5000;
    block = loan.requestRollover(0, null, null, null, null, COLL_RATIO, XUSD_CONTRACT_SIMNET, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    let loanData = (loan.getLoanData(0).result.expectTuple());
    rolloverData["coll-ratio"].expectUint(COLL_RATIO);
    rolloverData["coll-type"].expectPrincipal(XUSD_CONTRACT_SIMNET);
    rolloverData["status"].expectBuff(Buffer.from("02", "hex"));
    loanData["coll-ratio"].expectUint(4000);

    let collateralRequiredBeforeChange = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);

    let pairValue = SwapRouter.getPairValue(chain, SWAP_ROUTER, XBTC,XUSD_CONTRACT_SIMNET,deployerWallet.address);
    block = SwapRouter.setPairValue(chain,SWAP_ROUTER,XBTC,XUSD_CONTRACT_SIMNET,consumeUint(pairValue.expectSome()) * 15000 / 10000,deployerWallet.address);

    let collateralRequiredAfter = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);
    assertEquals(collateralRequiredBeforeChange * 1.5, collateralRequiredAfter);
    
    let collateralInVault = (chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"]);
    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);
    loanData = (loan.getLoanData(0).result.expectTuple());
    loanData["coll-ratio"].expectUint(COLL_RATIO);

    assertEquals(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"], collateralRequiredAfter);
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan with collateral, new terms uses more coll-ratio. XBTC value is lowered relative to XUSD. New collateral is lower than the collateral used.",
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,4000,XUSD_CONTRACT_SIMNET,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let COLL_RATIO = 5000;
    block = loan.requestRollover(0, null, null, null, null, COLL_RATIO, XUSD_CONTRACT_SIMNET, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    let loanData = (loan.getLoanData(0).result.expectTuple());
    rolloverData["coll-ratio"].expectUint(COLL_RATIO);
    rolloverData["coll-type"].expectPrincipal(XUSD_CONTRACT_SIMNET);
    rolloverData["status"].expectBuff(Buffer.from("02", "hex"));
    loanData["coll-ratio"].expectUint(4000);

    let collateralRequiredBeforeChange = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * 4000 / 10000);
    const VALUE_FACTOR = 7000 / 10000;

    let pairValue = SwapRouter.getPairValue(chain, SWAP_ROUTER, XBTC,XUSD_CONTRACT_SIMNET,deployerWallet.address);
    block = SwapRouter.setPairValue(chain,SWAP_ROUTER,XBTC,XUSD_CONTRACT_SIMNET,consumeUint(pairValue.expectSome()) * VALUE_FACTOR,deployerWallet.address);

    let collateralRequiredAfter = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);

    assert(collateralRequiredBeforeChange > collateralRequiredAfter);
    
    let collateralInVault = (chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"]);
    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);
    
    loanData = (loan.getLoanData(0).result.expectTuple());
    loanData["coll-ratio"].expectUint(COLL_RATIO);

    assertEquals(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"], collateralRequiredAfter);
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan with collateral, new terms uses less coll-ratio. XBTC value is lowered relative to XUSD. New collateral is lower than the collateral used.",
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,4000,XUSD_CONTRACT_SIMNET,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let COLL_RATIO = 3000;
    block = loan.requestRollover(0, null, null, null, null, COLL_RATIO, XUSD_CONTRACT_SIMNET, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    let loanData = (loan.getLoanData(0).result.expectTuple());
    rolloverData["coll-ratio"].expectUint(COLL_RATIO);
    rolloverData["coll-type"].expectPrincipal(XUSD_CONTRACT_SIMNET);
    rolloverData["status"].expectBuff(Buffer.from("02", "hex"));
    loanData["coll-ratio"].expectUint(4000);

    let collateralRequiredBeforeChange = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * 4000 / 10000);
    const VALUE_FACTOR = 7000 / 10000;

    let pairValue = SwapRouter.getPairValue(chain, SWAP_ROUTER, XBTC,XUSD_CONTRACT_SIMNET,deployerWallet.address);
    block = SwapRouter.setPairValue(chain,SWAP_ROUTER,XBTC,XUSD_CONTRACT_SIMNET,consumeUint(pairValue.expectSome()) * VALUE_FACTOR,deployerWallet.address);

    let collateralRequiredAfter = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);

    assert(collateralRequiredBeforeChange > collateralRequiredAfter);
    let difference = collateralRequiredBeforeChange - collateralRequiredAfter;
    
    let collateralInVault = (chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"]);
    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);
    
    loanData = (loan.getLoanData(0).result.expectTuple());
    loanData["coll-ratio"].expectUint(COLL_RATIO);

    assertEquals(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"], collateralInVault - difference);
  },
});

Clarinet.test({
  name: "Borrower can request rollover on an existing loan with collateral, new terms uses less coll-ratio. XBTC value is higher relative to XUSD. New collateral is higher than the collateral used.",
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,4000,XUSD_CONTRACT_SIMNET,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let COLL_RATIO = 3000;
    block = loan.requestRollover(0, null, null, null, null, COLL_RATIO, XUSD_CONTRACT_SIMNET, wallet_8.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());
    let loanData = (loan.getLoanData(0).result.expectTuple());
    rolloverData["coll-ratio"].expectUint(COLL_RATIO);
    rolloverData["coll-type"].expectPrincipal(XUSD_CONTRACT_SIMNET);
    rolloverData["status"].expectBuff(Buffer.from("02", "hex"));
    loanData["coll-ratio"].expectUint(4000);

    let collateralRequiredBeforeChange = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * 4000 / 10000);
    const VALUE_FACTOR = 15000 / 10000;

    let pairValue = SwapRouter.getPairValue(chain, SWAP_ROUTER, XBTC,XUSD_CONTRACT_SIMNET,deployerWallet.address);
    block = SwapRouter.setPairValue(chain,SWAP_ROUTER,XBTC,XUSD_CONTRACT_SIMNET,consumeUint(pairValue.expectSome()) * VALUE_FACTOR,deployerWallet.address);

    let collateralRequiredAfter = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);

    assert(collateralRequiredBeforeChange < collateralRequiredAfter);
    let difference = collateralRequiredAfter - collateralRequiredBeforeChange;
    
    let collateralInVault = (chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"]);
    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, wallet_8.address);
    // console.log(block.receipts[0].events);
    // console.log(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]);
    loanData = (loan.getLoanData(0).result.expectTuple());
    loanData["coll-ratio"].expectUint(COLL_RATIO);

    assertEquals(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"], collateralInVault + difference);
  },
});

Clarinet.test({
  name: "Borrower can request rollover, send collateral and initiate outbound swap, cancel drawdown and returns to READY state",
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,500_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,0,XBTC,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 500_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let createdAt = chain.blockHeight;
    const REQUESTED_AMOUNT = LOAN_AMOUNT + LOAN_AMOUNT + LOAN_AMOUNT;
    const COLL_RATIO = 5000;
    block = loan.requestRollover(0, null, REQUESTED_AMOUNT, null, null, COLL_RATIO, XUSD_CONTRACT_SIMNET, wallet_8.address);
    let loanDataBefore = (loan.getLoanData(0).result.expectTuple());
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());

    rolloverData["moved-collateral"].expectInt(0);
    rolloverData["coll-ratio"].expectUint(COLL_RATIO);

    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);

    let collateralRequiredAfter = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);

    let totalInvestorFees = getBP(REQUESTED_AMOUNT - LOAN_AMOUNT, consumeUint(globals["treasury-fee"]));

    let assetMapXbtc = (chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);
    let assetMapXusd = (chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]);
    block = chain.mineBlock([SupplierInterface.completeRollover(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER, XBTC, wallet_8.address)]);
    rolloverData = (loan.getRolloverData(0).result.expectTuple());
    // console.log(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"])
    // console.log(rolloverData);
    // rolloverData["moved-collateral"].expectInt(collateralRequiredAfter);
    rolloverData["sent-funds"].expectInt(REQUESTED_AMOUNT - LOAN_AMOUNT - totalInvestorFees);

    chain.mineEmptyBlock(500);
    block = chain.mineBlock([SupplierInterface.cancelRollover(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, 1, wallet_8.address)]);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.funding-vault"], assetMapXbtc["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.funding-vault"]);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bridge"], assetMapXbtc["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bridge"]);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"], 0);
  },
});

Clarinet.test({
  name: "Borrower can request rollover, return collateral and initiate outbound swap, cancel drawdown and returns to READY state.",
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,500_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    const LOAN_COLL_RATIO = 5000;
    let collateralRequiredBefore = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * LOAN_COLL_RATIO / 10000);
    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,LOAN_COLL_RATIO,XUSD_CONTRACT_SIMNET,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 500_000_000, deployerWallet.address)]);

    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let createdAt = chain.blockHeight;
    const REQUESTED_AMOUNT = LOAN_AMOUNT + LOAN_AMOUNT + LOAN_AMOUNT;
    const COLL_RATIO = 4000;
    block = loan.requestRollover(0, null, REQUESTED_AMOUNT, null, null, COLL_RATIO, XUSD_CONTRACT_SIMNET, wallet_8.address);
    let loanDataBefore = (loan.getLoanData(0).result.expectTuple());
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());

    rolloverData["moved-collateral"].expectInt(0);

    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);


    let pairValue = SwapRouter.getPairValue(chain, SWAP_ROUTER, XBTC,XUSD_CONTRACT_SIMNET,deployerWallet.address);
    block = SwapRouter.setPairValue(chain,SWAP_ROUTER,XBTC,XUSD_CONTRACT_SIMNET,consumeUint(pairValue.expectSome()) * 2000 / 10000,deployerWallet.address);

    let collateralRequiredAfter = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, REQUESTED_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);

    let totalInvestorFees = getBP(REQUESTED_AMOUNT - LOAN_AMOUNT, consumeUint(globals["treasury-fee"]));

    let assetMapXbtc = (chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);
    let assetMapXusd = (chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]);
    block = chain.mineBlock([SupplierInterface.completeRollover(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER, XBTC, wallet_8.address)]);
    
    rolloverData = (loan.getRolloverData(0).result.expectTuple());
    rolloverData["sent-funds"].expectInt(REQUESTED_AMOUNT - LOAN_AMOUNT - totalInvestorFees);
    rolloverData["moved-collateral"].expectInt(collateralRequiredAfter - collateralRequiredBefore);

    chain.mineEmptyBlock(500);
    block = chain.mineBlock([SupplierInterface.cancelRollover(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, 1, wallet_8.address)]);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.funding-vault"], assetMapXbtc["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.funding-vault"]);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bridge"], assetMapXbtc["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.bridge"]);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.coll-vault"], collateralRequiredBefore);
  },
});

Clarinet.test({
  name: "Complete rollover fails when incorrect collateral type is used.",
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
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,500_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,0,XBTC,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 500_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    let createdAt = chain.blockHeight;
    const REQUESTED_AMOUNT = LOAN_AMOUNT + LOAN_AMOUNT + LOAN_AMOUNT;
    const COLL_RATIO = 5000;
    block = loan.requestRollover(0, null, REQUESTED_AMOUNT, null, null, COLL_RATIO, XUSD_CONTRACT_SIMNET, wallet_8.address);
    let loanDataBefore = (loan.getLoanData(0).result.expectTuple());
    let rolloverData = (loan.getRolloverData(0).result.expectTuple());

    rolloverData["moved-collateral"].expectInt(0);
    rolloverData["coll-ratio"].expectUint(COLL_RATIO);

    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, wallet_7.address);

    let collateralRequiredAfter = (consumeUint(SwapRouter.getXgivenY(chain, XUSD_CONTRACT_SIMNET, XBTC, LOAN_AMOUNT, deployerWallet.address).expectOk()) * COLL_RATIO / 10000);

    block = chain.mineBlock([
      SupplierInterface.completeRollover(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER, XBTC, wallet_8.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(4003);
  },
});