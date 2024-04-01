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
import { Payment } from '../../interfaces/payment.ts';
import { ZestRewardDist } from '../../interfaces/zestRewardDist.ts';

import { 
  getHash,
  getReverseTxId,
  getTxId,
  getExpiration,
  swapperBuff,
  generateP2PKHTx,
  generateP2SHTx,
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
  getBP,
  finalizeDrawdown,
  makePaymentTxs
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
  SWAP_ROUTER,
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
    let delegate_2 = accounts.get("wallet_9") as Account; // Delegate_2
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);
    
    let block = pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);
    // creating second pool
    block = pool.createPool(delegate_2.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    block = pool.finalizePool(delegate_2.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 1);

    
    // TO BE DONE DURING DEPLOYMENT
    // Prepare supplier, has to be done by backend.
    block = chain.mineBlock([
      Tx.contractCall(
        "Wrapped-Bitcoin",
        "transfer",
        [
          types.uint(10_000_000_000),
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
          types.some(types.int(10)),
          types.some(types.int(10)),
          types.int(500),
          types.int(500),
          types.ascii("supplier-1"),
          types.uint(10_000_000_000),
        ],
        deployerWallet.address
      )
    ]);
    // END OF DEPLOYMENT PREPARATION
    
    // Liquidity Provider 1 has to initialize as a swapper
    const supplierId1 = (consumeUint(block.receipts[1].result.expectOk()));
    block = chain.mineBlock([ Tx.contractCall( "magic-protocol", 'initialize-swapper', [], LP_1.address) ]);
    
    const lp1SwapperId = 0;
    const expiration = 500;
    const sent_amount = 100_000_000;

    let hash = getHash(preimage);
    let tx1 = generateP2SHTx(sender, recipient, expiration, hash, lp1SwapperId, sent_amount);
    let txid1 = getTxId(tx1);

    // NOT DONE ON TESTNET add Transaction dummy to test the contract on simnet. Equivalent of sending the Bitcoin transaction on the Bitcoin blockchain
    block = chain.mineBlock([ Tx.contractCall("test-utils","set-mined", [ types.buff(Buffer.from(txid1, "hex")) ], deployerWallet.address) ]);

    // Transaction data
    const bitcoinBlock = { header: "", height: chain.blockHeight - 1 };
    const prevBlocks = [] as string[];
    const proof = { "tx-index": 0, "hashes": [], "tree-depth": 0 }
    // Output in which we're interested for the transaction
    const outputIndex = 0;
    // the 10 percent is  based on the inbound fee of supplier-1
    const minToReceive = sent_amount * 10 / 10_000;

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
          types.buff(Buffer.from(tx1, "hex")),
          types.tuple({
            "tx-index": types.uint(proof['tx-index']),
            "hashes": types.list(proof.hashes.map(val => types.buff(Buffer.from(val, "hex")))),
            "tree-depth": types.uint(proof['tree-depth'])
          }),
          types.uint(outputIndex),
          // end of Bitcoin Proof
          types.buff(Buffer.from(sender, "hex")),                     // Public key of the LP_1 sending the Bitcoin. Used to recover the funds if the sent bitcoin fails.
          types.buff(Buffer.from(recipient, "hex")),                  // Public key used by the Magic that is the recipient of Bitcoin.
          types.buff(Buffer.from(getExpiration(expiration), "hex")),  // Expiration time in Little Endian and padded to 2 bytes (string length of 4). Ex for 500: '01F4'
          types.buff(Buffer.from(hash, "hex")),                       // Hash of the preimage used for the HTLC
          types.buff(Buffer.from(swapperBuff(lp1SwapperId), "hex")),  // Swapper id in Little ending padded to 4 bytes (string length of 8). Ex for u0: "00000000"
          types.uint(supplierId1),                                   // Supplier id in uint
          types.uint(minToReceive),                                   // Minimum amount that has to be received. Is the amount of the sent funds minus the fees of the supplier.
        ],
        LP_1.address
      )
    ]);
    
    const commitmentTime = 1;
    const poolId_0 = 0;

    block = chain.mineBlock([
      Tx.contractCall(
        "supplier-interface",
        "send-funds-finalize",
        [
          types.buff(Buffer.from(txid1,"hex")),                             // Transaction ID of the previously confirmed transaction.
          types.buff(Buffer.from(preimage,"hex")),                          // preimage of the hash used by the HTLC
          types.uint(commitmentTime),                                       // Number of cycles that the Liquidity Provider wants to commit now.
          types.principal(`${deployerWallet.address}.lp-token`),            // Liquidity Providers Token used to account for the xBTC rewards of the pool
          types.uint(poolId_0),                                             // Pool id of the selected pool
          types.principal(`${deployerWallet.address}.zest-reward-dist`),    // Token for the Liquidity Providers to account for Zest rewards
          types.principal(`${deployerWallet.address}.liquidity-vault-v1-0`),// Liquidity Vault contract holding funds of the Liquidity Pool.
          types.principal(`${deployerWallet.address}.Wrapped-Bitcoin`),     // The asset used for loans in the pool
          types.principal(`${deployerWallet.address}.rewards-calc`),        // Contract containing the logic of how Zest rewards are calculated.
        ],
        LP_1.address
      )
    ]);
    // console.log(block);

    // same process for a second Liquidity Provider, sending to pool 1
    block = chain.mineBlock([
      Magic.initializeSwapper(LP_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,1,LP_2.address,sender,recipient,500,1,100_000_000,preimage,0,100_000_000 * 10 / 10_000,1,chain.blockHeight - 1),
    ]);
  },
});


