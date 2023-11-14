// deno-lint-ignore-file
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.3/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.159.0/testing/asserts.ts';
import { Pool } from '../../interfaces/pool-v1-0.ts';
import { CoverPool } from '../../interfaces/cover-pool-v1-0.ts';
import { Loan } from '../../interfaces/loan-v1-0.ts';
import { LPToken } from '../../interfaces/lp-token.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";
import { TestUtils } from '../../interfaces/test-utils.ts';
import { Magic } from '../../interfaces/magic_real.ts';
import { Globals } from '../../interfaces/globals.ts';
import { SwapRouter } from '../../interfaces/swap-router.ts';
import { SupplierInterface } from '../../interfaces/supplier_interface.ts';
import { Payment } from '../../interfaces/payment.ts';
import { SupplierController } from '../../interfaces/supplier-controller.ts';
import { MagicCaller } from '../../interfaces/magic-caller.ts';

import * as util from "../util.ts";
import * as common from '../../interfaces/common.ts';

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
  XUSD_CONTRACT_SIMNET,
  SUPPLIER_CONTROLLER_0,
  COVER_VAULT
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Borrower creates a Loan on Pool 0. Delegate funds loan and Borrower drawdowns funds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2 ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
    let coverPoolProvider = accounts.get("wallet_3") as Account; // Cover_1
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1 ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);

    const LP_1_MAGIC_CALLER = "magic-caller-ST1";
    const BORROWER_MAGIC_CALLER = "magic-caller-ST3";
    
    const defaultExpiration = 500;
    const inboundFee = 10;
    const outboundFee = 10;
    const outboundBaseFee = 500;
    const inboundBaseFee = 500;
    const supplierFunds = 1_000_000_000_000;
    const poolId_0 = 0;
    const loan_0 = 0;
    const supplierId = 0;
    const outputIndex = 0;

    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    
    block = pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,100_000_000_000,100_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT, CP_REWARDS_TOKEN,XBTC,true);
    block = pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let MagicId_LP_1 = common.consumeUint(chain.callReadOnlyFn(`${LP_1.address}.${LP_1_MAGIC_CALLER}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());
    let MagicId_Borrower = common.consumeUint(chain.callReadOnlyFn(`${borrower_1.address}.${BORROWER_MAGIC_CALLER}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());
    
    let sendFundsPreimage1 = "00";
    let sendFundsHash1 = util.getHash(sendFundsPreimage1);
    let sentAmount_1 = 100_000_000_000;
    const factor = 1;
    let senderPubKeyLp1 = "000000000000000000000000000000000000000000000000000000000000000000";
    
    let commitmentTime1 = 1;
    
    let hash = util.getHash(preimage);
    let tx1 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_1, sentAmount_1);
    let txid1 = util.getTxId(tx1);
    let minToReceive = (sentAmount_1 * inboundFee / 10_000);
    
    block = chain.mineBlock([
      SupplierController.registerSupplier(recipient, inboundFee, outboundFee, outboundBaseFee, inboundBaseFee, supplierFunds, deployerWallet.address, deployerWallet.address, "supplier-controller-0"),
      SupplierInterface.updateLiquidity(chain.blockHeight, supplierFunds, deployerWallet.address),
      ...common.commitFunds(deployerWallet.address, preimage, tx1, txid1, sender, recipient, defaultExpiration, 0, MagicId_LP_1, supplierId, minToReceive, chain.blockHeight - 1, poolId_0, 0, factor, "00", LP_1.address, LP_1.address, LP_1_MAGIC_CALLER),
      MagicCaller.sendFundsToPool(txid1,preimage,LP_TOKEN,ZP_TOKEN,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,LP_1_MAGIC_CALLER),
    ]);
    assertEquals(chain.getAssetsMaps().assets[".lp-token.lp"][LP_1.address], sentAmount_1);

    // Loan is created by Borrower
    const loan_amount = 100_000_000;
    const payment_period = 1440;
    const num_payments = 9;
    const coll_ratio = 0;
    
    const apr = 300;

    // Borrower creates Loan 0 for Pool 0
    block = pool.createLoan(LP_TOKEN,poolId_0,loan_amount,XBTC,0,XBTC,apr,payment_period * num_payments,payment_period,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(loan_0,LP_TOKEN,poolId_0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_1.address);

    // Backend process where we update the liquidity in the supplier-interface.
    // End of backend process

    let prev = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"];

    // Loan drawdown funds from Pool 0 and send bitcoin to the address
    block = chain.mineBlock([SupplierInterface.drawdown(loan_0, LP_TOKEN, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId, SWAP_ROUTER,XBTC, borrower_1.address)]);
    // Should be equal to the amount sent and
    assertEquals(100_000_000_000 - (100_000_000 + 300_000), prev - chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.funding-vault"]);
    chain.mineEmptyBlock(10);
    // Finalizing drawdown, can be called by the backend to confirm transaction.
    // dummy values to set on the Bitcoin blockchain

    // first outbound swap Id
    const swapId = 0;

    // mine dummy
    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    const treasuryFeeBPs = common.consumeUint(globals["treasury-fee"]);
    const loanAmountWithoutTreasuryFee = loan_amount - (loan_amount * treasuryFeeBPs / 10_000);
    tx1 = util.generateP2PKHTx(HASH, loanAmountWithoutTreasuryFee);
    txid1 = util.getTxId(tx1);

    
    // Dummy transaction data, can be empty block header and block
    // Output in which we're interested for the transaction
    
    // after a drawdown has been called and the bitcoin transaction is in the Bitcoin blockchain, the backend calls finalize-drawdown
    block = chain.mineBlock([...common.finalizeDrawdown(loan_0, LP_TOKEN, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, swapId, chain.blockHeight - 1, borrower_1.address, deployerWallet.address)]);
    block.receipts[0].result.expectOk();

    // make first payment
    hash = util.getHash(preimage);
    const expiration = 500;
    const borrowerSwapperId = common.consumeUint(block.receipts[0].result.expectOk());
    
    let payment1 = common.consumeUint(Payment.getCurrentLoanPayment(chain, 0, borrower_1.address));
    minToReceive = Math.floor(payment1 * inboundFee / 10_000);
    
    block = chain.mineBlock([...common.makePaymentToLoan(deployerWallet.address,"00",defaultExpiration,MagicId_Borrower,payment1,sender,recipient,outputIndex,supplierId,minToReceive,chain.blockHeight - 1,poolId_0,loan_0,0, "01",PAYMENT,LP_TOKEN,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,ZP_TOKEN,SWAP_ROUTER,XBTC,SUPPLIER_CONTROLLER_0,borrower_1.address,deployerWallet.address,borrower_1.address,BORROWER_MAGIC_CALLER)]);
    block.receipts[2].result.expectOk().expectTuple()["reward"].expectUint(payment1);

    chain.mineEmptyBlock(common.consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...common.makePaymentToLoan(deployerWallet.address,"01",defaultExpiration,MagicId_Borrower,payment1,sender,recipient,outputIndex,supplierId,minToReceive,chain.blockHeight - 1,poolId_0,loan_0,0, "01",PAYMENT,LP_TOKEN,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,ZP_TOKEN,SWAP_ROUTER,XBTC,SUPPLIER_CONTROLLER_0,borrower_1.address,deployerWallet.address,borrower_1.address,BORROWER_MAGIC_CALLER)]);
    block.receipts[2].result.expectOk();

    chain.mineEmptyBlock(common.consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...common.makePaymentToLoan(deployerWallet.address,"02",defaultExpiration,MagicId_Borrower,payment1,sender,recipient,outputIndex,supplierId,minToReceive,chain.blockHeight - 1,poolId_0,loan_0,0, "01",PAYMENT,LP_TOKEN,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,ZP_TOKEN,SWAP_ROUTER,XBTC,SUPPLIER_CONTROLLER_0,borrower_1.address,deployerWallet.address,borrower_1.address,BORROWER_MAGIC_CALLER)]);
    block.receipts[2].result.expectOk();

    chain.mineEmptyBlock(common.consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...common.makePaymentToLoan(deployerWallet.address,"03",defaultExpiration,MagicId_Borrower,payment1,sender,recipient,outputIndex,supplierId,minToReceive,chain.blockHeight - 1,poolId_0,loan_0,0, "01",PAYMENT,LP_TOKEN,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,ZP_TOKEN,SWAP_ROUTER,XBTC,SUPPLIER_CONTROLLER_0,borrower_1.address,deployerWallet.address,borrower_1.address,BORROWER_MAGIC_CALLER)]);
    block.receipts[2].result.expectOk();

    chain.mineEmptyBlock(common.consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...common.makePaymentToLoan(deployerWallet.address,"04",defaultExpiration,MagicId_Borrower,payment1,sender,recipient,outputIndex,supplierId,minToReceive,chain.blockHeight - 1,poolId_0,loan_0,0, "01",PAYMENT,LP_TOKEN,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,ZP_TOKEN,SWAP_ROUTER,XBTC,SUPPLIER_CONTROLLER_0,borrower_1.address,deployerWallet.address,borrower_1.address,BORROWER_MAGIC_CALLER)]);
    block.receipts[2].result.expectOk();

    block = chain.mineBlock([Magic.initializeSwapper(LP_1.address)]);
    const LP1MagicId = common.consumeUint(block.receipts[0].result.expectOk());
    const LP_1_ADDRESS_HASH = "0000000000000000000000000000000000000001";

    block = chain.mineBlock([ SupplierInterface.withdrawRewards(P2PKH_VERSION, LP_1_ADDRESS_HASH, supplierId, LP_TOKEN, poolId_0, LIQUIDITY_VAULT, XBTC, LP_1.address) ]);
    let rewardsEarned = common.consumeUint(block.receipts[0].result.expectOk());
    block = chain.mineBlock([ ...common.finalizeOutboundTxs(LP_1_ADDRESS_HASH, rewardsEarned, 1, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address) ]);
  },
});

