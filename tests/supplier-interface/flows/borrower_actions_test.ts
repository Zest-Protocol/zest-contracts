// deno-lint-ignore-file
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.31.1/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { Pool } from '../../interfaces/pool-v1-0.ts';
import { CoverPool } from '../../interfaces/cover-pool-v1-0.ts';
import { Loan } from '../../interfaces/loan-v1-0.ts';
import { LPToken } from '../../interfaces/lp-token.ts';
import { Buffer } from "https://deno.land/std@0.110.0/node/buffer.ts";
import { TestUtils } from '../../interfaces/test-utils.ts';
import { Bridge } from '../../interfaces/bridge_real.ts';
import { Globals } from '../../interfaces/globals.ts';
import { SwapRouter } from '../../interfaces/swap-router.ts';
import { SupplierInterface } from '../../interfaces/supplier_interface.ts';
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
  consumeUint,
  makePaymentTxs,
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
  XUSD_CONTRACT_SIMNET,
  COVER_VAULT
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Borrower can create a Loan on Pool 0. Delegate funds loan and Borrower drawdowns funds",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2
    let coverPoolProvider = accounts.get("wallet_3") as Account; // Cover_1
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);

    let block = runBootstrap(chain, deployerWallet);
    // block = Onboarding.onboardUser(chain, borrower_1.address, deployerWallet.address);
    block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    // loan.addBorrower(borrower_1.address, deployerWallet.address);
    
    block = pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT, CP_REWARDS_TOKEN,XBTC,true);
    
    block = pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN, ZEST_TOKEN, 0, 1_000_000_000_000n, 10, REWARDS_CALC, coverPoolProvider.address);
    // console.log(block);

    chain.mineEmptyBlock(10);
    
    block = chain.mineBlock([
      ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,14),
      Bridge.initializeSwapper(LP_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_2.address,sender,recipient,500,1,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,14),
    ]);

    // STARTS HERE

    // Loan is created by Borrower
    block = pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT, FUNDING_VAULT,XBTC, delegate_1.address);
    // Loan drawdown funds from Pool 0 and send bitcoin to the address

    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);

    let prev = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"];

    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, borrower_1.address)
    ]);
    // Should be equal to the amount sent and
    assertEquals(100_000_000 - 300000, prev - chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.funding-vault"]);
    chain.mineEmptyBlock(10);
    // Finalizing drawdown, can be called by anyone to confirm transaction.
    block = chain.mineBlock([
      ...finalizeOutboundTxs(HASH, 99700000, 0, 28, borrower_1.address, deployerWallet.address)
    ]);
    block.receipts[1].result.expectOk();
  },
});

Clarinet.test({
  name: "Borrower can create a Loan on Pool 0. Delegate funds loan and Borrower cannot drawn funds unless using allowed address by Pool Delegate",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2
    let coverPoolProvider = accounts.get("wallet_3") as Account; // Cover_1
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);

    let block = runBootstrap(chain, deployerWallet);
    // block = Onboarding.onboardUser(chain, borrower_1.address, deployerWallet.address);
    block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    // loan.addBorrower(borrower_1.address, deployerWallet.address);
    
    pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    
    pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN, ZEST_TOKEN, 0, 1_000_000_000_000n, 10, REWARDS_CALC, coverPoolProvider.address);

    chain.mineEmptyBlock(10);
    
    block = chain.mineBlock([
      ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,14),
      Bridge.initializeSwapper(LP_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_2.address,sender,recipient,500,1,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,14),
    ]);

    // Loan is created by Borrower
    block = pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT, FUNDING_VAULT,XBTC, delegate_1.address);
    // Loan drawdown funds from Pool 0 and send bitcoin to the address

    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);

    let prev = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"];

    // try first
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, "0000000000000000000000000000000000000001", 0, SWAP_ROUTER,XBTC, borrower_1.address)]);
    block.receipts[0].result.expectErr().expectUint(1007);
    block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, "0000000000000000000000000000000000000001", deployerWallet.address);

    // try again with added address
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, borrower_1.address)]);

    assertEquals(100_000_000 - 300000, prev - chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.funding-vault"]);
    chain.mineEmptyBlock(10);
    // Finalizing drawdown, can be called by anyone to confirm transaction.
    block = chain.mineBlock([
      ...finalizeOutboundTxs(HASH, 99700000, 0, 28, borrower_1.address, deployerWallet.address)
    ]);
    block.receipts[1].result.expectOk();
  },
});

Clarinet.test({
  name: "Borrower can make payments for the loan",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2
    let coverPoolProvider = accounts.get("wallet_3") as Account; // Cover_1
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);

    let block = runBootstrap(chain, deployerWallet);
    // block = Onboarding.onboardUser(chain, borrower_1.address, deployerWallet.address);
    block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    // loan.addBorrower(borrower_1.address, deployerWallet.address);
    // initContractOwners(chain, deployerWallet);
    
    pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    chain.mineEmptyBlock(10);
    
    block = chain.mineBlock([
      ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,14),
      Bridge.initializeSwapper(LP_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_2.address,sender,recipient,500,1,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,14),
    ]);

    block = pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_1.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, borrower_1.address)
    ]);
    // let result = SupplierInterface.getCurrentLiquidity(chain, deployerWallet.address);
    // console.log(block.receipts[0].events);
    chain.mineEmptyBlock(10);
    block = chain.mineBlock([
      ...finalizeOutboundTxs(HASH, 99000000, 0, 28, borrower_1.address, deployerWallet.address)
    ]);
    chain.mineEmptyBlock(1300);


    let fee = Number(Bridge.getSupplier(chain, 0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());
    // STARTS HERE
    // Borrower makes first payment
    block = chain.mineBlock([
      // initializes Borrower_1 as a swapper
      Bridge.initializeSwapper(borrower_1.address),
      // makes a payment to the loan through the Magic Bridge Contract
      ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,2,82191,"00",0,Math.floor(82191 * fee / 10000),0, PAYMENT, LP_TOKEN, LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,1330, XBTC)
    ]);

    // // mine a payment period amount of time
    chain.mineEmptyBlock(12960 / 1440);

    // Borrower makes a 2nd payment to the loan. No need for initializing
    block = chain.mineBlock([
      ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,2,82191,"01",0,Math.floor(82191 * fee / 10000),0, PAYMENT, LP_TOKEN, LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,1340, XBTC)
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

    chain.mineEmptyBlock(40);

    block = loan.withdrawCollateralLoan(0, 1, SWAP_ROUTER, XUSD_CONTRACT_SIMNET, XBTC, COLL_VAULT, wallet_8.address);
    block.receipts[0].result.expectErr().expectUint(4017);

    let pairValue = SwapRouter.getPairValue(chain, SWAP_ROUTER, XBTC,XUSD_CONTRACT_SIMNET,deployerWallet.address);
    block = SwapRouter.setPairValue(chain,SWAP_ROUTER,XBTC,XUSD_CONTRACT_SIMNET,consumeUint(pairValue.expectSome()) * 5000 / 10000,deployerWallet.address);

    block = loan.withdrawCollateralLoan(0, 98634500001, SWAP_ROUTER, XUSD_CONTRACT_SIMNET, XBTC, COLL_VAULT, wallet_8.address);
    block.receipts[0].result.expectErr().expectUint(4022);

    block = loan.withdrawCollateralLoan(0, 98634500000, SWAP_ROUTER, XUSD_CONTRACT_SIMNET, XBTC, COLL_VAULT, wallet_8.address);
    block.receipts[0].result.expectOk().expectUint(98634500000);
  },
});
