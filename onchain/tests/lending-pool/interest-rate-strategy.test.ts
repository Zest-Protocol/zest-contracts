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
    let callResponse = [
      simnet.callReadOnlyFn(
        "interest-rate-strategy",
        "mul",
        [Cl.uint(200_000_000), Cl.uint(200_000_000)],
        deployerAddress
      ),
      simnet.callReadOnlyFn(
        "interest-rate-strategy",
        "mul",
        [Cl.uint(0), Cl.uint(0)],
        deployerAddress
      ),
      simnet.callReadOnlyFn(
        "interest-rate-strategy",
        "mul",
        [Cl.uint(0), Cl.uint(100_000_000)],
        deployerAddress
      ),
      simnet.callReadOnlyFn(
        "interest-rate-strategy",
        "mul",
        [Cl.uint(100_000_000), Cl.uint(100_000_000)],
        deployerAddress
      ),
    ];

    // console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse[0].result).toBeUint(400_000_000);
    expect(callResponse[1].result).toBeUint(0);
    expect(callResponse[2].result).toBeUint(0);
    expect(callResponse[3].result).toBeUint(100_000_000);

    // test mulfractions
    callResponse = [
      simnet.callReadOnlyFn(
        "interest-rate-strategy",
        "mul",
        [Cl.uint(100_000_000), Cl.uint(20_000_000)],
        deployerAddress
      ),
      simnet.callReadOnlyFn(
        "interest-rate-strategy",
        "mul",
        [Cl.uint(200_000_000), Cl.uint(20_000_000)],
        deployerAddress
      ),
    ];

    expect(callResponse[0].result).toBeUint(20_000_000);
    expect(callResponse[1].result).toBeUint(40_000_000);

    // test div
    callResponse = [
      simnet.callReadOnlyFn(
        "interest-rate-strategy",
        "div",
        [Cl.uint(0), Cl.uint(100_000_000)],
        deployerAddress
      ),
      simnet.callReadOnlyFn(
        "interest-rate-strategy",
        "div",
        [Cl.uint(100_000_000), Cl.uint(100_000_000)],
        deployerAddress
      ),
    ];

    expect(callResponse[0].result).toBeUint(0);
    expect(callResponse[1].result).toBeUint(100_000_000);

    // test div fractions
    callResponse = [
      simnet.callReadOnlyFn(
        "interest-rate-strategy",
        "div",
        [Cl.uint(100_000_000), Cl.uint(200_000_000)],
        deployerAddress
      ),
      simnet.callReadOnlyFn(
        "interest-rate-strategy",
        "div",
        [Cl.uint(200_000_000), Cl.uint(200_000_000)],
        deployerAddress
      ),
    ];

    expect(callResponse[0].result).toBeUint(50_000_000);
    expect(callResponse[1].result).toBeUint(100_000_000);

    // test mul rounding
    callResponse = [
      simnet.callReadOnlyFn(
        "interest-rate-strategy",
        "mul",
        [Cl.uint(95005647), Cl.uint(100)],
        deployerAddress
      ),
      simnet.callReadOnlyFn(
        "interest-rate-strategy",
        "mul",
        [Cl.uint(100), Cl.uint(95005647)],
        deployerAddress
      ),
    ];

    // console.log(callResponse);

    expect(callResponse[0].result).toBeUint(95);
    expect(callResponse[1].result).toBeUint(95);

    // test pow
    callResponse = [
      // simnet.callReadOnlyFn(
      //   "interest-rate-strategy",
      //   "mul",
      //   [Cl.uint(5_000_000), Cl.uint(300_000_000)],
      //   deployerAddress
      // ),
      // simnet.callReadOnlyFn(
      //   "interest-rate-strategy",
      //   "taylor-x",
      //   // 0.05 * 3
      //   [Cl.uint(5_000_000 * 300_000_000)],
      //   deployerAddress
      // ),
      simnet.callReadOnlyFn(
        "interest-rate-strategy",
        "test-this",
        [],
        deployerAddress
      ),
      simnet.callReadOnlyFn(
        "pool-v2-0",
        "calculate-linear-interest-1",
        [Cl.uint(100_000_000_000), Cl.uint(5_000_000), Cl.uint(3600)],
        deployerAddress
      ),
    ];

    // expect(callResponse[0].result);
    // console.log(Cl.prettyPrint(callResponse[1].result));
    console.log(Cl.prettyPrint(callResponse[1].result));
    // console.log(Cl.prettyPrint(callResponse[2].result));

    // expect(callResponse[1].result).toBeUint(100_000_000);

    // console.log(simnet.getAssetsMap().get(".sBTC.sBTC"));
    // console.log(callResponse)
    // console.log(simnet.getAssetsMap().get(".lp-token-0.lp-token-0"))

    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!))
  });
});