Clarinet.test({
  name: "LP can send funds when preimage is leaked, Borrower can make payment after preimage is leaked",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2 ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
    let coverPoolProvider = accounts.get("wallet_3") as Account; // Cover_1
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);

    const LP_1_MAGIC_CALLER = "magic-caller-ST1";
    const BORROWER_MAGIC_CALLER = "magic-caller-ST3";
    
    const defaultExpiration = 500;
    const inboundFee = 10;
    const outboundFee = 10;
    const outboundBaseFee = 500;
    const inboundBaseFee = 500;
    const supplierFunds = 1_000_000_000_000;
    const poolId_0 = 0;
    const loan_0 = 0;
    const supplierId = 0;
    const outputIndex = 0;

    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    
    block = pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,100_000_000_000,100_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT, CP_REWARDS_TOKEN,XBTC,true);
    block = pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let MagicId_LP_1 = common.consumeUint(chain.callReadOnlyFn(`${LP_1.address}.${LP_1_MAGIC_CALLER}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());
    let MagicId_Borrower = common.consumeUint(chain.callReadOnlyFn(`${borrower_1.address}.${BORROWER_MAGIC_CALLER}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());
    
    let sendFundsPreimage1 = "00";
    let sendFundsHash1 = util.getHash(sendFundsPreimage1);
    let sentAmount_1 = 100_000_000_000;
    const factor = 1;
    let senderPubKeyLp1 = "000000000000000000000000000000000000000000000000000000000000000000";
    
    let commitmentTime1 = 1;
    
    let hash = util.getHash(preimage);
    let tx1 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_1, sentAmount_1);
    let txid1 = util.getTxId(tx1);
    let minToReceive = (sentAmount_1 * inboundFee / 10_000);
    
    block = chain.mineBlock([
      SupplierController.registerSupplier(recipient, inboundFee, outboundFee, outboundBaseFee, inboundBaseFee, supplierFunds, deployerWallet.address, deployerWallet.address, "supplier-controller-0"),
      SupplierInterface.updateLiquidity(chain.blockHeight, supplierFunds, deployerWallet.address),
      ...common.commitFunds(deployerWallet.address, preimage, tx1, txid1, sender, recipient, defaultExpiration, 0, MagicId_LP_1, supplierId, minToReceive, chain.blockHeight - 1, poolId_0, 0, factor, "00", LP_1.address, LP_1.address, LP_1_MAGIC_CALLER),
      Magic.finalizeSwap(txid1, preimage, coverPoolProvider.address),
      MagicCaller.sendFundsToPool(txid1,preimage,LP_TOKEN,ZP_TOKEN,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,LP_1_MAGIC_CALLER),
      MagicCaller.sendFundsToPoolCompleted(txid1,LP_TOKEN,ZP_TOKEN,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,LP_1_MAGIC_CALLER),
    ]);
    assertEquals(chain.getAssetsMaps().assets[".lp-token.lp"][LP_1.address], sentAmount_1);
    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5.magic-caller-ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"]);
    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);

    // Loan is created by Borrower
    const loan_amount = 100_000_000;
    const payment_period = 1440;
    const num_payments = 9;
    const coll_ratio = 0;
    
    const apr = 300;

    // Borrower creates Loan 0 for Pool 0
    block = pool.createLoan(LP_TOKEN,poolId_0,loan_amount,XBTC,0,XBTC,apr,payment_period * num_payments,payment_period,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(loan_0,LP_TOKEN,poolId_0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_1.address);

    // Backend process where we update the liquidity in the supplier-interface.
    // End of backend process

    let prev = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"];

    // Loan drawdown funds from Pool 0 and send bitcoin to the address
    block = chain.mineBlock([SupplierInterface.drawdown(loan_0, LP_TOKEN, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId, SWAP_ROUTER,XBTC, borrower_1.address)]);
    // Should be equal to the amount sent and
    assertEquals(100_000_000_000 - (100_000_000 + 300_000), prev - chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.funding-vault"]);
    chain.mineEmptyBlock(10);
    // Finalizing drawdown, can be called by the backend to confirm transaction.
    // dummy values to set on the Bitcoin blockchain

    // first outbound swap Id
    const swapId = 0;

    // mine dummy
    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    const treasuryFeeBPs = common.consumeUint(globals["treasury-fee"]);
    const loanAmountWithoutTreasuryFee = loan_amount - (loan_amount * treasuryFeeBPs / 10_000);
    tx1 = util.generateP2PKHTx(HASH, loanAmountWithoutTreasuryFee);
    txid1 = util.getTxId(tx1);

    
    // Dummy transaction data, can be empty block header and block
    // Output in which we're interested for the transaction
    
    // after a drawdown has been called and the bitcoin transaction is in the Bitcoin blockchain, the backend calls finalize-drawdown
    block = chain.mineBlock([...common.finalizeDrawdown(loan_0, LP_TOKEN, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, swapId, chain.blockHeight - 1, borrower_1.address, deployerWallet.address)]);
    block.receipts[0].result.expectOk();

    // make first payment
    hash = util.getHash(preimage);
    const expiration = 500;
    const borrowerSwapperId = common.consumeUint(block.receipts[0].result.expectOk());
    
    let payment1 = common.consumeUint(Payment.getCurrentLoanPayment(chain, 0, borrower_1.address));
    minToReceive = Math.floor(payment1 * inboundFee / 10_000);


    hash = util.getHash(preimage);
    let tx2 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_Borrower, payment1);
    let txid2 = util.getTxId(tx2);

    block = chain.mineBlock([
      ...common.commitFunds(deployerWallet.address, preimage, tx2, txid2, sender, recipient, defaultExpiration, 0, MagicId_Borrower, supplierId, minToReceive, chain.blockHeight - 1, 0, loan_0, 0, "01", borrower_1.address, borrower_1.address, BORROWER_MAGIC_CALLER),
      Magic.finalizeSwap(txid2, preimage, coverPoolProvider.address),
      MagicCaller.makePaymentCompleted(txid2,PAYMENT,LP_TOKEN,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,ZP_TOKEN,SWAP_ROUTER,XBTC,SUPPLIER_CONTROLLER_0,deployerWallet.address,borrower_1.address,BORROWER_MAGIC_CALLER),
      // MagicCaller.
    ]);
    block.receipts[3].result.expectOk().expectTuple()["reward"].expectUint(payment1);
    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${borrower_1.address}.${BORROWER_MAGIC_CALLER}`]);
    // console.log(block);
    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);

  },
});

Clarinet.test({
  name: "Borrower can send test payments",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2 ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
    let coverPoolProvider = accounts.get("wallet_3") as Account; // Cover_1
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);

    const LP_1_MAGIC_CALLER = "magic-caller-ST1";
    const BORROWER_MAGIC_CALLER = "magic-caller-ST3";
    
    const defaultExpiration = 500;
    const inboundFee = 10;
    const outboundFee = 10;
    const outboundBaseFee = 500;
    const inboundBaseFee = 500;
    const supplierFunds = 1_000_000_000_000;
    const poolId_0 = 0;
    const loan_0 = 0;
    const supplierId = 0;
    const outputIndex = 0;

    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    
    block = pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,100_000_000_000,100_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT, CP_REWARDS_TOKEN,XBTC,true);
    block = pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let MagicId_LP_1 = common.consumeUint(chain.callReadOnlyFn(`${LP_1.address}.${LP_1_MAGIC_CALLER}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());
    let MagicId_Borrower = common.consumeUint(chain.callReadOnlyFn(`${borrower_1.address}.${BORROWER_MAGIC_CALLER}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());
    
    let sendFundsPreimage1 = "00";
    let sendFundsHash1 = util.getHash(sendFundsPreimage1);
    let sentAmount_1 = 100_000_000_000;
    const factor = 1;
    let senderPubKeyLp1 = "000000000000000000000000000000000000000000000000000000000000000000";
    
    let commitmentTime1 = 1;
    
    let hash = util.getHash(preimage);
    let tx1 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_1, sentAmount_1);
    let txid1 = util.getTxId(tx1);
    let minToReceive = (sentAmount_1 * inboundFee / 10_000);
    
    block = chain.mineBlock([
      SupplierController.registerSupplier(recipient, inboundFee, outboundFee, outboundBaseFee, inboundBaseFee, supplierFunds, deployerWallet.address, deployerWallet.address, "supplier-controller-0"),
      SupplierInterface.updateLiquidity(chain.blockHeight, supplierFunds, deployerWallet.address),
      ...common.commitFunds(deployerWallet.address, preimage, tx1, txid1, sender, recipient, defaultExpiration, 0, MagicId_LP_1, supplierId, minToReceive, chain.blockHeight - 1, poolId_0, 0, factor, "00", LP_1.address, LP_1.address, LP_1_MAGIC_CALLER),
      // Magic.finalizeSwap(txid1, preimage, coverPoolProvider.address),
      MagicCaller.sendFundsToPool(txid1,preimage,LP_TOKEN,ZP_TOKEN,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,LP_1_MAGIC_CALLER),
      // MagicCaller.sendFundsToPoolCompleted(txid1,LP_TOKEN,ZP_TOKEN,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,LP_1_MAGIC_CALLER),
    ]);
    assertEquals(chain.getAssetsMaps().assets[".lp-token.lp"][LP_1.address], sentAmount_1);

    // Loan is created by Borrower
    const loan_amount = 100_000_000;
    const payment_period = 1440;
    const num_payments = 9;
    const coll_ratio = 0;
    
    const apr = 300;

    // Borrower creates Loan 0 for Pool 0
    block = pool.createLoan(LP_TOKEN,poolId_0,loan_amount,XBTC,0,XBTC,apr,payment_period * num_payments,payment_period,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(loan_0,LP_TOKEN,poolId_0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_1.address);

    let prev = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"];

    block = chain.mineBlock([SupplierInterface.drawdown(loan_0, LP_TOKEN, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId, SWAP_ROUTER,XBTC, borrower_1.address)]);
    assertEquals(100_000_000_000 - (100_000_000 + 300_000), prev - chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.funding-vault"]);
    chain.mineEmptyBlock(10);
    const swapId = 0;

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    const treasuryFeeBPs = common.consumeUint(globals["treasury-fee"]);
    const loanAmountWithoutTreasuryFee = loan_amount - (loan_amount * treasuryFeeBPs / 10_000);
    tx1 = util.generateP2PKHTx(HASH, loanAmountWithoutTreasuryFee);
    txid1 = util.getTxId(tx1);

    block = chain.mineBlock([...common.finalizeDrawdown(loan_0, LP_TOKEN, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, swapId, chain.blockHeight - 1, borrower_1.address, deployerWallet.address)]);
    block.receipts[0].result.expectOk();

    // make first payment
    hash = util.getHash(preimage);
    const expiration = 500;
    const borrowerSwapperId = common.consumeUint(block.receipts[0].result.expectOk());
    
    let payment1 = common.consumeUint(Payment.getCurrentLoanPayment(chain, 0, borrower_1.address));
    minToReceive = Math.floor(payment1 * inboundFee / 10_000);

    hash = util.getHash(preimage);
    let tx = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_Borrower, 1000);
    let txid = util.getTxId(tx);

    block = chain.mineBlock([
      ...common.commitFunds(deployerWallet.address, preimage, tx, txid, sender, recipient, defaultExpiration, 0, MagicId_Borrower, supplierId, minToReceive, chain.blockHeight - 1, 0, loan_0, 0, "02", borrower_1.address, borrower_1.address, BORROWER_MAGIC_CALLER),
      Magic.finalizeSwap(txid, preimage, coverPoolProvider.address),
      MagicCaller.makePaymentVerify(txid,preimage,PAYMENT,LP_TOKEN,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,ZP_TOKEN,SWAP_ROUTER,XBTC,SUPPLIER_CONTROLLER_0,deployerWallet.address,borrower_1.address,BORROWER_MAGIC_CALLER),
      MagicCaller.makePaymentVerifyCompleted(txid,PAYMENT,LP_TOKEN,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,ZP_TOKEN,SWAP_ROUTER,XBTC,SUPPLIER_CONTROLLER_0,deployerWallet.address,borrower_1.address,BORROWER_MAGIC_CALLER),
    ]);
    block.receipts[4].result.expectOk().expectUint(1000);
    // block.receipts[3].result.expectOk().expectTuple()["reward"].expectUint(payment1);
    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${borrower_1.address}.${BORROWER_MAGIC_CALLER}`]);
    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);
    // console.log(block);
    tx = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_Borrower, payment1 - 1000);
    txid = util.getTxId(tx);

    block = chain.mineBlock([
      ...common.commitFunds(deployerWallet.address, preimage, tx, txid, sender, recipient, defaultExpiration, 0, MagicId_Borrower, supplierId, minToReceive, chain.blockHeight - 1, 0, loan_0, 0, "01", borrower_1.address, borrower_1.address, BORROWER_MAGIC_CALLER),
      MagicCaller.makePaymentLoan(txid,preimage,PAYMENT,LP_TOKEN,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,ZP_TOKEN,SWAP_ROUTER,XBTC,SUPPLIER_CONTROLLER_0,deployerWallet.address,borrower_1.address,BORROWER_MAGIC_CALLER),
    ]);
    // console.log(block);
    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);
    block.receipts[2].result.expectOk().expectTuple()["reward"].expectUint(payment1);

  },
});

