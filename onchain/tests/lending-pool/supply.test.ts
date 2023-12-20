import { initSimnet } from "@hirosystems/clarinet-sdk";
import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";
import { readFileSync } from "fs";

const simnet = await initSimnet();

const accounts = simnet.getAccounts();
const deployerAddress = accounts.get("deployer")!;
const LP_1 = accounts.get("wallet_1")!;
const Borrower_1 = accounts.get("wallet_2")!;
const Delegate_1 = accounts.get("wallet_3")!;

const contractInterfaces = simnet.getContractsInterfaces();
const poolv20Interface = contractInterfaces.get(`${deployerAddress}.pool-v2-0`);
const lpToken0 = "lp-token-0";
const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const stSTX = "stSTX";
const SBTC = "sBTC";

describe("example tests", () => {
  it("Supply and immediately redeem without returns", () => {
    let callResponse = simnet.callPublicFn(
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
        Cl.uint(0),
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

    console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));

    // console.log(Cl.prettyPrint(callResponse.events[0]["data"].value!));

    console.log(Cl.prettyPrint(callResponse.result));

    // callResponse = simnet.callPublicFn(
    //   "pool-borrow",
    //   "supply",
    //   [
    //     Cl.contractPrincipal(deployerAddress, lpToken0),
    //     Cl.contractPrincipal(deployerAddress, pool0Reserve),
    //     Cl.contractPrincipal(deployerAddress, stSTX),
    //     Cl.uint(10_000_000_000),
    //     Cl.standardPrincipal(Borrower_1),
    //   ],
    //   Borrower_1
    // );

    // callResponse = simnet.callPublicFn(
    //   "pool-borrow",
    //   "borrow",
    //   [
    //     Cl.contractPrincipal(deployerAddress, debtToken0),
    //     Cl.contractPrincipal(deployerAddress, pool0Reserve),
    //     Cl.contractPrincipal(deployerAddress, sBTC),
    //     Cl.uint(200_000_000),
    //     Cl.uint(0),
    //     Cl.standardPrincipal(Borrower_1),
    //   ],
    //   Borrower_1
    // );

    // console.log(Cl.prettyPrint(callResponse.result));

    // console.log(Borrower_1);

    console.log(simnet.getAssetsMap());
  });
});
