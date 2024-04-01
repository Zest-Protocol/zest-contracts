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
import { ZestRewardDist } from '../../interfaces/zestRewardDist.ts';
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
  COLL_VAULT,
  FUNDING_VAULT,
  P2PKH_VERSION,
  HASH,
  XBTC,
  SWAP_ROUTER,
  recipient,
  sender,
  preimage,
  ONE_DAY,
  CP_REWARDS_TOKEN,
  COVER_VAULT
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Liquidity providers get the correct share of the zest rewards pool.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let wallet_1 = accounts.get("wallet_1") as Account; // LP_1
    let wallet_2 = accounts.get("wallet_2") as Account; // LP_2
    let wallet_7 = accounts.get("wallet_7") as Account; // Delegate_1
    let wallet_8 = accounts.get("wallet_8") as Account; // borrower_1
    let wallet_9 = accounts.get("wallet_9") as Account; // borrower_2

    let assetMaps = chain.getAssetsMaps();
    let pool = new Pool(chain, deployerWallet);
    let loan = new Loan(chain, deployerWallet);

    let block = Globals.onboardUserAddress(chain, wallet_8.address, P2PKH_VERSION, HASH, deployerWallet.address);

    pool.createPool(wallet_7.address,LP_TOKEN,ZP_TOKEN,PAYMENT,REWARDS_CALC,1000,1000,10_000_000_000,10_000_000_000,1,MAX_MATURITY_LENGTH,LIQUIDITY_VAULT,CP_TOKEN,COVER_VAULT,CP_REWARDS_TOKEN,XBTC,true);
    pool.finalizePool(wallet_7.address, LP_TOKEN, ZP_TOKEN, CP_TOKEN, 0);

    let supplierId = consumeUint(chain.mineBlock([...registerSupplierTxs(deployerWallet.address, deployerWallet.address, recipient, 10, 10, 500, 500, "supplier-1", 10_000_000_000)]).receipts[1].result.expectOk() as string);
    let fee = Number(Magic.getSupplier(chain, supplierId, deployerWallet.address).expectSome().expectTuple()["inbound-fee"].expectSome());

    block = chain.mineBlock([
      Magic.initializeSwapper(wallet_1.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_1.address,sender,recipient,500,0,300_000_000,preimage,supplierId,300_000_000*fee/10_000,8,5),
      Magic.initializeSwapper(wallet_2.address),
      ...sendFundsP2SHTxs(deployerWallet.address,0,wallet_2.address,sender,recipient,500,1,300_000_000,preimage,supplierId,300_000_000*fee/10_000,8,5)
    ]);

    ZestRewardDist.getCycleSharePrincipal(0, 0, wallet_1.address, chain, deployerWallet.address).result.expectUint(0);
    ZestRewardDist.getCycleSharePrincipal(0, 1, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000_000_000);
    ZestRewardDist.getCycleSharePrincipal(0, 2, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000_000_000);
    ZestRewardDist.getCycleSharePrincipal(0, 3, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000_000_000);
    ZestRewardDist.getCycleSharePrincipal(0, 4, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000_000_000);
    ZestRewardDist.getCycleSharePrincipal(0, 5, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000_000_000);
    ZestRewardDist.getCycleSharePrincipal(0, 6, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000_000_000);
    ZestRewardDist.getCycleSharePrincipal(0, 7, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000_000_000);
    ZestRewardDist.getCycleSharePrincipal(0, 8, wallet_1.address, chain, deployerWallet.address).result.expectUint(30_000_000_000_000);
    ZestRewardDist.getCycleSharePrincipal(0, 9, wallet_1.address, chain, deployerWallet.address).result.expectUint(0);
  },
});
