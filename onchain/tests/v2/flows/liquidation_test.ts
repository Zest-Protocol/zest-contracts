// deno-lint-ignore-file
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.5.4/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.159.0/testing/asserts.ts';
import { Pool } from '../interfaces/pool-v1-0.ts';
import { CoverPool } from '../interfaces/cover-pool-v1-0.ts';
import { Loan } from '../interfaces/loan-v1-0.ts';
import { LPToken } from '../interfaces/lp-token.ts';
import { CPToken } from '../interfaces/cp-token.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";
import { TestUtils } from '../interfaces/test-utils.ts';
import { Magic } from '../interfaces/magic_real.ts';
import { Globals } from '../interfaces/globals.ts';
import { SupplierInterface } from '../interfaces/supplier_interface.ts';
import { SwapRouter } from '../interfaces/swapRouter.ts';
import { MagicCaller } from '../interfaces/magic-caller.ts';
import { Payment } from '../interfaces/payment.ts';
import { WithdrawalManager } from '../interfaces/withdrawal-manager.ts';
import { CollVault } from '../interfaces/coll-vault.ts';
import { FT } from '../interfaces/ft.ts';

import * as util from "../util.ts";
import * as common from '../interfaces/common.ts';

import {
  LP_TOKEN_0,
  WITHDRAWAL_MANAGER,
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
  recipient,
  sender,
  preimage,
  ONE_DAY,
  CP_REWARDS_TOKEN,
  ERRORS,
  SWAP_ROUTER,
  SUPPLIER_CONTROLLER_0,
  XUSD_CONTRACT_SIMNET,
  USDA_CONTRACT_SIMNET,
  COVER_VAULT,
DAYS_PER_YEAR,
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Borrower's loan gets liquidated with no collateral or cover.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2 ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
    let LP_3 = accounts.get("wallet_3") as Account; // LP_3
    let LP_4 = accounts.get("wallet_4") as Account; // LP_4

    const MAGIC_CALLER_CONTRACT_NAME = "magic-caller";

    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_1.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_2.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, borrower_1.address)]);

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    const defaultExpiration = 500;
    const inboundFee = 10;
    const outboundFee = 10;
    const poolId_0 = 0;
    const loan_0 = 0;
    const supplierId = 0;
    const outputIndex = 0;

    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    block = FT.transfer(
      chain,
      deployerWallet.address,
      "Wrapped-Bitcoin",
      1_000_000_000_000,
      deployerWallet.address,
      `${deployerWallet.address}.supplier-controller`,
      "",
      deployerWallet.address
    );
    block = chain.mineBlock([
      Tx.contractCall(
        "supplier-controller",
        'register-supplier',
        [
          types.buff(Buffer.from(recipient, "hex")),
          types.some(types.int(inboundFee)),
          types.some(types.int(outboundFee)),
          types.int(500),
          types.int(500),
          types.uint(1_000_000_000_000),
        ],
        deployerWallet.address
      ),
      SupplierInterface.updateLiquidity(chain.blockHeight, 1_000_000_000_000, deployerWallet.address)
    ]);

    block = pool.createPool(delegate_1.address,XBTC,LP_TOKEN_0,ZP_TOKEN,PAYMENT,REWARDS_CALC,WITHDRAWAL_MANAGER,1000,1000,300_000_000_000,300_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    block = pool.finalizePool(delegate_1.address, LP_TOKEN_0, ZP_TOKEN, CP_TOKEN, poolId_0);

    let MagicId_LP_1 = common.consumeUint(chain.callReadOnlyFn(`${LP_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    // let MagicId_LP_2 = common.consumeUint(chain.callReadOnlyFn(`${LP_2.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_Borrower = common.consumeUint(chain.callReadOnlyFn(`${borrower_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());

    let sendFundsPreimage1 = "00";
    let sendFundsHash1 = util.getHash(sendFundsPreimage1);
    let sentAmount_1 = 100_000_000_000;
    let sentAmount_2 = 100_000_000_000;
    let senderPubKeyLp1 = "000000000000000000000000000000000000000000000000000000000000000000";
    
    let commitmentTime1 = 1;
    
    let hash = util.getHash(preimage);
    let tx1 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_1, sentAmount_1);
    // let tx2 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_2, sentAmount_2);
    let txid1 = util.getTxId(tx1);
    // let txid2 = util.getTxId(tx2);
    let minToReceive_1 = (sentAmount_1 * inboundFee / 10_000);
    // let minToReceive_2 = (sentAmount_2 * inboundFee / 10_000);

    block = chain.mineBlock([
      ...common.commitFunds(deployerWallet.address, preimage, tx1, txid1, sender, recipient, defaultExpiration, 0, MagicId_LP_1, supplierId, minToReceive_1, chain.blockHeight - 1, poolId_0, 0,"00", LP_1.address,LP_1.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid1,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,MAGIC_CALLER_CONTRACT_NAME),
      // ...common.commitFunds(deployerWallet.address, preimage, tx2, txid2, sender, recipient, defaultExpiration, 0, MagicId_LP_2, supplierId, minToReceive_2, chain.blockHeight - 1, poolId_0, 0,"00", LP_2.address,LP_2.address, MAGIC_CALLER_CONTRACT_NAME),
      // MagicCaller.sendFundsToPool(txid2,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_2.address,MAGIC_CALLER_CONTRACT_NAME),
    ]);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_1.address], sentAmount_1);
    // assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_2.address], sentAmount_2);
    
    block.receipts[2].result.expectOk().expectUint(sentAmount_1);
    // block.receipts[5].result.expectOk().expectUint(sentAmount_2);
    let fee = Number(Magic.getSupplier(chain, 0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    assert(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.liquidity-vault-v1-0`] > minToReceive_1);

    // Loan is created by Borrower
    const loan_amount = 100_000_000;
    const payment_period = 1440;
    const num_payments = 9;
    const coll_ratio = 0;
    
    const apr = 300;

    // Borrower creates Loan 0 for Pool 0
    block = pool.createLoan(LP_TOKEN_0, poolId_0, loan_amount, XBTC, coll_ratio, XBTC, apr, payment_period * num_payments, payment_period, COLL_VAULT, FUNDING_VAULT, borrower_1.address);

    const loanId = common.consumeUint(block.receipts[0].result.expectOk());
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(loanId, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, FUNDING_VAULT, XBTC, delegate_1.address);
    block.receipts[0].result.expectOk();

    // Backend process where we update the liquidity in the supplier-interface.
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);

    // Loan drawdown funds from Pool 0 and send bitcoin to the address
    block = chain.mineBlock([SupplierInterface.drawdown(loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId, SWAP_ROUTER, XBTC, borrower_1.address)]);
    
    // first outbound swap Id
    let swapId = common.consumeUint(block.receipts[0].result.expectOk().expectTuple()["swap-id"]);
    chain.mineEmptyBlock(10);

    // Finalizing drawdown, can be called by the backend to confirm transaction.
    // dummy values to set on the Bitcoin blockchain

    // mine dummy
    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    const treasuryFeeBPs = common.consumeUint(globals["treasury-fee"]);
    const loanAmountWithoutTreasuryFee = loan_amount - (loan_amount * treasuryFeeBPs / 10_000);
    let drawdown_tx = util.generateP2PKHTx(HASH, loanAmountWithoutTreasuryFee);

    block = chain.mineBlock(common.finalizeDrawdown(drawdown_tx, chain.blockHeight - 1, loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, 0, swapId, borrower_1.address, deployerWallet.address));
    block.receipts[1].result.expectOk().expectTuple()["borrow-amount"].expectUint(loanAmountWithoutTreasuryFee);

    // Payment start
    const GRACE_PERIOD = (ONE_DAY * 5);
    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) +  + GRACE_PERIOD + 2);

    block = pool.liquidateLoan(0, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, COLL_VAULT, XBTC, XBTC, CP_TOKEN,COVER_VAULT, SWAP_ROUTER, XBTC, delegate_1.address);
    pool.getPool(0)["principal-out"].expectUint(0);
    assertEquals(loan.getLoanData(0)["status"], "0x06");

    const requested_amount_1 = sentAmount_1;

    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address);

    chain.mineEmptyBlockUntil(common.consumeUint(WithdrawalManager.getFundsUnlockedAt(chain, poolId_0, LP_1.address, deployerWallet.address, "withdrawal-manager", deployerWallet.address).result));
    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address, LP_1.address);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`], 0);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_1.address], sentAmount_1 - loan_amount);
  },
});

Clarinet.test({
  name: "Borrower's loan gets liquidated with no collateral or cover. 2 LPers redeem their funds.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2 ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
    let LP_3 = accounts.get("wallet_3") as Account; // LP_3
    let LP_4 = accounts.get("wallet_4") as Account; // LP_4

    const MAGIC_CALLER_CONTRACT_NAME = "magic-caller";

    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_1.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_2.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, borrower_1.address)]);

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    const defaultExpiration = 500;
    const inboundFee = 10;
    const outboundFee = 10;
    const poolId_0 = 0;
    const loan_0 = 0;
    const supplierId = 0;
    const outputIndex = 0;

    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    block = FT.transfer(chain,deployerWallet.address,"Wrapped-Bitcoin",1_000_000_000_000,deployerWallet.address,`${deployerWallet.address}.supplier-controller`,"",deployerWallet.address);
    block = chain.mineBlock([
      Tx.contractCall(
        "supplier-controller",
        'register-supplier',
        [
          types.buff(Buffer.from(recipient, "hex")),
          types.some(types.int(inboundFee)),
          types.some(types.int(outboundFee)),
          types.int(500),
          types.int(500),
          types.uint(1_000_000_000_000),
        ],
        deployerWallet.address
      ),
      SupplierInterface.updateLiquidity(chain.blockHeight, 1_000_000_000_000, deployerWallet.address)
    ]);

    block = pool.createPool(delegate_1.address,XBTC,LP_TOKEN_0,ZP_TOKEN,PAYMENT,REWARDS_CALC,WITHDRAWAL_MANAGER,1000,1000,300_000_000_000,300_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    block = pool.finalizePool(delegate_1.address, LP_TOKEN_0, ZP_TOKEN, CP_TOKEN, poolId_0);

    let MagicId_LP_1 = common.consumeUint(chain.callReadOnlyFn(`${LP_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_LP_2 = common.consumeUint(chain.callReadOnlyFn(`${LP_2.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_Borrower = common.consumeUint(chain.callReadOnlyFn(`${borrower_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());

    let sendFundsPreimage1 = "00";
    let sendFundsHash1 = util.getHash(sendFundsPreimage1);
    let sentAmount_1 = 100_000_000_000;
    let sentAmount_2 = 100_000_000_000;
    let senderPubKeyLp1 = "000000000000000000000000000000000000000000000000000000000000000000";
    
    let commitmentTime1 = 1;
    
    let hash = util.getHash(preimage);
    let tx1 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_1, sentAmount_1);
    let tx2 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_2, sentAmount_2);
    let txid1 = util.getTxId(tx1);
    let txid2 = util.getTxId(tx2);
    let minToReceive_1 = (sentAmount_1 * inboundFee / 10_000);
    let minToReceive_2 = (sentAmount_2 * inboundFee / 10_000);

    block = chain.mineBlock([
      ...common.commitFunds(deployerWallet.address, preimage, tx1, txid1, sender, recipient, defaultExpiration, 0, MagicId_LP_1, supplierId, minToReceive_1, chain.blockHeight - 1, poolId_0, 0,"00", LP_1.address,LP_1.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid1,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,MAGIC_CALLER_CONTRACT_NAME),
      ...common.commitFunds(deployerWallet.address, preimage, tx2, txid2, sender, recipient, defaultExpiration, 0, MagicId_LP_2, supplierId, minToReceive_2, chain.blockHeight - 1, poolId_0, 0,"00", LP_2.address,LP_2.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid2,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_2.address,MAGIC_CALLER_CONTRACT_NAME),
    ]);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_1.address], sentAmount_1);
    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_2.address], sentAmount_2);
    
    block.receipts[2].result.expectOk().expectUint(sentAmount_1);
    block.receipts[5].result.expectOk().expectUint(sentAmount_2);
    let fee = Number(Magic.getSupplier(chain, 0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    assert(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.liquidity-vault-v1-0`] > minToReceive_1);

    // Loan is created by Borrower
    const loan_amount = 100_000_000;
    const payment_period = 1440;
    const num_payments = 9;
    const coll_ratio = 0;
    
    const apr = 300;

    // Borrower creates Loan 0 for Pool 0
    block = pool.createLoan(LP_TOKEN_0, poolId_0, loan_amount, XBTC, coll_ratio, XBTC, apr, payment_period * num_payments, payment_period, COLL_VAULT, FUNDING_VAULT, borrower_1.address);

    const loanId = common.consumeUint(block.receipts[0].result.expectOk());
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(loanId, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, FUNDING_VAULT, XBTC, delegate_1.address);
    block.receipts[0].result.expectOk();

    // Backend process where we update the liquidity in the supplier-interface.
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);

    // Loan drawdown funds from Pool 0 and send bitcoin to the address
    block = chain.mineBlock([SupplierInterface.drawdown(loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId, SWAP_ROUTER, XBTC, borrower_1.address)]);
    
    // first outbound swap Id
    let swapId = common.consumeUint(block.receipts[0].result.expectOk().expectTuple()["swap-id"]);
    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    const treasuryFeeBPs = common.consumeUint(globals["treasury-fee"]);
    const loanAmountWithoutTreasuryFee = loan_amount - (loan_amount * treasuryFeeBPs / 10_000);
    let drawdown_tx = util.generateP2PKHTx(HASH, loanAmountWithoutTreasuryFee);

    block = chain.mineBlock(common.finalizeDrawdown(drawdown_tx, chain.blockHeight - 1, loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, 0, swapId, borrower_1.address, deployerWallet.address));
    block.receipts[1].result.expectOk().expectTuple()["borrow-amount"].expectUint(loanAmountWithoutTreasuryFee);

    // Payment start
    const GRACE_PERIOD = (ONE_DAY * 5);
    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) +  + GRACE_PERIOD + 2);

    block = pool.liquidateLoan(0, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, COLL_VAULT, XBTC, XBTC, CP_TOKEN,COVER_VAULT, SWAP_ROUTER, XBTC, delegate_1.address);
    pool.getPool(0)["principal-out"].expectUint(0);
    assertEquals(loan.getLoanData(0)["status"], "0x06");

    const requested_amount_1 = sentAmount_1;
    const requested_amount_2 = sentAmount_2;

    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address);
    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_2, LP_2.address);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`],  requested_amount_1 + requested_amount_2);

    chain.mineEmptyBlockUntil(common.consumeUint(WithdrawalManager.getFundsUnlockedAt(chain, poolId_0, LP_1.address, deployerWallet.address, "withdrawal-manager", deployerWallet.address).result));
    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address, LP_1.address);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`], requested_amount_2);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_1.address], sentAmount_1 - (loan_amount / 2));

    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_2, LP_2.address, LP_2.address);

    // console.log(block);
    // console.log(block.receipts[0].events);
    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`], 0);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_2.address], sentAmount_2 - (loan_amount / 2));
  },
});


