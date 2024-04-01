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
  SWAP_ROUTER,
  ZEST_TOKEN,
  CP_REWARDS_TOKEN
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
    block = Globals.onboardUserAddress(chain, borrower_1.address, deployerWallet.address);
    // loan.addBorrower(borrower_1.address, deployerWallet.address);
    
    pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,XBTC,true);
    coverPool.sendFunds(CP_TOKEN,CP_REWARDS_TOKEN, ZEST_TOKEN, 0, 2_100_000_000_000_000n, 10, REWARDS_CALC, coverPoolProvider.address);

    pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    chain.mineEmptyBlock(10);

    chain.mineBlock([
      ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
    ])

    let fee = Number(Magic.getSupplier(chain, 0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());
    
    block = chain.mineBlock([
      Magic.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,14),
      Magic.initializeSwapper(LP_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_2.address,sender,recipient,500,1,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,14),
    ]);

    // STARTS HERE

    // Loan is created by Borrower
    block = pool.createLoan(LP_TOKEN,0,100_000_000,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    // Loan is funded by Pool Delegate
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT, XBTC, delegate_1.address);
    // Loan drawdown funds from Pool 0 and send bitcoin to the address

    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);

    let prev = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"];

    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, LIQUIDITY_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, borrower_1.address)
    ]);
    block = chain.mineBlock([
      ...finalizeOutboundTxs(HASH, 99000000, 0, 28, borrower_1.address, deployerWallet.address)
    ]);
    // Should be equal to the amount sent and 
    assertEquals(100_000_000 - 450000, prev - chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"]);
    chain.mineEmptyBlock(10);
    // Finalizing drawdown, can be called by anyone to confirm transaction.
    block.receipts[1].result.expectOk();
  },
});

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

    // let block = runBootstrap(chain, deployerWallet);
    // bootstrapApprovedContracts(chain, deployerWallet);
    // Onboarding.onboardUser(chain, wallet_8.address, deployerWallet.address);
    let block = Globals.onboardUserAddress(chain, wallet_8.address, deployerWallet.address);
    // loan.addBorrower(wallet_8.address, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    chain.mineEmptyBlock(58000);

    chain.mineBlock([
      ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
    ])

    let fee = Number(Magic.getSupplier(chain, 0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * fee / 10_000,1,57945)
    ]);

    pool.createLoan(LP_TOKEN,0,100_000_000,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,XBTC,wallet_7.address);
    
    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, LIQUIDITY_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99000000, 0, 28, wallet_8.address, deployerWallet.address)]);

    // assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][wallet_7.address], 50000);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.protocol-treasury"], 500000 + 50000);
    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.funding-vault"], 0);

  },
});
