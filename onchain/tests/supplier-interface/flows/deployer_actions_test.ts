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
import { delay } from 'https://deno.land/x/delay@v0.2.0/mod.ts';

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
  name: "Data dump.",
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

    let HASH_LP3 = "0000000000000000000000000000000000000001";
    const HASH_borrower2 = "0000000000000000000000000000000000000002";
    const HASH_borrower3 = "0000000000000000000000000000000000000003";

    // Deployer onboards user whose address is of type P2PKH and whose hash is HASH (0x0000000000000000000000000000000000000000)
    let block = chain.mineBlock([
      Tx.contractCall(
        "globals",
        "onboard-user-address",
        [
          types.principal(borrower_1.address),            // onboarded borrower address
          types.buff(Buffer.from(P2PKH_VERSION, "hex")),  // type of address
          types.buff(Buffer.from(HASH, "hex"))            // hash inside of the Bitcoin address
        ],
        deployerWallet.address
      ),
      Tx.contractCall(
        "globals",
        "onboard-user-address",
        [
          types.principal(borrower_2.address),            // onboarded borrower address
          types.buff(Buffer.from(P2PKH_VERSION, "hex")),  // type of address
          types.buff(Buffer.from(HASH_borrower2, "hex"))            // hash inside of the Bitcoin address
        ],
        deployerWallet.address
      ),
      Tx.contractCall(
        "globals",
        "onboard-user-address",
        [
          types.principal(borrower_3.address),            // onboarded borrower address
          types.buff(Buffer.from(P2PKH_VERSION, "hex")),  // type of address
          types.buff(Buffer.from(HASH_borrower3, "hex"))            // hash inside of the Bitcoin address
        ],
        deployerWallet.address
      ),
    ]);
    block = Globals.onboardUserAddress(chain, LP_3.address, P2PKH_VERSION, HASH_LP3, deployerWallet.address);
    
    // The deployer after having reviewed the requirements sent by the pool delegate (off-chain), creates a pool dedicated to it
    block = chain.mineBlock([
      Tx.contractCall(
        'pool-v1-0',
        'create-pool',
        [
          types.principal(delegate_1.address),                              // Principal of the pool delegate
          types.principal(`${deployerWallet.address}.lp-token`),            // Liquidity Providers Token used to account for the xBTC rewards of the pool
          types.principal(`${deployerWallet.address}.zest-reward-dist`),    // Token for the Liquidity Providers to account for Zest rewards
          types.principal(`${deployerWallet.address}.payment-fixed`),       // Contract containing the logic of payments in the pool.
          types.principal(`${deployerWallet.address}.rewards-calc`),        // Contract containing the logic of how Zest rewards are calculated.
          types.uint(1000),                                                 // Fee for the cover pool providers in Basis Points
          types.uint(1000),                                                 // Fee for the liquidity pool providers in Basis Points
          types.uint(16_000_000_000),                                       // Liquidity cap of the Liquidity Pool
          types.uint(16_000_000_000),                                       // Liquidity cap of the Cover Pool
          types.uint(1),                                                    // Minimum number of cycles that have to be commited.
          types.uint(MAX_MATURITY_LENGTH),                                  // Max length before maturity of loans that can be created on this pool.
          types.principal(`${deployerWallet.address}.liquidity-vault-v1-0`),// Liquidity Vault contract holding funds of the Liquidity Pool.
          types.principal(`${deployerWallet.address}.cp-token`),            // Cover pool contract to account for Zest rewards
          types.principal(`${deployerWallet.address}.cover-vault`),         // Cover Vault contract to hold the funds of the cover pool
          types.principal(`${deployerWallet.address}.cp-rewards-token`),    // Contract to account for xBTC rewards to cover pool providers
          types.principal(`${deployerWallet.address}.Wrapped-Bitcoin`),     // The asset used for loans in the pool
          types.bool(true),                                                 // Whether the pool is public
        ],
        deployerWallet.address                                      // Has to be deployed by the deployer in the beginning.
      )
    ]);

    // Create pool 1
    block = chain.mineBlock([
      Tx.contractCall(
        'pool-v1-0',
        'create-pool',
        [
          types.principal(delegate_2.address),                              // Principal of the pool delegate
          types.principal(`${deployerWallet.address}.lp-token`),            // Liquidity Providers Token used to account for the xBTC rewards of the pool
          types.principal(`${deployerWallet.address}.zest-reward-dist`),    // Token for the Liquidity Providers to account for Zest rewards
          types.principal(`${deployerWallet.address}.payment-fixed`),       // Contract containing the logic of payments in the pool.
          types.principal(`${deployerWallet.address}.rewards-calc`),        // Contract containing the logic of how Zest rewards are calculated.
          types.uint(2000),                                                 // Fee for the cover pool providers in Basis Points
          types.uint(3000),                                                 // Fee for the liquidity pool providers in Basis Points
          types.uint(20_000_000_000),                                       // Liquidity cap of the Liquidity Pool
          types.uint(20_000_000_000),                                       // Liquidity cap of the Cover Pool
          types.uint(2),                                                    // Minimum number of cycles that have to be commited.
          types.uint(MAX_MATURITY_LENGTH / 2),                              // Half the previous
          types.principal(`${deployerWallet.address}.liquidity-vault-v1-0`),// Liquidity Vault contract holding funds of the Liquidity Pool.
          types.principal(`${deployerWallet.address}.cp-token`),            // Cover pool contract to account for Zest rewards
          types.principal(`${deployerWallet.address}.cover-vault`),         // Cover Vault contract to hold the funds of the cover pool
          types.principal(`${deployerWallet.address}.cp-rewards-token`),    // Contract to account for xBTC rewards to cover pool providers
          types.principal(`${deployerWallet.address}.Wrapped-Bitcoin`),     // The asset used for loans in the pool
          types.bool(true),                                                 // Whether the pool is private or public
        ],
        deployerWallet.address                                      // Has to be deployed by the deployer in the beginning.
      )
    ]);

    // Create pool 2
    block = chain.mineBlock([
      Tx.contractCall(
        'pool-v1-0',
        'create-pool',
        [
          types.principal(delegate_3.address),                              // Principal of the pool delegate
          types.principal(`${deployerWallet.address}.lp-token`),
          types.principal(`${deployerWallet.address}.zest-reward-dist`),
          types.principal(`${deployerWallet.address}.payment-fixed`),
          types.principal(`${deployerWallet.address}.rewards-calc`),
          types.uint(1000),
          types.uint(4000),
          types.uint(100_000_000_000),
          types.uint(100_000_000_000),
          types.uint(8),
          types.uint(MAX_MATURITY_LENGTH),
          types.principal(`${deployerWallet.address}.liquidity-vault-v1-0`),
          types.principal(`${deployerWallet.address}.cp-token`),
          types.principal(`${deployerWallet.address}.cover-vault`),
          types.principal(`${deployerWallet.address}.cp-rewards-token`),
          types.principal(`${deployerWallet.address}.Wrapped-Bitcoin`),
          types.bool(false),                                                // Is not Public, so false
        ],
        deployerWallet.address                                      // Has to be deployed by the deployer in the beginning.
      )
    ]);

    // Create Pool 3
    block = pool.createPool(delegate_4.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,14_000_000_000,14_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);

    block = pool.addLiquidityProvider(2, LP_3.address, delegate_3.address);

    // Deploy supplier
    const inboundFee = 10;
    const outboundFee = 10;
    block = chain.mineBlock([
      Tx.contractCall(
        "Wrapped-Bitcoin",
        "transfer",
        [
          types.uint(1_000_000_000_000),
          types.principal(deployerWallet.address),
          types.principal(`${deployerWallet.address}.supplier-interface`),
          types.none(),
        ],
        deployerWallet.address
      ),
      Tx.contractCall(
        "supplier-interface",
        'register-supplier',
        [
          types.buff(Buffer.from(recipient, "hex")),
          types.some(types.int(inboundFee)),
          types.some(types.int(outboundFee)),
          types.int(500),
          types.int(500),
          types.ascii("supplier-1"),
          types.uint(1_000_000_000_000),
        ],
        deployerWallet.address
      ),
      SupplierInterface.updateLiquidity(chain.blockHeight, 1_000_000_000_000, deployerWallet.address)
    ]);

    // Pool has to be finalized by the pool delegate so that liquidity providers can send funds. Final step of deployment of a pool.
    block = chain.mineBlock([
      Tx.contractCall(
        "pool-v1-0",
        "finalize-pool",
        [
          types.principal(`${deployerWallet.address}.lp-token`),          // Liquidity Providers Token used to account for the xBTC rewards of the pool
          types.principal(`${deployerWallet.address}.zest-reward-dist`),  // Token for the Liquidity Providers to account for Zest rewards
          types.principal(`${deployerWallet.address}.cp-token`),          // Cover pool contract to account for Zest rewards
          types.uint(0)                                                   // Token ID (Pool ID) of the pool that the Pool Delegate wants to finalize
        ],
        delegate_1.address
      ),
      Tx.contractCall(
        "pool-v1-0",
        "finalize-pool",
        [
          types.principal(`${deployerWallet.address}.lp-token`),
          types.principal(`${deployerWallet.address}.zest-reward-dist`),
          types.principal(`${deployerWallet.address}.cp-token`),
          types.uint(1)
        ],
        delegate_2.address
      ),
      Tx.contractCall(
        "pool-v1-0",
        "finalize-pool",
        [
          types.principal(`${deployerWallet.address}.lp-token`),
          types.principal(`${deployerWallet.address}.zest-reward-dist`),
          types.principal(`${deployerWallet.address}.cp-token`),
          types.uint(2)
        ],
        delegate_3.address
      ),
      Tx.contractCall(
        "pool-v1-0",
        "finalize-pool",
        [
          types.principal(`${deployerWallet.address}.lp-token`),
          types.principal(`${deployerWallet.address}.zest-reward-dist`),
          types.principal(`${deployerWallet.address}.cp-token`),
          types.uint(3)
        ],
        delegate_4.address
      )
    ]);
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk();
    block.receipts[2].result.expectOk();

    // START Sending Funds.
    const supplierId0 = 0;
    const defaultExpiration = 500;
    const defaultOutputIndex = 0;
    const poolId0 = 0;
    const poolId1 = 1;
    const poolId2 = 2;
    const poolId3 = 3;

    block = pool.enableCover(LP_TOKEN, CP_TOKEN, poolId0, delegate_1.address);
    block = pool.enableCover(LP_TOKEN, CP_TOKEN, poolId3, delegate_4.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, poolId0, 6_000_000_000n, 10, REWARDS_CALC, cover_provider_1.address);
    block = coverPool.sendFunds(CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC, poolId3, 5_000_000_000n, 10, REWARDS_CALC, cover_provider_2.address);

    // has to be udpated with block height
    let bitcoinBlock = { header: "", height: chain.blockHeight - 1 };

    // Default transaction Data. Is empty for simnet
    const prevBlocks = [] as string[];
    const proof = { "tx-index": 0, "hashes": [], "tree-depth": 0 }

    block = chain.mineBlock([ Tx.contractCall( "magic-protocol", 'initialize-swapper', [], LP_1.address) ]);
    let MagicId_LP_1 = (consumeUint(block.receipts[0].result.expectOk()));

    let sendFundsPreimage1 = "00";
    let sendFundsHash1 = getHash(sendFundsPreimage1);
    let sentAmount_1 = 11_000_000_000;
    let senderPubKeyLp1 = "000000000000000000000000000000000000000000000000000000000000000000";
    let txSendFunds1 = generateP2SHTx(senderPubKeyLp1, recipient, defaultExpiration, sendFundsHash1, MagicId_LP_1, sentAmount_1);
    let txIdSendFunds1 = getTxId(txSendFunds1);
    let mintToReceive = (sentAmount_1 * inboundFee / 10_000);

    let commitmentTime1 = 1;

    block = chain.mineBlock([ Tx.contractCall("test-utils","set-mined", [ types.buff(Buffer.from(txIdSendFunds1, "hex")) ], deployerWallet.address) ]);

    // sending funds by validating transaction.
    block = chain.mineBlock([
      Tx.contractCall(
        "supplier-interface",
        "send-funds",
        [
          // Data used by the Magic Magic contract to prove that the Bitcoin transaction happened
          types.tuple({
            header: types.buff(Buffer.from(bitcoinBlock.header, "hex")),
            height: types.uint(bitcoinBlock.height)
          }),
          types.list(prevBlocks.map((val) => types.buff(Buffer.from(val, "hex")))),
          types.buff(Buffer.from(txSendFunds1, "hex")),
          types.tuple({
            "tx-index": types.uint(proof['tx-index']),
            "hashes": types.list(proof.hashes.map(val => types.buff(Buffer.from(val, "hex")))),
            "tree-depth": types.uint(proof['tree-depth'])
          }),
          types.uint(defaultOutputIndex),
          // end of Bitcoin Proof
          types.buff(Buffer.from(senderPubKeyLp1, "hex")),                  // Public key of the LP_1 sending the Bitcoin. Used to recover the funds if the sent bitcoin fails.
          types.buff(Buffer.from(recipient, "hex")),                        // Public key used by the Magic that is the recipient of Bitcoin.
          types.buff(Buffer.from(getExpiration(defaultExpiration), "hex")), // Expiration time in Little Endian and padded to 2 bytes (string length of 4). Ex for 500: '01F4'
          types.buff(Buffer.from(sendFundsHash1, "hex")),                             // Hash of the preimage used for the HTLC
          types.buff(Buffer.from(swapperBuff(MagicId_LP_1), "hex")),       // Swapper id in Little ending padded to 4 bytes (string length of 8). Ex for u0: "00000000"
          types.uint(supplierId0),                                          // Supplier id in uint
          types.uint(mintToReceive),                                        // Minimum amount that has to be received. Is the amount of the sent funds minus the fees of the supplier.
        ],
        LP_1.address
      ),
      Tx.contractCall(
        "supplier-interface",
        "send-funds-finalize",
        [
          types.buff(Buffer.from(txIdSendFunds1,"hex")),
          types.buff(Buffer.from(sendFundsPreimage1,"hex")),
          types.uint(commitmentTime1),
          types.principal(`${deployerWallet.address}.lp-token`),
          types.uint(poolId0),
          types.principal(`${deployerWallet.address}.zest-reward-dist`),
          types.principal(`${deployerWallet.address}.liquidity-vault-v1-0`),
          types.principal(`${deployerWallet.address}.Wrapped-Bitcoin`),
          types.principal(`${deployerWallet.address}.rewards-calc`),
        ],
        LP_1.address
      )
    ]);

    const commitmentTime2 = 2;
    const commitmentTime3 = 8;
    const commitmentTime4 = 1;
    const commitmentTime5 = 1;
    const commitmentTime6 = 1;
    const MagicId_LP_2 = 1;
    const MagicId_LP_3 = 2;
    const MagicId_LP_4 = 3;
    const sentAmount_2 = 5_000_000_000;
    const sentAmount_3 = 20_000_000_000;
    const sentAmount_4 = 2_000_000_000;
    const sentAmount_5 = 7_000_000_000;
    const sentAmount_6 = 7_000_000_000;

    const senderPubKeyLp2 = "000000000000000000000000000000000000000000000000000000000000000001";
    const senderPubKeyLp3 = "000000000000000000000000000000000000000000000000000000000000000002";
    const senderPubKeyLp4 = "000000000000000000000000000000000000000000000000000000000000000003";

    let sendFundsPreimage2 = "02";
    let sendFundsPreimage3 = "03";
    let sendFundsPreimage4 = "04";
    let sendFundsPreimage5 = "05";

    block = chain.mineBlock([
      Magic.initializeSwapper(LP_2.address),
      Magic.initializeSwapper(LP_3.address),
      Magic.initializeSwapper(LP_4.address),
      ...sendFundsP2SHTxs(deployerWallet.address,poolId0,LP_2.address,senderPubKeyLp2,recipient,defaultExpiration,MagicId_LP_2,sentAmount_2,sendFundsPreimage2,supplierId0,sentAmount_2 * inboundFee / 10_000,commitmentTime2,chain.blockHeight - 1),
      ...sendFundsP2SHTxs(deployerWallet.address,poolId1,LP_2.address,senderPubKeyLp2,recipient,defaultExpiration,MagicId_LP_2,sentAmount_2,sendFundsPreimage3,supplierId0,sentAmount_2 * inboundFee / 10_000,commitmentTime2,chain.blockHeight - 1),
      ...sendFundsP2SHTxs(deployerWallet.address,poolId2,LP_3.address,senderPubKeyLp3,recipient,defaultExpiration,MagicId_LP_3,sentAmount_3,sendFundsPreimage4,supplierId0,sentAmount_3 * inboundFee / 10_000,commitmentTime3,chain.blockHeight - 1),
      ...sendFundsP2SHTxs(deployerWallet.address,poolId0,LP_4.address,senderPubKeyLp4,recipient,defaultExpiration,MagicId_LP_4,sentAmount_4,sendFundsPreimage4,supplierId0,sentAmount_4 * inboundFee / 10_000,commitmentTime4,chain.blockHeight - 1),
      ...sendFundsP2SHTxs(deployerWallet.address,poolId3,LP_1.address,senderPubKeyLp1,recipient,defaultExpiration,MagicId_LP_1,sentAmount_5,generateRandomHexString(20),supplierId0,sentAmount_5 * inboundFee / 10_000,commitmentTime5,chain.blockHeight - 1),
      ...sendFundsP2SHTxs(deployerWallet.address,poolId3,LP_2.address,senderPubKeyLp2,recipient,defaultExpiration,MagicId_LP_2,sentAmount_6,generateRandomHexString(20),supplierId0,sentAmount_6 * inboundFee / 10_000,commitmentTime6,chain.blockHeight - 1),
    ]);

    const loanAmount0 = 100_000_000;
    const loanAmount1 = 500_000_000;
    const loanAmount2 = 5_000_000_000;
    const loanAmount3 = 10_00_000_000;
    const loanAmount4 = 10_00_000_000;
    const loanAmount5 = 10_00_000_000;
    const loanAmount6 = 10_00_000_000;
    const loanAmount7 = 10_00_000_000;
    const loanAmount8 = 10_00_000_000;
    const loanAmount9 = 4_500_000_000;
    const loanAmount10 = 3_000_000_000;
    const loanAmount11 = 3_000_000_000;
    const loanAmount12 = 7_000_000_000;

    const period0 = ONE_DAY * 100;
    const period1 = 10_000;
    const period2 = ONE_DAY * DAYS_PER_WEEK;
    const period3 = ONE_DAY * DAYS_PER_WEEK;
    const period4 = ONE_DAY * DAYS_PER_WEEK;
    const period5 = ONE_DAY * DAYS_PER_WEEK;
    const period6 = ONE_DAY * DAYS_PER_WEEK;
    const period7 = ONE_DAY * DAYS_PER_WEEK;
    const period8 = ONE_DAY * DAYS_PER_WEEK;
    const period9 = ONE_DAY * DAYS_PER_WEEK;
    const period10 = ONE_DAY * DAYS_PER_WEEK;
    const period11 = ONE_DAY * DAYS_PER_WEEK;
    const period12 = ONE_DAY * DAYS_PER_WEEK;
    const period13 = ONE_DAY * DAYS_PER_WEEK;

    const loan0 = 0;
    const loan1 = 1;
    const loan2 = 2;
    const loan3 = 3;
    const loan4 = 4;
    const loan5 = 5;
    const loan6 = 6;
    const loan7 = 7;
    const loan8 = 8;
    const loan9 = 9;
    const loan10 = 10;
    const loan11 = 11;
    const loan12 = 12;
    const loan13 = 13;

    block = pool.createLoan(LP_TOKEN,poolId0,loanAmount0,XBTC,0,XBTC,300,period0 * 9,period0,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    block = pool.createLoan(LP_TOKEN,poolId0,loanAmount1,XBTC,0,XBTC,300,period1 * 10,period1,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    block = pool.createLoan(LP_TOKEN,poolId0,loanAmount2,XBTC,0,XBTC,300,period2 * 20,period2,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    block = pool.createLoan(LP_TOKEN,poolId1,loanAmount3,XBTC,0,XBTC,300,period3 * 5,period3,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    block = pool.createLoan(LP_TOKEN,poolId1,loanAmount4,XBTC,0,XBTC,300,period4 * 5,period4,COLL_VAULT,FUNDING_VAULT,borrower_2.address);
    block = pool.createLoan(LP_TOKEN,poolId2,loanAmount5,XBTC,0,XBTC,300,period5 * 20,period5,COLL_VAULT,FUNDING_VAULT,borrower_2.address);
    block = pool.createLoan(LP_TOKEN,poolId2,loanAmount6,XBTC,0,XBTC,300,period6 * 20,period6,COLL_VAULT,FUNDING_VAULT,borrower_3.address);
    block = pool.createLoan(LP_TOKEN,poolId2,loanAmount7,XBTC,0,XBTC,300,period7 * 20,period7,COLL_VAULT,FUNDING_VAULT,borrower_3.address);
    block = pool.createLoan(LP_TOKEN,poolId2,loanAmount8,XBTC,0,XBTC,300,period8 * 20,period8,COLL_VAULT,FUNDING_VAULT,borrower_3.address);

    block = pool.fundLoan(0,LP_TOKEN,poolId0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_1.address);
    block = pool.fundLoan(1,LP_TOKEN,poolId0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_1.address);
    block = chain.mineBlock([
      ...sendFundsP2SHTxs(deployerWallet.address,poolId0,LP_2.address,senderPubKeyLp2,recipient,defaultExpiration,MagicId_LP_2,sentAmount_2,sendFundsPreimage5,supplierId0,sentAmount_2 * inboundFee / 10_000,commitmentTime2,chain.blockHeight - 1),
    ]);
    block = pool.fundLoan(2,LP_TOKEN,poolId0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_1.address);
    block = pool.fundLoan(3,LP_TOKEN,poolId1,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_2.address);
    block = pool.fundLoan(4,LP_TOKEN,poolId1,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_2.address);
    block = pool.fundLoan(5,LP_TOKEN,poolId2,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_3.address);
    block = pool.fundLoan(6,LP_TOKEN,poolId2,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_3.address);
    block = pool.fundLoan(7,LP_TOKEN,poolId2,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_3.address);
    block = pool.fundLoan(8,LP_TOKEN,poolId2,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_3.address);

    // console.log(borrower_1.address);
    // console.log(borrower_2.address);

    // add the XUSD contract as collateral
    block = chain.mineBlock([ Tx.contractCall("globals", "set-coll-contract", [ types.principal(XUSD_CONTRACT_SIMNET) ], deployerWallet.address) ]);
    // add loan with collateral
    block = pool.createLoan(LP_TOKEN,poolId0,loanAmount9,XBTC,20,XUSD_CONTRACT_SIMNET,300,period9 * 20,period9,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    block = pool.createLoan(LP_TOKEN,poolId1,loanAmount10,XBTC,20,XUSD_CONTRACT_SIMNET,300,period10 * 5,period10,COLL_VAULT,FUNDING_VAULT,borrower_2.address);
    // loan with XBTC collateral
    block = pool.createLoan(LP_TOKEN,poolId2,loanAmount11,XBTC,5000,XBTC,300,period11 * 20,period11,COLL_VAULT,FUNDING_VAULT,borrower_3.address);

    // // loan on pool without enough cover funds
    block = pool.createLoan(LP_TOKEN,poolId3,loanAmount12,XBTC,0,XBTC,300,period12 * 20,period12,COLL_VAULT,FUNDING_VAULT,borrower_3.address);
    
    block = pool.fundLoan(9,LP_TOKEN,poolId0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_1.address);
    // CollVault.getLoanColl(chain, COLL_VAULT, 9, deployerWallet.address);
    block = pool.fundLoan(10,LP_TOKEN,poolId1,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_2.address);
    block = pool.fundLoan(11,LP_TOKEN,poolId2,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_3.address);
    block = pool.fundLoan(12,LP_TOKEN,poolId3,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_4.address);

    // console.log(fv.getAsset(0));
    // Only drawding down loan 0, 1, 2, 3, 5, 6, 7, 9, 10, 11, 12
    // Not draawing down loans 4 and 8
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, poolId0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId0, SWAP_ROUTER,XBTC, borrower_1.address),
      SupplierInterface.drawdown(1, LP_TOKEN, poolId0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId0, SWAP_ROUTER,XBTC, borrower_1.address),
      SupplierInterface.drawdown(2, LP_TOKEN, poolId0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId0, SWAP_ROUTER,XBTC, borrower_1.address),
      SupplierInterface.drawdown(3, LP_TOKEN, poolId1, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId0, SWAP_ROUTER,XBTC, borrower_1.address),
    ]);
    // console.log(block.receipts[0].events);

    // console.log(fv.getAsset(0));
    // console.log(block);

    block = chain.mineBlock([
      SupplierInterface.drawdown(5, LP_TOKEN, poolId2, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH_borrower2, supplierId0, SWAP_ROUTER,XBTC, borrower_2.address),
      SupplierInterface.drawdown(6, LP_TOKEN, poolId2, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH_borrower3, supplierId0, SWAP_ROUTER,XBTC, borrower_3.address),
      SupplierInterface.drawdown(7, LP_TOKEN, poolId2, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH_borrower3, supplierId0, SWAP_ROUTER,XBTC, borrower_3.address),
    ]);

    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]);

    // console.log(chain.getAssetsMaps().assets[".Wrapped-USD.wrapped-usd"]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(9, LP_TOKEN, poolId0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, supplierId0, SWAP_ROUTER,XBTC, borrower_1.address),
      SupplierInterface.drawdown(10, LP_TOKEN, poolId1, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH_borrower2, supplierId0, SWAP_ROUTER,XBTC, borrower_2.address),
      SupplierInterface.drawdown(11, LP_TOKEN, poolId2, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH_borrower3, supplierId0, SWAP_ROUTER,XBTC, borrower_3.address),
      SupplierInterface.drawdown(loan12, LP_TOKEN, poolId3, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH_borrower3, supplierId0, SWAP_ROUTER,XBTC, borrower_3.address),
    ]);
    // console.log(CollVault.getLoanColl(chain, COLL_VAULT, 9, deployerWallet.address));
    // console.log(fv.getAsset(10));
    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let treasuryFeeBps = consumeUint(globals["treasury-fee"]);
    let drawdownAmount0 = loanAmount0 - getBP(loanAmount0, treasuryFeeBps);
    let drawdownAmount1 = loanAmount1 - getBP(loanAmount1, treasuryFeeBps);
    let drawdownAmount2 = loanAmount2 - getBP(loanAmount2, treasuryFeeBps);
    let drawdownAmount3 = loanAmount3 - getBP(loanAmount3, treasuryFeeBps);
    let drawdownAmount4 = loanAmount4 - getBP(loanAmount4, treasuryFeeBps);
    let drawdownAmount5 = loanAmount5 - getBP(loanAmount5, treasuryFeeBps);
    let drawdownAmount6 = loanAmount6 - getBP(loanAmount6, treasuryFeeBps);
    let drawdownAmount7 = loanAmount7 - getBP(loanAmount7, treasuryFeeBps);
    let drawdownAmount8 = loanAmount8 - getBP(loanAmount8, treasuryFeeBps);
    let drawdownAmount9 = loanAmount9 - getBP(loanAmount9, treasuryFeeBps);
    let drawdownAmount10 = loanAmount10 - getBP(loanAmount10, treasuryFeeBps);
    let drawdownAmount11 = loanAmount11 - getBP(loanAmount11, treasuryFeeBps);
    let drawdownAmount12 = loanAmount12 - getBP(loanAmount12, treasuryFeeBps);

    block = chain.mineBlock([
      ...finalizeDrawdown(0, LP_TOKEN, poolId0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, drawdownAmount0, 0, chain.blockHeight - 1, borrower_1.address, deployerWallet.address),
      ...finalizeDrawdown(1, LP_TOKEN, poolId0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, drawdownAmount1, 1, chain.blockHeight - 1, borrower_1.address, deployerWallet.address),
      ...finalizeDrawdown(2, LP_TOKEN, poolId0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, drawdownAmount2, 2, chain.blockHeight - 1, borrower_1.address, deployerWallet.address),
      ...finalizeDrawdown(3, LP_TOKEN, poolId1, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, drawdownAmount3, 3, chain.blockHeight - 1, borrower_1.address, deployerWallet.address),
    ]);

    let valueHex = padTo(numberToHex(drawdownAmount7), 8);
    let tx7 = `0200000001f01c1021c9d15a6ddda9e7f016586c5e1e57e8b456a90a5f741238a3ea5f01b1010000006a47\
304402206f2e00a06d84a629d1583d3e37d046dc768346e9cfb9f29a54fca8e25401661a022055bfb842f1baaad40da4ff\
1e53431c30e383007ac53b9a93c938423c3d217b950121031aa68bfad0576216e20a30892af32e49948fbd2892c339c373\
bc28e49e04f9bffdffffff02${toLittleEndian(valueHex)}19${generateP2PKHScript(HASH_borrower3)}c0da0\
000000000001976a914c5b8cc55ab829cc07b08936234b14a039a38ffe288ac89692200`
    let tx7Id = getTxId(tx7);

    block = chain.mineBlock([
      // fails, becuase has not been drawdown
      ...finalizeDrawdown(4, LP_TOKEN, poolId0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, drawdownAmount4, 4, chain.blockHeight - 1, borrower_1.address, deployerWallet.address),
      ...finalizeDrawdown(5, LP_TOKEN, poolId2, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH_borrower2, drawdownAmount5, 4, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address),
      ...finalizeDrawdown(6, LP_TOKEN, poolId2, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH_borrower3, drawdownAmount6, 5, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address),
      // ...finalizeDrawdown(7, LP_TOKEN, poolId2, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH_borrower3, drawdownAmount7, 6, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address),
      TestUtils.setMinedTx(tx7Id, deployerWallet.address),
      SupplierInterface.finalizeDrawdown(
        7,LP_TOKEN,poolId2,XBTC,COLL_VAULT,FUNDING_VAULT,XBTC,{ header: "", height: chain.blockHeight - 1 },[],tx7,{ "tx-index": 0, "hashes": [], "tree-depth": 0 },0,6,deployerWallet.address)
    ]);
    // console.log(block);
    block = chain.mineBlock([
      ...finalizeDrawdown(9, LP_TOKEN, poolId0, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, drawdownAmount9, 7, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address),
      ...finalizeDrawdown(10, LP_TOKEN, poolId1, XUSD_CONTRACT_SIMNET, COLL_VAULT, FUNDING_VAULT, XBTC, HASH_borrower2, drawdownAmount10, 8, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address),
      ...finalizeDrawdown(11, LP_TOKEN, poolId2, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH_borrower3, drawdownAmount11, 9, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address),
      ...finalizeDrawdown(12, LP_TOKEN, poolId3, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH_borrower3, drawdownAmount12, 10, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address),
    ]);

    let fundingPeriod = consumeUint(globals["funding-period"]);
    chain.mineEmptyBlock(fundingPeriod);

    block = pool.unwind(4,LP_TOKEN,poolId1,FUNDING_VAULT,LIQUIDITY_VAULT,XBTC,delegate_2.address);
    block = pool.unwind(8,LP_TOKEN,poolId2,FUNDING_VAULT,LIQUIDITY_VAULT,XBTC,delegate_3.address);

    let nextPayments: any[] = [];
    for (let i = 0; i < 12; i++)
      nextPayments = nextPayments.concat(consumeUint(loan.getLoanData(i).result.expectTuple()["next-payment"]));

    let paymentLoans: any[] = [];
    for (let i = 0; i < 12; i++)
      paymentLoans = paymentLoans.concat(consumeUint(Payment.getCurrentLoanPayment(chain, i, borrower_1.address)))

    let paymentLoansMinToReceive: any[] = [];
    for (let i = 0; i < 12; i++)
      paymentLoansMinToReceive = paymentLoansMinToReceive.concat(getBP(paymentLoans[i], treasuryFeeBps));

    let sender_1 = generateRandomHexString(33);
    let sender_2 = generateRandomHexString(33);
    let sender_3 = generateRandomHexString(33);

    block = chain.mineBlock([ Magic.initializeSwapper(borrower_1.address) ]);
    let borrower_1_Magic_id = consumeUint(block.receipts[0].result.expectOk());
    block = chain.mineBlock([ Magic.initializeSwapper(borrower_2.address) ]);
    let borrower_2_Magic_id = consumeUint(block.receipts[0].result.expectOk());
    block = chain.mineBlock([ Magic.initializeSwapper(borrower_3.address) ]);
    let borrower_3_Magic_id = consumeUint(block.receipts[0].result.expectOk());
    
    let paymentPreimage1 = generateRandomHexString(20);

    block = chain.mineBlock([
      ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender_1,recipient,defaultExpiration,borrower_1_Magic_id,paymentLoans[loan2],paymentPreimage1,supplierId0,paymentLoansMinToReceive[loan2],loan2, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender_1,recipient,defaultExpiration,borrower_1_Magic_id,paymentLoans[loan3],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan3],loan3, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      // fails to make a payment because is not active
      ...makePaymentTxs(deployerWallet.address, borrower_2.address,sender_2,recipient,defaultExpiration,borrower_2_Magic_id,paymentLoans[loan4],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan4],loan4, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId1, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      ...makePaymentTxs(deployerWallet.address, borrower_2.address,sender_2,recipient,defaultExpiration,borrower_2_Magic_id,paymentLoans[loan5],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan5],loan5, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId2, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      ...makePaymentTxs(deployerWallet.address, borrower_3.address,sender_3,recipient,defaultExpiration,borrower_3_Magic_id,paymentLoans[loan6],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan6],loan6, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId2, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      ...makePaymentTxs(deployerWallet.address, borrower_3.address,sender_3,recipient,defaultExpiration,borrower_3_Magic_id,paymentLoans[loan7],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan7],loan7, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId2, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
    ]);

    block = chain.mineBlock([
      // fails to make a payment because is not active
      ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender_1,recipient,defaultExpiration,borrower_1_Magic_id,paymentLoans[loan8],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan8],loan8, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId2, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender_1,recipient,defaultExpiration,borrower_1_Magic_id,paymentLoans[loan9],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan9],loan9, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      ...makePaymentTxs(deployerWallet.address, borrower_2.address,sender_2,recipient,defaultExpiration,borrower_2_Magic_id,paymentLoans[loan10],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan10],loan10, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId1, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      ...makePaymentTxs(deployerWallet.address, borrower_3.address,sender_3,recipient,defaultExpiration,borrower_3_Magic_id,paymentLoans[loan11],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan11],loan11, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId2, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
    ]);

    nextPayments = [];
    for (let i = 0; i < 12; i++)
      nextPayments = nextPayments.concat(consumeUint(loan.getLoanData(i).result.expectTuple()["next-payment"]));

    let LP_1_ADDY_HASH = generateRandomHexString(20);

    // LP_1 withdraws rewards
    block = chain.mineBlock([ SupplierInterface.withdrawRewards(P2PKH_VERSION, LP_1_ADDY_HASH, supplierId0, LP_TOKEN, poolId0, LIQUIDITY_VAULT, XBTC, LP_1.address) ]);
    let rewardsEarned = consumeUint(block.receipts[0].result.expectOk());
    block = chain.mineBlock([ ...finalizeOutboundTxs(LP_1_ADDY_HASH, rewardsEarned, 10, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address) ]);

    chain.mineEmptyBlockUntil(nextPayments[3] - 1);
    // Loan_3 payment
    block = chain.mineBlock([
      ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender_1,recipient,defaultExpiration,borrower_1_Magic_id,paymentLoans[loan3],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan3],loan3, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      ...makePaymentTxs(deployerWallet.address, borrower_2.address,sender_2,recipient,defaultExpiration,borrower_2_Magic_id,paymentLoans[loan10],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan10],loan10, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId1, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
    ]);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(3).result.expectTuple()["next-payment"]) - 1);

    block = chain.mineBlock([
      ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender_1,recipient,defaultExpiration,borrower_1_Magic_id,paymentLoans[loan3],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan3],loan3, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      ...makePaymentTxs(deployerWallet.address, borrower_2.address,sender_2,recipient,defaultExpiration,borrower_2_Magic_id,paymentLoans[loan10],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan10],loan10, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId1, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
    ]);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(3).result.expectTuple()["next-payment"]) - 1);

    block = chain.mineBlock([
      ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender_1,recipient,defaultExpiration,borrower_1_Magic_id,paymentLoans[loan3],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan3],loan3, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      ...makePaymentTxs(deployerWallet.address, borrower_2.address,sender_2,recipient,defaultExpiration,borrower_2_Magic_id,paymentLoans[loan10],generateRandomHexString(20),supplierId0,paymentLoansMinToReceive[loan10],loan10, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId1, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
    ]);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(3).result.expectTuple()["next-payment"]) - 1);

    let repaymentLoan3 = loanAmount3 + paymentLoans[loan3];
    let repaymentLoan10 = loanAmount10 + paymentLoans[loan10];
    block = chain.mineBlock([
      ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender_1,recipient,defaultExpiration,borrower_1_Magic_id,repaymentLoan3,generateRandomHexString(20),supplierId0,getBP(repaymentLoan3, inboundFee),loan3, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId1, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
      ...makePaymentTxs(deployerWallet.address, borrower_2.address,sender_2,recipient,defaultExpiration,borrower_2_Magic_id,repaymentLoan10,generateRandomHexString(20),supplierId0,getBP(repaymentLoan10, inboundFee),loan10, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId1, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC),
    ]);

    // We default poolId1
    block = pool.triggerDefaultmode(LP_TOKEN, poolId1, deployerWallet.address);

    // Start withdrawing funds from poolId1
    globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let cooldownTime = consumeUint(globals["lp-cooldown-period"]);
    block = pool.signalWithdrawal(LP_TOKEN,poolId1, sentAmount_2, LP_2.address);

    let LP_1_ADDRESS_HASH = generateRandomHexString(20);
    let LP_2_ADDRESS_HASH = generateRandomHexString(20);

    // Withdraw rewards before withdrawing funds
    block = chain.mineBlock([ SupplierInterface.withdrawRewards(P2PKH_VERSION, LP_2_ADDRESS_HASH, supplierId0, LP_TOKEN, poolId1, LIQUIDITY_VAULT, XBTC, LP_2.address) ]);
    rewardsEarned = consumeUint(block.receipts[0].result.expectOk());
    block = chain.mineBlock([ ...finalizeOutboundTxs(LP_2_ADDRESS_HASH, rewardsEarned, 12, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address) ]);

    chain.mineEmptyBlock(cooldownTime);
    
    // withdraw funds from poolId1
    block = chain.mineBlock([ SupplierInterface.withdraw(sentAmount_2, P2PKH_VERSION, LP_2_ADDRESS_HASH, supplierId0, LP_TOKEN,ZP_TOKEN, poolId1,LIQUIDITY_VAULT, XBTC, LP_2.address) ]);
    block = chain.mineBlock([ ...finalizeOutboundTxs(LP_2_ADDRESS_HASH, sentAmount_2, 13, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address) ]);

    // liquidate Loan2 from PoolId0, recover enough funds from the Cover Pool 1 to recover from losses
    block = pool.liquidateLoan(loan2, LP_TOKEN, poolId0,LIQUIDITY_VAULT, COLL_VAULT, XBTC, XBTC, CP_TOKEN,COVER_VAULT,SWAP_ROUTER, XBTC, delegate_1.address);
    block = pool.signalWithdrawal(LP_TOKEN,poolId0, sentAmount_2, LP_2.address);

    chain.mineEmptyBlock(cooldownTime);
    
    block = chain.mineBlock([ SupplierInterface.withdraw(sentAmount_2, P2PKH_VERSION, LP_2_ADDRESS_HASH, supplierId0, LP_TOKEN,ZP_TOKEN, poolId0,LIQUIDITY_VAULT, XBTC, LP_2.address) ]);

    // Create Transaction to finalize withdrawal
    valueHex = padTo(numberToHex(sentAmount_2), 8);
    let tx = `0200000001f01c1021c9d15a6ddda9e7f016586c5e1e57e8b456a90a5f741238a3ea5f01b1010000006a47\
304402206f2e00a06d84a629d1583d3e37d046dc768346e9cfb9f29a54fca8e25401661a022055bfb842f1baaad40da4ff\
1e53431c30e383007ac53b9a93c938423c3d217b950121031aa68bfad0576216e20a30892af32e49948fbd2892c339c373\
bc28e49e04f9bffdffffff02${toLittleEndian(valueHex)}19${generateP2PKHScript(LP_2_ADDRESS_HASH)}c0da0\
000000000001976a914c5b8cc55ab829cc07b08936234b14a039a38ffe288ac89692200`
    let txId = getTxId(tx);
    
    block = chain.mineBlock([
      TestUtils.setMinedTx(txId, deployerWallet.address),
      SupplierInterface.finalizeOutbound( { header: "", height: chain.blockHeight }, [], tx, { "tx-index": 0, "hashes": [], "tree-depth": 0 }, 0, 14, deployerWallet.address)
    ]);
    
    // End of Liquidation of PoolId1 and withdrawal of funds and recovered whole

    // Start of Liquidation of PoolId4 and there's not enough cover losses.
    // console.log(CoverVault.getAsset(chain, COVER_VAULT, poolId3, deployerWallet.address));
    block = pool.liquidateLoan(loan12, LP_TOKEN, poolId3, LIQUIDITY_VAULT, COLL_VAULT, XBTC, XBTC, CP_TOKEN,COVER_VAULT,SWAP_ROUTER, XBTC, delegate_4.address);
    let lossLp1 = (consumeUint(LpToken.recognizableLossesOf("lp-token", poolId3, LP_1.address).result));
    let lossLp2 = (consumeUint(LpToken.recognizableLossesOf("lp-token", poolId3, LP_2.address).result));
    // Everyone in LP3 wants to withdraw after liquidation
    block = pool.signalWithdrawal(LP_TOKEN,poolId3, sentAmount_5, LP_1.address);
    block = pool.signalWithdrawal(LP_TOKEN,poolId3, sentAmount_6, LP_2.address);
    
    chain.mineEmptyBlock(cooldownTime);

    // the minus 1 is for the loss of precision when distributing losses across multiple users
    // The pool holds 12_000. But LP1 and LP2 can both claim 6_001 due to precision loss
    // One could could withdraw 6_001 and the other 5_999
    // or both 6_000, 6_000.
    block = chain.mineBlock([ SupplierInterface.withdraw(sentAmount_5 - 1, P2PKH_VERSION, LP_1_ADDRESS_HASH, supplierId0, LP_TOKEN,ZP_TOKEN, poolId3,LIQUIDITY_VAULT, XBTC, LP_1.address) ]);
    block = chain.mineBlock([ SupplierInterface.withdraw(sentAmount_6 - 1, P2PKH_VERSION, LP_2_ADDRESS_HASH, supplierId0, LP_TOKEN,ZP_TOKEN, poolId3,LIQUIDITY_VAULT, XBTC, LP_2.address) ]);
    block = chain.mineBlock([ ...finalizeOutboundTxs(LP_1_ADDRESS_HASH, sentAmount_5 - 1, 15, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address) ]);
    block = chain.mineBlock([ ...finalizeOutboundTxs(LP_2_ADDRESS_HASH, sentAmount_6 - 1, 16, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address) ]);

    // PoolID3 is empty and has no more funds.

    let loanAmount13 = 10_000_000_000;
    let drawdownAmount13 = loanAmount13 - getBP(loanAmount13, treasuryFeeBps);

    block = pool.createLoan(LP_TOKEN,poolId2,loanAmount13,XBTC,0,XBTC,200,period13 * 10,period12,COLL_VAULT,FUNDING_VAULT,borrower_3.address);
    block = pool.fundLoan(loan13,LP_TOKEN,poolId2,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_3.address);

    block = chain.mineBlock([
      SupplierInterface.drawdown(loan13, LP_TOKEN, poolId2, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH_borrower3, supplierId0, SWAP_ROUTER,XBTC, borrower_3.address),
      ...finalizeDrawdown(loan13, LP_TOKEN, poolId2, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH_borrower3, drawdownAmount13, 17, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address),
    ]);

    let paymentLoan13 = consumeUint(Payment.getCurrentLoanPayment(chain, loan13, borrower_1.address));
    let paymentLoansMinToReceive13 = getBP(paymentLoan13, treasuryFeeBps);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(loan13).result.expectTuple()["next-payment"]) - 1);
    // Loan_3 payment
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, borrower_3.address,sender_3,recipient,defaultExpiration,borrower_3_Magic_id,paymentLoan13,generateRandomHexString(20),supplierId0,paymentLoansMinToReceive13,loan13, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId2, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(loan13).result.expectTuple()["next-payment"]) - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, borrower_3.address,sender_3,recipient,defaultExpiration,borrower_3_Magic_id,paymentLoan13,generateRandomHexString(20),supplierId0,paymentLoansMinToReceive13,loan13, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId2, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(loan13).result.expectTuple()["next-payment"]) - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, borrower_3.address,sender_3,recipient,defaultExpiration,borrower_3_Magic_id,paymentLoan13,generateRandomHexString(20),supplierId0,paymentLoansMinToReceive13,loan13, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT,poolId2, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    // Start a rollover process

    let newRolloverAmount = loanAmount13 + 4008000000;
    block = loan.requestRollover(loan13, null, newRolloverAmount, period13 * 20, period13 * 2, null, XBTC, borrower_3.address);
    // console.log(loan.getRolloverData(loan13).result.expectTuple());
    block = pool.acceptRollover(loan13, LP_TOKEN, poolId2, LIQUIDITY_VAULT,FUNDING_VAULT, XBTC, delegate_3.address);

    let rolloverDrawdownAmount = newRolloverAmount - getBP(newRolloverAmount, treasuryFeeBps);
    block = chain.mineBlock([ SupplierInterface.completeRollover(loan13, LP_TOKEN, poolId2, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH_borrower3, 0, SWAP_ROUTER, XBTC, borrower_3.address) ]);
    // console.log(block);
    // console.log(lv.getAsset(poolId2));
    block = chain.mineBlock([...finalizeRollover(loan13, LP_TOKEN, poolId2, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH_borrower3, rolloverDrawdownAmount, 18, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address )]);
    // console.log(block);
    // console.log(lv.getAsset(poolId2));
    // console.log(CoverVault.getAsset(chain, COVER_VAULT, poolId3, deployerWallet.address));
    // console.log(block.receipts[0].events);

    // console.log(lv.getAsset(poolId0));
    // console.log(CoverVault.getAsset(chain, COVER_VAULT, poolId0, deployerWallet.address));

    // console.log(loan.getLoanData(loan2).result.expectTuple());

    // console.log(block);
    // console.log(chain.blockHeight);

    // console.log(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.liquidity-vault-v1-0"]);
    // console.log(lv.getAsset(poolId2));
    // console.log(fv.getAsset(8));
    // console.log(block);

    // console.log(consumeUint(Payment.getCurrentLoanPayment(chain, 0, deployerWallet.address)));
    // console.log(consumeUint(Payment.getCurrentLoanPayment(chain, 1, deployerWallet.address)));
    // console.log(consumeUint(Payment.getCurrentLoanPayment(chain, 2, deployerWallet.address)));
    // console.log(consumeUint(Payment.getCurrentLoanPayment(chain, 3, deployerWallet.address)));
    // console.log(consumeUint(Payment.getCurrentLoanPayment(chain, 4, deployerWallet.address)));
    // console.log(consumeUint(Payment.getCurrentLoanPayment(chain, 5, deployerWallet.address)));
    // console.log(consumeUint(Payment.getCurrentLoanPayment(chain, 6, deployerWallet.address)));
    // console.log(consumeUint(Payment.getCurrentLoanPayment(chain, 7, deployerWallet.address)));
    // console.log(consumeUint(Payment.getCurrentLoanPayment(chain, 8, deployerWallet.address)));

    await delay(80_000);
  },
});
