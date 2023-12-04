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

describe("example tests", () => {
  it("Calculate Interest rates based on default strategy", () => {
    let callResponse = simnet.callPublicFn(
      "interest-rate-strategy",
      "hey-you",
      [],
      deployerAddress
    );

    console.log(Cl.prettyPrint(callResponse.result));
    // console.log(simnet.getAssetsMap().get(".sBTC.sBTC"));
    // console.log(callResponse)
    // console.log(simnet.getAssetsMap().get(".lp-token-0.lp-token-0"))

    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!))
  });
});
