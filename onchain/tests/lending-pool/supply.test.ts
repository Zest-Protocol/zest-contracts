import { initSimnet } from "@hirosystems/clarinet-sdk";
import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";
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
const USDA = "USDA";
const xUSD = "xUSD";

describe("example tests", () => {
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

    let callResponse = poolBorrow.init(
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

    callResponse = simnet.callPublicFn(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(LP_1)],
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
    console.log(Cl.prettyPrint(callResponse.result));

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(LP_1)],
      LP_1
    );
    console.log(Cl.prettyPrint(borrower_data.result));

    callResponse = simnet.callPublicFn(
      "lp-stSTX",
      "redeem",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      LP_1
    );
  });

  it("Supply and immediately redeem without returns", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

    let callResponse = simnet.callPublicFn(
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
        Cl.uint(1000000000),
        Cl.standardPrincipal("ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB"),
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
      [
        Cl.uint(1000000000000000),
        Cl.standardPrincipal("ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"),
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
      deployerAddress
    );
    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      xUSD,
      1_000_000_000_000,
      deployerAddress
    );
    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      USDA,
      1_000_000_000_000,
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

    // callResponse = poolBorrow.supply(
    //   deployerAddress,
    //   lpxUSD,
    //   deployerAddress,
    //   pool0Reserve,
    //   deployerAddress,
    //   xUSD,
    //   100_000_000_000,
    //   Borrower_1,
    //   Borrower_1
    // );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpUSDA,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      USDA,
      100_000_000_000,
      Borrower_1,
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

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

    callResponse = poolBorrow.supply(
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
    // console.log(Cl.prettyPrint(callResponse.result));

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    console.log(Cl.prettyPrint(borrower_data.result));

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "borrow",
      [
        // Cl.contractPrincipal(deployerAddress, debtToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, lpstSTX),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDA),
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
    console.log(Cl.prettyPrint(callResponse.result));
    // u9900000000
    // u990000000000

    // callResponse = poolBorrow.supply(
    //   deployerAddress,
    //   lpxUSD,
    //   deployerAddress,
    //   pool0Reserve,
    //   deployerAddress,
    //   xUSD,
    //   10_000_000_000,
    //   Borrower_1,
    //   Borrower_1
    // );
    // console.log(Cl.prettyPrint(callResponse.result));

    // console.log(simnet.getAssetsMap().get(".lp-token-0.lp-token-0"));
    // console.log(simnet.getAssetsMap().get(".stSTX.stSTX"));

    // console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));
    // console.log(callResponse.events);

    simnet.mineEmptyBlocks(10);

    let borrower_1_data = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDA),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    console.log(Cl.prettyPrint(borrower_1_data.result));
    // console.log(Cl.prettyPrint(borrower_1_data.events[0].data.value!));

    // console.log(Cl.prettyPrint(borrower_1_data.result));
    // console.log(Cl.prettyPrint(borrower_1_data.events[0].data.value!));
    // console.log(Cl.prettyPrint(borrower_1_data.events[1].data.value!));
    // console.log(Cl.prettyPrint(borrower_1_data.events[2].data.value!));
    // console.log(Cl.prettyPrint(borrower_1_data.events[3].data.value!));
    // console.log(Cl.prettyPrint(borrower_1_data.events[4].data.value!));
    // console.log(Cl.prettyPrint(borrower_1_data.events[5].data.value!));

    // let borrower_data = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-0-reserve`,
    //   "get-user-reserve-data",
    //   [
    //     Cl.standardPrincipal(Borrower_1),
    //     Cl.contractPrincipal(deployerAddress, stSTX),
    //   ],
    //   Borrower_1
    // );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "get-user-basic-reserve-data",
      [
        Cl.contractPrincipal(deployerAddress, lpUSDA),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.tuple({
          "total-liquidity-balanceUSD": Cl.uint(0),
          "total-collateral-balanceUSD": Cl.uint(0),
          "total-borrow-balanceUSD": Cl.uint(0),
          "user-total-feesUSD": Cl.uint(0),
          "current-ltv": Cl.uint(0),
          "current-liquidation-threshold": Cl.uint(0),
          user: Cl.standardPrincipal(Borrower_1),
        }),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_2),
      ],
      LP_2
    );
    console.log(Cl.prettyPrint(callResponse.result));

    borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_2)],
      Borrower_2
    );

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "borrow",
      [
        // Cl.contractPrincipal(deployerAddress, debtToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.contractPrincipal(deployerAddress, lpUSDA),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          // Cl.tuple({
          //   asset: Cl.contractPrincipal(deployerAddress, sBTC),
          //   "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
          //   oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          // }),
          // Cl.tuple({
          //   asset: Cl.contractPrincipal(deployerAddress, diko),
          //   "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
          //   oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          // }),
          // Cl.tuple({
          //   asset: Cl.contractPrincipal(deployerAddress, USDA),
          //   "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDA),
          //   oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          // }),
          // Cl.tuple({
          //   asset: Cl.contractPrincipal(deployerAddress, xUSD),
          //   "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
          //   oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          // }),
        ]),
        Cl.uint(200_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_2),
      ],
      Borrower_2
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_3),
      ],
      LP_3
    );
    // console.log(simnet.getAssetsMap());

    console.log(Cl.prettyPrint(callResponse.result));

    simnet.mineEmptyBlocks(10);

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "repay",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(200_681_524),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    console.log(Cl.prettyPrint(callResponse.result));

    // console.log(callResponse.events);
    // console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));
    // console.log(simnet.getAssetsMap().get(".lp-token-0.lp-token-0"));
    // console.log(simnet.getAssetsMap().get(".stSTX.stSTX"));

    // console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));

    // lp_1_data = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-0-reserve`,
    //   "get-user-reserve-data",
    //   [
    //     Cl.standardPrincipal(LP_1),
    //     Cl.contractPrincipal(deployerAddress, stSTX),
    //   ],
    //   deployerAddress
    // );
    // borrower_data = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-0-reserve`,
    //   "get-user-reserve-data",
    //   [
    //     Cl.standardPrincipal(Borrower_1),
    //     Cl.contractPrincipal(deployerAddress, stSTX),
    //   ],
    //   deployerAddress
    // );

    // console.log(Cl.prettyPrint(lp_1_data.result));
    // console.log(Cl.prettyPrint(borrower_data.result));

    callResponse = simnet.callPublicFn(
      "lp-stSTX",
      "redeem",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      LP_1
    );

    console.log(Cl.prettyPrint(callResponse.result));
    // console.log(callResponse.events);

    // console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));
    // { THIS: { balance-increase: u940, index: u100000094, new-user-balance: u1000000940, previous-user-balance: u1000000000 } }

    // console.log(simnet.getAssetsMap().get(".lp-token-0.lp-token-0"));
    // console.log(simnet.getAssetsMap().get(".stSTX.stSTX"));

    // console.log(Cl.prettyPrint(callResponse.events[1]["data"].value!));
    // console.log(callResponse.events);
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "lp-stSTX",
      "redeem",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_2),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDA),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      LP_2
    );
    console.log(Cl.prettyPrint(callResponse.result));
    // console.log(callResponse.events);

    // console.log(Cl.prettyPrint(callResponse.events[1]["data"].value!));
    // console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));

    // borrower_data = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-0-reserve`,
    //   "get-assets-used-by",
    //   [Cl.standardPrincipal(LP_3)],
    //   LP_3
    // );
    // console.log("WENT");
    // console.log(Cl.prettyPrint(borrower_data.result));

    callResponse = simnet.callPublicFn(
      "lp-stSTX",
      "redeem",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_3),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          // Cl.tuple({
          //   asset: Cl.contractPrincipal(deployerAddress, sBTC),
          //   "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
          //   oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          // }),
          // Cl.tuple({
          //   asset: Cl.contractPrincipal(deployerAddress, diko),
          //   "lp-token": Cl.contractPrincipal(deployerAddress, lpdiko),
          //   oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          // }),
          // Cl.tuple({
          //   asset: Cl.contractPrincipal(deployerAddress, USDA),
          //   "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDA),
          //   oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          // }),
          // Cl.tuple({
          //   asset: Cl.contractPrincipal(deployerAddress, xUSD),
          //   "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
          //   oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          // }),
        ]),
      ],
      LP_3
    );
    console.log(Cl.prettyPrint(callResponse.result));

    // console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));
    // console.log(callResponse.events);
    // console.log(Cl.prettyPrint(callResponse.result));

    // console.log(LP_2);

    // console.log(simnet.getAssetsMap().get(".stSTX.stSTX"));
  });
});

describe("example tests", () => {
  it("Supply and immediately redeem without returns", () => {});
});
