import { initSimnet } from "@hirosystems/clarinet-sdk";
import { describe, expect, it, beforeEach } from "vitest";
import { Cl, cvToJSON, cvToString, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { MintableToken } from "./models/token";
import { Oracle } from "./models/oracle";

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
const lpstSTX = "lp-ststx";
const lpUSDA = "lp-usda";
const lpxUSD = "lp-xusd";

const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const oracle = "oracle";
const diko = "diko";
const sBTC = "sBTC";
const stSTX = "ststx";
const USDA = "usda";
const xUSD = "xusd";

const max_value = BigInt("340282366920938463463374607431768211455");

const ONE = 100_000_000;

describe("Math", () => {
  it("Get correct price from assets with different decimals", () => {
    let callResponse = simnet.callReadOnlyFn(
      `math`,
      "mul-to-fixed-precision",
      [Cl.uint(100_000_000), Cl.uint(8), Cl.uint(40_000 * ONE)],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(40_000 * ONE);

    callResponse = simnet.callReadOnlyFn(
      `math`,
      "mul-to-fixed-precision",
      [Cl.uint(50_000_000), Cl.uint(8), Cl.uint(40_000 * ONE)],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(20_000 * ONE);

    callResponse = simnet.callReadOnlyFn(
      `math`,
      "mul-to-fixed-precision",
      [Cl.uint(123), Cl.uint(8), Cl.uint(40_000 * ONE)],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(4920000);

    callResponse = simnet.callReadOnlyFn(
      `math`,
      "mul-to-fixed-precision",
      [Cl.uint(1_234_567), Cl.uint(6), Cl.uint(1 * ONE)],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(123456700);

    callResponse = simnet.callReadOnlyFn(
      `math`,
      "mul-to-fixed-precision",
      [Cl.uint(2_222_333), Cl.uint(6), Cl.uint(ONE / 2)],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(111116650);
  });
  it("Get Y from X", () => {
    let callResponse = simnet.callReadOnlyFn(
      `math`,
      "get-y-from-x",
      [
        Cl.uint(100_000_000),
        Cl.uint(8),
        Cl.uint(6),
        Cl.uint(40000 * ONE),
        Cl.uint(2 * ONE),
      ],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(20_000_000_000);
    callResponse = simnet.callReadOnlyFn(
      `math`,
      "get-y-from-x",
      [
        Cl.uint(123_456_789),
        Cl.uint(8),
        Cl.uint(6),
        Cl.uint(40000 * ONE),
        Cl.uint(2 * ONE),
      ],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(24_691_357_800);
    // console.log(Cl.prettyPrint(callResponse.result));
  });
  it("mul-perc", () => {
    let ZERO_ZERO_5 = ONE / 20;
    let callResponse = simnet.callReadOnlyFn(
      `math`,
      "mul-perc",
      [Cl.uint(20_000_000_000), Cl.uint(6), Cl.uint(ONE + ZERO_ZERO_5)],
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeUint(21_000_000_000);
    callResponse = simnet.callReadOnlyFn(
      `math`,
      "mul-perc",
      [Cl.uint(24_691_357_800), Cl.uint(6), Cl.uint(ONE + ZERO_ZERO_5)],
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeUint(25_925_925_690);
  });
});