Clarinet.test({
  name: "Borrower makes 2 payments, misses 1. Borrower's loan gets liquidated with no collateral or cover. 2 LPers redeem their funds with full losses.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2 ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
    let LP_3 = accounts.get("wallet_3") as Account; // LP_3
    let LP_4 = accounts.get("wallet_4") as Account; // LP_4

    const MAGIC_CALLER_CONTRACT_NAME = "magic-caller";

    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_1.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_2.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, borrower_1.address)]);

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    const defaultExpiration = 500;
    const inboundFee = 10;
    const outboundFee = 10;
    const poolId_0 = 0;
    const loan_0 = 0;
    const supplierId = 0;
    const outputIndex = 0;

    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    block = FT.transfer(chain,deployerWallet.address,"Wrapped-Bitcoin",1_000_000_000_000,deployerWallet.address,`${deployerWallet.address}.supplier-controller`,"",deployerWallet.address);
    block = chain.mineBlock([
      Tx.contractCall(
        "supplier-controller",
        'register-supplier',
        [
          types.buff(Buffer.from(recipient, "hex")),
          types.some(types.int(inboundFee)),
          types.some(types.int(outboundFee)),
          types.int(500),
          types.int(500),
          types.uint(1_000_000_000_000),
        ],
        deployerWallet.address
      ),
      SupplierInterface.updateLiquidity(chain.blockHeight, 1_000_000_000_000, deployerWallet.address)
    ]);

    block = pool.createPool(delegate_1.address,XBTC,LP_TOKEN_0,ZP_TOKEN,PAYMENT,REWARDS_CALC,WITHDRAWAL_MANAGER,1000,1000,300_000_000_000,300_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    block = pool.finalizePool(delegate_1.address, LP_TOKEN_0, ZP_TOKEN, CP_TOKEN, poolId_0);

    let MagicId_LP_1 = common.consumeUint(chain.callReadOnlyFn(`${LP_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_LP_2 = common.consumeUint(chain.callReadOnlyFn(`${LP_2.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_Borrower = common.consumeUint(chain.callReadOnlyFn(`${borrower_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());

    let sendFundsPreimage1 = "00";
    let sendFundsHash1 = util.getHash(sendFundsPreimage1);
    let sentAmount_1 = 100_000_000_000;
    let sentAmount_2 = 100_000_000_000;
    let senderPubKeyLp1 = "000000000000000000000000000000000000000000000000000000000000000000";
    
    let commitmentTime1 = 1;
    
    let hash = util.getHash(preimage);
    let tx1 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_1, sentAmount_1);
    let tx2 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_2, sentAmount_2);
    let txid1 = util.getTxId(tx1);
    let txid2 = util.getTxId(tx2);
    let minToReceive_1 = (sentAmount_1 * inboundFee / 10_000);
    let minToReceive_2 = (sentAmount_2 * inboundFee / 10_000);

    block = chain.mineBlock([
      ...common.commitFunds(deployerWallet.address, preimage, tx1, txid1, sender, recipient, defaultExpiration, 0, MagicId_LP_1, supplierId, minToReceive_1, chain.blockHeight - 1, poolId_0, 0,"00", LP_1.address,LP_1.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid1,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,MAGIC_CALLER_CONTRACT_NAME),
      ...common.commitFunds(deployerWallet.address, preimage, tx2, txid2, sender, recipient, defaultExpiration, 0, MagicId_LP_2, supplierId, minToReceive_2, chain.blockHeight - 1, poolId_0, 0,"00", LP_2.address,LP_2.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid2,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_2.address,MAGIC_CALLER_CONTRACT_NAME),
    ]);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_1.address], sentAmount_1);
    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_2.address], sentAmount_2);
    
    block.receipts[2].result.expectOk().expectUint(sentAmount_1);
    block.receipts[5].result.expectOk().expectUint(sentAmount_2);
    let fee = Number(Magic.getSupplier(chain, 0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    assert(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.liquidity-vault-v1-0`] > minToReceive_1);

    // Loan is created by Borrower
    const loan_amount = 100_000_000;
    const payment_period = 1440;
    const num_payments = 9;
    const coll_ratio = 0;
    
    const apr = 300;

    // Borrower creates Loan 0 for Pool 0
    block = pool.createLoan(LP_TOKEN_0, poolId_0, loan_amount, XBTC, coll_ratio, XBTC, apr, payment_period * num_payments, payment_period, COLL_VAULT, FUNDING_VAULT, borrower_1.address);

    const loanId = common.consumeUint(block.receipts[0].result.expectOk());
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(loanId, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, FUNDING_VAULT, XBTC, delegate_1.address);
    block.receipts[0].result.expectOk();

    // Backend process where we update the liquidity in the supplier-interface.
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);

    // Loan drawdown funds from Pool 0 and send bitcoin to the address
    block = chain.mineBlock([SupplierInterface.drawdown(loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId, SWAP_ROUTER, XBTC, borrower_1.address)]);
    
    // first outbound swap Id
    let swapId = common.consumeUint(block.receipts[0].result.expectOk().expectTuple()["swap-id"]);
    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    const treasuryFeeBPs = common.consumeUint(globals["treasury-fee"]);
    const loanAmountWithoutTreasuryFee = loan_amount - (loan_amount * treasuryFeeBPs / 10_000);
    let drawdown_tx = util.generateP2PKHTx(HASH, loanAmountWithoutTreasuryFee);

    block = chain.mineBlock(common.finalizeDrawdown(drawdown_tx, chain.blockHeight - 1, loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, 0, swapId, borrower_1.address, deployerWallet.address));
    block.receipts[1].result.expectOk().expectTuple()["borrow-amount"].expectUint(loanAmountWithoutTreasuryFee);

    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) - 1);

    const preimagePayment1 = "00";
    let hashPayment1 = util.getHash(preimagePayment1);
    let payment1 = common.consumeUint(Payment.getCurrentLoanPayment(chain, 0, borrower_1.address));
    const payment1Tx = util.generateP2SHTx(sender, recipient, defaultExpiration, hashPayment1, MagicId_Borrower, payment1);
    const payment1TxId = util.getTxId(payment1Tx);    
    let minToReceive = Math.floor(payment1 * inboundFee / 10_000);

    block = chain.mineBlock([...common.makePaymentToLoan(deployerWallet.address,"00",defaultExpiration,MagicId_Borrower,payment1,sender,recipient,outputIndex,supplierId,minToReceive,chain.blockHeight - 1,poolId_0,loan_0,PAYMENT,LP_TOKEN_0,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,ZP_TOKEN,SWAP_ROUTER,XBTC,SUPPLIER_CONTROLLER_0,"01",borrower_1.address,borrower_1.address,MAGIC_CALLER_CONTRACT_NAME)]);
    block.receipts[2].result.expectOk().expectTuple()["reward"].expectUint(payment1);

    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) - 1);
    block = chain.mineBlock([...common.makePaymentToLoan(deployerWallet.address,"01",defaultExpiration,MagicId_Borrower,payment1,sender,recipient,outputIndex,supplierId,minToReceive,chain.blockHeight - 1,poolId_0,loan_0,PAYMENT,LP_TOKEN_0,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,ZP_TOKEN,SWAP_ROUTER,XBTC,SUPPLIER_CONTROLLER_0,"01",borrower_1.address,borrower_1.address,MAGIC_CALLER_CONTRACT_NAME)]);
    block.receipts[2].result.expectOk().expectTuple()["reward"].expectUint(payment1);

    // Payment start
    const GRACE_PERIOD = (ONE_DAY * 5);
    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) +  + GRACE_PERIOD + 2);

    block = pool.liquidateLoan(0, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, COLL_VAULT, XBTC, XBTC, CP_TOKEN,COVER_VAULT, SWAP_ROUTER, XBTC, delegate_1.address);
    pool.getPool(0)["principal-out"].expectUint(0);
    assertEquals(loan.getLoanData(0)["status"], "0x06");

    const requested_amount_1 = sentAmount_1;
    const requested_amount_2 = sentAmount_2;

    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address);
    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_2, LP_2.address);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`],  requested_amount_1 + requested_amount_2);

    chain.mineEmptyBlockUntil(common.consumeUint(WithdrawalManager.getFundsUnlockedAt(chain, poolId_0, LP_1.address, deployerWallet.address, "withdrawal-manager", deployerWallet.address).result));

    const total_liquidity = (chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.liquidity-vault-v1-0`]);

    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address, LP_1.address);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`], requested_amount_2);
    // assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_1.address], sentAmount_1 - (loan_amount / 2));

    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_2, LP_2.address, LP_2.address);

    // console.log(block);
    // console.log(block.receipts[0].events);

    const lp_1_amount_plus_rewards = (chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_1.address]);
    const lp_2_amount_plus_rewards = (chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_2.address]);
    const final_delegate_rewards = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][delegate_1.address];
    const total_rewards = num_payments * Math.floor(payment_period * (apr * loan_amount) / 10000 / (DAYS_PER_YEAR * ONE_DAY));
    const lp_rewards = total_rewards - final_delegate_rewards;

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`], 0);

    assertEquals(lp_1_amount_plus_rewards, total_liquidity / 2);
    assertEquals(lp_2_amount_plus_rewards, total_liquidity / 2);

    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);

    // assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_2.address], sentAmount_2 - (loan_amount / 2));
  },
});

