import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType, cvToJSON, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";

import * as config from "./tools/config";
import { initSimnetChecker } from "./tools/SimnetChecker";
import { deployPythContracts, deployV2_1Contracts, deployV2Contracts, deployV2TokenContracts, initializeRewards, setGracePeriodVars } from "./tools/common";
import { incentivesDummy } from "./tools/config";
import { isWithinMarginOfError } from "../utils/utils";

const simnet = await initSimnetChecker();

const accounts = simnet.getAccounts();
const deployerAddress = accounts.get("deployer")!;
const LP_1 = accounts.get("wallet_1")!;
const LP_2 = accounts.get("wallet_4")!;
const LP_3 = accounts.get("wallet_5")!;
const Liquidator_1 = accounts.get("wallet_5")!;
const Borrower_1 = accounts.get("wallet_2")!;
const Delegate_1 = accounts.get("wallet_3")!;
const Borrower_2 = accounts.get("wallet_4")!;

const contractInterfaces = simnet.getContractsInterfaces();
const poolv20Interface = contractInterfaces.get(`${deployerAddress}.pool-v2-0`);


const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const oracle = "oracle";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sbtc";
const stSTX = "ststx";
const USDA = "usda";
const xUSD = "xusd";
const wstx = "wstx";

const max_value = BigInt("340282366920938463463374607431768211455");

