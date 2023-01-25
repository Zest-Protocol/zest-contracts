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
import { Magic } from '../../interfaces/magic_real.ts';
import { Globals } from '../../interfaces/globals.ts';
import { SupplierInterface } from '../../interfaces/supplier_interface.ts';
import { LiquidityVault } from '../../interfaces/liquidity-vault.ts';
import { CollVault } from '../../interfaces/coll-vault.ts';
import { CoverVault } from '../../interfaces/cover-vault.ts';
import { FundingVault } from '../../interfaces/funding-vault.ts';
import { Payment } from '../../interfaces/payment.ts';

import { 
  getHash,
  getReverseTxId,
  getTxId,
  getExpiration,
  swapperBuff,
  generateP2PKHTx,
  generateP2SHTx,
  padTo,
  numberToHex,
  toLittleEndian,
  generateP2PKHScript,
  generateRandomHexString,
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
  consumeUint,
  getBP,
  finalizeDrawdown,
  makePaymentTxs,
  finalizeOutboundTxs,
  finalizeRollover,
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
  DAYS_PER_YEAR,
  DAYS_PER_WEEK,
  CP_REWARDS_TOKEN,
  COVER_VAULT,
  XUSD_CONTRACT_SIMNET,
  SWAP_ROUTER,
} from "../config.ts";


const MAX_MATURITY_LENGTH = ONE_DAY * DAYS_PER_YEAR * 3; // 3 years

Clarinet.test({
  name: "Add funds to cover flow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2
    let LP_3 = accounts.get("wallet_3") as Account; // LP_3
    let LP_4 = accounts.get("wallet_4") as Account; // LP_4
    let cover_1 = accounts.get("wallet_5") as Account; // Cover_1
    let cover_2 = accounts.get("wallet_6") as Account; // Cover_2
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let delegate_2 = accounts.get("wallet_8") as Account; // Delegate_2
    let delegate_3 = accounts.get("wallet_9") as Account; // Delegate_3
    let delegate_4 = accounts.get("wallet_10") as Account; // Delegate_4
    let borrower_1 = accounts.get("wallet_11") as Account; // borrower_1
    let borrower_2 = accounts.get("wallet_12") as Account; // borrower_2
    let borrower_3 = accounts.get("wallet_13") as Account; // borrower_2
    let cover_provider_1 = accounts.get("wallet_14") as Account; // cover_provider_1
    let cover_provider_2 = accounts.get("wallet_15") as Account; // cover_provider_2

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);
    let LpToken = new LPToken(chain, deployerWallet);
    let CpToken = new CPToken(chain, deployerWallet);
    let lv  = new LiquidityVault(chain, LIQUIDITY_VAULT, deployerWallet);
    let fv  = new LiquidityVault(chain, FUNDING_VAULT, deployerWallet);

    const poolId0 = 0;

    // Start Set up
    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    block = pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    block = pool.enableCover(LP_TOKEN, CP_TOKEN, 0, delegate_1.address);
    // End Set up

    // Start Flow
    // COVER POOL HAS A LIMIT OF 10_000_000_000
    block = chain.mineBlock([
      Tx.contractCall(
        'cover-pool-v1-0',
        'send-funds',
        [
          types.principal(`${deployerWallet.address}.cp-token`),                            // Cover pool contract to account for Zest rewards
          types.principal(`${deployerWallet.address}.cover-vault`),                         // Cover Vault contract to hold the funds of the cover pool
          types.principal(`${deployerWallet.address}.cp-rewards-token`),                    // Contract to account for xBTC rewards to cover pool providers
          types.principal(`${deployerWallet.address}.Wrapped-Bitcoin`),                     // The asset used for loans in the pool
          types.uint(poolId0),                                                              // Pool ID
          types.uint(6_000_000_000n),                                                       // amount commited to the pool by the cover provider
          types.uint(1),                                                                    // number of cycles committed
          types.principal(`${deployerWallet.address}.rewards-calc`),                        // Contract containing the logic of how Zest rewards are calculated.
          types.principal(cover_provider_1.address),                                        // Address of the user sending the funds (the caller in this case)
        ],
        cover_provider_1.address
      )
    ]);
  },
});

