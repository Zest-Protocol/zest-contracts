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
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpToken1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(20_000_000_000),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    let lp_1_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-user-reserve-data",
      [
        Cl.standardPrincipal(LP_1),
        Cl.contractPrincipal(deployerAddress, stSTX),
      ],
      LP_1
    );
    let reserve_state = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-read`,
      "get-current-liquidity-rate",
      [Cl.contractPrincipal(deployerAddress, stSTX)],
      LP_1
    );

    // console.log(Cl.prettyPrint(reserve_state.result));

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
  });
});