Clarinet.test({
  name: "Liquidity providers can send funds to Liquidity Pool 0 and to the Cover Pool, then waits until commitment ends and can withdraw sent funds.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2
    let coverPoolProvider1 = accounts.get("wallet_3") as Account; // Cover_1
    let coverPoolProvider2 = accounts.get("wallet_4") as Account; // Cover_2
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);
    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();

    // let block = runBootstrap(chain, deployerWallet);
    
    // Pool is created by Deployer. Pool Delegate is assigned.
    let block = pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    // Pool delegate has to enable cover pool of pool 0
    block = chain.mineBlock([
      Tx.contractCall(
        "pool-v1-0",
        "enable-cover",
        [
          types.principal(`${deployerWallet.address}.lp-token`),
          types.principal(`${deployerWallet.address}.cp-token`),
          types.uint(0),
        ],
        delegate_1.address
      )
    ]);

    const cover_amount = 1_000_000_000_000n;
    // Cover Pool provider sends funds to the cover pool of Pool 0.
    block = chain.mineBlock([
      Tx.contractCall(
        "cover-pool-v1-0",
        "send-funds",
        [
          types.principal(`${deployerWallet.address}.cp-token`),
          types.principal(`${deployerWallet.address}.cover-vault`),
          types.principal(`${deployerWallet.address}.cp-rewards-token`),
          types.principal(`${deployerWallet.address}.Wrapped-Bitcoin`),
          types.uint(0),
          types.uint(cover_amount),
          types.uint(10),
          types.principal(`${deployerWallet.address}.rewards-calc`),
          types.principal(coverPoolProvider1.address),
        ],
        coverPoolProvider1.address
      )
    ]);

    // Mine empty blocks until the commitment ends
    const cycleLength = consumeUint(coverPool.getPool(0)["cycle-length"]);
    chain.mineEmptyBlock(cycleLength * 10);

    // Cover pool provider has to signal that they're going to withdraw their funds from the pool before withdrawing
    block = chain.mineBlock([
      Tx.contractCall(
        "cover-pool-v1-0",
        "signal-withdrawal",
        [
          types.principal(`${deployerWallet.address}.cp-token`),
          types.uint(0),
          types.uint(cover_amount)
        ],
        coverPoolProvider1.address
      )
    ]);

    // mine empty blocks until the cooldown period has passed.
    chain.mineEmptyBlock(consumeUint(globals["staker-cooldown-period"]));

    // cover pool provider withdraws their funds
    block = chain.mineBlock([
      Tx.contractCall(
        "cover-pool-v1-0",
        "withdraw",
        [
          types.principal(`${deployerWallet.address}.cp-token`),
          types.principal(`${deployerWallet.address}.cp-rewards-token`),
          types.principal(`${deployerWallet.address}.Wrapped-Bitcoin`),
          types.uint(0),
          types.uint(cover_amount),
          types.principal(`${deployerWallet.address}.cover-vault`),
        ],
        coverPoolProvider1.address
      )
    ]);    
  },
});

