import { initSimnet } from "@hirosystems/clarinet-sdk";
import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType, cvToJSON, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";
import { ZToken } from "./models/zToken";

const simnet = await initSimnet();

const accounts = simnet.getAccounts();
const deployerAddress = accounts.get("deployer")!;
const LP_1 = accounts.get("wallet_1")!;
const LP_2 = accounts.get("wallet_4")!;
const LP_3 = accounts.get("wallet_5")!;
const Borrower_1 = accounts.get("wallet_2")!;
const Delegate_1 = accounts.get("wallet_3")!;
const Borrower_2 = accounts.get("wallet_4")!;

const contractInterfaces = simnet.getContractsInterfaces();
const poolv20Interface = contractInterfaces.get(`${deployerAddress}.pool-v2-0`);

const lpdiko = "lp-diko";
const lpsBTC = "lp-sbtc";
const lpsBTCv1 = "lp-sbtc-v1";
const lpsBTCv2 = "lp-sbtc-v2";
const lpstSTX = "lp-ststx";
const lpstSTXv1 = "lp-ststx-v1";
const lpstSTXv2 = "lp-ststx-v2";
const lpUSDA = "lp-usda";
const lpUSDAv1 = "lp-usda-v1";
const lpxUSD = "lp-xusd";

const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const oracle = "oracle";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sbtc";
const stSTX = "ststx";
const zstSTX = lpstSTXv2;
const zsBTC = lpsBTCv2;
const zwstx = "lp-wstx-v1";
const USDA = "usda";
const xUSD = "xusd";
const wstx = "wstx";

const zsbtc = lpsBTCv2;
const zststx = lpstSTXv2;

const max_value = BigInt("340282366920938463463374607431768211455");

describe("Confirm pass permission", () => {
  it("Call validate-assets", () => {
    let callResponse = simnet.callPublicFn(
      "pool-0-reserve-v1-2",
      "set-admin",
      [Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);
    callResponse = simnet.callReadOnlyFn(
      "pool-0-reserve-v1-2",
      "is-admin",
      [Cl.standardPrincipal(deployerAddress)],
      deployerAddress
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.BoolTrue);
    callResponse = simnet.callPublicFn(
      "pool-0-reserve-v1-2",
      "confirm-admin-transfer",
      [],
      deployerAddress
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseErr);
    callResponse = simnet.callPublicFn(
      "pool-0-reserve-v1-2",
      "confirm-admin-transfer",
      [],
      Borrower_1
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);
    callResponse = simnet.callReadOnlyFn(
      "pool-0-reserve-v1-2",
      "is-admin",
      [Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.BoolTrue);
    callResponse = simnet.callReadOnlyFn(
      "pool-0-reserve-v1-2",
      "is-admin",
      [Cl.standardPrincipal(deployerAddress)],
      deployerAddress
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.BoolFalse);

    // configurator
    callResponse = simnet.callPublicFn(
      "pool-0-reserve-v1-2",
      "set-configurator",
      [Cl.standardPrincipal(Borrower_2)],
      Borrower_1
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);
    callResponse = simnet.callReadOnlyFn(
      "pool-0-reserve-v1-2",
      "is-configurator",
      [Cl.standardPrincipal(deployerAddress)],
      deployerAddress
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.BoolTrue);
    callResponse = simnet.callPublicFn(
      "pool-0-reserve-v1-2",
      "confirm-configurator-transfer",
      [],
      Borrower_1
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseErr);
    callResponse = simnet.callPublicFn(
      "pool-0-reserve-v1-2",
      "confirm-configurator-transfer",
      [],
      Borrower_2
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);
    callResponse = simnet.callReadOnlyFn(
      "pool-0-reserve-v1-2",
      "is-configurator",
      [Cl.standardPrincipal(Borrower_2)],
      deployerAddress
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.BoolTrue);
    callResponse = simnet.callReadOnlyFn(
      "pool-0-reserve-v1-2",
      "is-configurator",
      [Cl.standardPrincipal(deployerAddress)],
      deployerAddress
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.BoolFalse);
  });
});
