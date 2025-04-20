import { describe, expect, it, beforeEach } from "vitest";
import { Cl, cvToJSON, cvToString, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { MintableToken } from "./models/token";
import { Oracle } from "./models/oracle";

import * as config from "./tools/config";
import { initSimnetChecker } from "./tools/SimnetChecker";
import { deployPythContracts, deployV2_1Contracts, deployV2Contracts, deployV2TokenContracts, initializeRewards } from "./tools/common";
import { incentivesDummy } from "./tools/config";

const simnet = await initSimnetChecker();

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
const lpwstxv1 = "lp-wstx-v1";
const lpwstxv2 = "lp-wstx-v2";
const wstx = "wstx";

const zsbtc = config.lpSbtc;
const zststx = config.lpStstx;
const zxusd = config.lpXusd;
const zwstx = config.lpwstx;

const max_value = BigInt("340282366920938463463374607431768211455");

describe("Isolated mode", () => {
  beforeEach(() => {
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = poolBorrow.init(
      deployerAddress,
      zststx,
      deployerAddress,
      stSTX,
      6,
      max_value,
      max_value,
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    callResponse = poolBorrow.addAsset(deployerAddress, stSTX, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      zsbtc,
      deployerAddress,
      sBTC,
      8,
      max_value,
      max_value,
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    callResponse = poolBorrow.addAsset(deployerAddress, sBTC, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      zxusd,
      deployerAddress,
      xUSD,
      6,
      max_value,
      max_value,
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    callResponse = poolBorrow.addAsset(deployerAddress, xUSD, deployerAddress);

    callResponse = simnet.deployContract(
      "run-reserve-extra-variables",
      readFileSync(config.reserveExtraVariables).toString(),
      null,
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
      xUSD,
      true,
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

  it("Supply and borrow supplying only isolated asset.", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = stSTXToken.mint(
      1_000_000_000_000_000,
      Borrower_1,
      deployerAddress
    );
    xUSDToken.mint(1_000_000_000_000_000, LP_1, deployerAddress);

    oracleContract.setPrice(deployerAddress,xUSD,100_000_000,deployerAddress);
    oracleContract.setPrice(deployerAddress,stSTX,160_000_000,deployerAddress);
    oracleContract.setPrice(deployerAddress,sBTC,4_000_000_000_000,deployerAddress);
    oracleContract.setPrice(deployerAddress,wstx,150_000_000,deployerAddress);
    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
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
      xUSD,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(100_000_000_000),
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
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(200_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
  });

  it("Supply and borrow supplying only isolated asset. Check borrowing power", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracle = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = stSTXToken.mint(
      1_000_000_000_000_000,
      Borrower_1,
      deployerAddress
    );
    sBTCToken.mint(1_000_000_000_000_000, Borrower_1, deployerAddress);
    xUSDToken.mint(1_000_000_000_000_000, LP_1, deployerAddress);

    oracle.setPrice(deployerAddress, xUSD, 100_000_000, deployerAddress);
    oracle.setPrice(deployerAddress, stSTX, 160_000_000, deployerAddress);
    oracle.setPrice(deployerAddress, sBTC, 4_000_000_000_000, deployerAddress);
    oracle.setPrice(deployerAddress, wstx, 150_000_000, deployerAddress);

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
    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
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
      sBTC,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(100_000_000_000),
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
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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

    const availableBorrow = Number(cvToValue(callResponse.result)["value"]);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(availableBorrow),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    // console.log(callResponse.events);
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
  });
  it(`Supply and borrow supplying only isolated asset. Supply non-isolated asset when enabled as collateral, Remove some isolated collateral, cannot because not enough collateral`, () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracle = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = stSTXToken.mint(
      1_000_000_000_000_000,
      Borrower_1,
      deployerAddress
    );
    sBTCToken.mint(1_000_000_000_000_000, Borrower_1, deployerAddress);
    xUSDToken.mint(1_000_000_000_000_000, LP_1, deployerAddress);

    oracle.setPrice(deployerAddress, xUSD, 100_000_000, deployerAddress);
    oracle.setPrice(deployerAddress, stSTX, 160_000_000, deployerAddress);
    oracle.setPrice(deployerAddress, sBTC, 4_000_000_000_000, deployerAddress);
    oracle.setPrice(deployerAddress, wstx, 150_000_000, deployerAddress);

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

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
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
      sBTC,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(100_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(900_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);

    callResponse = simnet.callPublicFnCheckOk(
      config.pool0ReserveRead,
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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

    const availableBorrow = Number(cvToValue(callResponse.result)["value"]);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(availableBorrow),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    // console.log(cvToValue(callResponse.result));
    let beforeNonIsolatedSupply = cvToJSON(callResponse.result).value.value;

    simnet.mineEmptyBlocks(10);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeOk(Cl.bool(true));

    borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
      Cl.contractPrincipal(deployerAddress, sBTC),
      Cl.contractPrincipal(deployerAddress, xUSD),
    ]);

    // callResponse = poolBorrow.getUserReserveData(
    //   Borrower_1,
    //   deployerAddress,
    //   xUSD,
    //   Borrower_1
    // );
    // console.log(cvToValue(callResponse.result));

    // callResponse = poolBorrow.getReserveState(deployerAddress, xUSD, Borrower_1);
    // console.log(cvToValue(callResponse.result));

    // callResponse = simnet.callReadOnlyFn(
    //   config.pool0Reserve,
    //   "get-user-borrow-balance",
    //   [
    //     Cl.standardPrincipal(Borrower_1),
    //     Cl.contractPrincipal(deployerAddress, xUSD)
    //   ],
    //   Borrower_1
    // );
    // console.log(cvToValue(callResponse.result));

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    // console.log(cvToValue(callResponse.result));
    let afterNonIsolatedSupply = cvToJSON(callResponse.result).value.value;
    expect(beforeNonIsolatedSupply["health-factor"].value).toBe("112500000");
    expect(afterNonIsolatedSupply["health-factor"].value).toBe("112499985");
  });
  it(`Supply and borrow supplying only isolated asset. Supply non-isolated asset when enabled as collateral, while isolate asset is allowed as collateral, non-isolated asset does not count as collateral`, () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracle = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = stSTXToken.mint(
      1_000_000_000_000_000,
      Borrower_1,
      deployerAddress
    );
    sBTCToken.mint(1_000_000_000_000_000, Borrower_1, deployerAddress);
    xUSDToken.mint(1_000_000_000_000_000, LP_1, deployerAddress);

    oracle.setPrice(deployerAddress, xUSD, 100_000_000, deployerAddress);
    oracle.setPrice(deployerAddress, stSTX, 160_000_000, deployerAddress);
    oracle.setPrice(deployerAddress, sBTC, 4_000_000_000_000, deployerAddress);
    oracle.setPrice(deployerAddress, wstx, 150_000_000, deployerAddress);

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

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
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
      sBTC,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(100_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(900_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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

    let availableBorrow = Number(cvToValue(callResponse.result)["value"]);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(Math.floor(availableBorrow / 2)),
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
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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

    availableBorrow = Number(cvToValue(callResponse.result)["value"]);

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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

    let beforeNonIsolatedSupply = cvToJSON(callResponse.result).value.value;

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "get-decrease-balance-allowed",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    // console.log(Cl.prettyPrint(callResponse.result));
    let allowedWithdrawalAmount = Number(
      cvToJSON(callResponse.result)["value"]["value"]["amount-to-decrease"][
        "value"
      ]
    );
    let factor = 1.028;
    // console.log("increased: ", Math.floor(allowedWithdrawalAmount * factor));
    // console.log(
    //   "difference: ",
    //   Math.floor(allowedWithdrawalAmount * factor) - allowedWithdrawalAmount
    // );

    const vaultBalanceBefore = simnet
      .getAssetsMap()
      .get(".ststx.ststx")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(Math.floor(allowedWithdrawalAmount * factor)),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    expect(
      vaultBalanceBefore -
        simnet
          .getAssetsMap()
          .get(".ststx.ststx")
          ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!
    ).toBe(499607998n);

    borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    // console.log("After withdrawing part of the stSTX");
    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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

    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
      Cl.contractPrincipal(deployerAddress, xUSD),
    ]);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000_000_000),
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
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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

    availableBorrow = Number(cvToValue(callResponse.result)["value"]);
    expect(callResponse.result).toBeOk(Cl.uint(0));

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(10000000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30003));

    // cannot enable or disable sBTC as collateral, in isolated mode
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.none(),
      ],
      Borrower_1
    );

    expect(callResponse.result).toBeErr(Cl.uint(30017));
    // console.log(Cl.prettyPrint(callResponse.result));

    // console.log("After withdrawing half and then borrowing xUSD again");
    xUSDToken.mint(1_000_000_000, Borrower_1, deployerAddress);

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    expect(callResponse.result).toBeOk(
      Cl.tuple({
        "current-liquidation-threshold": Cl.uint(90000000),
        "current-ltv": Cl.uint(80000000),
        "health-factor": Cl.uint(100098000),
        "is-health-factor-below-treshold": Cl.bool(false),
        "total-borrow-balanceUSD": Cl.uint(57600000100),
        "total-collateral-balanceUSD": Cl.uint(64062720320),
        "total-liquidity-balanceUSD": Cl.uint(64062720320),
        "user-total-feesUSD": Cl.uint(0),
      })
    );

    const balanceBeforeRepay = simnet
      .getAssetsMap()
      .get(".xusd.xusd")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    // console.log(callResponse.events);
    expect(
      simnet
        .getAssetsMap()
        .get(".xusd.xusd")
        ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")! -
        balanceBeforeRepay
    ).toBe(576000001n);

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    expect(callResponse.result).toBeOk(
      Cl.tuple({
        "current-liquidation-threshold": Cl.uint(90000000),
        "current-ltv": Cl.uint(80000000),
        "health-factor": Cl.uint(
          BigInt("340282366920938463463374607431768211455")
        ),
        "is-health-factor-below-treshold": Cl.bool(false),
        "total-borrow-balanceUSD": Cl.uint(0),
        "total-collateral-balanceUSD": Cl.uint(64062720320),
        "total-liquidity-balanceUSD": Cl.uint(64062720320),
        "user-total-feesUSD": Cl.uint(0),
      })
    );
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!));

    borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
      Cl.contractPrincipal(deployerAddress, sBTC),
    ]);

    // must disable isolated asset as collateral before enabling other assets
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30019));

    // disable isolated asset
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bool(false),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // console.log("After stSTX collateral has been disabled");
    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    expect(
      Number(
        cvToValue(callResponse.result)["value"]["total-collateral-balanceUSD"][
          "value"
        ]
      )
    ).toBe(0);

    // can enable isolated asset as collateral when not supplying anything else
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // disable again to enable other assets
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bool(false),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // can enable usage as collateral after exiting isolated mode
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // cannot enable usage as collateral of isolated after already using other asset as collateral
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.none(),
      ],
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result))
    expect(callResponse.result).toBeErr(Cl.uint(30022));

    callResponse = poolBorrow.getUserReserveData(
      Borrower_1,
      deployerAddress,
      stSTX,
      Borrower_1
    );
    // console.log(cvToValue(callResponse.result));

    // console.log("After repayment and sBTC enabled as collateral");
    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    expect(
      Number(
        cvToValue(callResponse.result)["value"]["total-collateral-balanceUSD"][
          "value"
        ]
      )
    ).toBe(40000000000000000000);
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    // withdraw unused isolated asset as collateral
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
        Cl.none(),
      ],
      Borrower_1
    );
    expect(simnet.getAssetsMap().get(".ststx.ststx")?.get(Borrower_1)).toBe(
      BigInt(1_000_000_000_000_000)
    );
  });
  it("Using 2 isolated assets and 1 asset that can be supplied and borrowed (not collateral). Try to enable an isolated asets when another isolated asset is active as collateral.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = stSTXToken.mint(
      100_000_000_000,
      Borrower_1,
      deployerAddress
    );
    stSTXToken.mint(100_000_000_000, Borrower_2, deployerAddress);
    callResponse = stSTXToken.mint(
      100_000_000_000,
      Borrower_2,
      deployerAddress
    );
    xUSDToken.mint(1_000_000_000_000, LP_1, deployerAddress);

    oracleContract.setPrice(
      deployerAddress,
      xUSD,
      100_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      160_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      wstx,
      155_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      4_000_000_000_000,
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

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(100_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(100_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    // adding wstx as an asset after supplying assets
    callResponse = poolBorrow.init(
      deployerAddress,
      zwstx,
      deployerAddress,
      wstx,
      6,
      max_value,
      max_value,
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    // console.log(cvToValue(callResponse.result));

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      wstx,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      wstx,
      deployerAddress
    );

    callResponse = poolBorrow.addAsset(deployerAddress, wstx, deployerAddress);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zwstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(50_000_000),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_2
    );
    // console.log(simnet.getAssetsMap());

    callResponse = poolBorrow.getReserveState(
      deployerAddress,
      wstx,
      deployerAddress
    );
    // console.log(cvToValue(callResponse.result)["value"]["usage-as-collateral-enabled"]);
    expect(
      cvToValue(callResponse.result)["value"]["usage-as-collateral-enabled"][
        "value"
      ]
    ).toBe(false);
    callResponse = poolBorrow.getUserReserveData(
      Borrower_2,
      deployerAddress,
      wstx,
      Borrower_2
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"]["value"]).toBe(
      false
    );
    // console.log(cvToValue(callResponse.result));

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      wstx,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    callResponse = poolBorrow.addIsolatedAsset(
      deployerAddress,
      wstx,
      1_000_000_000_000,
      deployerAddress
    );

    callResponse = poolBorrow.getReserveState(
      deployerAddress,
      wstx,
      deployerAddress
    );
    expect(
      cvToValue(callResponse.result)["value"]["usage-as-collateral-enabled"][
        "value"
      ]
    ).toBe(true);

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, zwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_2
    );
    expect(
      Number(
        cvToValue(callResponse.result)["value"]["total-collateral-balanceUSD"][
          "value"
        ]
      )
    ).toBe(0);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_2),
        Cl.contractPrincipal(deployerAddress, zwstx),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, zwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.none(),
      ],
      Borrower_2
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    callResponse = poolBorrow.getUserReserveData(
      Borrower_2,
      deployerAddress,
      wstx,
      Borrower_2
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"]["value"]).toBe(
      true
    );

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, zwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_2
    );
    expect(
      Number(
        cvToValue(callResponse.result)["value"]["total-collateral-balanceUSD"][
          "value"
        ]
      )
    ).toBe((50_000_000 * 155_000_000) / 1_000_000);

    // when not supplying
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, zwstx),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, zwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30002));

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(50_000_000),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_2
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = poolBorrow.getUserReserveData(
      Borrower_2,
      deployerAddress,
      wstx,
      Borrower_2
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"]["value"]).toBe(
      true
    );
    // console.log(cvToValue(callResponse.result));
    callResponse = poolBorrow.getUserReserveData(
      Borrower_2,
      deployerAddress,
      stSTX,
      Borrower_2
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"]["value"]).toBe(
      false
    );
    // console.log(cvToValue(callResponse.result));

    // when not supplying
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_2),
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, zwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.none(),
      ],
      Borrower_2
    );
    expect(callResponse.result).toBeErr(Cl.uint(30019));
    callResponse = poolBorrow.getUserReserveData(
      Borrower_2,
      deployerAddress,
      wstx,
      Borrower_2
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"]["value"]).toBe(
      true
    );
    callResponse = poolBorrow.getUserReserveData(
      Borrower_2,
      deployerAddress,
      stSTX,
      Borrower_2
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"]["value"]).toBe(
      false
    );

    // when not supplying
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_2),
        Cl.contractPrincipal(deployerAddress, zwstx),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, zwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.none(),
      ],
      Borrower_2
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    callResponse = poolBorrow.getUserReserveData(
      Borrower_2,
      deployerAddress,
      wstx,
      Borrower_2
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"]["value"]).toBe(
      false
    );
    callResponse = poolBorrow.getUserReserveData(
      Borrower_2,
      deployerAddress,
      stSTX,
      Borrower_2
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"]["value"]).toBe(
      false
    );

    // when not supplying
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(Borrower_2),
        Cl.contractPrincipal(deployerAddress, zwstx),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.bool(true),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, zwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.none(),
      ],
      Borrower_2
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    callResponse = poolBorrow.getUserReserveData(
      Borrower_2,
      deployerAddress,
      wstx,
      Borrower_2
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"]["value"]).toBe(
      true
    );
    callResponse = poolBorrow.getUserReserveData(
      Borrower_2,
      deployerAddress,
      stSTX,
      Borrower_2
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"]["value"]).toBe(
      false
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, zwstx),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, zwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(5_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
      ],
      Borrower_2
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // borrowing non-isolated asset
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, zwstx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(5_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
      ],
      Borrower_2
    );
    expect(callResponse.result).toBeErr(Cl.uint(30006));

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zwstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(50_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = poolBorrow.getUserReserveData(
      Borrower_1,
      deployerAddress,
      wstx,
      Borrower_1
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"]["value"]).toBe(
      false
    );
    // console.log(cvToValue(callResponse.result));
    callResponse = poolBorrow.getUserReserveData(
      Borrower_1,
      deployerAddress,
      stSTX,
      Borrower_1
    );
    expect(cvToValue(callResponse.result)["use-as-collateral"]["value"]).toBe(
      true
    );
    // callResponse = poolBorrow.getUserReserveData(Borrower_1, deployerAddress, USDA, Borrower_1);
    // expect(cvToValue(callResponse.result)["use-as-collateral"].value).toBe(false);

    // callResponse = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-0-reserve`,
    //   "get-assets-used-by",
    //   [Cl.standardPrincipal(Borrower_2)],
    //   Borrower_2
    // );
    // console.log(Cl.prettyPrint(callResponse.result));

    // expect(borrower_data.result).toBeList([
    //   Cl.contractPrincipal(deployerAddress, stSTX),
    // ]);

    // console.log(Cl.prettyPrint(callResponse.result));
    // expect(callResponse.result).toBeOk(Cl.bool(true));
  });
  it(`Supply and borrow supplying only isolated asset. Exceed debt ceiling.`, () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracle = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = stSTXToken.mint(
      1_000_000_000_000_000,
      Borrower_1,
      deployerAddress
    );
    stSTXToken.mint(1_000_000_000_000_000, Borrower_2, deployerAddress);
    sBTCToken.mint(1_000_000_000_000_000, Borrower_1, deployerAddress);
    xUSDToken.mint(1_000_000_000_000_000, LP_1, deployerAddress);

    const xUSDPrice = 90_000_000n;

    oracle.setPrice(deployerAddress, xUSD, xUSDPrice, deployerAddress);
    oracle.setPrice(deployerAddress, stSTX, 160_000_000, deployerAddress);
    oracle.setPrice(deployerAddress, sBTC, 4_000_000_000_000, deployerAddress);
    oracle.setPrice(deployerAddress, wstx, 150_000_000, deployerAddress);

    const isolatedDebtCeiling = 115_200_000_000n;

    callResponse = poolBorrow.addIsolatedAsset(
      deployerAddress,
      stSTX,
      115_200_000_000,
      deployerAddress
    );

    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      xUSD,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
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
      sBTC,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(100_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(900_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_2
    );

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    let availableBorrow = Number(cvToValue(callResponse.result)["value"]);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(Math.floor(availableBorrow / 2)),
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
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.standardPrincipal(Borrower_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    // availableBorrow = Number(cvToValue(callResponse.result)["value"]);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(Math.floor(availableBorrow / 2)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
      ],
      Borrower_2
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    // console.log((callResponse.events[1].data.value as any));
    // console.log((callResponse.events[1].data.value as any).data.payload);

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, xUSD),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(availableBorrow));

    // callResponse = simnet.callPrivateFn(
    //   config.poolBorrow,
    //   "calculate-price",
    //   [
    //     Cl.uint(BigInt(cvToValue(callResponse.result).value)),
    //     Cl.uint(6),
    //     Cl.contractPrincipal(deployerAddress, "oracle"),
    //     Cl.contractPrincipal(deployerAddress, xUSD),
    //   ],
    //   Borrower_1
    // );
    // console.log((BigInt(cvToValue(callResponse.result).value) * xUSDPrice) / 100000000n );

    // check total isolated debt is the set debt ceiling
    callResponse = simnet.callPrivateFn(
      config.poolBorrow,
      "calculate-total-isolated-debt",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    // console.log(BigInt(cvToValue(callResponse.result).value.sum.value));
    expect(BigInt(cvToValue(callResponse.result).value.sum.value)).toBe(isolatedDebtCeiling);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(10000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
      ],
      Borrower_2
    );
    expect(callResponse.result).toBeErr(Cl.uint(30005));

    callResponse = xUSDToken.mint(1_000_000, Borrower_1, deployerAddress);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPrivateFn(
      config.poolBorrow,
      "calculate-total-isolated-debt",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    expect(BigInt(cvToValue(callResponse.result).value.sum.value)).toBeLessThan(isolatedDebtCeiling);

    // can borrow back to the debt ceiling after repaying (slightly less because of interest accrued)
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        // remove some interest
        Cl.uint(Math.floor(availableBorrow / 2) - 40),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
      ],
      Borrower_2
    );


    callResponse = xUSDToken.mint(1_000_000, Borrower_2, deployerAddress);
    // repay completely
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_2),
        Cl.standardPrincipal(Borrower_2),
      ],
      Borrower_2
    );

    // check balances are set to 0
    callResponse = simnet.callPrivateFn(
      config.poolBorrow,
      "calculate-total-isolated-debt",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    expect(BigInt(cvToValue(callResponse.result).value.sum.value)).toBe(0n);

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, xUSD),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(0n));
  });
  it(`Supply and borrow supplying only isolated asset. Borrow 2 assets and exceed debt ceiling.`, () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracle = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = stSTXToken.mint(
      1_000_000_000_000_000,
      Borrower_1,
      deployerAddress
    );
    stSTXToken.mint(1_000_000_000_000_000, Borrower_2, deployerAddress);
    sBTCToken.mint(1_000_000_000_000_000, Borrower_1, deployerAddress);
    xUSDToken.mint(1_000_000_000_000_000, LP_1, deployerAddress);
    sBTCToken.mint(10_000_000_000, LP_1, deployerAddress);

    const xUSDPrice = 90_000_000n;
    const sBTCPrice = 10_000_000_000_000n;

    oracle.setPrice(deployerAddress, xUSD, xUSDPrice, deployerAddress);
    oracle.setPrice(deployerAddress, stSTX, 160_000_000, deployerAddress);
    oracle.setPrice(deployerAddress, sBTC, sBTCPrice, deployerAddress);
    oracle.setPrice(deployerAddress, wstx, 150_000_000, deployerAddress);

    const isolatedDebtCeiling = 115_200_000_000n;

    callResponse = poolBorrow.addIsolatedAsset(
      deployerAddress,
      stSTX,
      115_200_000_000,
      deployerAddress
    );

    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      xUSD,
      deployerAddress
    );

    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      sBTC,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
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
      sBTC,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(100_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(900_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_2
    );

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);

    callResponse = simnet.callPublicFn(
      config.pool0ReserveRead,
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    let availableBorrow = Number(cvToValue(callResponse.result)["value"]);

    const borrowedXUSD = BigInt(Math.floor(availableBorrow / 2));
    const borrowedXUSDinUSD = ((borrowedXUSD * xUSDPrice) / 1000000n);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(borrowedXUSD),
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
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.standardPrincipal(Borrower_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
      Borrower_2
    );
    availableBorrow = Number(cvToValue(callResponse.result)["value"]);

    const borrowedSBTC =
      ((isolatedDebtCeiling - ((borrowedXUSD * xUSDPrice) / 1000000n)) * 100000000n) / sBTCPrice;
    const borrowedSBTCinUSD = (isolatedDebtCeiling - ((borrowedXUSD * xUSDPrice) / 1000000n));
      // console.log(availableBorrow);
      // console.log(Math.floor(availableBorrow / 2));
      // console.log(isolatedDebtCeiling)
      // console.log(((borrowedXUSD * xUSDPrice) / 1000000n));
      // console.log((isolatedDebtCeiling - ((borrowedXUSD * xUSDPrice) / 1000000n)));
      // console.log(borrowedSBTC);
      // console.log(isolatedDebtCeiling - (isolatedDebtCeiling - ((borrowedXUSD * xUSDPrice) / 1000000n)));
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(borrowedSBTC),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
      ],
      Borrower_2
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, xUSD),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(borrowedXUSD));

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, sBTC),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(borrowedSBTC));

    // check total isolated debt is the set debt ceiling
    callResponse = simnet.callPrivateFn(
      config.poolBorrow,
      "calculate-total-isolated-debt",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    // console.log(BigInt(cvToValue(callResponse.result).value.sum.value));
    expect(BigInt(cvToValue(callResponse.result).value.sum.value)).toBe(isolatedDebtCeiling);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(10000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
      ],
      Borrower_2
    );
    expect(callResponse.result).toBeErr(Cl.uint(30005));

    callResponse = xUSDToken.mint(1_000_000, Borrower_1, deployerAddress);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(borrowedXUSD / 2n),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPrivateFn(
      config.poolBorrow,
      "calculate-total-isolated-debt",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    expect(BigInt(cvToValue(callResponse.result).value.sum.value)).toBeLessThanOrEqual(isolatedDebtCeiling - (borrowedXUSDinUSD / 2n));

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, xUSD),
      ],
      Borrower_1
    );
    // some debt left from interest
    expect(BigInt(cvToValue(callResponse.result).value) - (borrowedXUSD / 2n)).toBe(0n);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, xUSD),
      ],
      Borrower_1
    );
    // some debt left from interest
    expect(callResponse.result).toBeSome(Cl.uint(0n));

    callResponse = simnet.callPrivateFn(
      config.poolBorrow,
      "calculate-total-isolated-debt",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    expect(BigInt(cvToValue(callResponse.result).value.sum.value)).toBe(borrowedSBTCinUSD);

    callResponse = sBTCToken.mint(1_000_000, Borrower_2, deployerAddress);
    // repay completely
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_2),
        Cl.standardPrincipal(Borrower_2),
      ],
      Borrower_2
    );

    // check balances are set to 0
    callResponse = simnet.callPrivateFn(
      config.poolBorrow,
      "calculate-total-isolated-debt",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    expect(BigInt(cvToValue(callResponse.result).value.sum.value)).toBe(0n);

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, xUSD),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(0n));
  });
  it(`Borrow against 2 different isolated assets each user.`, () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracle = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = stSTXToken.mint(
      1_000_000_000_000_000,
      Borrower_1,
      deployerAddress
    );
    stSTXToken.mint(1_000_000_000_000_000, Borrower_2, deployerAddress);
    sBTCToken .mint(1_000_000_000_000_000, Borrower_2, deployerAddress);
    sBTCToken.mint(1_000_000_000_000_000, Borrower_1, deployerAddress);
    xUSDToken.mint(1_000_000_000_000_000, LP_1, deployerAddress);
    sBTCToken.mint(10_000_000_000, LP_1, deployerAddress);

    const xUSDPrice = 90_000_000n;
    const stSTXPrice = 160_000_000n;
    const sBTCPrice = 10_000_000_000_000n;
    const wstxPrice = 150_000_000n;

    oracle.setPrice(deployerAddress, xUSD, xUSDPrice, deployerAddress);
    oracle.setPrice(deployerAddress, stSTX, stSTXPrice, deployerAddress);
    oracle.setPrice(deployerAddress, sBTC, sBTCPrice, deployerAddress);
    oracle.setPrice(deployerAddress, wstx, wstxPrice, deployerAddress);

    const isolatedDebtCeiling = 115_200_000_000n;

    callResponse = poolBorrow.addIsolatedAsset(
      deployerAddress,
      stSTX,
      1_300_000_000_000,
      deployerAddress
    );

    callResponse = poolBorrow.addIsolatedAsset(
      deployerAddress,
      sBTC,
      3_000_000_000_000,
      deployerAddress
    );

    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      xUSD,
      deployerAddress
    );

    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      sBTC,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      stSTX,
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
      sBTC,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(100_000_000_000),
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
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
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
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(20_000_000_000),
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
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(100_000_000),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_2
    );

    const ststxxUsd = 12_000_000n;
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(ststxxUsd),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, xUSD),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(ststxxUsd));

    const ststxsbtc = 11_000_000n;
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(ststxsbtc),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, sBTC),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(ststxsbtc));

    const sbtcsBTC = 20_000_000n;
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, zsbtc),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(sbtcsBTC),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
      ],
      Borrower_2
    );

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, sBTC),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(sbtcsBTC));

    const sbtcststx = 3_000_000n;
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(sbtcststx),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_2),
        Cl.none(),
      ],
      Borrower_2
    );
    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(sbtcststx));


    // balances remain unchanged
    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, xUSD),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(ststxxUsd));

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, sBTC),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(ststxsbtc));
    const totalDebtstSTX = (((ststxxUsd * xUSDPrice) / 1000000n) + ((ststxsbtc * sBTCPrice) / 100000000n));

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, sBTC),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(sbtcsBTC));

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(sbtcststx));

    const totalDebtsBTC = (((sbtcsBTC * sBTCPrice) / 100000000n) + ((sbtcststx * stSTXPrice) / 1000000n));

    // check total isolated debt is the set debt ceiling
    callResponse = simnet.callPrivateFn(
      config.poolBorrow,
      "calculate-total-isolated-debt",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    expect(BigInt(cvToValue(callResponse.result).value.sum.value)).toBe(totalDebtstSTX);

    // check total isolated debt is the debt against sbtc
    callResponse = simnet.callPrivateFn(
      config.poolBorrow,
      "calculate-total-isolated-debt",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    expect(BigInt(cvToValue(callResponse.result).value.sum.value)).toBe(totalDebtsBTC);
    // console.log(callResponse.events.map((event: any) => {
    //   console.log({
    //     sum: event.data.value.data.sum.value,
    //     isolatedAsset: event.data.value.data["isolated-asset"]["contractName"],
    //     currentOracle: event.data.value.data["oracle-contract"]["contractName"]
    //   })
    // }));
    // console.log(BigInt(cvToValue(callResponse.result).value.sum.value));
    
    callResponse = xUSDToken.mint(1_000_000, Borrower_1, deployerAddress);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(ststxsbtc / 2n),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, sBTC),
      ],
      Borrower_1
    );
    // some debt left from interest
    expect(BigInt(cvToValue(callResponse.result).value)).toBeLessThan(ststxsbtc);

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, sBTC),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(sbtcsBTC));

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeSome(Cl.uint(sbtcststx));

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, xUSD),
      ],
      Borrower_1
    );
    // some debt left from interest
    expect(callResponse.result).toBeSome(Cl.uint(0n));

  });

  it("Supply and borrow, debt against debt ceiling doesn't increase.", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = stSTXToken.mint(
      1_000_000_000_000_000,
      Borrower_1,
      deployerAddress
    );
    xUSDToken.mint(1_000_000_000_000_000, LP_1, deployerAddress);

    oracleContract.setPrice(deployerAddress,xUSD,100_000_000,deployerAddress);
    oracleContract.setPrice(deployerAddress,stSTX,160_000_000,deployerAddress);
    oracleContract.setPrice(deployerAddress,sBTC,4_000_000_000_000,deployerAddress);
    oracleContract.setPrice(deployerAddress,wstx,150_000_000,deployerAddress);
    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
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
      xUSD,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(100_000_000_000),
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
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(200_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, stSTX),
      ],
      Borrower_1
    );
    // some debt left from interest
    expect(callResponse.result).toBeNone();

    callResponse = simnet.callPrivateFn(
      config.poolBorrow,
      "calculate-total-isolated-debt",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    expect(BigInt(cvToValue(callResponse.result).value.sum.value)).toBe(0n);
  });
  it("Supply and borrow against isolated asset, pay back after interest is accrued.", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = stSTXToken.mint(
      1_000_000_000_000_000,
      Borrower_1,
      deployerAddress
    );
    xUSDToken.mint(1_000_000_000_000_000, LP_1, deployerAddress);

    oracleContract.setPrice(deployerAddress,xUSD,100_000_000,deployerAddress);
    oracleContract.setPrice(deployerAddress,stSTX,160_000_000,deployerAddress);
    oracleContract.setPrice(deployerAddress,sBTC,4_000_000_000_000,deployerAddress);
    oracleContract.setPrice(deployerAddress,wstx,150_000_000,deployerAddress);
    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
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
      xUSD,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    const suppliedxUSD = 100_000_000_000;

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(suppliedxUSD),
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
        Cl.contractPrincipal(deployerAddress, zststx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(10_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, zxusd),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
        Cl.uint(2_000_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );


    callResponse = simnet.callPrivateFn(
      config.poolBorrow,
      "calculate-total-isolated-debt",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    expect(BigInt(cvToValue(callResponse.result).value.sum.value)).toBeGreaterThan(0n);

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, xUSD),
      ],
      Borrower_1
    );
    // some debt left from interest
    expect(callResponse.result).toBeSome(Cl.uint(2_000_000_000));

    simnet.mineEmptyBurnBlocks(52560);

    const prevxUSDBalance = 
      simnet.getAssetsMap()
        .get(".xusd.xusd")?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
    xUSDToken.mint(1_000_000_000, Borrower_1, deployerAddress);
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(
      simnet.getAssetsMap()
        .get(".xusd.xusd")
        ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!).toBeGreaterThan(suppliedxUSD);

    callResponse = simnet.callReadOnlyFn(
      config.poolReserveData3,
      "get-asset-isolation-mode-debt-read",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, xUSD),
      ],
      Borrower_1
    );
    // some debt left from interest
    expect(callResponse.result).toBeSome(Cl.uint(0));

    callResponse = simnet.callPrivateFn(
      config.poolBorrow,
      "calculate-total-isolated-debt",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
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
    expect(BigInt(cvToValue(callResponse.result).value.sum.value)).toBe(0n);

  });
});
