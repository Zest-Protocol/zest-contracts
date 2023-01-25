// deno-lint-ignore-file
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.3/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.159.0/testing/asserts.ts';
import { Pool } from '../../interfaces/pool-v1-0.ts';
import { CoverPool } from '../../interfaces/cover-pool-v1-0.ts';
import { Loan } from '../../interfaces/loan-v1-0.ts';
import { LPToken } from '../../interfaces/lp-token.ts';
import { CPToken } from '../../interfaces/cp-token.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";
import { TestUtils } from '../../interfaces/test-utils.ts';
import { Globals } from '../../interfaces/globals.ts';
import { SupplierInterface } from '../../interfaces/supplier_interface.ts';
import { CpTokenRewards } from "../../interfaces/cpTokenRewards.ts";
import { Payment } from '../../interfaces/payment.ts';
import { EmergencyExecute } from '../../interfaces/emergency-execute.ts';
import { Magic } from '../../interfaces/magic_real.ts';

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
  makePaymentVerifyTxs,
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
  COVER_VAULT,
  DAO
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Test drawdown with small amount can only try 3 times",
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
    block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, "0000000000000000000000000000000000000001", deployerWallet.address);
    block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, "0000000000000000000000000000000000000002", deployerWallet.address);
    block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, "0000000000000000000000000000000000000003", deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);
    
    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    // block = loan.drawdownVerify(0, XBTC, COLL_VAULT, FUNDING_VAULT, LP_TOKEN, 0, wallet_7.address, 1000, SWAP_ROUTER, XBTC, wallet_8.address);
    block = chain.mineBlock([
      SupplierInterface.drawdownVerify(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address),
      SupplierInterface.drawdownVerify(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, "0000000000000000000000000000000000000001", 0, SWAP_ROUTER,XBTC, wallet_8.address),
      SupplierInterface.drawdownVerify(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, "0000000000000000000000000000000000000002", 0, SWAP_ROUTER,XBTC, wallet_8.address),
      SupplierInterface.drawdownVerify(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, "0000000000000000000000000000000000000003", 0, SWAP_ROUTER,XBTC, wallet_8.address),
    ]);
    const loanWithoutFees = (LOAN_AMOUNT - (1000 * 3)) - getBP(LOAN_AMOUNT, 30);
    block.receipts[0].result.expectOk().expectTuple()["sats"].expectUint(1000);
    block.receipts[1].result.expectOk().expectTuple()["sats"].expectUint(1000);
    block.receipts[2].result.expectOk().expectTuple()["sats"].expectUint(1000);
    block.receipts[3].result.expectErr().expectUint(4025);

    block = chain.mineBlock([
      ...finalizeOutboundTxs(HASH, 1000, 0, chain.blockHeight - 1, wallet_8.address, deployerWallet.address),
      ...finalizeOutboundTxs("0000000000000000000000000000000000000001", 1000, 1, chain.blockHeight - 1, wallet_8.address, deployerWallet.address),
      ...finalizeOutboundTxs("0000000000000000000000000000000000000002", 1000, 2, chain.blockHeight - 1, wallet_8.address, deployerWallet.address),
      ...finalizeOutboundTxs("0000000000000000000000000000000000000003", 1000, 3, chain.blockHeight - 1, wallet_8.address, deployerWallet.address),
    ]);
    block.receipts[1].result.expectOk();
    block.receipts[3].result.expectOk();
    block.receipts[5].result.expectOk();
    block.receipts[7].result.expectErr().expectUint(23);

    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);
    block.receipts[0].result.expectOk().expectTuple()["sats"].expectUint(loanWithoutFees);
    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, loanWithoutFees, 0, 28, wallet_8.address, deployerWallet.address)]);
  },
});

