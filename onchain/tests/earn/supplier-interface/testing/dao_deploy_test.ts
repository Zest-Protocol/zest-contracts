// deno-lint-ignore-file
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.5.4/index.ts';
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
  makePaymentTxs,
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
  name: "Emergency execute to update late fee on payment contract",
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

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    let block = chain.mineBlock([Payment.setContractOwner(DAO, deployerWallet.address)]);

    block = (chain.mineBlock([EmergencyExecute.executiveAction(`${deployerWallet.address}.zgp003-update-payment-fee`, deployerWallet.address)]));
    block = (chain.mineBlock([EmergencyExecute.executiveAction(`${deployerWallet.address}.zgp003-update-payment-fee`, LP_1.address)]));
    block = (chain.mineBlock([EmergencyExecute.executiveAction(`${deployerWallet.address}.zgp003-update-payment-fee`, LP_2.address)]));
    
    block.receipts[0].result.expectOk().expectUint(3);
    block.receipts[0].events[1].contract_event.value.expectTuple().payload.expectTuple().fee.expectUint(20);
  },
});

Clarinet.test({
  name: "Emergency cannot execute to update late fee on payment contract if pool is Ready",
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

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    let block = chain.mineBlock([Payment.setContractOwner(DAO, deployerWallet.address)]);

    block = (chain.mineBlock([EmergencyExecute.executiveAction(`${deployerWallet.address}.zgp003-update-payment-fee`, deployerWallet.address)]));
    block = (chain.mineBlock([EmergencyExecute.executiveAction(`${deployerWallet.address}.zgp003-update-payment-fee`, LP_1.address)]));
    block = (chain.mineBlock([EmergencyExecute.executiveAction(`${deployerWallet.address}.zgp003-update-payment-fee`, LP_2.address)]));
    
    block.receipts[0].result.expectErr().expectUint(5007);
  },
});

Clarinet.test({
  name: "Emergency execute can add a pool.",
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

    let block = pool.setContractOwner(DAO, deployerWallet.address);
    block = Globals.setContractOwner(chain, DAO, deployerWallet.address);
    // console.log(block);

    block = (chain.mineBlock([EmergencyExecute.executiveAction(`${deployerWallet.address}.zgp004-add-pool-admin`, deployerWallet.address)]));
    block = (chain.mineBlock([EmergencyExecute.executiveAction(`${deployerWallet.address}.zgp004-add-pool-admin`, LP_1.address)]));
    block = (chain.mineBlock([EmergencyExecute.executiveAction(`${deployerWallet.address}.zgp004-add-pool-admin`, LP_2.address)]));
    // console.log(block.receipts[0].events);

    block = (chain.mineBlock([EmergencyExecute.executiveAction(`${deployerWallet.address}.zgp005-create-pool-1`, deployerWallet.address)]));
    block = (chain.mineBlock([EmergencyExecute.executiveAction(`${deployerWallet.address}.zgp005-create-pool-1`, LP_1.address)]));
    block = (chain.mineBlock([EmergencyExecute.executiveAction(`${deployerWallet.address}.zgp005-create-pool-1`, LP_2.address)]));
    // console.log(block);
    // console.log(block.receipts[0].events);
  },
});
