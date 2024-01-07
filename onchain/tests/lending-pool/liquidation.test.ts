import { initSimnet } from "@hirosystems/clarinet-sdk";
import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";

const simnet = await initSimnet();

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

const lpdiko = "lp-diko";
const lpsBTC = "lp-sBTC";
const lpstSTX = "lp-stSTX";
const lpUSDA = "lp-USDA";
const lpxUSD = "lp-xUSD";

const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sBTC";
const stSTX = "stSTX";
const USDA = "USDA";
const xUSD = "xUSD";

describe("example tests", () => {
  it("Supply sBTC, borrow xUSD, price goes bellow health factor", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

    let callResponse = simnet.callPublicFn(
      sBTC,
      "mint",
      [Cl.uint(100_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      sBTC,
      "mint",
      [Cl.uint(1_000_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    // 3 992 301 124 525
    //    50 000 000 000
    callResponse = simnet.callPublicFn(
      xUSD,
      "mint",
      [Cl.uint(100_000_000_000_000), Cl.standardPrincipal(Liquidator_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      xUSD,
      "mint",
      [Cl.uint(100_000_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "oracle",
      "set-price",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(100_000_000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "oracle",
      "set-price",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(1_000_000_000_000)],
      deployerAddress
    );

    callResponse = poolReserve0.init(
      deployerAddress,
      lpsBTC,
      deployerAddress,
      sBTC,
      8,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    callResponse = poolReserve0.init(
      deployerAddress,
      lpxUSD,
      deployerAddress,
      xUSD,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    callResponse = poolReserve0.setBorrowingEnabled(
      deployerAddress,
      sBTC,
      true,
      deployerAddress
    );

    callResponse = poolReserve0.setBorrowingEnabled(
      deployerAddress,
      xUSD,
      true,
      deployerAddress
    );

    callResponse = poolReserve0.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      80000000,
      5000000,
      deployerAddress
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpsBTC,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      sBTC,
      100_000_000_000,
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
      1_000_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpxUSD,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      xUSD,
      100_000_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "borrow",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
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
    console.log(Cl.prettyPrint(callResponse.result));
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[2].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[3].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[4].data.value!));

    // simnet.mineEmptyBlocks(10);

    let borrower_1_data = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
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

    callResponse = simnet.callPublicFn(
      "oracle",
      "set-price",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(100_000_000)],
      deployerAddress
    );

    console.log(simnet.getAssetsMap().get(".sBTC.sBTC"));
    console.log(simnet.getAssetsMap().get(".xUSD.xUSD"));
    // console.log(simnet.getAssetsMap().get(".lp-sBTC.lp-sBTC"));
    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTC),
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
    // u100000000000
    console.log(Cl.prettyPrint(callResponse.result));
    // console.log(Cl.prettyPrint(borrower_1_data.events[0].data.value!));
    // console.log(callResponse.events);
    console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    console.log(Cl.prettyPrint(callResponse.events[1].data.value!));
    console.log(Cl.prettyPrint(callResponse.events[2].data.value!));
    console.log(Cl.prettyPrint(callResponse.events[3].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[4].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[5].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[6].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[7].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[8].data.value!));
    // u20000000000
    // console.log(Cl.prettyPrint(callResponse.events[9].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[10].data.value!));
    // console.log(callResponse.events);

    // console.log(Cl.prettyPrint(callResponse.events[6].data.value!));
    // console.log(Cl.prettyPrint(borrower_1_data.events[4].data.value!));
    // console.log(Cl.prettyPrint(borrower_1_data.events[5].data.value!));
    // callResponse = simnet.callPublicFn(
    //   "pool-0-reserve",
    //   "get-user-basic-reserve-data",
    //   [
    //     Cl.contractPrincipal(deployerAddress, lpsBTC),
    //     Cl.contractPrincipal(deployerAddress, sBTC),
    //     Cl.contractPrincipal(deployerAddress, "oracle"),
    //     Cl.tuple({
    //       "total-liquidity-balanceUSD": Cl.uint(0),
    //       "total-collateral-balanceUSD": Cl.uint(0),
    //       "total-borrow-balanceUSD": Cl.uint(0),
    //       "user-total-feesUSD": Cl.uint(0),
    //       "current-ltv": Cl.uint(0),
    //       "current-liquidation-threshold": Cl.uint(0),
    //       user: Cl.standardPrincipal(Borrower_1),
    //     }),
    //   ],
    //   Borrower_1
    // );

    console.log(simnet.getAssetsMap().get(".sBTC.sBTC"));
    console.log(simnet.getAssetsMap().get(".xUSD.xUSD"));
    // console.log(simnet.getAssetsMap().get(".lp-sBTC.lp-sBTC"));
    // console.log(simnet.getAssetsMap());
    // console.log(Cl.prettyPrint(callResponse.result));
  });
});