Clarinet.test({
  name: "Test drawdown and finalize a test",
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

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);
    
    const LOAN_AMOUNT = 100_000_000;

    block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = loan.drawdownVerify(0, XBTC, COLL_VAULT, FUNDING_VAULT, LP_TOKEN, 0, wallet_7.address, 1000, SWAP_ROUTER, XBTC, wallet_8.address);
    block = chain.mineBlock([SupplierInterface.drawdownVerify(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);
    block.receipts[0].result.expectOk().expectTuple()["sats"].expectUint(1000);
    block = chain.mineBlock([...finalizeOutboundTxs(HASH, 1000, 0, chain.blockHeight - 1, wallet_8.address, deployerWallet.address)]);
    
    const loanWithoutFees = (LOAN_AMOUNT - (1000 * 1)) - getBP(LOAN_AMOUNT, 30);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);
    block.receipts[0].result.expectOk().expectTuple()["sats"].expectUint(loanWithoutFees);
    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, loanWithoutFees, 1, chain.blockHeight - 1, wallet_8.address, deployerWallet.address)]);
    block.receipts[1].result.expectOk().expectTuple()["borrow-amount"].expectUint(loanWithoutFees);
  },
});

Clarinet.test({
  name: "Borrower can make a payment verification",
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

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    let prev = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"];

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);
    const TEST_PAYMENT = 1000;

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_8.address),
      ...makePaymentVerifyTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,TEST_PAYMENT,"00",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      ...makePaymentVerifyTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,TEST_PAYMENT,"01",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      ...makePaymentVerifyTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,TEST_PAYMENT,"02",0,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
    ]);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.loan-v1-0"], TEST_PAYMENT * 3);
    
    const paymentAfterTests = regularPaymentDue - (TEST_PAYMENT * 3);
    const tempMinPaymentToReceive =  Math.floor(paymentAfterTests * fee / 10_000);
    block = chain.mineBlock([
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,paymentAfterTests,"03",supplierId,tempMinPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"], regularPaymentDue - delegateFee);
  },
});


Clarinet.test({
  name: "Borrower can make a payment verification with leaked preimage",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
    let wallet_9 = accounts.get("wallet_9") as Account;

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

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    let prev = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"];

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);
    const TEST_PAYMENT = 1000;

    let expiration = 500;
    let swapperId = 1;
    let outputValue = TEST_PAYMENT;
    let minToReceive = TEST_PAYMENT * fee / 10_000;
    let hash = getHash(preimage);
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
      Magic.finalizeSwap(txid1, preimage, wallet_9.address),
      SupplierInterface.makePaymentVerify(txid1, "00", 0, PAYMENT, LP_TOKEN, LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER, XBTC, wallet_8.address),
      SupplierInterface.makePaymentVerifyCompleted(txid1, 0, PAYMENT, LP_TOKEN, LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER, XBTC, wallet_8.address),
    ]);
    block.receipts[4].result.expectErr().expectUint(17);
    block.receipts[5].result.expectOk().expectUint(TEST_PAYMENT);
    
    const paymentAfterTests = regularPaymentDue - (TEST_PAYMENT * 1);
    const tempMinPaymentToReceive =  Math.floor(paymentAfterTests * fee / 10_000);
    hash = getHash("03");
    let tx = generateP2SHTx(sender, recipient, expiration, hash, swapperId, paymentAfterTests);
    let txid = getTxId(tx);

    block = chain.mineBlock([
      TestUtils.setMinedTx(txid, deployerWallet.address),
      // called by different Stacks address
      SupplierInterface.sendFunds(
        { header: "", height: chain.blockHeight - 1 },
        [],
        tx,
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
      Magic.finalizeSwap(txid, "03", wallet_9.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,paymentAfterTests,"03",supplierId,tempMinPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      SupplierInterface.makePaymentCompleted(txid, 0, PAYMENT, LP_TOKEN, LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER, XBTC, wallet_8.address),
    ]);
    block.receipts[2].result.expectOk();
    block.receipts[5].result.expectErr().expectUint(17);
    block.receipts[6].result.expectOk();
  },
});

