import { initSimnet } from "@hirosystems/clarinet-sdk";
import { describe, expect, it, beforeEach } from "vitest";
import { Cl, cvToJSON } from "@stacks/transactions";
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
const lpstSTX = "lp-ststx";
const lpUSDA = "lp-usda";
const lpxUSD = "lp-xusd";

const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const oracle = "oracle";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sbtc";
const stSTX = "ststx";
const zstSTX = "lp-ststx";
const zsBTC = "lp-sbtc";
const zwstx = "lp-wstx";
const USDA = "usda";
const xUSD = "xusd";
const wstx = "wstx";

const max_value = BigInt("340282366920938463463374607431768211455");

describe("Supply and redeem", () => {
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
  });
  it("Supply and immediately redeem without returns", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
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
      lpstSTX,
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

    callResponse = poolBorrow.init(
      deployerAddress,
      lpsBTC,
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

    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      sBTC,
      "mint",
      [Cl.uint(2_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      1_000_000_000,
      LP_1,
      LP_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

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
    // console.log(Cl.prettyPrint(callResponse.result));

    // console.log(simnet.getAssetsMap());
    callResponse = stSTXZToken.redeem(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      stSTX,
      deployerAddress,
      oracle,
      1_000_000_000,
      LP_1,
      [
        {
          asset: { deployerAddress, contractName: stSTX },
          "lp-token": { deployerAddress, contractName: zstSTX },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      LP_1
    );
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));

    callResponse = sBTCZToken.redeem(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      sBTC,
      deployerAddress,
      oracle,
      2_000_000_000,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    expect(simnet.getAssetsMap().get(".lp-sbtc.lp-sbtc")?.get(Borrower_1)).toBe(
      0n
    );
    expect(simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(LP_1)).toBe(0n);
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
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
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
      lpstSTX,
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

    callResponse = poolBorrow.init(
      deployerAddress,
      lpsBTC,
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

    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [Cl.uint(1_100_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      sBTC,
      "mint",
      [Cl.uint(2_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      1_100_000_000,
      LP_1,
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30020));

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      1_000_000_000,
      LP_1,
      LP_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

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

    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      stSTX,
      deployerAddress,
      lpstSTX,
      100_000_000,
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30004));

    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      stSTX,
      deployerAddress,
      lpstSTX,
      99_750_000,
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(99_750_000));
  });
  it("Supply and borrow wstx", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
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

    // let callResponse = poolReserve0.setOptimalUtilizationRate(deployerAddress, wstx, 1, deployerAddress);
    // console.log(Cl.prettyPrint(callResponse.result));

    let callResponse = poolBorrow.init(
      deployerAddress,
      lpstSTX,
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

    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [Cl.uint(1_100_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      wstx,
      "transfer",
      [
        Cl.uint(2_000_000_000), 
        Cl.standardPrincipal(deployerAddress),
        Cl.standardPrincipal(Borrower_1),
        Cl.none()
      ],
      deployerAddress
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      1_000_000_000,
      LP_1,
      LP_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = poolBorrow.supply(
      deployerAddress,
      zwstx,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      wstx,
      2_000_000_000,
      Borrower_1,
      Borrower_1
    );
    expect(simnet.getAssetsMap().get("STX")?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")).toBe(2000000000n);
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      wstx,
      deployerAddress,
      zwstx,
      99_750_000,
      deployerAddress,
      "fees-calculator",
      0,
      LP_1,
      [
        {
          asset: { deployerAddress, contractName: stSTX },
          "lp-token": { deployerAddress, contractName: zstSTX },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      LP_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(99_750_000));

    simnet.mineEmptyBlocks(100)

    callResponse = simnet.callPublicFn(
      wstx,
      "transfer",
      [
        Cl.uint(99_750_000 * 10), 
        Cl.standardPrincipal(deployerAddress),
        Cl.standardPrincipal(LP_1),
        Cl.none()
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(max_value),
        Cl.standardPrincipal(LP_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(99999858));
  });
  it("Borrower supplies sBTC, borrow stSTX pay back with interest. LPer gets their stSTX back", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
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
      lpstSTX,
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

    callResponse = poolBorrow.init(
      deployerAddress,
      lpsBTC,
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

    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      sBTC,
      "mint",
      [Cl.uint(2_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      1_000_000_000,
      LP_1,
      LP_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

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
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      stSTX,
      deployerAddress,
      lpstSTX,
      5_000_000_000,
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30007));

    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      stSTX,
      deployerAddress,
      lpstSTX,
      100_000_000,
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    // console.log(cvToJSON(callResponse.result));
    expect(callResponse.result).toBeOk(Cl.uint(100_000_000));

    simnet.mineEmptyBlocks(10);

    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    expect(callResponse.result).toBeOk(Cl.uint(100250114));

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(callResponse.result).toBeList([
      Cl.contractPrincipal(deployerAddress, sBTC),
    ]);

    callResponse = sBTCZToken.redeem(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      sBTC,
      deployerAddress,
      oracle,
      2_000_000_000,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
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

    callResponse = stSTXZToken.redeem(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      stSTX,
      deployerAddress,
      oracle,
      max_value,
      LP_1,
      [
        {
          asset: { deployerAddress, contractName: stSTX },
          "lp-token": { deployerAddress, contractName: zstSTX },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      LP_1
    );

    expect(callResponse.result).toBeOk(Cl.uint(1_000_000_110n));

    expect(simnet.getAssetsMap().get(".lp-sbtc.lp-sbtc")?.get(Borrower_1)).toBe(
      0n
    );
    expect(simnet.getAssetsMap().get(".lp-ststx.lp-ststx")?.get(LP_1)).toBe(0n);
    expect(simnet.getAssetsMap().get(".ststx.ststx")?.get(LP_1)).toBe(
      1_000_000_110n
    );
  });
  it("Borrower supplies sBTC, borrow stSTX pay back with high interests. LPer gets their stSTX back", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
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
      lpstSTX,
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

    callResponse = poolBorrow.init(
      deployerAddress,
      lpsBTC,
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

    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      sBTC,
      "mint",
      [Cl.uint(2_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      1_000_000_000,
      LP_1,
      LP_1
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

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
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      stSTX,
      deployerAddress,
      lpstSTX,
      5_000_000_000,
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30007));

    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      stSTX,
      deployerAddress,
      lpstSTX,
      100_000_000,
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    // console.log(cvToJSON(callResponse.result));
    expect(callResponse.result).toBeOk(Cl.uint(100_000_000));

    simnet.mineEmptyBlocks(10);

    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    // console.log(cvToJSON(callResponse.result));

    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      stSTX,
      deployerAddress,
      lpstSTX,
      100_000_000,
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    // console.log(cvToJSON(callResponse.result));
    expect(callResponse.result).toBeOk(Cl.uint(100_000_000));

    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    // callResponse = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-read`,
    //   "get-asset-supply-apy",
    //   [Cl.contractPrincipal(deployerAddress, stSTX)],
    //   deployerAddress
    // );
    // console.log(Cl.prettyPrint(callResponse.result));

    // callResponse = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-read`,
    //   "get-supplieable-assets",
    //   // [Cl.contractPrincipal(deployerAddress, stSTX)],
    //   [],
    //   deployerAddress
    // );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(max_value),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(100250019));
  });
});