Clarinet.test({
  name: "Liquidity providers can send funds to Liquidity Pool 0, then waits until commitment ends and can withdraw sent funds from the Liquidity Pool.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2
    let coverPoolProvider1 = accounts.get("wallet_3") as Account; // Cover_1
    let coverPoolProvider2 = accounts.get("wallet_4") as Account; // Cover_2
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);
    let coverPool = new CoverPool(chain, deployerWallet);
    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let lpToken = new LPToken(chain, deployerWallet);

    // let block = runBootstrap(chain, deployerWallet);
    
    // Pool is created by Deployer. Pool Delegate is assigned.
    let block = pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    // get supplier id after registering the supplier
    const supplierId_0 = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    const fee = Number(Magic.getSupplier(chain, supplierId_0, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());
    const poolId_0 = 0;

    const amountSent_1 = 100_000_000;
    const amountSent_2 = 200_000_000;
    const commitmentTime = 1;
    // calls initialize-swapper, send-funds, send-funds-finalized
    block = chain.mineBlock([
      Magic.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,amountSent_1,preimage,supplierId_0,amountSent_1 * fee / 10_000,commitmentTime,chain.blockHeight - 1),
      Magic.initializeSwapper(LP_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_2.address,sender,recipient,500,1,amountSent_2,preimage,supplierId_0,amountSent_2 * fee / 10_000,commitmentTime,chain.blockHeight - 1),
    ]);

    // Mine empty blocks until the commitment ends
    const cycleLength = consumeUint(coverPool.getPool(poolId_0)["cycle-length"]);
    chain.mineEmptyBlock(cycleLength * commitmentTime);

    block = chain.mineBlock([
      Tx.contractCall(
        "pool-v1-0",
        "signal-withdrawal",
        [
          types.principal(LP_TOKEN),
          types.uint(poolId_0),
          types.uint(amountSent_1)
        ],
        LP_1.address
      )
    ]);

    // mine empty blocks until the cooldown period has passed.
    chain.mineEmptyBlock(consumeUint(globals["lp-cooldown-period"]));
    const PUBKEYHASH = "0000000000000000000000000000000000000000";

    let balance = chain.mineBlock([ Tx.contractCall("lp-token", "get-balance", [ types.uint(poolId_0), types.principal(LP_1.address) ], LP_1.address) ]).receipts[0].result.expectOk();
    // initiate withdrawal process by the Liquidity Provider on Pool 0
    block = chain.mineBlock([
      Tx.contractCall(
        "supplier-interface",
        "withdraw",
        [
          types.uint((consumeUint(balance))),
          types.buff(Buffer.from(P2PKH_VERSION, "hex")),
          types.buff(Buffer.from(PUBKEYHASH, "hex")),
          types.uint(supplierId_0),
          types.principal(LP_TOKEN),
          types.principal(ZP_TOKEN),
          types.uint(poolId_0),
          types.principal(LIQUIDITY_VAULT),
          types.principal(XBTC),
        ],
        LP_1.address
      )
    ]);

    // Transaction data
    const bitcoinBlock = { header: "", height: chain.blockHeight - 1 };
    const prevBlocks = [] as string[];
    const proof = { "tx-index": 0, "hashes": [], "tree-depth": 0 }
    // Output in which we're interested for the transaction
    const outputIndex = 0;

    const lp1SwapperId = 0;
    const sent_amount = 100_000_000;

    // generate a P2PKH bitcoin transaction as the outbound transaction.
    let tx1 = generateP2PKHTx(PUBKEYHASH, sent_amount);
    let txid1 = getTxId(tx1);
    block = chain.mineBlock([TestUtils.setMinedTx(txid1, deployerWallet.address)]);
    
    // finalize the withdrawal by the backend by confirming that the transaction happened.
    block = chain.mineBlock([
      Tx.contractCall(
        "supplier-interface",
        "finalize-outbound",
        [
          types.tuple({
            header: types.buff(Buffer.from(bitcoinBlock.header, "hex")),
            height: types.uint(bitcoinBlock.height)
          }),
          types.list(prevBlocks.map((val) => types.buff(Buffer.from(val, "hex")))),
          types.buff(Buffer.from(tx1, "hex")),
          types.tuple({
            "tx-index": types.uint(proof['tx-index']),
            "hashes": types.list(proof.hashes.map(val => types.buff(Buffer.from(val, "hex")))),
            "tree-depth": types.uint(proof['tree-depth'])
          }),
          types.uint(outputIndex),
          types.uint(lp1SwapperId),
        ],
        deployerWallet.address
      )
    ]);
  },
});

