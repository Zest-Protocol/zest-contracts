import { initSimnet, Simnet, tx } from "@hirosystems/clarinet-sdk";
import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";

import * as config from "./tools/config";
import { deployV2Contracts, deployV2TokenContracts } from "./tools/common";

const simnet = await initSimnet();

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

const lpdiko = "lp-diko";
const lpdikov1 = "lp-diko-v1";
const lpdikov2 = "lp-diko-v2";
const lpsBTC = "lp-sbtc";
const lpsBTCv1 = "lp-sbtc-v1";
const lpsBTCv2 = "lp-sbtc-v2";
const lpstSTX = "lp-ststx";
const lpstSTXv1 = "lp-ststx-v1";
const lpstSTXv2 = "lp-ststx-v2";
const lpstSTXv3 = "lp-ststx-v3";

const lpUSDA = "lp-usda";
const lpUSDAv1 = "lp-usda-v1";
const lpUSDAv2 = "lp-usda-v2";
const lpxUSD = "lp-xusd";
const lpxUSDv1 = "lp-xusd";
const lpxUSDv2 = "lp-xusd-v2";

const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const oracle = "oracle";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sbtc";
const stSTX = "ststx";
const USDA = "usda";
const xUSD = "xusd";

const lpwstx = "lp-wstx";
const lpwstxv1 = "lp-wstx-v1";
const lpwstxv2 = "lp-wstx-v2";
const wstx = "wstx";

const max_value = BigInt("340282366920938463463374607431768211455");

const cvAssets = Cl.list([
  Cl.tuple({
    asset: Cl.contractPrincipal(deployerAddress, stSTX),
    "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv3),
    oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
  }),
  Cl.tuple({
    asset: Cl.contractPrincipal(deployerAddress, sBTC),
    "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv2),
    oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
  }),
  Cl.tuple({
    asset: Cl.contractPrincipal(deployerAddress, diko),
    "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov2),
    oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
  }),
  Cl.tuple({
    asset: Cl.contractPrincipal(deployerAddress, USDA),
    "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv2),
    oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
  }),
  Cl.tuple({
    asset: Cl.contractPrincipal(deployerAddress, xUSD),
    "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv2),
    oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
  }),
  Cl.tuple({
    asset: Cl.contractPrincipal(deployerAddress, wstx),
    "lp-token": Cl.contractPrincipal(deployerAddress, lpwstxv2),
    oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
  }),
]);

describe("Upgrading z-token to v1-2", () => {
  beforeEach(() => {
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

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
      "pool-reserve-data",
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(0)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(0)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
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
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(0)],
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

    callResponse = simnet.callPublicFn(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST1J9DETBQBWSTSQ1WDAS66WP8RTJHK1SMRZMZXVQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      sBTC,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST21FPF3HJK57GXH9B5BB0FWZC8YDDK665APDYFQQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST1J9DETBQBWSTSQ1WDAS66WP8RTJHK1SMRZMZXVQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [
        Cl.uint(3000000000),
        Cl.standardPrincipal("ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST21FPF3HJK57GXH9B5BB0FWZC8YDDK665APDYFQQ"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      xUSD,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      USDA,
      "mint",
      [Cl.uint(1000000000000000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = poolBorrow.init(
      deployerAddress,
      lpstSTX,
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
      lpsBTC,
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
      lpdiko,
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
      lpUSDA,
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
      lpxUSD,
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
      lpwstx,
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

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      60000000,
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
  });

  it("Supply and fully withdraw z-tokens", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

    let callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      10_000_000_000,
      Borrower_2,
      Borrower_2
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      10_000_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpUSDA,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = simnet.deployContract(
      "run-1",
      readFileSync(`contracts/borrow/mocks/migrate-v0-v1.clar`).toString(),
      null,
      deployerAddress
    );
    simnet.mineEmptyBlock();
    callResponse = simnet.deployContract(
      "migrate-2",
      readFileSync(`contracts/borrow/mocks/migrate-v1-v2.clar`).toString(),
      null,
      deployerAddress
    );
    simnet.mineEmptyBlock();

    simnet.setEpoch("3.0");
		deployV2Contracts(simnet, deployerAddress);
		deployV2TokenContracts(simnet, deployerAddress);

    callResponse = simnet.deployContract(
      "migrate-3",
      readFileSync(`contracts/borrow/mocks/migrate-v2-v3.clar`).toString(),
      null,
      deployerAddress
    );
    callResponse = simnet.callReadOnlyFn(
      `pool-reserve-data`,
      "get-reserve-state-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "borrow-helper-v2-0",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv3),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(10_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        cvAssets,
      ],
      Borrower_1
    );
    expect(
      simnet.getAssetsMap().get(".ststx.ststx")?.get(`${deployerAddress}.pool-vault`)
    ).toBe(10000000000n);
    expect(
      simnet.getAssetsMap().get(".lp-ststx-v2.lp-ststx")?.get(Borrower_1)
    ).toBe(0n);
    expect(
      simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)
    ).toBe(undefined);
    expect(
      simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(Borrower_1)
    ).toBe(0n);
  });
});
