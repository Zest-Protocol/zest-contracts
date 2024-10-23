import { describe, expect, it, beforeEach } from "vitest";
import { Cl, cvToJSON, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";
import { ZToken } from "./models/zToken";

import * as config from "./tools/config";
import { initSimnetChecker } from "./tools/SimnetChecker";
import { deployV2Contracts, deployV2TokenContracts } from "./tools/common";

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

const lpdiko = "lp-diko";
const lpsBTC = "lp-sbtc";
const lpsBTCv1 = "lp-sbtc-v1";
const lpsBTCv2 = "lp-sbtc-v2";
const lpsBTCv3 = "lp-sbtc-v3";
const lpstSTX = "lp-ststx";
const lpstSTXv1 = "lp-ststx-v1";
const lpstSTXv2 = "lp-ststx-v2";
const lpstSTXv3 = "lp-ststx-v3";
const lpUSDA = "lp-usda";
const lpUSDAv1 = "lp-usda-v1";
const lpUSDAv2 = "lp-usda-v2";
const lpUSDAv3 = "lp-usda-v3";
const lpxUSD = "lp-xusd";

const lpWSTXv2 = "lp-wstx-v2";
const lpWSTXv3 = "lp-wstx-v3";

const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const oracle = "oracle";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sbtc";
const stSTX = "ststx";
const zstSTX = lpstSTXv3;
const zsBTC = lpsBTCv3;
const zUSDA = lpUSDAv3;
const zwstx = lpWSTXv3;
const USDA = "usda";
const xUSD = "xusd";
const wstx = "wstx";

const max_value = BigInt("340282366920938463463374607431768211455");

describe("Supply and redeem ", () => {
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

    let callResponse = simnet.deployContract(
      "run-reserve-extra-variables",
      readFileSync(config.reserveExtraVariables).toString(),
      null,
      deployerAddress
    );

		simnet.setEpoch("3.0");
		deployV2Contracts(simnet, deployerAddress);
		deployV2TokenContracts(simnet, deployerAddress);

    callResponse = simnet.deployContract(
      "run-1",
      readFileSync(config.initContractsToV2).toString(),
      null,
      deployerAddress
    );
  });
  it("Supply and immediately redeem without returns ", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zstSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);

    let callResponse = oracleContract.setPrice(
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

    callResponse = poolBorrow.init(
      deployerAddress,
      zstSTX,
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
      zsBTC,
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

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
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

    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(2_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zsBTC),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, zsBTC),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      Borrower_1
    );

    expect(
      simnet.getAssetsMap().get(`.${lpsBTCv2}.lp-sbtc`)?.get(Borrower_1)
    ).toBe(0n);
    expect(simnet.getAssetsMap().get(`.${lpstSTXv2}.lp-ststx`)?.get(LP_1)).toBe(
      0n
    );
    expect(simnet.getAssetsMap().get(".sbtc.sbtc")?.get(Borrower_1)).toBe(
      2_000_000_000n
    );
    expect(simnet.getAssetsMap().get(".ststx.ststx")?.get(LP_1)).toBe(
      1_000_000_000n
    );

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(LP_1)],
      LP_1
    );
    expect(callResponse.result).toBeList([]);

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(callResponse.result).toBeList([]);
  });
  it("Hit supply and borrow cap", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      config.pool0Reserve
    );
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zstSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);

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

    let callResponse = poolBorrow.init(
      deployerAddress,
      zstSTX,
      deployerAddress,
      stSTX,
      6,
      1_000_000_000,
      100_000_000,
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    callResponse = poolBorrow.addAsset(deployerAddress, stSTX, deployerAddress);

    callResponse = poolBorrow.init(
      deployerAddress,
      zsBTC,
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

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
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

    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1_100_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(2_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_100_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30020));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zsBTC),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(150_000_000)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30004));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(99_750_000)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
  });
  it("Supply and borrow wstx", () => {
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
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zstSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const wstxZToken = new ZToken(simnet, deployerAddress, wstx);

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      161_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      wstx,
      160_000_000,
      deployerAddress
    );

    let callResponse = poolBorrow.init(
      deployerAddress,
      zstSTX,
      deployerAddress,
      stSTX,
      6,
      1_000_000_000,
      100_000_000,
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    callResponse = poolBorrow.addAsset(deployerAddress, stSTX, deployerAddress);

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
    callResponse = poolBorrow.addAsset(deployerAddress, wstx, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      wstx,
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

    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1_100_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      wstx,
      "transfer",
      [
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(deployerAddress),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zwstx),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
    expect(
      simnet
        .getAssetsMap()
        .get("STX")
        ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")
    ).toBe(2000000000n);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, zwstx),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, zwstx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
        Cl.uint(Math.floor(99_750_000)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(LP_1),
      ],
      LP_1
    );

    simnet.mineEmptyBlocks(100);

    callResponse = simnet.callPublicFnCheckOk(
      wstx,
      "transfer",
      [
        Cl.uint(99_750_000 * 10),
        Cl.standardPrincipal(deployerAddress),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(max_value),
        Cl.standardPrincipal(LP_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));
  });
  it("Borrower supplies sBTC, borrow stSTX pay back with interest. LPer gets their stSTX back", () => {
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
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zstSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);

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

    let callResponse = poolBorrow.init(
      deployerAddress,
      zstSTX,
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
      zsBTC,
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

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
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

    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(2_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zsBTC),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(5_000_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30007));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsBTC),
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

    simnet.mineEmptyBlocks(10);

    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    const balanceBeforeRepay = simnet
      .getAssetsMap()
      .get(".ststx.ststx")
      ?.get(Borrower_1)!;

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(
      balanceBeforeRepay -
        simnet.getAssetsMap().get(".ststx.ststx")?.get(Borrower_1)!
    ).toBe(100_000_091n);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, zsBTC),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      Borrower_1
    );

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.${zstSTX}`,
      "get-balance",
      [Cl.standardPrincipal(LP_1)],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(max_value),
        Cl.standardPrincipal(LP_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );

    expect(
      simnet.getAssetsMap().get(`.${lpsBTCv2}.lp-sbtc`)?.get(Borrower_1)
    ).toBe(0n);
    expect(simnet.getAssetsMap().get(`.${lpstSTXv2}.lp-ststx`)?.get(LP_1)).toBe(
      0n
    );
    expect(simnet.getAssetsMap().get(".ststx.ststx")?.get(LP_1)).toBe(
      1_000_000_070n
    );
  });
  it("Borrower supplies sBTC, borrow stSTX pay back with high interests. LPer gets their stSTX back", () => {
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
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zstSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);

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

    let callResponse = poolBorrow.init(
      deployerAddress,
      zstSTX,
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
      zsBTC,
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

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
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

    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(2_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zsBTC),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(5_000_000_000)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30007));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(100_000_000)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    simnet.mineEmptyBlocks(100);

    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsBTC),
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

    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    simnet.mineEmptyBlocks(100);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(max_value),
        Cl.standardPrincipal(LP_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(
      simnet.getAssetsMap().get(".ststx.ststx")?.get(LP_1)!
    ).toBeGreaterThan(1_000_000_000n);
  });
});