Clarinet.test({
  name: "Borrower can send test payments",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2 ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
    let coverPoolProvider = accounts.get("wallet_3") as Account; // Cover_1
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);

    const LP_1_MAGIC_CALLER = "magic-caller-ST1";
    const BORROWER_MAGIC_CALLER = "magic-caller-ST3";
    
    const defaultExpiration = 500;
    const inboundFee = 10;
    const outboundFee = 10;
    const outboundBaseFee = 500;
    const inboundBaseFee = 500;
    const supplierFunds = 1_000_000_000_000;
    const poolId_0 = 0;
    const loan_0 = 0;
    const supplierId = 0;
    const outputIndex = 0;

    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    
    block = pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,100_000_000_000,100_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT, CP_REWARDS_TOKEN,XBTC,true);
    block = pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let MagicId_LP_1 = common.consumeUint(chain.callReadOnlyFn(`${LP_1.address}.${LP_1_MAGIC_CALLER}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());
    let MagicId_Borrower = common.consumeUint(chain.callReadOnlyFn(`${borrower_1.address}.${BORROWER_MAGIC_CALLER}`,`get-swapper-id`,[],deployerWallet.address).result.expectSome());
    
    let sendFundsPreimage1 = "00";
    let sendFundsHash1 = util.getHash(sendFundsPreimage1);
    let sentAmount_1 = 100_000_000_000;
    const factor = 1;
    let senderPubKeyLp1 = "000000000000000000000000000000000000000000000000000000000000000000";
    
    let commitmentTime1 = 1;
    
    let hash = util.getHash(preimage);
    let tx1 = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_LP_1, sentAmount_1);
    let txid1 = util.getTxId(tx1);
    let minToReceive = (sentAmount_1 * inboundFee / 10_000);
    
    block = chain.mineBlock([
      SupplierController.registerSupplier(recipient, inboundFee, outboundFee, outboundBaseFee, inboundBaseFee, supplierFunds, deployerWallet.address, deployerWallet.address, "supplier-controller-0"),
      SupplierInterface.updateLiquidity(chain.blockHeight, supplierFunds, deployerWallet.address),
      ...common.commitFunds(deployerWallet.address, preimage, tx1, txid1, sender, recipient, defaultExpiration, 0, MagicId_LP_1, supplierId, minToReceive, chain.blockHeight - 1, poolId_0, 0, factor, "00", LP_1.address, LP_1.address, LP_1_MAGIC_CALLER),
      // Magic.finalizeSwap(txid1, preimage, coverPoolProvider.address),
      MagicCaller.sendFundsToPool(txid1,preimage,LP_TOKEN,ZP_TOKEN,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,LP_1_MAGIC_CALLER),
      // MagicCaller.sendFundsToPoolCompleted(txid1,LP_TOKEN,ZP_TOKEN,LIQUIDITY_VAULT,XBTC,REWARDS_CALC,SUPPLIER_CONTROLLER_0,deployerWallet.address,LP_1.address,LP_1_MAGIC_CALLER),
    ]);
    assertEquals(chain.getAssetsMaps().assets[".lp-token.lp"][LP_1.address], sentAmount_1);

    // Loan is created by Borrower
    const loan_amount = 100_000_000;
    const payment_period = 1440;
    const num_payments = 9;
    const coll_ratio = 0;
    
    const apr = 300;

    // Borrower creates Loan 0 for Pool 0
    block = pool.createLoan(LP_TOKEN,poolId_0,loan_amount,XBTC,0,XBTC,apr,payment_period * num_payments,payment_period,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(loan_0,LP_TOKEN,poolId_0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_1.address);

    let prev = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"];

    block = chain.mineBlock([SupplierInterface.drawdown(loan_0, LP_TOKEN, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId, SWAP_ROUTER,XBTC, borrower_1.address)]);
    assertEquals(100_000_000_000 - (100_000_000 + 300_000), prev - chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.funding-vault"]);
    chain.mineEmptyBlock(10);
    const swapId = 0;

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    const treasuryFeeBPs = common.consumeUint(globals["treasury-fee"]);
    const loanAmountWithoutTreasuryFee = loan_amount - (loan_amount * treasuryFeeBPs / 10_000);
    tx1 = util.generateP2PKHTx(HASH, loanAmountWithoutTreasuryFee);
    txid1 = util.getTxId(tx1);

    block = chain.mineBlock([...common.finalizeDrawdown(loan_0, LP_TOKEN, poolId_0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, swapId, chain.blockHeight - 1, borrower_1.address, deployerWallet.address)]);
    
    const REQUESTED_AMOUNT = loan_amount / 2;
    const RESIDUAL = loan_amount - REQUESTED_AMOUNT;
    block = loan.requestRollover(0, null, REQUESTED_AMOUNT, null, null, 0, XBTC, borrower_1.address);
    block = pool.acceptRollover(0, LP_TOKEN, 0, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, delegate_1.address);

    hash = util.getHash(preimage);
    let tx = util.generateP2SHTx(sender, recipient, defaultExpiration, hash, MagicId_Borrower, RESIDUAL);
    let txid = util.getTxId(tx);
    minToReceive =  Math.floor(RESIDUAL * inboundFee / 10_000);

    block = chain.mineBlock([
      ...common.commitFunds(deployerWallet.address, preimage, tx, txid, sender, recipient, defaultExpiration, 0, MagicId_Borrower, supplierId, minToReceive, chain.blockHeight - 1, 0, loan_0, 0, "03", borrower_1.address, borrower_1.address, BORROWER_MAGIC_CALLER),
      MagicCaller.makeResidualPayment(txid,preimage,LP_TOKEN,LIQUIDITY_VAULT,XBTC,SUPPLIER_CONTROLLER_0,deployerWallet.address,borrower_1.address,BORROWER_MAGIC_CALLER),
    ]);
    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);
    block = pool.completeRolloverNoWithdrawal(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, SWAP_ROUTER, XBTC, borrower_1.address);
    // console.log(block);

  },
});

// Clarinet.test({
//   name: "Borrower can create a Loan on Pool 0. Delegate funds loan and Borrower cannot drawn funds unless using allowed address by Pool Delegate",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployerWallet = accounts.get("deployer") as Account;
//     let LP_1 = accounts.get("wallet_1") as Account; // LP_1
//     let LP_2 = accounts.get("wallet_2") as Account; // LP_2
//     let coverPoolProvider = accounts.get("wallet_3") as Account; // Cover_1
//     let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
//     let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

//     let assetMaps = chain.getAssetsMaps();
//     let pool = new Pool(chain, deployerWallet);
//     let loan = new Loan(chain, deployerWallet);
//     let coverPool = new CoverPool(chain, deployerWallet);

//     let block = runBootstrap(chain, deployerWallet);
//     // block = Onboarding.onboardUser(chain, borrower_1.address, deployerWallet.address);
//     block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
//     // loan.addBorrower(borrower_1.address, deployerWallet.address);
    
//     pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    
//     pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    
//     block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN, ZEST_TOKEN, 0, 1_000_000_000_000n, 10, REWARDS_CALC, coverPoolProvider.address);

//     chain.mineEmptyBlock(10);
    
//     block = chain.mineBlock([
//       ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
//       Magic.initializeSwapper(LP_1.address),
//       ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,14),
//       Magic.initializeSwapper(LP_2.address),
//       ...sendFundsP2SHTxs(deployerWallet.address,0,LP_2.address,sender,recipient,500,1,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,14),
//     ]);

//     // Loan is created by Borrower
//     block = pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
//     // Loan is funded by Pool Delegate
//     block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT, FUNDING_VAULT,XBTC, delegate_1.address);
//     // Loan drawdown funds from Pool 0 and send bitcoin to the address

//     chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);

//     let prev = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"];

//     // try first
//     block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, "0000000000000000000000000000000000000001", 0, SWAP_ROUTER,XBTC, borrower_1.address)]);
//     block.receipts[0].result.expectErr().expectUint(1007);
//     block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, "0000000000000000000000000000000000000001", deployerWallet.address);

//     // try again with added address
//     block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, borrower_1.address)]);

//     assertEquals(100_000_000 - 300000, prev - chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.funding-vault"]);
//     chain.mineEmptyBlock(10);
//     // Finalizing drawdown, can be called by anyone to confirm transaction.
//     block = chain.mineBlock([
//       ...finalizeOutboundTxs(HASH, 99700000, 0, 28, borrower_1.address, deployerWallet.address)
//     ]);
//     block.receipts[1].result.expectOk();
//   },
// });

// Clarinet.test({
//   name: "Borrower can make payments for the loan",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployerWallet = accounts.get("deployer") as Account;
//     let LP_1 = accounts.get("wallet_1") as Account; // LP_1
//     let LP_2 = accounts.get("wallet_2") as Account; // LP_2
//     let coverPoolProvider = accounts.get("wallet_3") as Account; // Cover_1
//     let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
//     let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

//     let assetMaps = chain.getAssetsMaps();
//     let pool = new Pool(chain, deployerWallet);
//     let loan = new Loan(chain, deployerWallet);
//     let coverPool = new CoverPool(chain, deployerWallet);

//     let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    
//     pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
//     pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
//     chain.mineEmptyBlock(10);
    
//     block = chain.mineBlock([
//       ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
//       Magic.initializeSwapper(LP_1.address),
//       ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,14),
//       Magic.initializeSwapper(LP_2.address),
//       ...sendFundsP2SHTxs(deployerWallet.address,0,LP_2.address,sender,recipient,500,1,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,14),
//     ]);
//     const supplierId1 = (consumeUint(block.receipts[1].result.expectOk()));
//     const loanAmount = 100_000_000;

//     block = pool.createLoan(LP_TOKEN,0,loanAmount,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    
//     block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_1.address);
//     chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
//     block = chain.mineBlock([
//       SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, borrower_1.address)
//     ]);

//     block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, chain.blockHeight - 1, borrower_1.address, deployerWallet.address)]);

//     chain.mineEmptyBlock(1300);

//     let fee = Number(Magic.getSupplier(chain, 0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());
//     // STARTS HERE
//     // initializes Borrower_1 as a swapper
//     block = chain.mineBlock([ Magic.initializeSwapper(borrower_1.address) ]);

//     // make first payment
//     const hash = getHash(preimage);
//     const expiration = 500;
//     const borrowerSwapperId = consumeUint(block.receipts[0].result.expectOk());
//     const loanId = 0;
//     const poolId = 0;
//     // TODO: generate payment from loan data
//     const payment = 82191;
//     const tx1 = generateP2SHTx(sender, recipient, expiration, hash, borrowerSwapperId, payment);
//     const txId1 = getTxId(tx1);

//     block = chain.mineBlock([ Tx.contractCall("test-utils","set-mined", [ types.buff(Buffer.from(txId1, "hex")) ], deployerWallet.address) ]);

//     const bitcoinBlock = { header: "", height: chain.blockHeight - 1 };
//     const prevBlocks = [] as string[];
//     const proof = { "tx-index": 0, "hashes": [], "tree-depth": 0 }

//     // Output in which we're interested for the transaction
//     const outputIndex = 0;
//     // the 10 percent is  based on the inbound fee of supplier-1
//     let minToReceive = Math.floor(payment * 10 / 10_000);

//     // sending funds by validating transaction.
//     block = chain.mineBlock([
//       Tx.contractCall(
//         "supplier-interface",
//         "send-funds",
//         [
//           // Data used by the Magic Magic contract to prove that the Bitcoin transaction happened
//           types.tuple({
//             header: types.buff(Buffer.from(bitcoinBlock.header, "hex")),
//             height: types.uint(bitcoinBlock.height)
//           }),
//           types.list(prevBlocks.map((val) => types.buff(Buffer.from(val, "hex")))),
//           types.buff(Buffer.from(tx1, "hex")),
//           types.tuple({
//             "tx-index": types.uint(proof['tx-index']),
//             "hashes": types.list(proof.hashes.map(val => types.buff(Buffer.from(val, "hex")))),
//             "tree-depth": types.uint(proof['tree-depth'])
//           }),
//           types.uint(outputIndex),
//           // end of Bitcoin Proof
//           types.buff(Buffer.from(sender, "hex")),                           // Public key of the LP_1 sending the Bitcoin. Used to recover the funds if the sent bitcoin fails.
//           types.buff(Buffer.from(recipient, "hex")),                        // Public key used by the Magic that is the recipient of Bitcoin.
//           types.buff(Buffer.from(getExpiration(expiration), "hex")),        // Expiration time in Little Endian and padded to 2 bytes (string length of 4). Ex for 500: '01F4'
//           types.buff(Buffer.from(hash, "hex")),                             // Hash of the preimage used for the HTLC
//           types.buff(Buffer.from(swapperBuff(borrowerSwapperId), "hex")),   // Swapper id in Little ending padded to 4 bytes (string length of 8). Ex for u0: "00000000"
//           types.uint(supplierId1),                                          // Supplier id in uint
//           types.uint(minToReceive),                                         // Minimum amount that has to be received. Is the amount of the sent funds minus the fees of the supplier.
//         ],
//         borrower_1.address
//       )
//     ]);
    
//     block = chain.mineBlock([
//       Tx.contractCall(
//         "supplier-interface",
//         "make-payment",
//         [
//           types.buff(Buffer.from(txId1,"hex")),
//           types.buff(Buffer.from(preimage,"hex")),
//           types.uint(loanId),
//           types.principal(PAYMENT),
//           types.principal(LP_TOKEN),
//           types.principal(LIQUIDITY_VAULT),
//           types.uint(poolId),
//           types.principal(CP_TOKEN),
//           types.principal(CP_REWARDS_TOKEN),
//           types.principal(ZP_TOKEN),
//           types.principal(SWAP_ROUTER),
//           types.principal(XBTC),
//         ],
//         borrower_1.address
//       )
//     ]);

//     // mine a payment period amount of time
//     // chain.mineEmptyBlock(12960 / 1440);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
//     // // Borrower makes a 2nd payment to the loan. No need for initializing

//     const preimage2 = "01";
//     const hash2 = getHash(preimage2);
//     const tx2 = generateP2SHTx(sender, recipient, expiration, hash2, borrowerSwapperId, payment);
//     const txId2 = getTxId(tx2);
//     const bitcoinBlock2 = { header: "", height: chain.blockHeight - 1 };

//     block = chain.mineBlock([ Tx.contractCall("test-utils","set-mined", [ types.buff(Buffer.from(txId2, "hex")) ], deployerWallet.address) ]);

//     // Make a payment without registering as a swapper, already registered.
//     block = chain.mineBlock([
//       Tx.contractCall(
//         "supplier-interface",
//         "send-funds",
//         [
//           // Data used by the Magic Magic contract to prove that the Bitcoin transaction happened
//           types.tuple({
//             header: types.buff(Buffer.from(bitcoinBlock2.header, "hex")),
//             height: types.uint(bitcoinBlock2.height)
//           }),
//           types.list(prevBlocks.map((val) => types.buff(Buffer.from(val, "hex")))),
//           types.buff(Buffer.from(tx2, "hex")),
//           types.tuple({
//             "tx-index": types.uint(proof['tx-index']),
//             "hashes": types.list(proof.hashes.map(val => types.buff(Buffer.from(val, "hex")))),
//             "tree-depth": types.uint(proof['tree-depth'])
//           }),
//           types.uint(outputIndex),
//           // end of Bitcoin Proof
//           types.buff(Buffer.from(sender, "hex")),                           // Public key of the LP_1 sending the Bitcoin. Used to recover the funds if the sent bitcoin fails.
//           types.buff(Buffer.from(recipient, "hex")),                        // Public key used by the Magic that is the recipient of Bitcoin.
//           types.buff(Buffer.from(getExpiration(expiration), "hex")),        // Expiration time in Little Endian and padded to 2 bytes (string length of 4). Ex for 500: '01F4'
//           types.buff(Buffer.from(hash2, "hex")),                             // Hash of the preimage used for the HTLC
//           types.buff(Buffer.from(swapperBuff(borrowerSwapperId), "hex")),   // Swapper id in Little ending padded to 4 bytes (string length of 8). Ex for u0: "00000000"
//           types.uint(supplierId1),                                          // Supplier id in uint
//           types.uint(minToReceive),                                         // Minimum amount that has to be received. Is the amount of the sent funds minus the fees of the supplier.
//         ],
//         borrower_1.address
//       ),
//       Tx.contractCall(
//         "supplier-interface",
//         "make-payment",
//         [
//           types.buff(Buffer.from(txId2,"hex")),
//           types.buff(Buffer.from(preimage2,"hex")),
//           types.uint(loanId),
//           types.principal(PAYMENT),
//           types.principal(LP_TOKEN),
//           types.principal(LIQUIDITY_VAULT),
//           types.uint(poolId),
//           types.principal(CP_TOKEN),
//           types.principal(CP_REWARDS_TOKEN),
//           types.principal(ZP_TOKEN),
//           types.principal(SWAP_ROUTER),
//           types.principal(XBTC),
//         ],
//         borrower_1.address
//       )
//     ]);

//     // chain.mineEmptyBlock(12960 / 1440);
//     // perform all the payments necessary before the loan matures
//     // shortened version of the previous payment calls
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
//     block = chain.mineBlock([
//       ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,2,payment,"02",0,minToReceive,0, PAYMENT, LP_TOKEN, LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
//     ]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
//     block = chain.mineBlock([
//       ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,2,payment,"03",0,minToReceive,0, PAYMENT, LP_TOKEN, LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
//     ]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
//     block = chain.mineBlock([
//       ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,2,payment,"04",0,minToReceive,0, PAYMENT, LP_TOKEN, LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
//     ]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
//     block = chain.mineBlock([
//       ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,2,payment,"05",0,minToReceive,0, PAYMENT, LP_TOKEN, LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
//     ]);
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
//     block = chain.mineBlock([
//       ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,2,payment,"06",0,minToReceive,0, PAYMENT, LP_TOKEN, LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
//     ]);
//     // last payment
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
//     block = chain.mineBlock([
//       ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,2,payment,"07",0,minToReceive,0, PAYMENT, LP_TOKEN, LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
//     ]);
//     // make repayment
//     // last payment has to be the amount of the loan the last rewards payment
//     chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
//     minToReceive = Math.floor((payment + loanAmount) * 10 / 10_000);
//     block = chain.mineBlock([
//       ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,2,loanAmount + payment,"08",0,minToReceive,0, PAYMENT, LP_TOKEN, LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
//     ]);
//     // console.log(loan.getLoanData(0).result.expectTuple());
//   },
// });

// Clarinet.test({
//   name: "Borrower can make an early repayment of the loan",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployerWallet = accounts.get("deployer") as Account;
//     let LP_1 = accounts.get("wallet_1") as Account; // LP_1
//     let LP_2 = accounts.get("wallet_2") as Account; // LP_2
//     let coverPoolProvider = accounts.get("wallet_3") as Account; // Cover_1
//     let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
//     let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

//     let assetMaps = chain.getAssetsMaps();
//     let pool = new Pool(chain, deployerWallet);
//     let loan = new Loan(chain, deployerWallet);
//     let coverPool = new CoverPool(chain, deployerWallet);

//     let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    
//     pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
//     pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
//     chain.mineEmptyBlock(10);
    
//     block = chain.mineBlock([
//       ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
//       Magic.initializeSwapper(LP_1.address),
//       ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,chain.blockHeight - 1),
//       Magic.initializeSwapper(LP_2.address),
//       ...sendFundsP2SHTxs(deployerWallet.address,0,LP_2.address,sender,recipient,500,1,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,chain.blockHeight - 1),
//     ]);
//     const supplierId1 = (consumeUint(block.receipts[1].result.expectOk()));
//     const loanAmount = 100_000_000;

//     block = pool.createLoan(LP_TOKEN,0,loanAmount,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    
//     block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_1.address);
//     chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
//     block = chain.mineBlock([
//       SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, borrower_1.address)
//     ]);

//     block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, chain.blockHeight - 1, borrower_1.address, deployerWallet.address)]);

//     chain.mineEmptyBlock(1300);

//     let fee = Number(Magic.getSupplier(chain, 0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

//     block = chain.mineBlock([ Magic.initializeSwapper(borrower_1.address) ]);

//     const preimage00 = "00";
//     const expiration = 500;
//     const borrowerSwapperId = consumeUint(block.receipts[0].result.expectOk());
//     const loanId = 0;
//     const poolId = 0;

//     // Output in which we're interested for the transaction
//     // const outputIndex = 0;
//     // the 10 percent is  based on the inbound fee of supplier-1
//     let earlyPayment = (consumeUint(Payment.getEarlyRepaymentAmount(chain, loanId, borrower_1.address)));
//     const payment = earlyPayment + loanAmount;
//     let minToReceive = Math.floor(payment * 10 / 10_000);

//     const hash = getHash(preimage00);
//     const tx1 = generateP2SHTx(sender, recipient, expiration, hash, borrowerSwapperId, payment);
//     const txId1 = getTxId(tx1);
//     const outputIndex = 0;

//     const bitcoinBlock = { header: "", height: chain.blockHeight - 1 };
//     const prevBlocks = [] as string[];
//     const proof = { "tx-index": 0, "hashes": [], "tree-depth": 0 }

//     // set Bitcoin transaction in the brackground
//     block = chain.mineBlock([ Tx.contractCall("test-utils","set-mined", [ types.buff(Buffer.from(txId1, "hex")) ], deployerWallet.address) ]);

//     // Make a payment without registering as a swapper, already registered.
//     block = chain.mineBlock([
//       Tx.contractCall(
//         "supplier-interface",
//         "send-funds",
//         [
//           // Data used by the Magic Magic contract to prove that the Bitcoin transaction happened
//           types.tuple({
//             header: types.buff(Buffer.from(bitcoinBlock.header, "hex")),
//             height: types.uint(bitcoinBlock.height)
//           }),
//           types.list(prevBlocks.map((val) => types.buff(Buffer.from(val, "hex")))),
//           types.buff(Buffer.from(tx1, "hex")),
//           types.tuple({
//             "tx-index": types.uint(proof['tx-index']),
//             "hashes": types.list(proof.hashes.map(val => types.buff(Buffer.from(val, "hex")))),
//             "tree-depth": types.uint(proof['tree-depth'])
//           }),
//           types.uint(outputIndex),
//           // end of Bitcoin Proof
//           types.buff(Buffer.from(sender, "hex")),                           // Public key of the LP_1 sending the Bitcoin. Used to recover the funds if the sent bitcoin fails.
//           types.buff(Buffer.from(recipient, "hex")),                        // Public key used by the Magic that is the recipient of Bitcoin.
//           types.buff(Buffer.from(getExpiration(expiration), "hex")),        // Expiration time in Little Endian and padded to 2 bytes (string length of 4). Ex for 500: '01F4'
//           types.buff(Buffer.from(hash, "hex")),                             // Hash of the preimage used for the HTLC
//           types.buff(Buffer.from(swapperBuff(borrowerSwapperId), "hex")),   // Swapper id in Little ending padded to 4 bytes (string length of 8). Ex for u0: "00000000"
//           types.uint(supplierId1),                                          // Supplier id in uint
//           types.uint(minToReceive),                                         // Minimum amount that has to be received. Is the amount of the sent funds minus the fees of the supplier.
//         ],
//         borrower_1.address
//       ),
//       Tx.contractCall(
//         "supplier-interface",
//         "make-full-payment",
//         [
//           types.buff(Buffer.from(txId1,"hex")),
//           types.buff(Buffer.from(preimage00,"hex")),
//           types.uint(loanId),
//           types.principal(PAYMENT),
//           types.principal(LP_TOKEN),
//           types.principal(LIQUIDITY_VAULT),
//           types.uint(poolId),
//           types.principal(CP_TOKEN),
//           types.principal(CP_REWARDS_TOKEN),
//           types.principal(ZP_TOKEN),
//           types.principal(SWAP_ROUTER),
//           types.principal(XBTC),
//         ],
//         borrower_1.address
//       )
//     ]);
//     // loan is Matured and repaid
//   },
// });

// Clarinet.test({
//   name: "Borrower can withdraw collateral if value of collateral increases",
//   async fn(chain: Chain, accounts: Map<string, Account>) {
//     let deployerWallet = accounts.get("deployer") as Account;
//     let LP_1 = accounts.get("wallet_1") as Account; // LP_1
//     let LP_2 = accounts.get("wallet_2") as Account; // LP_2
//     let cover = accounts.get("wallet_3") as Account; // Cover_1
//     let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
//     let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

//     let assetMaps = chain.getAssetsMaps();
//     let pool = new Pool(chain, deployerWallet);
//     let loan = new Loan(chain, deployerWallet);
//     let coverPool = new CoverPool(chain, deployerWallet);

//     let block = runBootstrap(chain, deployerWallet);
//     block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);
//     block = Globals.addCollateralContract(chain, XUSD_CONTRACT_SIMNET, deployerWallet.address);

//     pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
//     pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
//     pool.enableCover(LP_TOKEN, CP_TOKEN, 0, wallet_7.address);
//     block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, 0, 100_000_000_000n, 10, REWARDS_CALC, cover.address);

//     let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
//     let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

//     block = chain.mineBlock([
//       Magic.initializeSwapper(LP_1.address),
//       ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,chain.blockHeight - 1)
//     ]);

//     const LOAN_AMOUNT = 100_000_000;

//     block = pool.createLoan(LP_TOKEN,0,LOAN_AMOUNT,XBTC,1000,XUSD_CONTRACT_SIMNET,300,5760,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
//     block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);
//     block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
//     block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

//     chain.mineEmptyBlock(10);

//     let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
//     let totalInvestorFees = getBP(LOAN_AMOUNT, consumeUint(globals["treasury-fee"]) + consumeUint(globals["investor-fee"]));

//     block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

//     chain.mineEmptyBlock(40);

//     let pairValue = SwapRouter.getPairValue(chain, SWAP_ROUTER, XBTC,XUSD_CONTRACT_SIMNET,deployerWallet.address);
//     block = SwapRouter.setPairValue(chain,SWAP_ROUTER,XBTC,XUSD_CONTRACT_SIMNET,consumeUint(pairValue.expectSome()) * 5000 / 10000,deployerWallet.address);

//     block = chain.mineBlock([
//       Tx.contractCall(
//         `loan-v1-0`,
//         "withdraw-collateral-loan",
//         [
//           types.uint(0),
//           types.uint(98634500000),
//           types.principal(SWAP_ROUTER),
//           types.principal(XUSD_CONTRACT_SIMNET),
//           types.principal(XBTC),
//           types.principal(COLL_VAULT)
//         ],
//         wallet_8.address
//       )
//     ])
//   },
// });