describe("Supply and Redeem", () => {
  beforeEach(() => {
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      160_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      4_000_000_000_000,
      deployerAddress
    );
    oracleContract.setPrice(deployerAddress, diko, 40000000, deployerAddress);
    oracleContract.setPrice(deployerAddress, USDA, 99000000, deployerAddress);
    oracleContract.setPrice(
      deployerAddress,
      xUSD,
      100_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      wstx,
      160_000_000,
      deployerAddress
    );

    let callResponse = simnet.callPublicFn(
      config.poolReserveData,
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(0)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      config.poolReserveData,
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(0)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      config.poolReserveData,
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.uint(0)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(0)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(0)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(0)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-1",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(4000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-1",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(4000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-1",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.uint(4000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-1",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(4000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-1",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(4000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-1",
      [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(4000000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-2",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(300000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-2",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(300000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-2",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.uint(300000000)],
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
      "set-variable-rate-slope-2",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(300000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-2",
      [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(300000000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-optimal-utilization-rate",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(80000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-optimal-utilization-rate",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(80000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-optimal-utilization-rate",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.uint(80000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-optimal-utilization-rate",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(80000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-optimal-utilization-rate",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(80000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-optimal-utilization-rate",
      [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(80000000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-liquidation-close-factor-percent",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(50000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-liquidation-close-factor-percent",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(50000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-liquidation-close-factor-percent",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.uint(50000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-liquidation-close-factor-percent",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(50000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-liquidation-close-factor-percent",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(50000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-liquidation-close-factor-percent",
      [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(50000000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-flashloan-fee-total",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(35)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-flashloan-fee-total",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(35)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-flashloan-fee-protocol",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(3000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-flashloan-fee-protocol",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(3000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-origination-fee-prc",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(25)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-origination-fee-prc",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(25)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-origination-fee-prc",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.uint(25)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-origination-fee-prc",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(25)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-origination-fee-prc",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(25)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-origination-fee-prc",
      [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(25)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-reserve-factor",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(15000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-reserve-factor",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(10000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-reserve-factor",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.uint(10000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-reserve-factor",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(10000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-reserve-factor",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(10000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-reserve-factor",
      [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(10000000)],
      deployerAddress
    );

    simnet.deployContract(
      "run-reserve-extra-variables",
      readFileSync(config.reserveExtraVariables).toString(),
      null,
      deployerAddress
    );

    simnet.setEpoch("3.0");
    deployV2Contracts(simnet, deployerAddress);
    deployV2TokenContracts(simnet, deployerAddress);
    deployPythContracts(simnet, deployerAddress);
    deployV2_1Contracts(simnet, deployerAddress);

    simnet.deployContract(
      "run-1",
      readFileSync(config.initContractsToV2_1).toString(),
      null,
      deployerAddress
    );

    initializeRewards(simnet, deployerAddress);
  });

  it("Supply STX, enable STX e-mode, borrow STX category, try borrow outside of STX category get error, try to go back to default fail, repay, go back to default", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    let callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal(Borrower_1),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(3_000_000_000),
        Cl.standardPrincipal(LP_1),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      USDA,
      "mint",
      [
        Cl.uint(2_000_000_000_000_000),
        Cl.standardPrincipal(Borrower_1)
      ],
      deployerAddress
    );

    callResponse = simnet.transferSTX(400_000_000_000, LP_1, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpStstx,
      deployerAddress,
      stSTX,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, stSTX, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpwstx,
      deployerAddress,
      wstx,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, wstx, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpUsda,
      deployerAddress,
      USDA,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, USDA, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      wstx,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      USDA,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      wstx,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      USDA,
      true,
      50000000,
      80000000,
      50000000,
      deployerAddress
    );
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      160_000_000,
      deployerAddress
    );

    oracleContract.setPrice(
      deployerAddress,
      wstx,
      150_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      USDA,
      100_000_000,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpwstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(50_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.uint(100_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(3_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    const prevLtv = Number(cvToJSON(callResponse.result)["value"]["value"]["current-ltv"]["value"]);
    const prevLT = Number(cvToJSON(callResponse.result)["value"]["value"]["current-liquidation-threshold"]["value"]);
    expect(prevLtv).toBe(51374046)
    expect(prevLT).toBe(80458015)

    // set up e-mode type settings (STX category)
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-enabled",
      [
        Cl.bufferFromHex("0x01"),
        Cl.bool(true)
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-config",
      [
        Cl.bufferFromHex("0x01"),
        Cl.uint(95000000),
        Cl.uint(97000000),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-config",
      [
        Cl.bufferFromHex("0x02"),
        Cl.uint(95000000),
        Cl.uint(97000000),
      ],
      deployerAddress
    );

    // set up e-mode type settings (STX category)
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.bufferFromHex("0x01")
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bufferFromHex("0x01")
      ],
      deployerAddress
    );

    // set up e-mode type settings (stablecoins)
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-enabled",
      [
        Cl.bufferFromHex("0x02"),
        Cl.bool(true)
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.bufferFromHex("0x02")
      ],
      deployerAddress
    );

    // try to set emode to STX when using USDA and STX as collateral
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-e-mode",
      [
        Cl.principal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          })
        ]),
        Cl.bufferFromHex("0x01"),
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30029));

    // disable USDA use as collateral before turning on e-mode
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.bool(false),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "set-e-mode",
      [
        Cl.principal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          })
        ]),
        Cl.bufferFromHex("0x01"),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callReadOnlyFn(
      config.pool0Reserve,
      "get-e-mode-config",
      [
        Cl.principal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, wstx)
      ],
      Borrower_1
    );
    expect((callResponse.result)).toBeOk(Cl.tuple({ "liquidation-threshold": Cl.uint(97000000), "ltv": Cl.uint(95000000) }));
    callResponse = simnet.callReadOnlyFn(
      config.pool0Reserve,
      "get-e-mode-config",
      [
        Cl.principal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, USDA)
      ],
      Borrower_1
    );
    expect((callResponse.result)).toBeOk(Cl.tuple({ "liquidation-threshold": Cl.uint(80000000), "ltv": Cl.uint(50000000) }));

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    let AfterLtv = Number(cvToJSON(callResponse.result)["value"]["value"]["current-ltv"]["value"]);
    let AfterLT = Number(cvToJSON(callResponse.result)["value"]["value"]["current-liquidation-threshold"]["value"]);
    expect(AfterLtv).toBeGreaterThan(prevLtv);
    expect(AfterLT).toBeGreaterThan(prevLT);

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          })
        ]),
      ],
      Borrower_1
    );
    const maxAmount = cvToValue(callResponse.result)["value"];

    callResponse = simnet.callPublicFn(
      config.pool0ReserveV2,
      "get-reserve-available-liquidity",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, config.lpwstx),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          })
        ]),
        Cl.uint(maxAmount),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-e-mode",
      [
        Cl.principal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          })
        ]),
        Cl.bufferFromHex("0x02"),
        Cl.none(),
      ],
      Borrower_1
    );
    // fails to change because it's borrowing
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseErr);

    // cannot borrow different category (stablecoin)
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          })
        ]),
        Cl.uint(100_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30016));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    // can change mode out of default after repaying or with enough collateral
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "set-e-mode",
      [
        Cl.principal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          })
        ]),
        Cl.bufferFromHex("0x00"),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    AfterLtv = Number(cvToJSON(callResponse.result)["value"]["value"]["current-ltv"]["value"]);
    AfterLT = Number(cvToJSON(callResponse.result)["value"]["value"]["current-liquidation-threshold"]["value"]);
    expect(AfterLtv).toBe(80000000)
    expect(AfterLT).toBe(90000000)
  });
  it("Supply STX, enable STX e-mode, borrow STX category in default mode", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    let callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal(Borrower_1),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(3_000_000_000),
        Cl.standardPrincipal(LP_1),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      USDA,
      "mint",
      [
        Cl.uint(2_000_000_000_000_000),
        Cl.standardPrincipal(Borrower_1)
      ],
      deployerAddress
    );

    callResponse = simnet.transferSTX(400_000_000_000, LP_1, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpStstx,
      deployerAddress,
      stSTX,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, stSTX, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpwstx,
      deployerAddress,
      wstx,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, wstx, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpUsda,
      deployerAddress,
      USDA,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, USDA, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      wstx,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      USDA,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      wstx,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      USDA,
      true,
      50000000,
      80000000,
      50000000,
      deployerAddress
    );
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const ststxPrice = 160_000_000;
    const wstxPrice = 150_000_000;
    const usdaPrice = 100_000_000;

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      ststxPrice,
      deployerAddress
    );

    oracleContract.setPrice(
      deployerAddress,
      wstx,
      wstxPrice,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      USDA,
      usdaPrice,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpwstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(50_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    const borrower1Supply = 3_000_000_000;

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(borrower1Supply),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    // set up e-mode type settings (STX category)
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-enabled",
      [
        Cl.bufferFromHex("0x01"),
        Cl.bool(true)
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-config",
      [
        Cl.bufferFromHex("0x01"),
        Cl.uint(95000000),
        Cl.uint(97000000),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-config",
      [
        Cl.bufferFromHex("0x02"),
        Cl.uint(95000000),
        Cl.uint(97000000),
      ],
      deployerAddress
    );

    // set up e-mode type settings (STX category)
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.bufferFromHex("0x01")
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bufferFromHex("0x01")
      ],
      deployerAddress
    );

    // set up e-mode type settings (stablecoins)
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-enabled",
      [
        Cl.bufferFromHex("0x02"),
        Cl.bool(true)
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.bufferFromHex("0x02")
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          })
        ]),
      ],
      Borrower_1
    );
    const maxAmount = cvToValue(callResponse.result)["value"];

    const ststxRatio = Math.floor((ststxPrice * 100000000) / wstxPrice);
    const borrower1Borrow = Math.floor(borrower1Supply * 0.80 * ststxRatio / 100000000);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, config.lpwstx),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          })
        ]),
        Cl.uint(maxAmount),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);
    expect(isWithinMarginOfError(borrower1Borrow, maxAmount, 0.001)).toBe(true)
  });
  it("Supply STX, enable STX e-mode, borrow 2 STX category", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    let callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal(Borrower_1),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      USDA,
      "mint",
      [
        Cl.uint(2_000_000_000_000_000),
        Cl.standardPrincipal(Borrower_1)
      ],
      deployerAddress
    );
    callResponse = simnet.transferSTX(400_000_000_000, LP_1, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpStstx,
      deployerAddress,
      stSTX,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, stSTX, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpwstx,
      deployerAddress,
      wstx,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, wstx, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpUsda,
      deployerAddress,
      USDA,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, USDA, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      wstx,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      USDA,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      wstx,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      USDA,
      true,
      50000000,
      80000000,
      50000000,
      deployerAddress
    );
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      160_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      wstx,
      150_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      USDA,
      100_000_000,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpwstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(50_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(50_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(3_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    // set up e-mode type settings (STX category)
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-enabled",
      [
        Cl.bufferFromHex("0x01"),
        Cl.bool(true)
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-config",
      [
        Cl.bufferFromHex("0x01"),
        Cl.uint(95000000),
        Cl.uint(97000000),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-config",
      [
        Cl.bufferFromHex("0x02"),
        Cl.uint(95000000),
        Cl.uint(97000000),
      ],
      deployerAddress
    );

    // set up e-mode type settings (STX category)
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.bufferFromHex("0x01")
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bufferFromHex("0x01")
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-enabled",
      [
        Cl.bufferFromHex("0x02"),
        Cl.bool(true)
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.bufferFromHex("0x02")
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "set-e-mode",
      [
        Cl.principal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          })
        ]),
        Cl.bufferFromHex("0x01"),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.uint(100_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          })
        ]),
      ],
      Borrower_1
    );
    let maxAmount = BigInt(cvToValue(callResponse.result)["value"]);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, config.lpwstx),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          })
        ]),
        // borrow 1/2 of power
        Cl.uint(maxAmount / 2n),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          })
        ]),
      ],
      Borrower_1
    );
    maxAmount = BigInt(cvToValue(callResponse.result)["value"]);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          })
        ]),
        // borrow 1/2 of power
        Cl.uint(maxAmount),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callReadOnlyFn(
      config.pool0Reserve,
      "get-user-assets",
      [
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(
      cvToValue(callResponse.result)['assets-supplied'].value[0].value
    ).toBe(cvToValue(Cl.contractPrincipal(deployerAddress, stSTX)));
    expect(
      cvToValue(callResponse.result)['assets-supplied'].value[1].value
    ).toBe(cvToValue(Cl.contractPrincipal(deployerAddress, USDA)));
    expect(
      cvToValue(callResponse.result)['assets-borrowed'].value[0].value
    ).toBe(cvToValue(Cl.contractPrincipal(deployerAddress, wstx)));
    expect(
      cvToValue(callResponse.result)['assets-borrowed'].value[1].value
    ).toBe(cvToValue(Cl.contractPrincipal(deployerAddress, stSTX)));
  });
  it("Supply STX, supply USDA, withdraw STX and USDA set e-mode to STX. Supply STX and enable other asset as collateral", () => {
    const assets = 
    Cl.list([
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, stSTX),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      }),
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, wstx),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      }),
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, USDA),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      })
    ]);
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    let callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal(Borrower_1),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      USDA,
      "mint",
      [
        Cl.uint(2_000_000_000_000_000),
        Cl.standardPrincipal(Borrower_1)
      ],
      deployerAddress
    );
    callResponse = simnet.transferSTX(400_000_000_000, LP_1, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpStstx,
      deployerAddress,
      stSTX,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, stSTX, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpwstx,
      deployerAddress,
      wstx,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, wstx, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpUsda,
      deployerAddress,
      USDA,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, USDA, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      wstx,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      USDA,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      wstx,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      USDA,
      true,
      50000000,
      80000000,
      50000000,
      deployerAddress
    );
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      160_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      wstx,
      150_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      USDA,
      100_000_000,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpwstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(50_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(50_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(3_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.uint(100_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    // set up e-mode type settings (STX category)
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-enabled",
      [
        Cl.bufferFromHex("0x01"),
        Cl.bool(true)
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-config",
      [
        Cl.bufferFromHex("0x01"),
        Cl.uint(95000000),
        Cl.uint(97000000),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-config",
      [
        Cl.bufferFromHex("0x02"),
        Cl.uint(95000000),
        Cl.uint(97000000),
      ],
      deployerAddress
    );

    // set up e-mode type settings (STX category)
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.bufferFromHex("0x01")
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bufferFromHex("0x01")
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-enabled",
      [
        Cl.bufferFromHex("0x02"),
        Cl.bool(true)
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.bufferFromHex("0x02")
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.bool(false),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        assets,
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bool(false),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        assets,
        Cl.none(),
      ],
      Borrower_1
    );

    // can set to e-mode if not using an asset as collateral
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "set-e-mode",
      [
        Cl.principal(Borrower_1),
        assets,
        Cl.bufferFromHex("0x01"),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "set-e-mode",
      [
        Cl.principal(Borrower_1),
        assets,
        Cl.bufferFromHex("0x00"),
        Cl.none(),
      ],
      Borrower_1
    );

    // can set to e-mode if not using an asset as collateral
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "set-e-mode",
      [
        Cl.principal(Borrower_1),
        assets,
        Cl.bufferFromHex("0x01"),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        assets,
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30031));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        assets,
        Cl.none(),
      ],
      Borrower_1
    );
  });
  it("Supply STX, set to STX e-mode, supply USDA and should not be able to set use as collateral.", () => {
    const assets = 
    Cl.list([
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, stSTX),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      }),
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, wstx),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      }),
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, USDA),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      })
    ]);
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    let callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal(Borrower_1),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      USDA,
      "mint",
      [
        Cl.uint(2_000_000_000_000_000),
        Cl.standardPrincipal(Borrower_1)
      ],
      deployerAddress
    );
    callResponse = simnet.transferSTX(400_000_000_000, LP_1, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpStstx,
      deployerAddress,
      stSTX,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, stSTX, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpwstx,
      deployerAddress,
      wstx,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, wstx, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpUsda,
      deployerAddress,
      USDA,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, USDA, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      wstx,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      USDA,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      wstx,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      USDA,
      true,
      50000000,
      80000000,
      50000000,
      deployerAddress
    );
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      160_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      wstx,
      150_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      USDA,
      100_000_000,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpwstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(50_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(50_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(3_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.uint(100_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    // set up e-mode type settings (STX category)
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-enabled",
      [
        Cl.bufferFromHex("0x01"),
        Cl.bool(true)
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-config",
      [
        Cl.bufferFromHex("0x01"),
        Cl.uint(95000000),
        Cl.uint(97000000),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-config",
      [
        Cl.bufferFromHex("0x02"),
        Cl.uint(95000000),
        Cl.uint(97000000),
      ],
      deployerAddress
    );

    // set up e-mode type settings (STX category)
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.bufferFromHex("0x01")
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bufferFromHex("0x01")
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-enabled",
      [
        Cl.bufferFromHex("0x02"),
        Cl.bool(true)
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.bufferFromHex("0x02")
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        assets,
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-e-mode",
      [
        Cl.principal(Borrower_1),
        assets,
        Cl.bufferFromHex("0x01"),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.uint(100_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );
    callResponse = simnet.callReadOnlyFn(
      config.pool0Reserve,
      "get-user-reserve-data",
      [
        Cl.principal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, USDA)
      ],
      Borrower_1
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(false);

    // cannot enable asset that is not of same e-mode type
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30031));
  });
  it("Supply stSTX, borrow wstx, liquidate", () => {
    const assets = 
    Cl.list([
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, stSTX),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      }),
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, wstx),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      }),
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, USDA),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      })
    ]);
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    let callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal(Borrower_1),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      USDA,
      "mint",
      [
        Cl.uint(2_000_000_000_000_000),
        Cl.standardPrincipal(Borrower_1)
      ],
      deployerAddress
    );
    callResponse = simnet.transferSTX(400_000_000_000, LP_1, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpStstx,
      deployerAddress,
      stSTX,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, stSTX, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpwstx,
      deployerAddress,
      wstx,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, wstx, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpUsda,
      deployerAddress,
      USDA,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, USDA, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      wstx,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      USDA,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      wstx,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      USDA,
      true,
      50000000,
      80000000,
      50000000,
      deployerAddress
    );
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const ststxPrice = 160_000_000;
    const wstxPrice = 150_000_000;

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      ststxPrice,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      wstx,
      wstxPrice,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      USDA,
      100_000_000,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpwstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(3_100_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(50_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(3_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.uint(100_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    // set up e-mode type settings (STX category)
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-enabled",
      [
        Cl.bufferFromHex("0x01"),
        Cl.bool(true)
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-config",
      [
        Cl.bufferFromHex("0x01"),
        Cl.uint(95000000),
        Cl.uint(97000000),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-config",
      [
        Cl.bufferFromHex("0x02"),
        Cl.uint(95000000),
        Cl.uint(97000000),
      ],
      deployerAddress
    );

    // set up e-mode type settings (STX category)
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.bufferFromHex("0x01")
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bufferFromHex("0x01")
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-e-mode-type-enabled",
      [
        Cl.bufferFromHex("0x02"),
        Cl.bool(true)
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-asset-e-mode-type",
      [
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.bufferFromHex("0x02")
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        assets,
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-e-mode",
      [
        Cl.principal(Borrower_1),
        assets,
        Cl.bufferFromHex("0x01"),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolReserveData4,
      "set-approved-contract",
      [
        Cl.standardPrincipal(deployerAddress),
        Cl.bool(true),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolReserveData4,
      "set-liquidation-bonus-e-mode",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(5000000),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.poolReserveData4,
      "set-liquidation-bonus-e-mode",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(5000000),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.standardPrincipal(Borrower_1),
        assets,
      ],
      Borrower_1
    );
    const borrowingPower = cvToValue(callResponse.result)["value"];

    setGracePeriodVars(simnet, deployerAddress);
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, config.lpwstx),
        assets,
        Cl.uint(borrowingPower),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );
    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        assets,
      ],
      Borrower_1
    );
    // let userGlobalData = cvToValue(callResponse.result);
    // console.log(userGlobalData);
    simnet.mineEmptyBurnBlocks(600);

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        assets,
      ],
      Borrower_1
    );
    // userGlobalData = cvToValue(callResponse.result);
    // console.log(userGlobalData);


    const stxBefore = simnet.getAssetsMap().get("STX")?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
    // const stStxBefore = simnet
    // .getAssetsMap()
    // .get("STX")
    // ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
    const ststxBefore = simnet.getAssetsMap().get(".ststx.ststx")?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "liquidation-call",
      [
        assets,
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(max_value),
        Cl.bool(false),
        Cl.none(),
      ],
      LP_1
    );
    const stxAfter = simnet.getAssetsMap().get("STX")?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
    const ststxAfter = simnet.getAssetsMap().get(".ststx.ststx")?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;

    const debtRepaid = stxAfter - stxBefore;
    const collateralPurchased = ststxBefore - ststxAfter;
    const stxEquivalent = Number(collateralPurchased) * (ststxPrice / wstxPrice);

    // console.log("Debt Repaid STX:", debtRepaid);
    // console.log("Collateral Purchased STSTX:", collateralPurchased);
    // console.log("STX Equivalent:", stxEquivalent);
    const bonusPrct = (Number(stxEquivalent) / Number(debtRepaid)) - 1;
    // console.log("Bonus Percentage:", bonusPrct);
    // bonus should be 5% after liquidation
    expect(isWithinMarginOfError(bonusPrct, 0.05, 0.001)).toBe(true)

  });
});
