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
import { Payment } from '../../interfaces/payment.ts';
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
  getBP,
  sendFundsP2SHTxsWrap,
  makePaymentTxs,
  finalizeDrawdown
} from '../../interfaces/common.ts';

import {
  LP_TOKEN,
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
  SWAP_ROUTER,
  CP_REWARDS_TOKEN,
  COVER_VAULT
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Liquidity providers can send funds to the liquidity vault - wrapped",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_2 = accounts.get("wallet_2") as Account; // LP_2
    let wallet_7 = accounts.get("wallet_7") as Account; // DELEGATE_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    let block = chain.mineBlock([
      Bridge.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxsWrap(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,300_000_000,preimage,supplierId, 300_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    assetMaps = chain.getAssetsMaps();
    assertEquals(assetMaps.assets[".Wrapped-Bitcoin.wrapped-bitcoin"][`${deployerWallet.address}.liquidity-vault-v1-0`], 300000000);
  },
});

Clarinet.test({
  name: "Liquidity providers can withdraw xBTC rewards - wrapped",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_2 = accounts.get("wallet_2") as Account; // LP_2
    let wallet_7 = accounts.get("wallet_7") as Account; // DELEGATE_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Bridge.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    let block = chain.mineBlock([
      Bridge.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxsWrap(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,300_000_000,preimage,supplierId,300_000_000 * fee / 10_000,1,chain.blockHeight - 1)
    ]);

    block = pool.createLoan(LP_TOKEN,0,100_000_000,XBTC,0,XBTC,300,12960,1440,COLL_VAULT,FUNDING_VAULT,wallet_8.address);
    block = pool.fundLoan(0,LP_TOKEN,0,LIQUIDITY_VAULT,FUNDING_VAULT,XBTC,wallet_7.address);

    block = chain.mineBlock([SupplierInterface.updateLiquidity(chain.blockHeight, 100_000_000, deployerWallet.address)]);
    
    block = chain.mineBlock([SupplierInterface.drawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, P2PKH_VERSION, HASH, 0, SWAP_ROUTER,XBTC, wallet_8.address)]);
    block = chain.mineBlock([...finalizeDrawdown(0, LP_TOKEN, 0, XBTC, COLL_VAULT, FUNDING_VAULT, XBTC, HASH, 99700000, 0, 28, wallet_8.address, deployerWallet.address)]);

    // block = chain.mineBlock([...finalizeOutboundTxs(HASH, 99000000, 0, 58010, wallet_8.address, deployerWallet.address)]);
    chain.mineEmptyBlock(1300);

    let regularPaymentDue = (consumeUint(Payment.getCurrentLoanPayment(chain, 0, wallet_8.address)));
    let delegateFee = Math.floor(consumeUint(pool.getPool(0)["delegate-fee"]) / 10000 * regularPaymentDue);
    let minPaymentToReceive =  Math.floor(regularPaymentDue * fee / 10_000);

    block = chain.mineBlock([
      Bridge.initializeSwapper(wallet_8.address),
      ...makePaymentTxs(deployerWallet.address, wallet_8.address,sender,recipient,500,1,regularPaymentDue,"00",supplierId,minPaymentToReceive,0, PAYMENT, LP_TOKEN,LIQUIDITY_VAULT, 0, CP_TOKEN, CP_REWARDS_TOKEN, ZP_TOKEN, SWAP_ROUTER,chain.blockHeight - 1,XBTC)
    ]);


    block = Globals.setcontingencyPlan(chain, true, deployerWallet.address);
    let prev = chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"];
    block = chain.mineBlock([
      SupplierInterface.withdrawRewardsXBTC(LP_TOKEN, 0, LIQUIDITY_VAULT, XBTC, wallet_1.address)
    ]);

    assertEquals(chain.getAssetsMaps().assets[".Wrapped-Bitcoin.wrapped-bitcoin"]["ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"] - prev, consumeUint(block.receipts[0].result.expectOk() as string));
  },
});
