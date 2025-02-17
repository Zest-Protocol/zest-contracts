import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";

import { initContractsToV2, lpSbtc, lpStstx, lpXusd, poolBorrow as poolBorrowContractName, pool0Reserve as pool0ReserveContractName, reserveExtraVariables, borrowHelper, pool0ReserveRead, initContractsToV2_1 } from "./tools/config";
import { initSimnetChecker } from "./tools/SimnetChecker";
import { deployV2_1Contracts, deployV2Contracts, deployV2TokenContracts, setGracePeriodVars } from "./tools/common";

const simnet = await initSimnetChecker();

const accounts = simnet.getAccounts();
const deployerAddress = accounts.get("deployer")!;
const LP_1 = accounts.get("wallet_1")!;
const LP_2 = accounts.get("wallet_4")!;
const LP_3 = accounts.get("wallet_5")!;
const Borrower_1 = accounts.get("wallet_2")!;
const Delegate_1 = accounts.get("wallet_3")!;
const Borrower_2 = accounts.get("wallet_4")!;
const Liquidator_1 = accounts.get("wallet_5")!;

const contractInterfaces = simnet.getContractsInterfaces();
const poolv20Interface = contractInterfaces.get(`${deployerAddress}.pool-v2-0`);

const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const oracle = "oracle";
const diko = "diko";
const sBTC = "sbtc";
const stSTX = "ststx";
const USDA = "usda";
const xUSD = "xusd";

const lpwstx = "lp-wstx";
const wstx = "wstx";

const zsbtc = lpSbtc;
const zststx = lpStstx;
const zxusd = lpXusd;

describe("Liquidation tests", () => {
  beforeEach(() => {
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
      readFileSync(reserveExtraVariables).toString(),
      null,
      deployerAddress
    );

    simnet.setEpoch("3.0");
    deployV2Contracts(simnet, deployerAddress);
    deployV2TokenContracts(simnet, deployerAddress);
    deployV2_1Contracts(simnet, deployerAddress);

    simnet.deployContract(
      "run-1",
      readFileSync(initContractsToV2_1).toString(),
      null,
      deployerAddress
    );

    setGracePeriodVars(simnet, deployerAddress);
  });
  it("Supply sBTC, borrow xUSD, price goes below health factor", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      poolBorrowContractName
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
      sBTC,
      4000000000000,
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

    let callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(100_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(1_000_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    // 3 992 301 124 525
    //    50 000 000 000
    callResponse = simnet.callPublicFnCheckOk(
      xUSD,
      "mint",
      [Cl.uint(100_000_000_000_000), Cl.standardPrincipal(Liquidator_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      xUSD,
      "mint",
      [Cl.uint(100_000_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      "oracle",
      "set-price",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(100_000_000)],
      deployerAddress
    );

    callResponse = poolBorrow.init(
      deployerAddress,
      zsbtc,
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
      zxusd,
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
      xUSD,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      80000000,
      5000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(100_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(100_000_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, zxusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(6_996_172_743_701),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    // console.log(callResponse.events);
    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[2].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[3].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[4].data.value!));

    // simnet.mineEmptyBlocks(10);

    let borrower_1_data = simnet.callPublicFn(
      pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, zxusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      "oracle",
      "set-price",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(100_000_000)],
      deployerAddress
    );

    // console.log(
    //   simnet
    //     .getAssetsMap()
    //     .get(".sBTC.sBTC")
    //     ?.get("ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB")
    // );
    const prevUsdamount = simnet
      .getAssetsMap()
      .get(".xUSD.xUSD")
      ?.get("ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB")!;
    // console.log(
    //   simnet
    //     .getAssetsMap()
    //     .get(".xUSD.xUSD")
    //     ?.get("ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB")
    // );
    // console.log(simnet.getAssetsMap().get(".lp-sBTC.lp-sBTC"));

    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, zxusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(1_000_000_000_000),
        Cl.bool(false),
      ],
      Liquidator_1
    );
  });
  it("Supply sBTC, borrow xUSD, liquidator buys part of the collateral", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      poolBorrowContractName
    );

    let callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(100_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(1_000_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    // 3 992 301 124 525
    //    50 000 000 000
    callResponse = simnet.callPublicFnCheckOk(
      xUSD,
      "mint",
      [Cl.uint(100_000_000_000_000), Cl.standardPrincipal(Liquidator_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      xUSD,
      "mint",
      [Cl.uint(100_000_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      "oracle",
      "set-price",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(100_000_000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      "oracle",
      "set-price",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(1_000_000_000_000)],
      deployerAddress
    );

    callResponse = poolBorrow.init(
      deployerAddress,
      zsbtc,
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
      zxusd,
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
      xUSD,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      80000000,
      5000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(100_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );
    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );
    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(100_000_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, zxusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(6_996_172_743_701),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFnCheckOk(
      "oracle",
      "set-price",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(500_000_000_000)],
      deployerAddress
    );

    simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    // console.log("Before liquidation");
    // console.log(Cl.prettyPrint(borrower_data.result));

    // console.log(simnet.getAssetsMap().get(".xUSD.xUSD"));
    // console.log(simnet.getAssetsMap().get(".lp-xUSD.lp-xUSD"));

    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, zxusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        // Cl.uint(3_992_301_124_525),
        Cl.uint(1_000_000_000_000),
        Cl.bool(false),
      ],
      Liquidator_1
    );

    // console.log(Liquidator_1);
    // console.log(simnet.getAssetsMap().get(".xUSD.xUSD"));
    // console.log(simnet.getAssetsMap().get(".lp-xUSD.lp-xUSD"));
    // console.log(callResponse.result);
    // console.log(callResponse.events);
  });
  it("Supply sBTC, borrow xUSD, liquidator buys maximum possible amount of debt (>50%). There are remaining assets in the reserve", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      poolBorrowContractName
    );

    let callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(100_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(100_000_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    // 3 992 301 124 525
    //    50 000 000 000
    callResponse = simnet.callPublicFnCheckOk(
      xUSD,
      "mint",
      [Cl.uint(100_000_000_000_000), Cl.standardPrincipal(Liquidator_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      xUSD,
      "mint",
      [Cl.uint(100_000_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      "oracle",
      "set-price",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(100_000_000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      "oracle",
      "set-price",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(1_000_000_000_000)],
      deployerAddress
    );

    callResponse = poolBorrow.init(
      deployerAddress,
      zsbtc,
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
      zxusd,
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
      xUSD,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      80000000,
      5000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(100_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(100_000_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(100_000_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, zxusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(6_996_172_743_701),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    // console.log(simnet.getAssetsMap());
    // console.log(callResponse.events);
    expect(callResponse.result).toBeOk(Cl.bool(true));
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[2].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[3].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[4].data.value!));

    // simnet.mineEmptyBlocks(10);

    callResponse = simnet.callPublicFnCheckOk(
      "oracle",
      "set-price",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(10_000_000_000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, zxusd),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(3_498_089_240_283),
        // Cl.uint(1_000_000_000_000),
        Cl.bool(false),
      ],
      Liquidator_1
    );
  });
});