Clarinet.test({
  name: "Withdraw funds from cover pool flow",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2
    let LP_3 = accounts.get("wallet_3") as Account; // LP_3
    let LP_4 = accounts.get("wallet_4") as Account; // LP_4
    let cover_1 = accounts.get("wallet_5") as Account; // Cover_1
    let cover_2 = accounts.get("wallet_6") as Account; // Cover_2
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let delegate_2 = accounts.get("wallet_8") as Account; // Delegate_2
    let delegate_3 = accounts.get("wallet_9") as Account; // Delegate_3
    let delegate_4 = accounts.get("wallet_10") as Account; // Delegate_4
    let borrower_1 = accounts.get("wallet_11") as Account; // borrower_1
    let borrower_2 = accounts.get("wallet_12") as Account; // borrower_2
    let borrower_3 = accounts.get("wallet_13") as Account; // borrower_2
    let cover_provider_1 = accounts.get("wallet_14") as Account; // cover_provider_1
    let cover_provider_2 = accounts.get("wallet_15") as Account; // cover_provider_2

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);
    let LpToken = new LPToken(chain, deployerWallet);
    let CpToken = new CPToken(chain, deployerWallet);
    let lv  = new LiquidityVault(chain, LIQUIDITY_VAULT, deployerWallet);
    let fv  = new LiquidityVault(chain, FUNDING_VAULT, deployerWallet);

    const poolId0 = 0;
    const commitmentTime = 1;
    const amountCommitted = 6_000_000_000n;

    // Start Set up
    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);
    block = pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    block = pool.enableCover(LP_TOKEN, CP_TOKEN, 0, delegate_1.address);
    

    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, poolId0, amountCommitted, commitmentTime, REWARDS_CALC, cover_provider_1.address);

    let result = coverPool.getPool(poolId0);
    // We have to wait until the time committed has passed
    let commitmentBlockTime = consumeUint(result["cycle-length"]) * commitmentTime;
    chain.mineEmptyBlock(commitmentBlockTime);
    // End Set up

    // Flow Starts here
    // Signal that we want to start a withdrawal
    block = chain.mineBlock([
      Tx.contractCall(
        'cover-pool-v1-0',
        'signal-withdrawal',
        [
          types.principal(`${deployerWallet.address}.cp-token`),                            // Cover pool contract to account for Zest rewards
          types.uint(poolId0),                                                              // Pool ID
          types.uint(amountCommitted),                                                      // amount that the cover pool provider wishes to withdraw
        ],
        cover_provider_1.address
      )
    ]);

    // Get time for staker cooldown period time
    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let stakerCooldownPeriod = (consumeUint(globals["staker-cooldown-period"]));

    // wait until time has passed.
    chain.mineEmptyBlock(stakerCooldownPeriod);

    block = chain.mineBlock([
      Tx.contractCall(
        'cover-pool-v1-0',
        'withdraw',
        [
          types.principal(`${deployerWallet.address}.cp-token`),                            // Cover pool contract to account for Zest rewards
          types.principal(`${deployerWallet.address}.cp-rewards-token`),                    // Contract to account for xBTC rewards to cover pool providers
          types.principal(`${deployerWallet.address}.Wrapped-Bitcoin`),                     // The asset used for loans in the pool
          types.uint(poolId0),                                                              // Pool ID
          types.uint(amountCommitted),                                                      // amount that the caller will withdraw
          types.principal(`${deployerWallet.address}.cover-vault`),                         // Cover Vault contract to hold the funds of the cover pool
        ],
        cover_provider_1.address
      )
    ]);
    block.receipts[0].result.expectOk();
  },
});
