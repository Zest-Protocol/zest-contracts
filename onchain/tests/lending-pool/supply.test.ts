import { initSimnet } from "@hirosystems/clarinet-sdk";
import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { readFileSync } from "fs";

const simnet = await initSimnet();

const accounts = simnet.getAccounts();
const deployerAddress = accounts.get("deployer")!;
const LP_1 = accounts.get("wallet_1")!;
const LP_2 = accounts.get("wallet_4")!;
const LP_3 = accounts.get("wallet_5")!;
const Borrower_1 = accounts.get("wallet_2")!;
const Delegate_1 = accounts.get("wallet_3")!;

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
  it("Supply and immediately redeem without returns", () => {
    let callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "init",
      [
        Cl.contractPrincipal(deployerAddress, lpdiko),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(6),
        Cl.uint(80000000),
        Cl.uint(BigInt("340282366920938463463374607431768211455")),
        Cl.contractPrincipal(deployerAddress, interestRateStrategyDefault),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpdiko),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "redeem-underlying",
      [
        Cl.contractPrincipal(deployerAddress, lpdiko),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
      ],
      LP_1
    );

    // console.log(simnet.getAssetsMap());
    // console.log(Cl.prettyPrint(callResponse.result));

    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!))
  });
  it("Supply and immediately redeem without returns", () => {
    let callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "init",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTX),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(6),
        Cl.uint(80000000),
        Cl.uint(BigInt("340282366920938463463374607431768211455")),
        Cl.contractPrincipal(deployerAddress, interestRateStrategyDefault),
      ],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "init",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTC),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(6),
        Cl.uint(80000000),
        Cl.uint(BigInt("340282366920938463463374607431768211455")),
        Cl.contractPrincipal(deployerAddress, interestRateStrategyDefault),
      ],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "init",
      [
        Cl.contractPrincipal(deployerAddress, lpdiko),
        Cl.contractPrincipal(deployerAddress, diko),
        Cl.uint(6),
        Cl.uint(80000000),
        Cl.uint(BigInt("340282366920938463463374607431768211455")),
        Cl.contractPrincipal(deployerAddress, interestRateStrategyDefault),
      ],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "init",
      [
        Cl.contractPrincipal(deployerAddress, lpUSDA),
        Cl.contractPrincipal(deployerAddress, USDA),
        Cl.uint(6),
        Cl.uint(80000000),
        Cl.uint(BigInt("340282366920938463463374607431768211455")),
        Cl.contractPrincipal(deployerAddress, interestRateStrategyDefault),
      ],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "init",
      [
        Cl.contractPrincipal(deployerAddress, lpxUSD),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.uint(6),
        Cl.uint(80000000),
        Cl.uint(BigInt("340282366920938463463374607431768211455")),
        Cl.contractPrincipal(deployerAddress, interestRateStrategyDefault),
      ],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-borrowing-enabled",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.bool(true)],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-borrowing-enabled",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.bool(true)],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-borrowing-enabled",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.bool(true)],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-borrowing-enabled",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.bool(true)],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-borrowing-enabled",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.bool(true)],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-usage-as-collateral-enabled",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.bool(true)],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-usage-as-collateral-enabled",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.bool(true)],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-usage-as-collateral-enabled",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.bool(true)],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-usage-as-collateral-enabled",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.bool(true)],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-usage-as-collateral-enabled",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.bool(true)],
      deployerAddress
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
        Cl.standardPrincipal(LP_1),
      ],
      LP_1
    );
    console.log(Cl.prettyPrint(callResponse.result));

    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log(LP_1);
    // console.log(simnet.getAssetsMap().get(".lp-stSTX.lp-stSTX"));

    // callResponse = simnet.callPublicFn(
    //   "pool-borrow",
    //   "supply",
    //   [
    //     Cl.contractPrincipal(deployerAddress, lpsBTC),
    //     Cl.contractPrincipal(deployerAddress, pool0Reserve),
    //     Cl.contractPrincipal(deployerAddress, sBTC),
    //     Cl.uint(1_000_000_000),
    //     Cl.standardPrincipal(LP_1),
    //   ],
    //   LP_1
    // );
    // console.log(simnet.getAssetsMap().get(".lp-token-0.lp-token-0"));
    // console.log(simnet.getAssetsMap().get(".stSTX.stSTX"));

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTC),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(10_000_000_000),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    console.log(Cl.prettyPrint(callResponse.result));

    // console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));
    // console.log(callResponse.events);

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "borrow",
      [
        // Cl.contractPrincipal(deployerAddress, debtToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, stSTX),
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
        Cl.uint(200_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    console.log(Cl.prettyPrint(callResponse.result));

    // console.log(simnet.getAssetsMap().get(".lp-token-0.lp-token-0"));
    // console.log(simnet.getAssetsMap().get(".stSTX.stSTX"));

    // console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));
    // console.log(callResponse.events);

    simnet.mineEmptyBlocks(10);

    let lp_1_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-user-reserve-data",
      [
        Cl.standardPrincipal(LP_1),
        Cl.contractPrincipal(deployerAddress, stSTX),
      ],
      LP_1
    );
    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-user-reserve-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, stSTX),
      ],
      Borrower_1
    );

    // console.log(Cl.prettyPrint(lp_1_data.result));
    // console.log(Cl.prettyPrint(borrower_data.result));

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

    // console.log(Cl.prettyPrint(callResponse.result));
    console.log(Cl.prettyPrint(callResponse.result));

    // let lp_balance = simnet.callReadOnlyFn(
    //   `${deployerAddress}.${lpstSTX}`,
    //   "get-balance",
    //   [Cl.standardPrincipal(LP_1)],
    //   LP_1
    // );

    // console.log("THIS", Cl.prettyPrint(lp_balance.result));

    // let cumulated_balance = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-0-reserve`,
    //   "get-balance-read",
    //   [
    //     Cl.contractPrincipal(deployerAddress, lpstSTX),
    //     Cl.contractPrincipal(deployerAddress, stSTX),
    //     Cl.standardPrincipal(LP_1),
    //     Cl.uint(1000000000),
    //   ],
    //   LP_1
    // );

    // console.log("ONE", Cl.prettyPrint(cumulated_balance.result));

    // cumulated_balance = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-0-reserve`,
    //   "get-cumulated-balance-read",
    //   [
    //     Cl.standardPrincipal(Borrower_1),
    //     Cl.contractPrincipal(deployerAddress, "lp-stSTX"),
    //     Cl.contractPrincipal(deployerAddress, stSTX),
    //     Cl.uint(10000000000),
    //   ],
    //   Borrower_1
    // );

    // console.log(Cl.prettyPrint(cumulated_balance.result));

    // cumulated_balance = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-read`,
    //   "token-to-usd",
    //   [
    //     Cl.standardPrincipal(Borrower_1),
    //     Cl.contractPrincipal(deployerAddress, stSTX),
    //     // Cl.contractPrincipal(deployerAddress, "lp-stSTX"),
    //     Cl.contractPrincipal(deployerAddress, "oracle"),
    //     Cl.uint(2000001940),
    //   ],
    //   LP_1
    // );

    // console.log(Cl.prettyPrint(cumulated_balance.result));

    // cumulated_balance = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-read`,
    //   "get-reserve-state",
    //   [
    //     // Cl.standardPrincipal(LP_1),
    //     Cl.contractPrincipal(deployerAddress, stSTX),
    //     // Cl.contractPrincipal(deployerAddress, "lp-stSTX"),
    //     // Cl.contractPrincipal(deployerAddress, "oracle"),
    //     // Cl.uint(2000001940),
    //   ],
    //   LP_1
    // );

    // console.log(Cl.prettyPrint(cumulated_balance.result));

    // cumulated_balance = simnet.callReadOnlyFn(
    //   `${deployerAddress}.math`,
    //   "mul",
    //   [Cl.uint(3200003104), Cl.uint(80000000)],
    //   Borrower_1
    // );

    // console.log(Cl.prettyPrint(cumulated_balance.result));

    // console.log(simnet.getAssetsMap().get(".lp-token-0.lp-token-0"));
    // console.log(simnet.getAssetsMap().get(".stSTX.stSTX"));

    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));
    // console.log(callResponse.events);

    // console.log(simnet.getAssetsMap().get(".stSTX.stSTX"));

    // let user_assets = simnet.callReadOnlyFn(
    //   `pool-read`,
    //   "get-user-assets",
    //   [Cl.standardPrincipal(LP_3)],
    //   LP_3
    // );
    // console.log(Cl.prettyPrint(user_assets.result));

    // let supply_apy = simnet.callReadOnlyFn(
    //   `pool-read`,
    //   "get-asset-supply-apy",
    //   [Cl.contractPrincipal(deployerAddress, stSTX)],
    //   deployerAddress
    // );

    // let borrow_apy = simnet.callReadOnlyFn(
    //   `pool-read`,
    //   "get-asset-supply-apy",
    //   [Cl.contractPrincipal(deployerAddress, stSTX)],
    //   deployerAddress
    // );

    // console.log(Cl.prettyPrint(supply_apy.result));
    // console.log(Cl.prettyPrint(borrow_apy.result));

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

    simnet.mineEmptyBlocks(10);

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "redeem-underlying",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
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
      "pool-borrow",
      "redeem-underlying",
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
    // console.log(callResponse.events);

    // console.log(Cl.prettyPrint(callResponse.events[1]["data"].value!));
    // console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "redeem-underlying",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_3),
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