Clarinet.test({
  name: "Borrower makes 2 payments, misses 1. Borrower's loan gets liquidated with xBTC collateral. 2 LPers redeem their funds with partial losses.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2 ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
    let LP_3 = accounts.get("wallet_3") as Account; // LP_3
    let LP_4 = accounts.get("wallet_4") as Account; // LP_4

    const MAGIC_CALLER_CONTRACT_NAME = "magic-caller";

    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_1.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_2.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, borrower_1.address)]);

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    const defaultExpiration = 500;
    const inboundFee = 10;
    const outboundFee = 10;
    const poolId_0 = 0;
    const loan_0 = 0;
    const supplierId = 0;
    const outputIndex = 0;

    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    block = FT.transfer(chain,deployerWallet.address,"Wrapped-Bitcoin",1_000_000_000_000,deployerWallet.address,`${deployerWallet.address}.supplier-controller`,"",deployerWallet.address);
    block = FT.transfer(chain,deployerWallet.address,"Wrapped-Bitcoin",40_000_000,deployerWallet.address,borrower_1.address,"",deployerWallet.address);

    block = chain.mineBlock([
      Tx.contractCall(
        "supplier-controller",
        'register-supplier',
        [
          types.buff(Buffer.from(recipient, "hex")),
          types.some(types.int(inboundFee)),
          types.some(types.int(outboundFee)),
          types.int(500),
          types.int(500),
          types.uint(1_000_000_000_000),
        ],
        deployerWallet.address
      ),
      SupplierInterface.updateLiquidity(chain.blockHeight, 1_000_000_000_000, deployerWallet.address)
    ]);

    block = pool.createPool(delegate_1.address,XBTC,LP_TOKEN_0,ZP_TOKEN,PAYMENT,REWARDS_CALC,WITHDRAWAL_MANAGER,1000,1000,300_000_000_000,300_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    block = pool.finalizePool(delegate_1.address, LP_TOKEN_0, ZP_TOKEN, CP_TOKEN, poolId_0);

    let MagicId_LP_1 = common.consumeUint(chain.callReadOnlyFn(`${LP_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_LP_2 = common.consumeUint(chain.callReadOnlyFn(`${LP_2.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_Borrower = common.consumeUint(chain.callReadOnlyFn(`${borrower_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());

    let sendFundsPreimage1 = "00";
    let sendFundsHash1 = util.getHash(sendFundsPreimage1);
    let sentAmount_1 = 100_000_000_000;
    let sentAmount_2 = 100_000_000_000;
    let senderPubKeyLp1 = "000000000000000000000000000000000000000000000000000000000000000000";
    
    let commitmentTime1 = 1;
    
    let hash = util.getHash(preimage);
    let tx1 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_1, sentAmount_1);
    let tx2 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_2, sentAmount_2);
    let txid1 = util.getTxId(tx1);
    let txid2 = util.getTxId(tx2);
    let minToReceive_1 = (sentAmount_1 * inboundFee / 10_000);
    let minToReceive_2 = (sentAmount_2 * inboundFee / 10_000);

    block = chain.mineBlock([
      ...common.commitFunds(deployerWallet.address, preimage, tx1, txid1, sender, recipient, defaultExpiration, 0, MagicId_LP_1, supplierId, minToReceive_1, chain.blockHeight - 1, poolId_0, 0,"00", LP_1.address,LP_1.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid1,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,MAGIC_CALLER_CONTRACT_NAME),
      ...common.commitFunds(deployerWallet.address, preimage, tx2, txid2, sender, recipient, defaultExpiration, 0, MagicId_LP_2, supplierId, minToReceive_2, chain.blockHeight - 1, poolId_0, 0,"00", LP_2.address,LP_2.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid2,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_2.address,MAGIC_CALLER_CONTRACT_NAME),
    ]);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_1.address], sentAmount_1);
    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_2.address], sentAmount_2);
    
    block.receipts[2].result.expectOk().expectUint(sentAmount_1);
    block.receipts[5].result.expectOk().expectUint(sentAmount_2);
    let fee = Number(Magic.getSupplier(chain, 0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    assert(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.liquidity-vault-v1-0`] > minToReceive_1);

    // Loan is created by Borrower
    const loan_amount = 100_000_000;
    const payment_period = 1440;
    const num_payments = 9;
    const coll_ratio = 4000;
    
    const apr = 300;

    // Borrower creates Loan 0 for Pool 0
    block = pool.createLoan(LP_TOKEN_0, poolId_0, loan_amount, XBTC, coll_ratio, XBTC, apr, payment_period * num_payments, payment_period, COLL_VAULT, FUNDING_VAULT, borrower_1.address);
    
    const loanId = common.consumeUint(block.receipts[0].result.expectOk());
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(loanId, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, FUNDING_VAULT, XBTC, delegate_1.address);
    block.receipts[0].result.expectOk();
    
    // Backend process where we update the liquidity in the supplier-interface.
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);

    // Loan drawdown funds from Pool 0 and send bitcoin to the address
    block = chain.mineBlock([SupplierInterface.drawdown(loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId, SWAP_ROUTER, XBTC, borrower_1.address)]);
    
    // first outbound swap Id
    let swapId = common.consumeUint(block.receipts[0].result.expectOk().expectTuple()["swap-id"]);
    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    const treasuryFeeBPs = common.consumeUint(globals["treasury-fee"]);
    const loanAmountWithoutTreasuryFee = loan_amount - (loan_amount * treasuryFeeBPs / 10_000);
    let drawdown_tx = util.generateP2PKHTx(HASH, loanAmountWithoutTreasuryFee);

    block = chain.mineBlock(common.finalizeDrawdown(drawdown_tx, chain.blockHeight - 1, loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, 0, swapId, borrower_1.address, deployerWallet.address));
    block.receipts[1].result.expectOk().expectTuple()["borrow-amount"].expectUint(loanAmountWithoutTreasuryFee);

    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) - 1);

    const preimagePayment1 = "00";
    let hashPayment1 = util.getHash(preimagePayment1);
    let payment1 = common.consumeUint(Payment.getCurrentLoanPayment(chain, 0, borrower_1.address));
    const payment1Tx = util.generateP2SHTx(sender, recipient, defaultExpiration, hashPayment1, MagicId_Borrower, payment1);
    const payment1TxId = util.getTxId(payment1Tx);    
    let minToReceive = Math.floor(payment1 * inboundFee / 10_000);
    
    // Payment start
    const GRACE_PERIOD = (ONE_DAY * 5);
    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) +  + GRACE_PERIOD + 2);

    const coll_amount = common.consumeUint(CollVault.getLoanColl(chain, COLL_VAULT, 0, deployerWallet.address).expectOk().expectTuple()["amount"]);

    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);
    block = pool.liquidateLoan(0, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, COLL_VAULT, XBTC, XBTC, CP_TOKEN,COVER_VAULT, SWAP_ROUTER, XBTC, delegate_1.address);
    pool.getPool(0)["principal-out"].expectUint(0);
    assertEquals(loan.getLoanData(0)["status"], "0x06");
    
    // console.log(block.receipts[0].events);
    // console.log(block);

    block.receipts[0].result.expectOk().expectTuple()["collateral-recovery"].expectUint(40_000_000);

    const requested_amount_1 = sentAmount_1;
    const requested_amount_2 = sentAmount_2;

    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address);
    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_2, LP_2.address);

    // console.log(WithdrawalManager.getRedeemeableAmounts(chain, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address, deployerWallet.address,"withdrawal-manager", deployerWallet.address));

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`],  requested_amount_1 + requested_amount_2);

    chain.mineEmptyBlockUntil(common.consumeUint(WithdrawalManager.getFundsUnlockedAt(chain, poolId_0, LP_1.address, deployerWallet.address, "withdrawal-manager", deployerWallet.address).result));
    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address, LP_1.address);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`], requested_amount_2);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_1.address], sentAmount_1 - (loan_amount / 2) + (coll_amount / 2));

    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_2, LP_2.address, LP_2.address);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`], 0);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_2.address], sentAmount_2 - (loan_amount / 2) + (coll_amount / 2));
  },
});

Clarinet.test({
  name: "Borrower makes 2 payments, misses 1. Borrower's loan gets liquidated with xBTC cover pool activated but no cover and no collateral. 2 LPers redeem their funds with full losses.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2 ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
    let LP_3 = accounts.get("wallet_3") as Account; // LP_3
    let LP_4 = accounts.get("wallet_4") as Account; // LP_4

    const MAGIC_CALLER_CONTRACT_NAME = "magic-caller";

    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_1.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_2.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, borrower_1.address)]);

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    const defaultExpiration = 500;
    const inboundFee = 10;
    const outboundFee = 10;
    const poolId_0 = 0;
    const loan_0 = 0;
    const supplierId = 0;
    const outputIndex = 0;

    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    block = FT.transfer(chain,deployerWallet.address,"Wrapped-Bitcoin",1_000_000_000_000,deployerWallet.address,`${deployerWallet.address}.supplier-controller`,"",deployerWallet.address);
    // block = FT.transfer(chain,deployerWallet.address,"Wrapped-Bitcoin",40_000_000,deployerWallet.address,borrower_1.address,"",deployerWallet.address);

    block = chain.mineBlock([
      Tx.contractCall(
        "supplier-controller",
        'register-supplier',
        [
          types.buff(Buffer.from(recipient, "hex")),
          types.some(types.int(inboundFee)),
          types.some(types.int(outboundFee)),
          types.int(500),
          types.int(500),
          types.uint(1_000_000_000_000),
        ],
        deployerWallet.address
      ),
      SupplierInterface.updateLiquidity(chain.blockHeight, 1_000_000_000_000, deployerWallet.address)
    ]);

    block = pool.createPool(delegate_1.address,XBTC,LP_TOKEN_0,ZP_TOKEN,PAYMENT,REWARDS_CALC,WITHDRAWAL_MANAGER,1000,1000,300_000_000_000,300_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    block = pool.finalizePool(delegate_1.address, LP_TOKEN_0, ZP_TOKEN, CP_TOKEN, poolId_0);
    block = pool.enableCover(LP_TOKEN_0, CP_TOKEN, 0, delegate_1.address);

    let MagicId_LP_1 = common.consumeUint(chain.callReadOnlyFn(`${LP_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_LP_2 = common.consumeUint(chain.callReadOnlyFn(`${LP_2.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_Borrower = common.consumeUint(chain.callReadOnlyFn(`${borrower_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());

    let sendFundsPreimage1 = "00";
    let sendFundsHash1 = util.getHash(sendFundsPreimage1);
    let sentAmount_1 = 100_000_000_000;
    let sentAmount_2 = 100_000_000_000;
    let senderPubKeyLp1 = "000000000000000000000000000000000000000000000000000000000000000000";
    
    let commitmentTime1 = 1;
    
    let hash = util.getHash(preimage);
    let tx1 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_1, sentAmount_1);
    let tx2 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_2, sentAmount_2);
    let txid1 = util.getTxId(tx1);
    let txid2 = util.getTxId(tx2);
    let minToReceive_1 = (sentAmount_1 * inboundFee / 10_000);
    let minToReceive_2 = (sentAmount_2 * inboundFee / 10_000);

    block = chain.mineBlock([
      ...common.commitFunds(deployerWallet.address, preimage, tx1, txid1, sender, recipient, defaultExpiration, 0, MagicId_LP_1, supplierId, minToReceive_1, chain.blockHeight - 1, poolId_0, 0,"00", LP_1.address,LP_1.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid1,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,MAGIC_CALLER_CONTRACT_NAME),
      ...common.commitFunds(deployerWallet.address, preimage, tx2, txid2, sender, recipient, defaultExpiration, 0, MagicId_LP_2, supplierId, minToReceive_2, chain.blockHeight - 1, poolId_0, 0,"00", LP_2.address,LP_2.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid2,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_2.address,MAGIC_CALLER_CONTRACT_NAME),
    ]);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_1.address], sentAmount_1);
    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_2.address], sentAmount_2);
    
    block.receipts[2].result.expectOk().expectUint(sentAmount_1);
    block.receipts[5].result.expectOk().expectUint(sentAmount_2);
    let fee = Number(Magic.getSupplier(chain, 0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    assert(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.liquidity-vault-v1-0`] > minToReceive_1);

    // Loan is created by Borrower
    const loan_amount = 100_000_000;
    const payment_period = 1440;
    const num_payments = 9;
    const coll_ratio = 0;
    
    const apr = 300;

    // Borrower creates Loan 0 for Pool 0
    block = pool.createLoan(LP_TOKEN_0, poolId_0, loan_amount, XBTC, coll_ratio, XBTC, apr, payment_period * num_payments, payment_period, COLL_VAULT, FUNDING_VAULT, borrower_1.address);
    
    const loanId = common.consumeUint(block.receipts[0].result.expectOk());
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(loanId, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, FUNDING_VAULT, XBTC, delegate_1.address);
    block.receipts[0].result.expectOk();
    
    // Backend process where we update the liquidity in the supplier-interface.
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);

    // Loan drawdown funds from Pool 0 and send bitcoin to the address
    block = chain.mineBlock([SupplierInterface.drawdown(loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId, SWAP_ROUTER, XBTC, borrower_1.address)]);
    
    // first outbound swap Id
    let swapId = common.consumeUint(block.receipts[0].result.expectOk().expectTuple()["swap-id"]);
    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    const treasuryFeeBPs = common.consumeUint(globals["treasury-fee"]);
    const loanAmountWithoutTreasuryFee = loan_amount - (loan_amount * treasuryFeeBPs / 10_000);
    let drawdown_tx = util.generateP2PKHTx(HASH, loanAmountWithoutTreasuryFee);

    block = chain.mineBlock(common.finalizeDrawdown(drawdown_tx, chain.blockHeight - 1, loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, 0, swapId, borrower_1.address, deployerWallet.address));
    block.receipts[1].result.expectOk().expectTuple()["borrow-amount"].expectUint(loanAmountWithoutTreasuryFee);

    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) - 1);

    const preimagePayment1 = "00";
    let hashPayment1 = util.getHash(preimagePayment1);
    let payment1 = common.consumeUint(Payment.getCurrentLoanPayment(chain, 0, borrower_1.address));
    const payment1Tx = util.generateP2SHTx(sender, recipient, defaultExpiration, hashPayment1, MagicId_Borrower, payment1);
    const payment1TxId = util.getTxId(payment1Tx);    
    let minToReceive = Math.floor(payment1 * inboundFee / 10_000);
    
    // Payment start
    const GRACE_PERIOD = (ONE_DAY * 5);
    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) +  + GRACE_PERIOD + 2);

    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);
    block = pool.liquidateLoan(0, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, COLL_VAULT, XBTC, XBTC, CP_TOKEN,COVER_VAULT, SWAP_ROUTER, XBTC, delegate_1.address);
    pool.getPool(0)["principal-out"].expectUint(0);
    assertEquals(loan.getLoanData(0)["status"], "0x06");

    block.receipts[0].result.expectOk().expectTuple()["collateral-recovery"].expectUint(0);
    // block.receipts[0].result.expectOk().expectTuple()["stakes-recovery"].expectUint(0);

    const requested_amount_1 = sentAmount_1;
    const requested_amount_2 = sentAmount_2;

    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address);
    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_2, LP_2.address);

    // console.log(WithdrawalManager.getRedeemeableAmounts(chain, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address, deployerWallet.address,"withdrawal-manager", deployerWallet.address));

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`],  requested_amount_1 + requested_amount_2);

    chain.mineEmptyBlockUntil(common.consumeUint(WithdrawalManager.getFundsUnlockedAt(chain, poolId_0, LP_1.address, deployerWallet.address, "withdrawal-manager", deployerWallet.address).result));
    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address, LP_1.address);

    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_1.address], sentAmount_1 - (loan_amount / 2));

    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_2, LP_2.address, LP_2.address);

    // console.log(block);
    // console.log(block.receipts[0].events);
    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`], 0);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_2.address], sentAmount_2 - (loan_amount / 2));

    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);
  },
});

Clarinet.test({
  name: "Borrower makes 2 payments, misses 1. Borrower's loan gets liquidated with xBTC cover pool activated with just enough cover and no collateral. 2 LPers redeem their funds with no losses.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2 ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
    let Cover_Provider = accounts.get("wallet_3") as Account; // Cover Provider_1
    let LP_4 = accounts.get("wallet_4") as Account; // LP_4

    const MAGIC_CALLER_CONTRACT_NAME = "magic-caller";

    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_1.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_2.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, borrower_1.address)]);

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);

    const defaultExpiration = 500;
    const inboundFee = 10;
    const outboundFee = 10;
    const poolId_0 = 0;
    const loan_0 = 0;
    const supplierId = 0;
    const outputIndex = 0;

    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    block = FT.transfer(chain,deployerWallet.address,"Wrapped-Bitcoin",1_000_000_000_000,deployerWallet.address,`${deployerWallet.address}.supplier-controller`,"",deployerWallet.address);
    block = FT.transfer(chain,deployerWallet.address,"Wrapped-Bitcoin",100_000_000_000,deployerWallet.address,Cover_Provider.address,"",deployerWallet.address);

    block = chain.mineBlock([
      Tx.contractCall(
        "supplier-controller",
        'register-supplier',
        [
          types.buff(Buffer.from(recipient, "hex")),
          types.some(types.int(inboundFee)),
          types.some(types.int(outboundFee)),
          types.int(500),
          types.int(500),
          types.uint(1_000_000_000_000),
        ],
        deployerWallet.address
      ),
      SupplierInterface.updateLiquidity(chain.blockHeight, 1_000_000_000_000, deployerWallet.address)
    ]);

    block = pool.createPool(delegate_1.address,XBTC,LP_TOKEN_0,ZP_TOKEN,PAYMENT,REWARDS_CALC,WITHDRAWAL_MANAGER,1000,1000,300_000_000_000,300_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    block = pool.finalizePool(delegate_1.address, LP_TOKEN_0, ZP_TOKEN, CP_TOKEN, poolId_0);
    block = pool.enableCover(LP_TOKEN_0, CP_TOKEN, 0, delegate_1.address);

    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, poolId_0, 100_000_000n, 10, REWARDS_CALC, Cover_Provider.address);

    let MagicId_LP_1 = common.consumeUint(chain.callReadOnlyFn(`${LP_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_LP_2 = common.consumeUint(chain.callReadOnlyFn(`${LP_2.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_Borrower = common.consumeUint(chain.callReadOnlyFn(`${borrower_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());

    let sendFundsPreimage1 = "00";
    let sendFundsHash1 = util.getHash(sendFundsPreimage1);
    let sentAmount_1 = 100_000_000_000;
    let sentAmount_2 = 100_000_000_000;
    let senderPubKeyLp1 = "000000000000000000000000000000000000000000000000000000000000000000";
    
    let commitmentTime1 = 1;
    
    let hash = util.getHash(preimage);
    let tx1 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_1, sentAmount_1);
    let tx2 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_2, sentAmount_2);
    let txid1 = util.getTxId(tx1);
    let txid2 = util.getTxId(tx2);
    let minToReceive_1 = (sentAmount_1 * inboundFee / 10_000);
    let minToReceive_2 = (sentAmount_2 * inboundFee / 10_000);

    block = chain.mineBlock([
      ...common.commitFunds(deployerWallet.address, preimage, tx1, txid1, sender, recipient, defaultExpiration, 0, MagicId_LP_1, supplierId, minToReceive_1, chain.blockHeight - 1, poolId_0, 0,"00", LP_1.address,LP_1.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid1,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,MAGIC_CALLER_CONTRACT_NAME),
      ...common.commitFunds(deployerWallet.address, preimage, tx2, txid2, sender, recipient, defaultExpiration, 0, MagicId_LP_2, supplierId, minToReceive_2, chain.blockHeight - 1, poolId_0, 0,"00", LP_2.address,LP_2.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid2,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_2.address,MAGIC_CALLER_CONTRACT_NAME),
    ]);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_1.address], sentAmount_1);
    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_2.address], sentAmount_2);
    
    block.receipts[2].result.expectOk().expectUint(sentAmount_1);
    block.receipts[5].result.expectOk().expectUint(sentAmount_2);
    let fee = Number(Magic.getSupplier(chain, 0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    assert(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.liquidity-vault-v1-0`] > minToReceive_1);

    // Loan is created by Borrower
    const loan_amount = 100_000_000;
    const payment_period = 1440;
    const num_payments = 9;
    const coll_ratio = 0;
    
    const apr = 300;

    // Borrower creates Loan 0 for Pool 0
    block = pool.createLoan(LP_TOKEN_0, poolId_0, loan_amount, XBTC, coll_ratio, XBTC, apr, payment_period * num_payments, payment_period, COLL_VAULT, FUNDING_VAULT, borrower_1.address);
    
    const loanId = common.consumeUint(block.receipts[0].result.expectOk());
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(loanId, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, FUNDING_VAULT, XBTC, delegate_1.address);
    block.receipts[0].result.expectOk();
    
    // Backend process where we update the liquidity in the supplier-interface.
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);

    // Loan drawdown funds from Pool 0 and send bitcoin to the address
    block = chain.mineBlock([SupplierInterface.drawdown(loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId, SWAP_ROUTER, XBTC, borrower_1.address)]);
    
    // first outbound swap Id
    let swapId = common.consumeUint(block.receipts[0].result.expectOk().expectTuple()["swap-id"]);
    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    const treasuryFeeBPs = common.consumeUint(globals["treasury-fee"]);
    const loanAmountWithoutTreasuryFee = loan_amount - (loan_amount * treasuryFeeBPs / 10_000);
    let drawdown_tx = util.generateP2PKHTx(HASH, loanAmountWithoutTreasuryFee);

    block = chain.mineBlock(common.finalizeDrawdown(drawdown_tx, chain.blockHeight - 1, loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, 0, swapId, borrower_1.address, deployerWallet.address));
    block.receipts[1].result.expectOk().expectTuple()["borrow-amount"].expectUint(loanAmountWithoutTreasuryFee);

    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) - 1);

    const preimagePayment1 = "00";
    let hashPayment1 = util.getHash(preimagePayment1);
    let payment1 = common.consumeUint(Payment.getCurrentLoanPayment(chain, 0, borrower_1.address));
    const payment1Tx = util.generateP2SHTx(sender, recipient, defaultExpiration, hashPayment1, MagicId_Borrower, payment1);
    const payment1TxId = util.getTxId(payment1Tx);    
    let minToReceive = Math.floor(payment1 * inboundFee / 10_000);
    
    // Payment start
    const GRACE_PERIOD = (ONE_DAY * 5);
    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) +  + GRACE_PERIOD + 2);

    block = pool.liquidateLoan(0, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, COLL_VAULT, XBTC, XBTC, CP_TOKEN,COVER_VAULT, SWAP_ROUTER, XBTC, delegate_1.address);
    pool.getPool(0)["principal-out"].expectUint(0);
    assertEquals(loan.getLoanData(0)["status"], "0x06");

    block.receipts[0].result.expectOk().expectTuple()["collateral-recovery"].expectUint(0);
    block.receipts[0].result.expectOk().expectTuple()["cover-pool-recovered"].expectUint(100000000);

    const requested_amount_1 = sentAmount_1;
    const requested_amount_2 = sentAmount_2;

    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address);
    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_2, LP_2.address);

    // // console.log(WithdrawalManager.getRedeemeableAmounts(chain, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address, deployerWallet.address,"withdrawal-manager", deployerWallet.address));

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`],  requested_amount_1 + requested_amount_2);

    chain.mineEmptyBlockUntil(common.consumeUint(WithdrawalManager.getFundsUnlockedAt(chain, poolId_0, LP_1.address, deployerWallet.address, "withdrawal-manager", deployerWallet.address).result));
    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address, LP_1.address);
    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_2, LP_2.address, LP_2.address);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`], 0);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_1.address], sentAmount_1);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_2.address], sentAmount_2);
  },
});

Clarinet.test({
  name: "Borrower makes 2 payments, misses 1. Borrower's loan gets liquidated with xBTC cover pool activated with not enough cover and no collateral. 2 LPers redeem their funds with losses.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2 ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
    let Cover_Provider = accounts.get("wallet_3") as Account; // Cover Provider_1
    let LP_4 = accounts.get("wallet_4") as Account; // LP_4

    const MAGIC_CALLER_CONTRACT_NAME = "magic-caller";

    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_1.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_2.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, borrower_1.address)]);

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);

    const defaultExpiration = 500;
    const inboundFee = 10;
    const outboundFee = 10;
    const poolId_0 = 0;
    const loan_0 = 0;
    const supplierId = 0;
    const outputIndex = 0;

    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    block = FT.transfer(chain,deployerWallet.address,"Wrapped-Bitcoin",1_000_000_000_000,deployerWallet.address,`${deployerWallet.address}.supplier-controller`,"",deployerWallet.address);
    block = FT.transfer(chain,deployerWallet.address,"Wrapped-Bitcoin",50_000_000,deployerWallet.address,Cover_Provider.address,"",deployerWallet.address);

    block = chain.mineBlock([
      Tx.contractCall(
        "supplier-controller",
        'register-supplier',
        [
          types.buff(Buffer.from(recipient, "hex")),
          types.some(types.int(inboundFee)),
          types.some(types.int(outboundFee)),
          types.int(500),
          types.int(500),
          types.uint(1_000_000_000_000),
        ],
        deployerWallet.address
      ),
      SupplierInterface.updateLiquidity(chain.blockHeight, 1_000_000_000_000, deployerWallet.address)
    ]);

    block = pool.createPool(delegate_1.address,XBTC,LP_TOKEN_0,ZP_TOKEN,PAYMENT,REWARDS_CALC,WITHDRAWAL_MANAGER,1000,1000,300_000_000_000,300_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    block = pool.finalizePool(delegate_1.address, LP_TOKEN_0, ZP_TOKEN, CP_TOKEN, poolId_0);
    block = pool.enableCover(LP_TOKEN_0, CP_TOKEN, 0, delegate_1.address);

    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, poolId_0, 50_000_000n, 10, REWARDS_CALC, Cover_Provider.address);

    let MagicId_LP_1 = common.consumeUint(chain.callReadOnlyFn(`${LP_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_LP_2 = common.consumeUint(chain.callReadOnlyFn(`${LP_2.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_Borrower = common.consumeUint(chain.callReadOnlyFn(`${borrower_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());

    let sendFundsPreimage1 = "00";
    let sendFundsHash1 = util.getHash(sendFundsPreimage1);
    let sentAmount_1 = 100_000_000_000;
    let sentAmount_2 = 100_000_000_000;
    let senderPubKeyLp1 = "000000000000000000000000000000000000000000000000000000000000000000";
    
    let commitmentTime1 = 1;
    
    let hash = util.getHash(preimage);
    let tx1 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_1, sentAmount_1);
    let tx2 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_2, sentAmount_2);
    let txid1 = util.getTxId(tx1);
    let txid2 = util.getTxId(tx2);
    let minToReceive_1 = (sentAmount_1 * inboundFee / 10_000);
    let minToReceive_2 = (sentAmount_2 * inboundFee / 10_000);

    block = chain.mineBlock([
      ...common.commitFunds(deployerWallet.address, preimage, tx1, txid1, sender, recipient, defaultExpiration, 0, MagicId_LP_1, supplierId, minToReceive_1, chain.blockHeight - 1, poolId_0, 0,"00", LP_1.address,LP_1.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid1,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,MAGIC_CALLER_CONTRACT_NAME),
      ...common.commitFunds(deployerWallet.address, preimage, tx2, txid2, sender, recipient, defaultExpiration, 0, MagicId_LP_2, supplierId, minToReceive_2, chain.blockHeight - 1, poolId_0, 0,"00", LP_2.address,LP_2.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid2,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_2.address,MAGIC_CALLER_CONTRACT_NAME),
    ]);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_1.address], sentAmount_1);
    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_2.address], sentAmount_2);
    
    block.receipts[2].result.expectOk().expectUint(sentAmount_1);
    block.receipts[5].result.expectOk().expectUint(sentAmount_2);
    let fee = Number(Magic.getSupplier(chain, 0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    assert(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.liquidity-vault-v1-0`] > minToReceive_1);

    // Loan is created by Borrower
    const loan_amount = 100_000_000;
    const payment_period = 1440;
    const num_payments = 9;
    const coll_ratio = 0;
    
    const apr = 300;

    // Borrower creates Loan 0 for Pool 0
    block = pool.createLoan(LP_TOKEN_0, poolId_0, loan_amount, XBTC, coll_ratio, XBTC, apr, payment_period * num_payments, payment_period, COLL_VAULT, FUNDING_VAULT, borrower_1.address);
    
    const loanId = common.consumeUint(block.receipts[0].result.expectOk());
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(loanId, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, FUNDING_VAULT, XBTC, delegate_1.address);
    block.receipts[0].result.expectOk();
    
    // Backend process where we update the liquidity in the supplier-interface.
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);

    // Loan drawdown funds from Pool 0 and send bitcoin to the address
    block = chain.mineBlock([SupplierInterface.drawdown(loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId, SWAP_ROUTER, XBTC, borrower_1.address)]);
    
    // first outbound swap Id
    let swapId = common.consumeUint(block.receipts[0].result.expectOk().expectTuple()["swap-id"]);
    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    const treasuryFeeBPs = common.consumeUint(globals["treasury-fee"]);
    const loanAmountWithoutTreasuryFee = loan_amount - (loan_amount * treasuryFeeBPs / 10_000);
    let drawdown_tx = util.generateP2PKHTx(HASH, loanAmountWithoutTreasuryFee);

    block = chain.mineBlock(common.finalizeDrawdown(drawdown_tx, chain.blockHeight - 1, loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, 0, swapId, borrower_1.address, deployerWallet.address));
    block.receipts[1].result.expectOk().expectTuple()["borrow-amount"].expectUint(loanAmountWithoutTreasuryFee);

    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) - 1);

    const preimagePayment1 = "00";
    let hashPayment1 = util.getHash(preimagePayment1);
    let payment1 = common.consumeUint(Payment.getCurrentLoanPayment(chain, 0, borrower_1.address));
    const payment1Tx = util.generateP2SHTx(sender, recipient, defaultExpiration, hashPayment1, MagicId_Borrower, payment1);
    const payment1TxId = util.getTxId(payment1Tx);    
    let minToReceive = Math.floor(payment1 * inboundFee / 10_000);
    
    // Payment start
    const GRACE_PERIOD = (ONE_DAY * 5);
    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) +  + GRACE_PERIOD + 2);

    block = pool.liquidateLoan(0, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, COLL_VAULT, XBTC, XBTC, CP_TOKEN,COVER_VAULT, SWAP_ROUTER, XBTC, delegate_1.address);
    pool.getPool(0)["principal-out"].expectUint(0);
    assertEquals(loan.getLoanData(0)["status"], "0x06");

    block.receipts[0].result.expectOk().expectTuple()["collateral-recovery"].expectUint(0);
    block.receipts[0].result.expectOk().expectTuple()["cover-pool-recovered"].expectUint(50_000_000);
    const funds_recovered = common.consumeUint(block.receipts[0].result.expectOk().expectTuple()["cover-pool-recovered"])

    const requested_amount_1 = sentAmount_1;
    const requested_amount_2 = sentAmount_2;

    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address);
    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_2, LP_2.address);


    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`],  requested_amount_1 + requested_amount_2);

    chain.mineEmptyBlockUntil(common.consumeUint(WithdrawalManager.getFundsUnlockedAt(chain, poolId_0, LP_1.address, deployerWallet.address, "withdrawal-manager", deployerWallet.address).result));
    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address, LP_1.address);
    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_2, LP_2.address, LP_2.address);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`], 0);

    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_1.address], sentAmount_1 - (loan_amount / 2) + (funds_recovered / 2));
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_2.address], sentAmount_2 - (loan_amount / 2) + (funds_recovered / 2));
  },
});

Clarinet.test({
  name: "Borrower makes 2 payments, misses 1. Borrower's loan gets liquidated with xBTC cover pool activated with double cover and no collateral. 2 LPers redeem their funds with losses.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2 ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
    let Cover_Provider = accounts.get("wallet_3") as Account; // Cover Provider_1
    let LP_4 = accounts.get("wallet_4") as Account; // LP_4

    const MAGIC_CALLER_CONTRACT_NAME = "magic-caller";

    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_1.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_2.address)]);
    temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, borrower_1.address)]);

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);

    const defaultExpiration = 500;
    const inboundFee = 10;
    const outboundFee = 10;
    const poolId_0 = 0;
    const loan_0 = 0;
    const supplierId = 0;
    const outputIndex = 0;

    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    block = FT.transfer(chain,deployerWallet.address,"Wrapped-Bitcoin",1_000_000_000_000,deployerWallet.address,`${deployerWallet.address}.supplier-controller`,"",deployerWallet.address);
    block = FT.transfer(chain,deployerWallet.address,"Wrapped-Bitcoin",200_000_000,deployerWallet.address,Cover_Provider.address,"",deployerWallet.address);

    block = chain.mineBlock([
      Tx.contractCall(
        "supplier-controller",
        'register-supplier',
        [
          types.buff(Buffer.from(recipient, "hex")),
          types.some(types.int(inboundFee)),
          types.some(types.int(outboundFee)),
          types.int(500),
          types.int(500),
          types.uint(1_000_000_000_000),
        ],
        deployerWallet.address
      ),
      SupplierInterface.updateLiquidity(chain.blockHeight, 1_000_000_000_000, deployerWallet.address)
    ]);

    block = pool.createPool(delegate_1.address,XBTC,LP_TOKEN_0,ZP_TOKEN,PAYMENT,REWARDS_CALC,WITHDRAWAL_MANAGER,1000,1000,300_000_000_000,300_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    block = pool.finalizePool(delegate_1.address, LP_TOKEN_0, ZP_TOKEN, CP_TOKEN, poolId_0);
    block = pool.enableCover(LP_TOKEN_0, CP_TOKEN, 0, delegate_1.address);

    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, poolId_0, 200_000_000n, 10, REWARDS_CALC, Cover_Provider.address);

    let MagicId_LP_1 = common.consumeUint(chain.callReadOnlyFn(`${LP_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_LP_2 = common.consumeUint(chain.callReadOnlyFn(`${LP_2.address}.${MAGIC_CALLER_CONTRACT_NAME}`, `get-swapper-id`, [], deployerWallet.address ).result.expectSome());
    let MagicId_Borrower = common.consumeUint(chain.callReadOnlyFn(`${borrower_1.address}.${MAGIC_CALLER_CONTRACT_NAME}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());

    let sendFundsPreimage1 = "00";
    let sendFundsHash1 = util.getHash(sendFundsPreimage1);
    let sentAmount_1 = 100_000_000_000;
    let sentAmount_2 = 100_000_000_000;
    let senderPubKeyLp1 = "000000000000000000000000000000000000000000000000000000000000000000";
    
    let commitmentTime1 = 1;
    
    let hash = util.getHash(preimage);
    let tx1 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_1, sentAmount_1);
    let tx2 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_2, sentAmount_2);
    let txid1 = util.getTxId(tx1);
    let txid2 = util.getTxId(tx2);
    let minToReceive_1 = (sentAmount_1 * inboundFee / 10_000);
    let minToReceive_2 = (sentAmount_2 * inboundFee / 10_000);

    block = chain.mineBlock([
      ...common.commitFunds(deployerWallet.address, preimage, tx1, txid1, sender, recipient, defaultExpiration, 0, MagicId_LP_1, supplierId, minToReceive_1, chain.blockHeight - 1, poolId_0, 0,"00", LP_1.address,LP_1.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid1,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,MAGIC_CALLER_CONTRACT_NAME),
      ...common.commitFunds(deployerWallet.address, preimage, tx2, txid2, sender, recipient, defaultExpiration, 0, MagicId_LP_2, supplierId, minToReceive_2, chain.blockHeight - 1, poolId_0, 0,"00", LP_2.address,LP_2.address, MAGIC_CALLER_CONTRACT_NAME),
      MagicCaller.sendFundsToPool(txid2,preimage,LP_TOKEN_0,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_2.address,MAGIC_CALLER_CONTRACT_NAME),
    ]);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_1.address], sentAmount_1);
    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][LP_2.address], sentAmount_2);
    
    block.receipts[2].result.expectOk().expectUint(sentAmount_1);
    block.receipts[5].result.expectOk().expectUint(sentAmount_2);
    let fee = Number(Magic.getSupplier(chain, 0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    assert(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.liquidity-vault-v1-0`] > minToReceive_1);

    // Loan is created by Borrower
    const loan_amount = 100_000_000;
    const payment_period = 1440;
    const num_payments = 9;
    const coll_ratio = 0;
    
    const apr = 300;

    // Borrower creates Loan 0 for Pool 0
    block = pool.createLoan(LP_TOKEN_0, poolId_0, loan_amount, XBTC, coll_ratio, XBTC, apr, payment_period * num_payments, payment_period, COLL_VAULT, FUNDING_VAULT, borrower_1.address);
    
    const loanId = common.consumeUint(block.receipts[0].result.expectOk());
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(loanId, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, FUNDING_VAULT, XBTC, delegate_1.address);
    block.receipts[0].result.expectOk();
    
    // Backend process where we update the liquidity in the supplier-interface.
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);

    // Loan drawdown funds from Pool 0 and send bitcoin to the address
    block = chain.mineBlock([SupplierInterface.drawdown(loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId, SWAP_ROUTER, XBTC, borrower_1.address)]);
    
    // first outbound swap Id
    let swapId = common.consumeUint(block.receipts[0].result.expectOk().expectTuple()["swap-id"]);
    chain.mineEmptyBlock(10);

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    const treasuryFeeBPs = common.consumeUint(globals["treasury-fee"]);
    const loanAmountWithoutTreasuryFee = loan_amount - (loan_amount * treasuryFeeBPs / 10_000);
    let drawdown_tx = util.generateP2PKHTx(HASH, loanAmountWithoutTreasuryFee);

    block = chain.mineBlock(common.finalizeDrawdown(drawdown_tx, chain.blockHeight - 1, loanId, LP_TOKEN_0, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, 0, swapId, borrower_1.address, deployerWallet.address));
    block.receipts[1].result.expectOk().expectTuple()["borrow-amount"].expectUint(loanAmountWithoutTreasuryFee);

    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) - 1);

    const preimagePayment1 = "00";
    let hashPayment1 = util.getHash(preimagePayment1);
    let payment1 = common.consumeUint(Payment.getCurrentLoanPayment(chain, 0, borrower_1.address));
    const payment1Tx = util.generateP2SHTx(sender, recipient, defaultExpiration, hashPayment1, MagicId_Borrower, payment1);
    const payment1TxId = util.getTxId(payment1Tx);    
    let minToReceive = Math.floor(payment1 * inboundFee / 10_000);
    
    // Payment start
    const GRACE_PERIOD = (ONE_DAY * 5);
    chain.mineEmptyBlockUntil(common.consumeUint(loan.getLoanData(0)["next-payment"]) +  + GRACE_PERIOD + 2);

    block = pool.liquidateLoan(0, LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, COLL_VAULT, XBTC, XBTC, CP_TOKEN,COVER_VAULT, SWAP_ROUTER, XBTC, delegate_1.address);
    pool.getPool(0)["principal-out"].expectUint(0);
    assertEquals(loan.getLoanData(0)["status"], "0x06");

    block.receipts[0].result.expectOk().expectTuple()["collateral-recovery"].expectUint(0);
    block.receipts[0].result.expectOk().expectTuple()["cover-pool-recovered"].expectUint(loan_amount);

    const requested_amount_1 = sentAmount_1;
    const requested_amount_2 = sentAmount_2;

    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address);
    block = pool.signalRedeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_2, LP_2.address);


    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`],  requested_amount_1 + requested_amount_2);

    chain.mineEmptyBlockUntil(common.consumeUint(WithdrawalManager.getFundsUnlockedAt(chain, poolId_0, LP_1.address, deployerWallet.address, "withdrawal-manager", deployerWallet.address).result));
    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_1, LP_1.address, LP_1.address);
    block = pool.redeem(LP_TOKEN_0, poolId_0, LIQUIDITY_VAULT, XBTC, requested_amount_2, LP_2.address, LP_2.address);

    assertEquals(chain.getAssetsMaps().assets[".lp-token-0.lp-token-0"][`${deployerWallet.address}.withdrawal-manager`], 0);

    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_1.address], sentAmount_1);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][LP_2.address], sentAmount_2);
  },
});
