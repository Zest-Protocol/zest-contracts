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
const lpsBTC = "lp-sBTC";
const lpstSTX = "lp-stSTX";
const lpUSDA = "lp-USDA";
const lpxUSD = "lp-xUSD";

const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const oracle = "oracle";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sBTC";
const stSTX = "stSTX";
const zStSTX = "lp-stSTX";
const zsBTC = "lp-sBTC";
const USDA = "USDA";
const xUSD = "xUSD";

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

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
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
          "lp-token": { deployerAddress, contractName: zStSTX },
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
    expect(simnet.getAssetsMap().get(".lp-sBTC.lp-sBTC")?.get(Borrower_1)).toBe(
      0n
    );
    expect(simnet.getAssetsMap().get(".lp-stSTX.lp-stSTX")?.get(LP_1)).toBe(0n);
    expect(simnet.getAssetsMap().get(".sBTC.sBTC")?.get(Borrower_1)).toBe(
      2_000_000_000n
    );
    expect(simnet.getAssetsMap().get(".stSTX.stSTX")?.get(LP_1)).toBe(
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
  it("Borrower supplies sBTC, borrow stSTX pay back with interest. LPer gets their stSTX back", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
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
    expect(callResponse.result).toBeOk(Cl.uint(100_000_000));

    // callResponse = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-reserve-data`,
    //   "get-reserve-state-read",
    //   [Cl.contractPrincipal(deployerAddress, stSTX)],
    //   LP_1
    // );
    // console.log(cvToJSON(callResponse.result)["value"]);
    // callResponse = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-reserve-data`,
    //   "get-user-reserve-data-read",
    //   [
    //     Cl.standardPrincipal(Borrower_1),
    //     Cl.contractPrincipal(deployerAddress, stSTX),
    //   ],
    //   Borrower_1
    // );
    // console.log(cvToJSON(callResponse.result)["value"]["value"]);
    // console.log("User Index data");
    // callResponse = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-reserve-data`,
    //   "get-user-index-read",
    //   [Cl.standardPrincipal(LP_1)],
    //   LP_1
    // );
    // console.log(cvToJSON(callResponse.result)["value"]);

    // 50000
    // 20
    // 100000000

    // console.log("After stSTX borrow by Borrower 1");
    // callResponse = simnet.callPublicFn(
    //   zStSTX,
    //   "get-balance-test",
    //   [Cl.standardPrincipal(LP_1)],
    //   LP_1
    // );
    // console.log(cvToJSON(callResponse.result)["value"]);
    // console.log(cvToJSON(callResponse.result)["value"]["value"]);

    // console.log("Calculating interest rates after borrowing");
    // callResponse = simnet.callPublicFn(
    //   "pool-read",
    //   "calculate-interest-rates-test",
    //   [Cl.contractPrincipal(deployerAddress, stSTX)],
    //   deployerAddress
    // );
    // console.log(cvToJSON(callResponse.result)["value"]);

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
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log("Reserve state data After Repayment");
    // callResponse = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-reserve-data`,
    //   "get-reserve-state-read",
    //   [Cl.contractPrincipal(deployerAddress, stSTX)],
    //   LP_1
    // );
    // callResponse = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-reserve-data`,
    //   "get-user-reserve-data-read",
    //   [
    //     Cl.standardPrincipal(Borrower_1),
    //     Cl.contractPrincipal(deployerAddress, stSTX),
    //   ],
    //   Borrower_1
    // );

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(callResponse.result).toBeList([
      Cl.contractPrincipal(deployerAddress, sBTC),
    ]);

    // console.log(simnet.getAssetsMap());
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
    // expect(callResponse.result).toBeOk(Cl.uint(2_000_000_000));

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    // expect(callResponse.result).toBeList([]);

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.${zStSTX}`,
      "get-balance",
      [Cl.standardPrincipal(LP_1)],
      Borrower_1
    );

    // callResponse = simnet.callPublicFn(
    //   zStSTX,
    //   "get-balance-test",
    //   [Cl.standardPrincipal(LP_1)],
    //   deployerAddress
    // );
    // console.log(cvToJSON(callResponse.result)["value"]["value"]);

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
          "lp-token": { deployerAddress, contractName: zStSTX },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      LP_1
    );

    expect(callResponse.result).toBeOk(Cl.uint(1_000_000_110n));

    expect(simnet.getAssetsMap().get(".lp-sBTC.lp-sBTC")?.get(Borrower_1)).toBe(
      0n
    );
    expect(simnet.getAssetsMap().get(".lp-stSTX.lp-stSTX")?.get(LP_1)).toBe(0n);
    expect(simnet.getAssetsMap().get(".stSTX.stSTX")?.get(LP_1)).toBe(
      1_000_000_110n
    );
  });
});
