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
const lpToken0 = "lp-token-0";
const lpToken1 = "lp-token-1";
const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const stSTX = "stSTX";
const sBTC = "sBTC";

describe("example tests", () => {
  it("Supply and immediately redeem without returns", () => {
    let callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "init",
      [
        Cl.contractPrincipal(deployerAddress, lpToken0),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(6),
        Cl.contractPrincipal(deployerAddress, interestRateStrategyDefault),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpToken0),
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
        Cl.contractPrincipal(deployerAddress, lpToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        // Cl.uint(0),
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
        Cl.contractPrincipal(deployerAddress, lpToken0),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(6),
        Cl.contractPrincipal(deployerAddress, interestRateStrategyDefault),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "init",
      [
        Cl.contractPrincipal(deployerAddress, lpToken1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(6),
        Cl.contractPrincipal(deployerAddress, interestRateStrategyDefault),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
      ],
      LP_1
    );
    // console.log(simnet.getAssetsMap().get(".lp-token-0.lp-token-0"));
    // console.log(simnet.getAssetsMap().get(".stSTX.stSTX"));

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpToken1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(10_000_000_000),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    // console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));
    // console.log(callResponse.events);

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "borrow",
      [
        // Cl.contractPrincipal(deployerAddress, debtToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(200_000_000),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

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
        Cl.contractPrincipal(deployerAddress, lpToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_2),
      ],
      LP_2
    );

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_3),
      ],
      LP_3
    );

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
        Cl.contractPrincipal(deployerAddress, lpToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
      ],
      LP_1
    );

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
        Cl.contractPrincipal(deployerAddress, lpToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_2),
      ],
      LP_2
    );

    // console.log(Cl.prettyPrint(callResponse.events[1]["data"].value!));
    // console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "redeem-underlying",
      [
        Cl.contractPrincipal(deployerAddress, lpToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_3),
      ],
      LP_3
    );

    // console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));
    // console.log(callResponse.events);
    // console.log(Cl.prettyPrint(callResponse.result));

    // console.log(LP_2);

    // console.log(simnet.getAssetsMap().get(".stSTX.stSTX"));
  });
});
