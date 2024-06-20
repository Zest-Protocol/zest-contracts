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

// {
//   base-variable-borrow-rate: u0,
//   variable-rate-slope-1: u7000000,
//   variable-rate-slope-2: u300000000,
//   optimal-utilization-rate: u45000000,
//   liquidation-close-factor-percent: u5000000,
//   origination-fee-prc: u0,
//   reserve-factor: u10000000,
// }

describe("Math", () => {
  it("Do this", () => {
    let callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(0)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-1",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(10000000)],
      // [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(7000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-2",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(300000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-optimal-utilization-rate",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(45000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-liquidation-close-factor-percent",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(5000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-origination-fee-prc",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(0)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-reserve-factor",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(10000000)],
      deployerAddress
    );

    // const totalLiq = Math.floor(981_589_000_000 / (1 - 0.33));
    const totalLiq = Math.floor(981_589_000_000 / (1 - 0.45));
    // console.log(totalLiq);
    callResponse = simnet.callReadOnlyFn(
      `pool-0-reserve-v1-2`,
      "calculate-interest-rates",
      [
        // Cl.uint(totalLiq - Math.floor(totalLiq * 0.3268)),
        Cl.uint(totalLiq - Math.floor(totalLiq * 0.45)),
        Cl.uint(0),
        // Cl.uint(Math.floor(totalLiq * 0.3268)),
        Cl.uint(Math.floor(totalLiq * 0.45)),
        Cl.uint(0),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(6),
      ],
      deployerAddress
    );
    // expect(callResponse.result).toBeUint(40_000 * ONE);
    // console.log(Cl.prettyPrint(callResponse.result));
  });
});
