import { initSimnet } from "@hirosystems/clarinet-sdk";
import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";

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
const lpsBTC = "lp-sbtc";
const lpsBTCv1 = "lp-sbtc-v1";
const lpstSTX = "lp-ststx";
const lpstSTXv1 = "lp-ststx-v1";

const lpUSDA = "lp-usda";
const lpUSDAv1 = "lp-usda-v1";
const lpxUSD = "lp-xusd";
const lpxUSDv1 = "lp-xusd";

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
const wstx = "wstx";

const max_value = BigInt("340282366920938463463374607431768211455");

describe("Upgrading a z-token", () => {
  beforeEach(() => {
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

    oracleContract.setPrice(deployerAddress, stSTX, 160_000_000, deployerAddress);
    oracleContract.setPrice(deployerAddress, sBTC, 4_000_000_000_000, deployerAddress);
    oracleContract.setPrice(deployerAddress, diko, 40000000, deployerAddress);
    oracleContract.setPrice(deployerAddress, USDA, 99000000, deployerAddress);
    oracleContract.setPrice(deployerAddress, xUSD, 100_000_000, deployerAddress);
    oracleContract.setPrice(deployerAddress, wstx, 160_000_000, deployerAddress);
    
    let callResponse = simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(0) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(0) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(0) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(0) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(0) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(0) ], deployerAddress);

    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(4000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(4000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(4000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(4000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(4000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(4000000) ], deployerAddress);

    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(300000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(300000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(300000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(300000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(300000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(300000000) ], deployerAddress);

    callResponse = simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(80000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(80000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(80000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(80000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(80000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(80000000) ], deployerAddress);

    callResponse = simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(50000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(50000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(50000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(50000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(50000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(50000000) ], deployerAddress);

    callResponse = simnet.callPublicFn("pool-0-reserve", "set-flashloan-fee-total", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(35) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-0-reserve", "set-flashloan-fee-total", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(35) ], deployerAddress);
    
    callResponse = simnet.callPublicFn("pool-0-reserve", "set-flashloan-fee-protocol", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(3000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-0-reserve", "set-flashloan-fee-protocol", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(3000) ], deployerAddress);

    callResponse = simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(0) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(25) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(25) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(25) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(25) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(25) ], deployerAddress);

    callResponse = simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(15000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(10000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(10000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(10000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(10000000) ], deployerAddress);
    callResponse = simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(10000000) ], deployerAddress);

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
    // callResponse = simnet.callPublicFn(
    //   stSTX,
    //   "mint",
    //   [
    //     Cl.uint(1000000000),
    //     Cl.standardPrincipal("ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB"),
    //   ],
    //   deployerAddress
    // );
    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND"),
      ],
      deployerAddress
    );
    // callResponse = simnet.callPublicFn(
    //   stSTX,
    //   "mint",
    //   [
    //     Cl.uint(100_000_000),
    //     Cl.standardPrincipal(Liquidator_1),
    //   ],
    //   deployerAddress
    // );
    
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
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal(LP_1),
      ],
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

    poolBorrow.addAsset(
      deployerAddress,
      stSTX,
      deployerAddress
    );

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

    poolBorrow.addAsset(
      deployerAddress,
      sBTC,
      deployerAddress
    );

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

    poolBorrow.addAsset(
      deployerAddress,
      diko,
      deployerAddress
    );

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

    poolBorrow.addAsset(
      deployerAddress,
      USDA,
      deployerAddress
    );

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

    poolBorrow.addAsset(
      deployerAddress,
      xUSD,
      deployerAddress
    );

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

    // callResponse = poolBorrow.addIsolatedAsset(
    //   deployerAddress,
    //   stSTX,
    //   1_000_000_000_000,
    //   deployerAddress
    // );
    // callResponse = poolBorrow.setBorroweableIsolated(
    //   deployerAddress,
    //   xUSD,
    //   deployerAddress
    // );
    // callResponse = poolBorrow.setBorroweableIsolated(
    //   deployerAddress,
    //   USDA,
    //   deployerAddress
    // );
    // console.log(Cl.prettyPrint(callResponse.result));

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

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    callResponse = simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(10_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)).toBe(0n);
    expect(simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(Borrower_1)).toBe(0n);
  });

  it("Supply and fully withdraw z-tokens when the `owner` parameter is different than tx-sender.", () => {
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
      lpUSDAv1,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, newZTokenContractName),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(Borrower_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, newZTokenContractName),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30000));
    expect(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)).toBe(undefined);
    expect(simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(Borrower_1)).toBe(10000000000n);
  });

  it("Supply and fully withdraw z-tokens, check borrowing power.", () => {
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
      lpUSDAv1,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
    );
    const maxBorrowAmountBeforeWithdrawal =
        Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(10_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)).toBe(0n);
    expect(simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(Borrower_1)).toBe(0n);


    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountAfterWithdrawal =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;
    expect(maxBorrowAmountAfterWithdrawal).toBe(0);
  });
  it("Supply and partly withdraw z-tokens, check borrowing power.", () => {
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
      lpUSDAv1,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
    );
    const maxBorrowAmountBeforeWithdrawal =
        Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, newZTokenContractName),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(5_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, newZTokenContractName),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)).toBe(5000000000n);
    expect(simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(Borrower_1)).toBe(0n);

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountAfterWithdrawal =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;
    expect(maxBorrowAmountAfterWithdrawal).toBe(maxBorrowAmountBeforeWithdrawal / 2);
  });

  it("Supply and partly withdraw z-tokens", () => {
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
      lpUSDAv1,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, newZTokenContractName),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, newZTokenContractName),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)).toBe(9000000000n);
    expect(simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(Borrower_1)).toBe(0n);
  });
  it("Supply before upgrade and supply z-tokens again after upgrade", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    let poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

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
      lpUSDAv1,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;
    poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(10_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.some(Cl.standardPrincipal(deployerAddress)),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    expect(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)).toBe(20000000000n);
    expect(simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(Borrower_1)).toBe(0n);
  });
  it("Supply before upgrade and borrow after upgrade and expect no changes.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    let poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

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
      100_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpUSDAv1,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountAfterUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;


    poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmountAfterUpgrade)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // does not get minted to next version
    expect(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)).toBe(undefined);
    expect(simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(Borrower_1)).toBe(100_000_000n);
    
    // no change
    expect(maxBorrowAmountBeforeUpgrade).toBe(maxBorrowAmountAfterUpgrade);
  });

  it("Supply before upgrade and borrow before upgrade, keep interest.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    let poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

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
      20_000_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpUSDAv1,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;
    
  callResponse = poolBorrow.borrow(
    deployerAddress,
    "pool-0-reserve",
    deployerAddress,
    oracle,
    deployerAddress,
    stSTX,
    deployerAddress,
    lpstSTX,
    Math.floor(maxBorrowAmountBeforeUpgrade),
    deployerAddress,
    "fees-calculator",
    0,
    Borrower_1,
    [
      {
          asset: { deployerAddress, contractName: stSTX },
          "lp-token": { deployerAddress, contractName: lpstSTX },
          oracle: { deployerAddress, contractName: oracle },
      },
      {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: lpsBTC },
          oracle: { deployerAddress, contractName: oracle },
      },
      {
          asset: { deployerAddress, contractName: diko },
          "lp-token": { deployerAddress, contractName: lpdiko },
          oracle: { deployerAddress, contractName: oracle },
      },
      {
          asset: { deployerAddress, contractName: USDA },
          "lp-token": { deployerAddress, contractName: lpUSDAv1 },
          oracle: { deployerAddress, contractName: oracle },
      },
      {
          asset: { deployerAddress, contractName: xUSD },
          "lp-token": { deployerAddress, contractName: lpxUSDv1 },
          oracle: { deployerAddress, contractName: oracle },
      },
    ],
    Borrower_1
  );

    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    simnet.mineEmptyBlocks(1000);
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_2
    );
    expect(simnet.getAssetsMap().get(".ststx.ststx")?.get(Borrower_2)! - 1000000000000000n).toBeGreaterThan(0n);
    expect(callResponse.result).toBeOk(Cl.bool(true));
  });

  it("Supply before upgrade and borrow after upgrade, keep interest.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    let poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

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
      20_000_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpUSDAv1,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmountBeforeUpgrade)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    simnet.mineEmptyBlocks(1000);
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_2
    );
    expect(simnet.getAssetsMap().get(".ststx.ststx")?.get(Borrower_2)! - 1000000000000000n).toBeGreaterThan(0n);
    expect(callResponse.result).toBeOk(Cl.bool(true));
  });

  it("Supply after upgrade and borrow after upgrade, keep interest.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    let poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

    // let callResponse = poolBorrow.supply(
    //   deployerAddress,
    //   lpstSTX,
    //   deployerAddress,
    //   pool0Reserve,
    //   deployerAddress,
    //   stSTX,
    //   10_000_000_000,
    //   Borrower_2,
    //   Borrower_2
    // );

    let callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      20_000_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(10_000_000_000),
        Cl.standardPrincipal(Borrower_2),
        Cl.some(Cl.standardPrincipal(deployerAddress)),
      ],
      Borrower_2
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmountBeforeUpgrade)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    simnet.mineEmptyBlocks(1000);
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_2
    );
    expect(simnet.getAssetsMap().get(".ststx.ststx")?.get(Borrower_2)! - 1000000000000000n).toBeGreaterThan(0n);
    expect(callResponse.result).toBeOk(Cl.bool(true));
  });


  it("Supply before upgrade, maintain same amount of collateral.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    let poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

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
      20_000_000_000,
      Borrower_1,
      Borrower_1
    );
    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDA),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    const collateralBefore = Number(cvToValue(callResponse.result)["value"]["total-collateral-balanceUSD"]["value"]);

    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(Number(cvToValue(callResponse.result)["value"]["total-collateral-balanceUSD"]["value"])).toBe(collateralBefore);
  });

  it("Supply before and after, maintain same amount of collateral on mutliple assets.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    let poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

    let callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      20_000_000_000,
      Borrower_2,
      Borrower_2
    );

    callResponse = simnet.callPublicFn(
      sBTC,
      "mint",
      [ Cl.uint(2_000_000_000), Cl.standardPrincipal(Borrower_2) ],
      deployerAddress
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpsBTC,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      sBTC,
      2_000_000_000,
      Borrower_2,
      Borrower_2
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      20_000_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDA),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_2
    );
    const collateralBefore = Number(cvToValue(callResponse.result)["value"]["total-collateral-balanceUSD"]["value"]);

    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.some(Cl.standardPrincipal(deployerAddress)),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(Number(cvToValue(callResponse.result)["value"]["total-collateral-balanceUSD"]["value"])).toBe(collateralBefore);
  });

  it("Supply after, maintain same amount of collateral on mutliple assets.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    let poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

    let callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      20_000_000_000,
      Borrower_2,
      Borrower_2
    );

    callResponse = simnet.callPublicFn(
      sBTC,
      "mint",
      [ Cl.uint(2_000_000_000), Cl.standardPrincipal(Borrower_2) ],
      deployerAddress
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpsBTC,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      sBTC,
      2_000_000_000,
      Borrower_2,
      Borrower_2
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDA),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_2
    );
    const collateralBefore = Number(cvToValue(callResponse.result)["value"]["total-collateral-balanceUSD"]["value"]);

    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(20_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.some(Cl.standardPrincipal(deployerAddress)),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.some(Cl.standardPrincipal(deployerAddress)),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(Number(cvToValue(callResponse.result)["value"]["total-collateral-balanceUSD"]["value"])).toBe(collateralBefore);
  });

  it("Supply after upgrade and borrow after upgrade, maintain same amount of collateral.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    let poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

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
      20_000_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpsBTC,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      sBTC,
      2_000_000_000,
      Borrower_1,
      Borrower_1
    );
    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDA),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(cvToValue(callResponse.result));
    const collateralBefore = (cvToValue(callResponse.result)["value"]["total-collateral-balanceUSD"]["value"]);

    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTCv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(cvToValue(callResponse.result));
    expect(cvToValue(callResponse.result)["value"]["total-collateral-balanceUSD"]["value"]).toBe(collateralBefore);
  });
  

  it("Supply before upgrade and borrow before upgrade, keep interest using multiple withdraw calls.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    let poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

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
      20_000_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpUSDAv1,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;
    
  callResponse = poolBorrow.borrow(
    deployerAddress,
    "pool-0-reserve",
    deployerAddress,
    oracle,
    deployerAddress,
    stSTX,
    deployerAddress,
    lpstSTX,
    Math.floor(maxBorrowAmountBeforeUpgrade),
    deployerAddress,
    "fees-calculator",
    0,
    Borrower_1,
    [
      {
          asset: { deployerAddress, contractName: stSTX },
          "lp-token": { deployerAddress, contractName: lpstSTX },
          oracle: { deployerAddress, contractName: oracle },
      },
      {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: lpsBTC },
          oracle: { deployerAddress, contractName: oracle },
      },
      {
          asset: { deployerAddress, contractName: diko },
          "lp-token": { deployerAddress, contractName: lpdiko },
          oracle: { deployerAddress, contractName: oracle },
      },
      {
          asset: { deployerAddress, contractName: USDA },
          "lp-token": { deployerAddress, contractName: lpUSDAv1 },
          oracle: { deployerAddress, contractName: oracle },
      },
      {
          asset: { deployerAddress, contractName: xUSD },
          "lp-token": { deployerAddress, contractName: lpxUSDv1 },
          oracle: { deployerAddress, contractName: oracle },
      },
    ],
    Borrower_1
  );

    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    simnet.mineEmptyBlocks(1000);
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;
    const halfAvailable = 10001296600n / 2n;
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(halfAvailable),
        Cl.standardPrincipal(Borrower_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_2
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    expect(simnet.getAssetsMap().get(".ststx.ststx")?.get(Borrower_2)! - (1000000000000000n - (halfAvailable))).toBeGreaterThan(0n);
    const balanceAfterWithdrawal = simnet.getAssetsMap().get(".ststx.ststx")?.get(Borrower_2)!;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_2
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    expect(simnet.getAssetsMap().get(".ststx.ststx")?.get(Borrower_2)!).toBeGreaterThan(balanceAfterWithdrawal);
  });

  it("Supply before upgrade and borrow before upgrade and expect no changes.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    let poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

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
      100_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpUSDAv1,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      stSTX,
      deployerAddress,
      lpstSTX,
      Math.floor(maxBorrowAmountBeforeUpgrade),
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
            asset: { deployerAddress, contractName: stSTX },
            "lp-token": { deployerAddress, contractName: lpstSTX },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: sBTC },
            "lp-token": { deployerAddress, contractName: lpsBTC },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: diko },
            "lp-token": { deployerAddress, contractName: lpdiko },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: USDA },
            "lp-token": { deployerAddress, contractName: lpUSDAv1 },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: xUSD },
            "lp-token": { deployerAddress, contractName: lpxUSDv1 },
            oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(maxBorrowAmountBeforeUpgrade));

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountAfterUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    // does not get minted to next version
    expect(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)).toBe(undefined);
    expect(simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(Borrower_1)).toBe(100_000_000n);
    
    // no change
    expect(maxBorrowAmountAfterUpgrade).toBe(0);
  });

  it("Supply before upgrade and supply z-tokens again after upgrade. Borrow and expect a higher collateral amount value.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    let poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

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
      100_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpUSDAv1,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);

    poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");
    
    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(100_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.some(Cl.standardPrincipal(deployerAddress)),
      ],
      Borrower_1
    );
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountAfterUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmountAfterUpgrade)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    expect(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)).toBe(200000000n);
    expect(simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(Borrower_1)).toBe(0n);

    expect(maxBorrowAmountAfterUpgrade).toBeGreaterThan(maxBorrowAmountBeforeUpgrade);
    expect(maxBorrowAmountBeforeUpgrade * 2).toBe(maxBorrowAmountAfterUpgrade);

    // console.log("lp-ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));

    // console.log(callResponse.events)
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log("lp-ststx-v1 balance")
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance")
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
  });
  it("Supply before upgrade. Borrow and expect a higher collateral amount value. Repay with no interest.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    let poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

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
      100_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpUSDAv1,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);

    poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(100_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.some(Cl.standardPrincipal(deployerAddress)),
      ],
      Borrower_1
    );
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountAfterUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmountAfterUpgrade)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    expect(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)).toBe(200000000n);
    // expect(simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(Borrower_1)).toBe(0n);

    // expect(maxBorrowAmountAfterUpgrade).toBeGreaterThan(maxBorrowAmountBeforeUpgrade);
    // expect(maxBorrowAmountBeforeUpgrade * 2).toBe(maxBorrowAmountAfterUpgrade);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // console.log("lp-ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
    // console.log("stSTX balances");
    // console.log(simnet.getAssetsMap().get(".ststx.ststx"));

    // console.log(callResponse.events)
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log("lp-ststx-v1 balance")
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance")
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
  });
  it("Supply before upgrade. Borrow expected max amount. Repay with no interest.", () => {
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
      100_000_000,
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

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, stSTX),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDA),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
    );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmountBeforeUpgrade)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    // expect(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)).toBe(200000000n);
    // expect(simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(Borrower_1)).toBe(0n);

    // expect(maxBorrowAmountAfterUpgrade).toBeGreaterThan(maxBorrowAmountBeforeUpgrade);
    // expect(maxBorrowAmountBeforeUpgrade * 2).toBe(maxBorrowAmountAfterUpgrade);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // console.log("lp-ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
    // console.log("stSTX balances");
    // console.log(simnet.getAssetsMap().get(".ststx.ststx"));
    expect(simnet.getAssetsMap().get(".ststx.ststx")?.get(`${deployerAddress}.pool-vault`)).toBe(10100000001n);

    // console.log(callResponse.events)
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log("lp-ststx-v1 balance")
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance")
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
  });

  it("Supply before upgrade and borrow before upgrade get liquidated after upgrade. Liquidator does not supply asset. Can claim back assets after price goes back up", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

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
      100_000_000,
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

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, USDA),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;


    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      USDA,
      deployerAddress,
      lpUSDA,
      Math.floor(maxBorrowAmountBeforeUpgrade),
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
            asset: { deployerAddress, contractName: stSTX },
            "lp-token": { deployerAddress, contractName: lpstSTX },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: sBTC },
            "lp-token": { deployerAddress, contractName: lpsBTC },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: diko },
            "lp-token": { deployerAddress, contractName: lpdiko },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: USDA },
            "lp-token": { deployerAddress, contractName: lpUSDA },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: xUSD },
            "lp-token": { deployerAddress, contractName: lpxUSD },
            oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    expect(callResponse.result).toBeOk(Cl.uint(maxBorrowAmountBeforeUpgrade));

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      80_000_000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      USDA,
      "mint",
      [ Cl.uint(1000000000000000), Cl.standardPrincipal(Liquidator_1) ],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmountBeforeUpgrade),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(0));


    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      160_000_000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    expect(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)).toBe(0n);
    expect(simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(Borrower_1)).toBe(0n);
    // console.log("lp-ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
    // console.log("stSTX balances");
    // console.log(simnet.getAssetsMap().get(".ststx.ststx"));

    expect(simnet.getAssetsMap().get(".ststx.ststx")?.get(Borrower_1)! + simnet.getAssetsMap().get(".ststx.ststx")?.get(Liquidator_1)!).toBe(1000000000000000n);
  });

  it("Supply after upgrade and borrow after upgrade get liquidated after upgrade. Liquidator does not supply asset. Does not claim z-tokens.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

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
      lpUSDA,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(100_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.some(Cl.standardPrincipal(deployerAddress)),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, USDA),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, lpUSDAv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmountBeforeUpgrade)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      80_000_000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      USDA,
      "mint",
      [ Cl.uint(1000000000000000), Cl.standardPrincipal(Liquidator_1) ],
      deployerAddress
    );


    // console.log("lp-ststx-v1 balance before");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmountBeforeUpgrade),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(0));

    // console.log("lp-ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
    // console.log("stSTX balances");
    // console.log(simnet.getAssetsMap().get(".ststx.ststx"));

    // console.log("lp-usda balance");
    // console.log(simnet.getAssetsMap().get(".lp-usda.lp-usda"));
    // console.log("usda balance");
    // console.log(simnet.getAssetsMap().get(".usda.usda"));

    // console.log(maxBorrowAmountBeforeUpgrade);
    // console.log(Liquidator_1);
    
    // console.log("Liquidator_1 ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Liquidator_1));
    // console.log("Borrower_1 ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1));
    expect(
      simnet.getAssetsMap().get(".ststx.ststx")?.get(Liquidator_1)! +
      simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)!)
      .toBe(100000000n);
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
    // console.log("stSTX balances");
    // console.log(simnet.getAssetsMap().get(".ststx.ststx"));
  });

  it("Supply after upgrade and borrow after upgrade get liquidated after upgrade. Liquidator does not supply asset. Claims z-tokens.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

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
      lpUSDA,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      10_000_000_000,
      LP_1,
      LP_1
    );

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(100_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.some(Cl.standardPrincipal(deployerAddress)),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, USDA),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, lpUSDAv1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(maxBorrowAmountBeforeUpgrade)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      80_000_000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      USDA,
      "mint",
      [ Cl.uint(1000000000000000), Cl.standardPrincipal(Liquidator_1) ],
      deployerAddress
    );


    // console.log("lp-ststx-v1 balance before");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmountBeforeUpgrade),
        Cl.bool(true),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(0));

    // console.log("lp-ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
    // console.log("stSTX balances");
    // console.log(simnet.getAssetsMap().get(".ststx.ststx"));

    // console.log("lp-usda balance");
    // console.log(simnet.getAssetsMap().get(".lp-usda.lp-usda"));
    // console.log("usda balance");
    // console.log(simnet.getAssetsMap().get(".usda.usda"));

    // console.log(maxBorrowAmountBeforeUpgrade);
    // console.log(Liquidator_1);
    
    // console.log("Liquidator_1 ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Liquidator_1));
    // console.log("Borrower_1 ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1));
    expect(
      simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Liquidator_1)! +
      simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)!)
      .toBe(100000000n);
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
    // console.log("stSTX balances");
    // console.log(simnet.getAssetsMap().get(".ststx.ststx"));
  });

  it("Supply before upgrade and borrow before upgrade get liquidated after upgrade. Liquidator does not supply asset. Claims z-tokens.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

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
      100_000_000,
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

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, USDA),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;


    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      USDA,
      deployerAddress,
      lpUSDA,
      Math.floor(maxBorrowAmountBeforeUpgrade),
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
            asset: { deployerAddress, contractName: stSTX },
            "lp-token": { deployerAddress, contractName: lpstSTX },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: sBTC },
            "lp-token": { deployerAddress, contractName: lpsBTC },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: diko },
            "lp-token": { deployerAddress, contractName: lpdiko },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: USDA },
            "lp-token": { deployerAddress, contractName: lpUSDA },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: xUSD },
            "lp-token": { deployerAddress, contractName: lpxUSD },
            oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(maxBorrowAmountBeforeUpgrade));

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      80_000_000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      USDA,
      "mint",
      [ Cl.uint(1000000000000000), Cl.standardPrincipal(Liquidator_1) ],
      deployerAddress
    );


    // console.log("lp-ststx-v1 balance before");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmountBeforeUpgrade),
        Cl.bool(true),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(0));

    // console.log("lp-ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
    // console.log("stSTX balances");
    // console.log(simnet.getAssetsMap().get(".ststx.ststx"));

    // console.log("lp-usda balance");
    // console.log(simnet.getAssetsMap().get(".lp-usda.lp-usda"));
    // console.log("usda balance");
    // console.log(simnet.getAssetsMap().get(".usda.usda"));

    // console.log(maxBorrowAmountBeforeUpgrade);
    // console.log(Liquidator_1);
    
    // console.log("Liquidator_1 ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Liquidator_1));
    // console.log("Borrower_1 ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1));
    expect(
      simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Liquidator_1)! +
      simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)!)
      .toBe(100000000n);
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
    // console.log("stSTX balances");
    // console.log(simnet.getAssetsMap().get(".ststx.ststx"));
  });
  it("Supply before upgrade and borrow before upgrade get liquidated after upgrade. Liquidator supplies asset before upgrade. Does not claim z-tokens.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

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
      100_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      100_000_000,
      Liquidator_1,
      Liquidator_1
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

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, USDA),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDA),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;


    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      USDA,
      deployerAddress,
      lpUSDA,
      Math.floor(maxBorrowAmountBeforeUpgrade),
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
            asset: { deployerAddress, contractName: stSTX },
            "lp-token": { deployerAddress, contractName: lpstSTX },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: sBTC },
            "lp-token": { deployerAddress, contractName: lpsBTC },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: diko },
            "lp-token": { deployerAddress, contractName: lpdiko },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: USDA },
            "lp-token": { deployerAddress, contractName: lpUSDA },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: xUSD },
            "lp-token": { deployerAddress, contractName: lpxUSD },
            oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(maxBorrowAmountBeforeUpgrade));

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      80_000_000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      USDA,
      "mint",
      [ Cl.uint(1000000000000000), Cl.standardPrincipal(Liquidator_1) ],
      deployerAddress
    );


    // console.log("lp-ststx-v1 balance before");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmountBeforeUpgrade),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(0));

    // console.log("lp-ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
    // console.log("stSTX balances");
    // console.log(simnet.getAssetsMap().get(".ststx.ststx"));

    // console.log("lp-usda balance");
    // console.log(simnet.getAssetsMap().get(".lp-usda.lp-usda"));
    // console.log("usda balance");
    // console.log(simnet.getAssetsMap().get(".usda.usda"));

    // console.log(maxBorrowAmountBeforeUpgrade);
    // console.log(Liquidator_1);
    
    // console.log("Liquidator_1 ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Liquidator_1));
    // console.log("Borrower_1 ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1));
    expect(
      simnet.getAssetsMap().get(".ststx.ststx")?.get(Liquidator_1)! +
      simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)!)
      .toBe(100000000n);
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
    // console.log("stSTX balances");
    // console.log(simnet.getAssetsMap().get(".ststx.ststx"));
  });

  it("Supply before upgrade and borrow before upgrade get liquidated after upgrade. Liquidator supplies asset before upgrade. Claims z-tokens.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

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
      100_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      100_000_000,
      Liquidator_1,
      Liquidator_1
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

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
          Cl.contractPrincipal(deployerAddress, USDA),
          Cl.standardPrincipal(Borrower_1),
          Cl.list([
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, stSTX),
                "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
                oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, sBTC),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, diko),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, USDA),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
              Cl.tuple({
                  asset: Cl.contractPrincipal(deployerAddress, xUSD),
                  "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
                  oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
              }),
          ]),
      ],
      Borrower_1
  );
  const maxBorrowAmountBeforeUpgrade =
      Number(cvToValue(callResponse.result)["value"]) * 1.000000;


    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      USDA,
      deployerAddress,
      lpUSDA,
      Math.floor(maxBorrowAmountBeforeUpgrade),
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
            asset: { deployerAddress, contractName: stSTX },
            "lp-token": { deployerAddress, contractName: lpstSTX },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: sBTC },
            "lp-token": { deployerAddress, contractName: lpsBTC },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: diko },
            "lp-token": { deployerAddress, contractName: lpdiko },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: USDA },
            "lp-token": { deployerAddress, contractName: lpUSDA },
            oracle: { deployerAddress, contractName: oracle },
        },
        {
            asset: { deployerAddress, contractName: xUSD },
            "lp-token": { deployerAddress, contractName: lpxUSD },
            oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(maxBorrowAmountBeforeUpgrade));

    // simnet.deployContract(lpstSTXv1, readFileSync(`contracts/borrow/mocks/lp-ststx-v1.clar`).toString(), null, deployerAddress);
    let result = simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/migrate-zststx.clar`).toString(), null, deployerAddress);
    
    // variables to change in upgrade
    const newZTokenContractName = lpstSTXv1;

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      80_000_000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      USDA,
      "mint",
      [ Cl.uint(1000000000000000), Cl.standardPrincipal(Liquidator_1) ],
      deployerAddress
    );


    // console.log("lp-ststx-v1 balance before");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTXv1),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, sBTC),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, diko),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpdikov1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, USDA),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
              asset: Cl.contractPrincipal(deployerAddress, xUSD),
              "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSDv1),
              oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmountBeforeUpgrade),
        Cl.bool(true),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(0));
    // console.log(Cl.prettyPrint(callResponse.result));

    // console.log("lp-ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
    // console.log("stSTX balances");
    // console.log(simnet.getAssetsMap().get(".ststx.ststx"));

    // console.log("lp-usda balance");
    // console.log(simnet.getAssetsMap().get(".lp-usda.lp-usda"));
    // console.log("usda balance");
    // console.log(simnet.getAssetsMap().get(".usda.usda"));

    // console.log(maxBorrowAmountBeforeUpgrade);
    // console.log(Liquidator_1);
    
    // console.log("Liquidator_1 ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Liquidator_1));
    // console.log("Borrower_1 ststx-v1 balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1));
    expect(
      simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Liquidator_1)! +
      simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx")?.get(Borrower_1)!)
      .toBe(100000000n);
    // console.log(simnet.getAssetsMap().get(".lp-ststx-v1.lp-ststx"));
    // console.log("lp-ststx balance");
    // console.log(simnet.getAssetsMap().get(".lp-ststx.lp-ststx"));
    // console.log("stSTX balances");
    // console.log(simnet.getAssetsMap().get(".ststx.ststx"));
  });
});
