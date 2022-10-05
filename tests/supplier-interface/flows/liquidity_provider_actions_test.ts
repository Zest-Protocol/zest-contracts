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
  ZEST_TOKEN,
  CP_REWARDS_TOKEN,
  COVER_VAULT,
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Liquidity providers can send funds to Liquidity Pool 0 and to the Cover Pool",
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
    
    // Pool is created by Deployer. Pool Delegate is assigned.
    block = pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    block = pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    
    // Pool 0 is finalized so that funds can be sent to it.
    pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    // Cover Pool Provider sends funds to the cover pool of Pool 0.
    block = pool.enableCover(LP_TOKEN, CP_TOKEN, 0, delegate_1.address);
    let xbtcBefore = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][coverPoolProvider.address];
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN, XBTC, 0, 1_000_000_000_000n, 10, REWARDS_CALC, coverPoolProvider.address);
    let xbtcAfter = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"][coverPoolProvider.address];
    assertEquals(xbtcAfter, xbtcBefore - 1_000_000_000_000);

    chain.mineEmptyBlock(10);
    
    // LP_1 and LP_2 sends funds to the Pool.
    block = chain.mineBlock([
      // registerSupplierTxs is not used in Testnet only for Devnet.
      ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
      // This applies to testnet
      // LP_1 is initialized
      Bridge.initializeSwapper(LP_1.address),
      // LP_1 sends funds
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,14),
      // LP_2 is initialized
      Bridge.initializeSwapper(LP_2.address),
      // LP_1 sends funds
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_2.address,sender,recipient,500,1,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,14),
    ]);
  },
});

Clarinet.test({
  name: "Liquidity providers can send funds to Liquidity Pool 0 and to the Cover Pool",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2
    let coverPoolProvider = accounts.get("wallet_3") as Account; // Cover_1
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let delegate_2 = accounts.get("wallet_9") as Account; // Delegate_2
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);

    // let block = runBootstrap(chain, deployerWallet);
    
    let block = pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);

    
    pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,ZEST_TOKEN, 0, 2_100_000_000_000_000n, 10, REWARDS_CALC, coverPoolProvider.address);

    chain.mineEmptyBlock(10);
    
    block = chain.mineBlock([
      ...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000),
      Bridge.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,14),
      Bridge.initializeSwapper(LP_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_2.address,sender,recipient,500,1,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,14),
    ]);
  },
});
