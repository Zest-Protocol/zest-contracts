import { initSimnet } from "@hirosystems/clarinet-sdk";
import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { readFileSync } from "fs";
import { parseCustomStringToJson } from "../utils/utils";

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
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sBTC";
const stSTX = "stSTX";
const USDA = "USDA";
const xUSD = "xUSD";

Cl.uint(BigInt("340282366920938463463374607431768211455"));

describe("example tests", () => {
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

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-borrowing-enabled",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.bool(true)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-borrowing-enabled",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.bool(true)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-borrowing-enabled",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.bool(true)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-borrowing-enabled",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.bool(true)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-borrowing-enabled",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.bool(true)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-usage-as-collateral-enabled",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.bool(true)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-usage-as-collateral-enabled",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.bool(true)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-usage-as-collateral-enabled",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.bool(true)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-usage-as-collateral-enabled",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.bool(true)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-usage-as-collateral-enabled",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.bool(true)],
      deployerAddress
    );

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

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTC),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(20_000_000_000),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    // console.log(callResponse.events);

    // let lp_1_data = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-0-reserve`,
    //   "get-user-reserve-data",
    //   [
    //     Cl.standardPrincipal(LP_1),
    //     Cl.contractPrincipal(deployerAddress, stSTX),
    //   ],
    //   LP_1
    // );
    // let reserve_state = simnet.callReadOnlyFn(
    //   `${deployerAddress}.pool-read`,
    //   "get-current-liquidity-rate",
    //   [Cl.contractPrincipal(deployerAddress, stSTX)],
    //   LP_1
    // );

    // console.log(Cl.prettyPrint(reserve_state.result));

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
        Cl.contractPrincipal(deployerAddress, "fees-calculator"),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[2].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[3].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[4].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[5].data.value!));

    console.log(Cl.prettyPrint(callResponse.result));

    let lp_1_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-user-reserve-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, stSTX),
      ],
      Borrower_1
    );

    lp_1_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-reserve-state",
      [
        // Cl.standardPrincipal(Borrower_1),
        Cl.contractPrincipal(deployerAddress, stSTX),
      ],
      Borrower_1
    );

    // console.log(callResponse.events);
    console.log(Cl.prettyPrint(lp_1_data.result));
  });
});

// { block-height: u10, current-variable-borrow-rate: u1000000, last-updated-block: u0, last-variable-borrow-cumulative-index: u0, last-variable-borrow-cumulative-index-reserve: u100000000, principal-borrow-balance: u0, stable-borrow-rate: u0 }
