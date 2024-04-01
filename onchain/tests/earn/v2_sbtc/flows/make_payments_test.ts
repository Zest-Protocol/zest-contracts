// deno-lint-ignore-file
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.5.4/index.ts';
import { assertEquals, assert } from 'https://deno.land/std@0.159.0/testing/asserts.ts';
import { Pool } from '../interfaces/pool-v1-0.ts';
import { CoverPool } from '../interfaces/cover-pool-v1-0.ts';
import { Loan } from '../interfaces/loan-v1-0.ts';
import { LPToken } from '../interfaces/lp-token.ts';
import { CPToken } from '../interfaces/cp-token.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";
import { TestUtils } from '../interfaces/test-utils.ts';
import { Magic } from '../interfaces/magic_real.ts';
import { Globals } from '../interfaces/globals.ts';
import { SupplierInterface } from '../interfaces/supplier_interface.ts';
import { SwapRouter } from '../interfaces/swapRouter.ts';
import { MagicCaller } from '../interfaces/magic-caller.ts';
import { Payment } from '../interfaces/payment.ts';
import { WithdrawalManager } from '../interfaces/withdrawal-manager.ts';

import * as util from "../util.ts";
import * as common from '../interfaces/common.ts';

import {
  LP_TOKEN_0,
  WITHDRAWAL_MANAGER,
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
  CP_REWARDS_TOKEN,
  ERRORS,
  SWAP_ROUTER,
  SUPPLIER_CONTROLLER_0,
  XUSD_CONTRACT_SIMNET,
  USDA_CONTRACT_SIMNET,
  COVER_VAULT,
  DAYS_PER_YEAR,
  POOL_V2_0,
  LOAN_V1_0,
} from "../config.ts";

const MAX_MATURITY_LENGTH = 144 * 365 * 3; // 3 years

Clarinet.test({
  name: "Borrower completely pays their loan. Liquidity Provider can claim all of their funds back + rewards.",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let deployerWallet = accounts.get("deployer") as Account;
    let LP_1 = accounts.get("wallet_1") as Account; // LP_1 ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
    let LP_2 = accounts.get("wallet_2") as Account; // LP_2 ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG
    let LP_3 = accounts.get("wallet_3") as Account; // LP_3
    let LP_4 = accounts.get("wallet_4") as Account; // LP_4

    const MAGIC_CALLER_CONTRACT_NAME = "magic-caller";

    let delegate_1 = accounts.get("wallet_7") as Account; // Delegate_1
    let borrower_1 = accounts.get("wallet_8") as Account; // borrower_1

    let temp = chain.mineBlock([common.createMagicCallerDeployTx(MAGIC_CALLER_CONTRACT_NAME, LP_1.address)]);

    console.log(temp);

    


  },
});
