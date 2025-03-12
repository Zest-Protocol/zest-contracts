import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";

import * as config from "./tools/config";
import { initSimnetChecker } from "./tools/SimnetChecker";
import { deployV2_1Contracts, deployV2Contracts, deployV2TokenContracts, initializeRewards } from "./tools/common";
import { incentivesDummy } from "./tools/config";

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
    deployV2_1Contracts(simnet, deployerAddress);

    callResponse = simnet.deployContract(
      "run-1",
      readFileSync(config.initContractsToV2_1).toString(),
      null,
      deployerAddress
    );
    initializeRewards(simnet, deployerAddress);

  });
  it("Supply and immediately redeem without returns", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    let callResponse = poolBorrow.init(
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

    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(LP_1)],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    expect(
      simnet
        .getAssetsMap()
        .get(".ststx.ststx")
        ?.get(`${deployerAddress}.pool-vault`)!
    ).toBe(0n);
    expect(simnet.getAssetsMap().get(".ststx.ststx")?.get(LP_1)!).toBe(
      1_000_000_000n
    );
  });
  it("Supply and immediately redeem without returns", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    let callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST1J9DETBQBWSTSQ1WDAS66WP8RTJHK1SMRZMZXVQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST21FPF3HJK57GXH9B5BB0FWZC8YDDK665APDYFQQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST1J9DETBQBWSTSQ1WDAS66WP8RTJHK1SMRZMZXVQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(3000000000),
        Cl.standardPrincipal("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000),
        Cl.standardPrincipal("ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST21FPF3HJK57GXH9B5BB0FWZC8YDDK665APDYFQQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      xUSD,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      USDA,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
      ],
      deployerAddress
    );

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
      config.lpSbtc,
      deployerAddress,
      sBTC,
      8,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, sBTC, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpDiko,
      deployerAddress,
      diko,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, diko, deployerAddress);

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

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpXusd,
      deployerAddress,
      xUSD,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, xUSD, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      sBTC,
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
      diko,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      USDA,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      xUSD,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.addIsolatedAsset(
      deployerAddress,
      stSTX,
      1_000_000_000_000,
      deployerAddress
    );
    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      xUSD,
      deployerAddress
    );
    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      USDA,
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
      sBTC,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      diko,
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
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
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
        Cl.uint(1_000_000_000),
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
        Cl.uint(10_000_000_000),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_2
    );

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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(200_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    simnet.mineEmptyBlocks(10);

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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(200_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[2].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[3].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[4].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[5].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[6].data.value!));

    // console.log(callResponse.events);
    callResponse = poolBorrow.getUserReserveData(
      Borrower_1,
      deployerAddress,
      USDA,
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_2),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_2
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        // Cl.contractPrincipal(deployerAddress, debtToken0),
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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(200_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_2),
      ],
      Borrower_2
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    // callResponse = poolBorrow.getUserReserveData(Borrower_1, deployerAddress, USDA, Borrower_1);
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_3),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_3
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    // console.log(Cl.prettyPrint(callResponse.result));
    callResponse = poolBorrow.getReserveState(
      deployerAddress,
      stSTX,
      deployerAddress
    );
    // console.log(simnet.getAssetsMap());

    simnet.mineEmptyBlocks(10);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(200_000_086),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(200_000_008 / 2),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_2
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_3),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_3
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
  });

  it("Supply and borrow small amounts immediately redeem with returns", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    let callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST1J9DETBQBWSTSQ1WDAS66WP8RTJHK1SMRZMZXVQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(1000000000000000), Cl.standardPrincipal(deployerAddress)],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST21FPF3HJK57GXH9B5BB0FWZC8YDDK665APDYFQQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST1J9DETBQBWSTSQ1WDAS66WP8RTJHK1SMRZMZXVQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(3000000000),
        Cl.standardPrincipal("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000),
        Cl.standardPrincipal("ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST21FPF3HJK57GXH9B5BB0FWZC8YDDK665APDYFQQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(BigInt("200000000000000000")), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      xUSD,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      USDA,
      "mint",
      [Cl.uint(BigInt("2000000000000000")), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

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
      config.lpSbtc,
      deployerAddress,
      sBTC,
      8,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, sBTC, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpDiko,
      deployerAddress,
      diko,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, diko, deployerAddress);

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

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpXusd,
      deployerAddress,
      xUSD,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      "xusd-oracle",
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, xUSD, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      sBTC,
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
      diko,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      USDA,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      xUSD,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.addIsolatedAsset(
      deployerAddress,
      stSTX,
      1_000_000_000_000,
      deployerAddress
    );
    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      xUSD,
      deployerAddress
    );
    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      USDA,
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));

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
      sBTC,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      diko,
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
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );

    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      10_000_000,
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
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.uint(1_000_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    // console.log("Supplying large amount");

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(BigInt("100000000000000")),
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
        Cl.uint(1),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_2
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(100_000_000),
        Cl.standardPrincipal(deployerAddress),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      `pool-reserve-data`,
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, "ststx"), Cl.uint(1_000_000)],
      deployerAddress
    );

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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "xusd-oracle"),
          }),
        ]),
        Cl.uint(100_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(deployerAddress),
      ],
      deployerAddress
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);
    // console.log(Cl.prettyPrint(callResponse.result));

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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "xusd-oracle"),
          }),
        ]),
        Cl.uint(1_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);
    // console.log(Cl.prettyPrint(callResponse.result));

    // console.log("Reserve state after small borrow");
    callResponse = poolBorrow.getReserveState(
      deployerAddress,
      stSTX,
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    // callResponse = simnet.callReadOnlyFn(
    //   "pool-read",
    //   "get-borrowed-balance-user-ststx",
    //   [Cl.standardPrincipal(Borrower_1)],
    //   Borrower_1
    // );
    // console.log("Borrower balance same block as borrowed")
    // console.log(Borrower_1);
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      `pool-reserve-data`,
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, "ststx"), Cl.uint(1_000_000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_2
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // console.log("Reserve state after repay");
    // callResponse = poolBorrow.getReserveState(deployerAddress, stSTX, deployerAddress);
    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log(callResponse.events);
    // console.log(Cl.prettyPrint(callResponse.events[7].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[8].data.value!));
    // console.log(Cl.prettyPrint(callResponse.result));

    // simnet.mineEmptyBlocks(10);

    callResponse = simnet.callPublicFnCheckOk(
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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(200_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    // expect(callResponse.result).toBeOk(Cl.uint(200000000));

    // console.log(callResponse.events);
    callResponse = poolBorrow.getUserReserveData(
      Borrower_1,
      deployerAddress,
      USDA,
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_2),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_2
    );
    // console.log(Cl.prettyPrint(callResponse.result));

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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(150_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_2),
      ],
      Borrower_2
    );
    expect(callResponse.result).toBeErr(Cl.uint(30003));
    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_3),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_3
    );
    callResponse = poolBorrow.getReserveState(
      deployerAddress,
      stSTX,
      deployerAddress
    );

    callResponse = poolBorrow.getReserveState(deployerAddress, USDA, Borrower_1);
    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log(simnet.getAssetsMap());
    // expect(callResponse.result).toBeOk(Cl.uint(200_000_086));

    // callResponse = simnet.callReadOnlyFn(
    //   config.pool0Reserve,
    //   "get-user-borrow-balance",
    //   [
    //     Cl.standardPrincipal(Borrower_1),
    //     Cl.contractPrincipal(deployerAddress, USDA)
    //   ],
    //   Borrower_1
    // );
    // console.log(cvToValue(callResponse.result));
    simnet.mineEmptyBlocks(1000)
    // callResponse = simnet.callReadOnlyFn(
    //   config.pool0Reserve,
    //   "get-user-borrow-balance",
    //   [
    //     Cl.standardPrincipal(Borrower_1),
    //     Cl.contractPrincipal(deployerAddress, USDA)
    //   ],
    //   Borrower_1
    // );
    // console.log(cvToValue(callResponse.result));
    // callResponse = poolBorrow.getUserReserveData(Borrower_1, deployerAddress, USDA, Borrower_1);
    // console.log(cvToValue(callResponse.result))
    // console.log(simnet.getAssetsMap().get(".usda.usda"))
    // callResponse = simnet.callPublicFnCheckOk(
    //   config.borrowHelper,
    //   "repay",
        // Cl.contractPrincipal(deployerAddress, "oracle"),
    //   [
    //     Cl.contractPrincipal(deployerAddress, USDA),
    //     Cl.uint(max_value),
    //     Cl.standardPrincipal(Borrower_1),
    //     Cl.standardPrincipal(Borrower_1),
    //   ],
    //   Borrower_1
    // );
    // expect(callResponse.result).toBeOk(Cl.bool(true));
    // console.log(simnet.getAssetsMap().get(".usda.usda"))

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_2
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_3),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_3
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = poolBorrow.getReserveState(
      deployerAddress,
      stSTX,
      deployerAddress
    );
    const accruedToTreasury = Number(
      cvToValue(callResponse.result).value["accrued-to-treasury"].value
    );

    callResponse = simnet.callPublicFn(
      config.pool0Reserve,
      "mint-to-treasury",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
      ],
      deployerAddress
    );
    expect(callResponse.result).toBeOk(Cl.uint(accruedToTreasury));

    callResponse = simnet.callPublicFn(
      config.pool0Reserve,
      "mint-to-treasury",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
      ],
      deployerAddress
    );
    expect(callResponse.result).toBeErr(Cl.uint(7005));
  });
  it("Supply an asset that can't be used as collateral. Is not added to collateral in user value. Cannot be enabled as collateral or is not enabled when supplying again.", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    let callResponse = poolBorrow.init(
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

    poolBorrow.addAsset(deployerAddress, stSTX, deployerAddress);

    poolBorrow.addAsset(deployerAddress, USDA, deployerAddress);

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      USDA,
      true,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      USDA,
      "mint",
      [Cl.uint(1000000000000000), Cl.standardPrincipal(LP_2)],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(LP_2)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    callResponse = poolBorrow.getUserReserveData(
      Borrower_1,
      deployerAddress,
      stSTX,
      Borrower_1
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(
      true
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_2),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_2
    );

    callResponse = poolBorrow.getUserReserveData(
      LP_2,
      deployerAddress,
      USDA,
      LP_2
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(
      false
    );

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(LP_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      LP_2
    );
    // console.log(cvToValue(callResponse.result).value);
    expect(
      Number(
        cvToValue(callResponse.result).value["total-collateral-balanceUSD"]
          .value
      )
    ).toBe(0);
    expect(
      Number(
        cvToValue(callResponse.result).value["current-liquidation-threshold"]
          .value
      )
    ).toBe(0);
    expect(
      Number(cvToValue(callResponse.result).value["current-ltv"].value)
    ).toBe(0);

    callResponse = simnet.callPublicFnCheckOk(
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
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(200_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = poolBorrow.getUserReserveData(
      Borrower_1,
      deployerAddress,
      USDA,
      Borrower_1
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(
      false
    );

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
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(10_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // check only ststx borrowing power is reduced
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
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      Number(cvToValue(callResponse.result).value["health-factor"].value)
    ).toBeLessThan(max_value);

    // cannot borrow if stSTX has not be enabled to be borrowed
    callResponse = simnet.callPublicFn(
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
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(200_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30006));

    // can't set asset disabled as collateral to be enabled as collateral by the user
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(LP_2),
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
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      LP_2
    );
    expect(callResponse.result).toBeErr(Cl.uint(30021));

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(LP_2),
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      LP_2
    );
    expect(callResponse.result).toBeErr(Cl.uint(30002));
    // supply again and check collateral is not enabled either
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpUsda),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_2),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_2
    );
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_2),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_2
    );
    callResponse = poolBorrow.getUserReserveData(
      LP_2,
      deployerAddress,
      stSTX,
      LP_2
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(
      true
    );
    callResponse = poolBorrow.getUserReserveData(
      LP_2,
      deployerAddress,
      USDA,
      LP_2
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(
      false
    );
    // console.log(cvToValue(callResponse.result));

    // check only ststx is used as collateral
    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(LP_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      LP_2
    );
    expect(
      Number(
        cvToValue(callResponse.result).value["total-collateral-balanceUSD"]
          .value
      )
    ).toBe(160000000000);

    callResponse = simnet.callPublicFnCheckOk(
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
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(100_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(LP_2),
      ],
      LP_2
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = poolBorrow.getUserReserveData(
      LP_2,
      deployerAddress,
      USDA,
      LP_2
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(
      false
    );

    // check only ststx is used as collateral
    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(LP_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      LP_2
    );
    // console.log(cvToValue(callResponse.result).value);
    expect(
      Number(
        cvToValue(callResponse.result).value["total-borrow-balanceUSD"].value
      )
    ).toBe(9900000099);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(max_value),
        Cl.standardPrincipal(LP_2),
        Cl.standardPrincipal(LP_2),
      ],
      LP_2
    );
    // check only ststx is used as collateral
    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(LP_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      LP_2
    );
    expect(
      Number(
        cvToValue(callResponse.result).value["total-borrow-balanceUSD"].value
      )
    ).toBe(0);
    callResponse = poolBorrow.getUserReserveData(
      LP_2,
      deployerAddress,
      USDA,
      LP_2
    );
    expect(
      Number(cvToValue(callResponse.result)["principal-borrow-balance"].value)
    ).toBe(0);
  });
  it("Supply multiple assets and check TVL and threshold values are average weighted sum", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    let callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(1000000000000000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1000000000000000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1000000000000000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    // callResponse =  simnet.transferSTX(
    //   250_000_000_000_000,
    //   Borrower_1,
    //   deployerAddress
    // );
    // console.log(Cl.prettyPrint(callResponse.result))

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
      config.lpSbtc,
      deployerAddress,
      sBTC,
      8,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, sBTC, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpDiko,
      deployerAddress,
      diko,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, diko, deployerAddress);

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

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpXusd,
      deployerAddress,
      xUSD,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, xUSD, deployerAddress);

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

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      diko,
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
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      wstx,
      true,
      40000000,
      45000000,
      50000000,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      sBTC,
      true,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
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
        Cl.uint(1_000_000_000),
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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      Number(
        cvToValue(callResponse.result).value["current-liquidation-threshold"]
          .value
      )
    ).toBe(90000000);
    expect(
      Number(cvToValue(callResponse.result).value["current-ltv"].value)
    ).toBe(80000000);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30021));
    // fail

    // supply new asset with different TVL and threshold
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpwstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(250_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    callResponse = poolBorrow.getUserReserveData(
      Borrower_1,
      deployerAddress,
      wstx,
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      Number(
        cvToValue(callResponse.result).value["current-liquidation-threshold"]
          .value
      )
    ).toBe((90000000 + 45000000) / 2);
    expect(
      Number(cvToValue(callResponse.result).value["current-ltv"].value)
    ).toBe((80000000 + 40000000) / 2);

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      20000000,
      10000000,
      50000000,
      deployerAddress
    );

    // enable user collateral after it's enabled by protocol
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // calculate new TVL and Threshold
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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      Number(
        cvToValue(callResponse.result).value["current-liquidation-threshold"]
          .value
      )
    ).toBeLessThan((90000000 + 45000000) / 2);
    expect(
      Number(cvToValue(callResponse.result).value["current-ltv"].value)
    ).toBeLessThan((80000000 + 40000000) / 2);

    const avgSumThreshold = Number(
      cvToValue(callResponse.result).value["current-liquidation-threshold"]
        .value
    );
    const avgSumTvl = Number(
      cvToValue(callResponse.result).value["current-ltv"].value
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(100_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // TVL and Threshold remains unchanged after borrowing supplied asset
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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      Number(
        cvToValue(callResponse.result).value["current-liquidation-threshold"]
          .value
      )
    ).toBe(avgSumThreshold);
    expect(
      Number(cvToValue(callResponse.result).value["current-ltv"].value)
    ).toBe(avgSumTvl);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, config.lpStstx),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bool(false),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // calculate new TVL and Threshold after disabling usage as collateral for the user and goes back to previous TVL and Threshold
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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      Number(
        cvToValue(callResponse.result).value["current-liquidation-threshold"]
          .value
      )
    ).toBe((90000000 + 45000000) / 2);
    expect(
      Number(cvToValue(callResponse.result).value["current-ltv"].value)
    ).toBe((80000000 + 40000000) / 2);
  });

  it("Can use different oracles", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    let callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST1J9DETBQBWSTSQ1WDAS66WP8RTJHK1SMRZMZXVQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST21FPF3HJK57GXH9B5BB0FWZC8YDDK665APDYFQQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST1J9DETBQBWSTSQ1WDAS66WP8RTJHK1SMRZMZXVQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(3000000000),
        Cl.standardPrincipal("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000),
        Cl.standardPrincipal("ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST21FPF3HJK57GXH9B5BB0FWZC8YDDK665APDYFQQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      xUSD,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      USDA,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
      ],
      deployerAddress
    );

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
      config.lpSbtc,
      deployerAddress,
      sBTC,
      8,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, sBTC, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpDiko,
      deployerAddress,
      diko,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, diko, deployerAddress);

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

    callResponse = poolBorrow.init(
      deployerAddress,
      config.lpXusd,
      deployerAddress,
      xUSD,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      "xusd-oracle",
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, xUSD, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      sBTC,
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
      diko,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      USDA,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      xUSD,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.addIsolatedAsset(
      deployerAddress,
      stSTX,
      1_000_000_000_000,
      deployerAddress
    );
    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      xUSD,
      deployerAddress
    );
    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      USDA,
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));

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
      sBTC,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      diko,
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
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      80000000,
      50000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpXusd),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
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
        Cl.uint(1_000_000_000),
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
        Cl.uint(10_000_000_000),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_2
    );

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_2)],
      Borrower_2
    );
    expect(callResponse.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);

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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(7002));

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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpDiko),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpUsda),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, config.lpXusd),
            oracle: Cl.contractPrincipal(deployerAddress, "xusd-oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);
  });
});