Clarinet.test({
  name: "Liquidity providers can claim rewards after the Borrower has made multiple payments and the final loan repayment",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1
    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, borrower_1.address, P2PKH_VERSION, HASH, deployerWallet.address);

    pool.createPool(delegate_1.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(delegate_1.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    const amountSent = 100_000_000;

    block = chain.mineBlock([
      Magic.initializeSwapper(LP_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,LP_1.address,sender,recipient,500,0,amountSent,preimage,supplierId,amountSent * fee / 10_000,1,chain.blockHeight - 1)
    ]);
    const loanAmount = 100_000_000;
    pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,borrower_1.address);
    pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,delegate_1.address);
    chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    block = chain.mineBlock([
      SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, borrower_1.address)
    ]);

    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, borrower_1.address, deployerWallet.address)]);

    chain.mineEmptyBlockUntil(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - 1);
    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, borrower_1.address)));
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);

    block = chain.mineBlock([
      Magic.initializeSwapper(borrower_1.address),
      ...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,1,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)
    ]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,1,regularPaymentDue,"01",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - chain.blockHeight - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,1,regularPaymentDue,"02",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    // In a P2PKH, this hash is the hash of the public key of the user.
    const LP_1_ADDRESS_HASH = "0000000000000000000000000000000000000001";
    block = chain.mineBlock([ SupplierInterface.withdrawRewards(P2PKH_VERSION, LP_1_ADDRESS_HASH, 0, LP_TOKEN, 0, LIQUIDITY_VAULT, XBTC, LP_1.address) ]);
    let rewardsEarned = consumeUint(block.receipts[0].result.expectOk());

    block = chain.mineBlock([ ...finalizeOutboundTxs(LP_1_ADDRESS_HASH, rewardsEarned, 1, chain.blockHeight - 1, borrower_1.address, deployerWallet.address) ]);
    block.receipts[1].result.expectOk();

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,1,regularPaymentDue,"03",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,1,regularPaymentDue,"04",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,1,regularPaymentDue,"05",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);

    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,1,regularPaymentDue,"06",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,1,regularPaymentDue,"07",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    chain.mineEmptyBlock(consumeUint(loan.getLoanData(0).result.expectTuple()["next-payment"]) - block.height - 1);
    block = chain.mineBlock([...makePaymentTxs(deployerWallet.address, borrower_1.address,sender,recipient,500,1,regularPaymentDue + loanAmount,"08",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN,CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1, XBTC)]);
    
    // initiate claiming rewards
    block = chain.mineBlock([ SupplierInterface.withdrawRewards(P2PKH_VERSION, LP_1_ADDRESS_HASH, 0, LP_TOKEN, 0, LIQUIDITY_VAULT, XBTC, LP_1.address) ]);
    rewardsEarned = consumeUint(block.receipts[0].result.expectOk());
    block = chain.mineBlock([ ...finalizeOutboundTxs(LP_1_ADDRESS_HASH, rewardsEarned, 2, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address) ]);
    // end of claiming rewards

    let globals = Globals.getGlobals(chain, deployerWallet.address).expectTuple();
    let cooldownTime = consumeUint(globals["lp-cooldown-period"]);

    block = pool.signalWithdrawal(LP_TOKEN,0, amountSent, LP_1.address);
    chain.mineEmptyBlock(cooldownTime);

    block = chain.mineBlock([ SupplierInterface.withdraw(amountSent, P2PKH_VERSION, LP_1_ADDRESS_HASH, 0, LP_TOKEN,ZP_TOKEN, 0,LIQUIDITY_VAULT, XBTC, LP_1.address) ]);
    block = chain.mineBlock([ ...finalizeOutboundTxs(LP_1_ADDRESS_HASH, amountSent, 3, chain.blockHeight - 1, deployerWallet.address, deployerWallet.address) ]);
  },
});