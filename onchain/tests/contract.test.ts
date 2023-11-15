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
  it("ensures simnet is well initalise", () => {
    let callResponse = simnet.callPublicFn(
      "globals",
      "onboard-user-address",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.bufferFromHex("00"),
        Cl.bufferFromHex("0000000000000000000000000000000000000000"),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-v2-0",
      "create-pool",
      [
        Cl.standardPrincipal(Delegate_1),
        Cl.contractPrincipal(deployerAddress, "sBTC"),
        Cl.contractPrincipal(deployerAddress, "pool-v2-0"),
        Cl.contractPrincipal(deployerAddress, "lp-token-0"),
        Cl.contractPrincipal(deployerAddress, "zest-reward-dist"),
        Cl.contractPrincipal(deployerAddress, "payment-fixed"),
        Cl.contractPrincipal(deployerAddress, "rewards-calc"),
        Cl.contractPrincipal(deployerAddress, "withdrawal-manager"),
        Cl.uint(1000),
        Cl.uint(1000),
        Cl.uint(100_000_000_000),
        Cl.uint(100_000_000_000),
        Cl.uint(1),
        Cl.uint(144 * 365 * 3), // 3 years
        Cl.contractPrincipal(deployerAddress, "liquidity-vault-v1-0"),
        Cl.contractPrincipal(deployerAddress, "cp-token"),
        Cl.contractPrincipal(deployerAddress, "cover-vault"),
        Cl.contractPrincipal(deployerAddress, "cp-rewards-token"),
        Cl.contractPrincipal(deployerAddress, "sBTC"),
        Cl.bool(true),
      ],
      deployerAddress
    );

    // Send Bitcoin to address
    const sbtcDebpositCode = readFileSync(
      "./contracts/v2_sbtc/bitcoin/sbtc-deposit-caller.clar"
    );
    let deployRes = simnet.deployContract(
      "sbtc-deposit-caller-001",
      sbtcDebpositCode.toString("utf8"),
      null,
      simnet.deployer
    );

    // mint sBTC to address
    callResponse = simnet.callPublicFn(
      "sBTC",
      "mint",
      [
        Cl.uint(100_000_000),
        Cl.contractPrincipal(deployerAddress, "sbtc-deposit-caller-001"),
      ],
      deployerAddress
    );

    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log(simnet.getAssetsMap().get(".sBTC.sBTC"));
    // console.log(simnet.getContractsInterfaces().get(`${deployerAddress}.sbtc-deposit-caller-001`))

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.sbtc-deposit-caller-001`,
      "send-funds",
      [
        Cl.contractPrincipal(deployerAddress, "lp-token-0"),
        Cl.contractPrincipal(deployerAddress, "zest-reward-dist"),
        Cl.contractPrincipal(deployerAddress, "liquidity-vault-v1-0"),
        Cl.contractPrincipal(deployerAddress, "sBTC"),
        Cl.contractPrincipal(deployerAddress, "rewards-calc"),
      ],
      deployerAddress
    );
    // console.log(simnet.getAssetsMap().get(".sBTC.sBTC"))
    // console.log(Cl.prettyPrint(callResponse.result))

    const payment_period = 1440;
    const num_payments = 9;

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-v2-0`,
      "create-loan",
      [
        Cl.contractPrincipal(deployerAddress, "loan-v1-0"),
        Cl.contractPrincipal(deployerAddress, "lp-token-0"),
        Cl.uint(0),
        Cl.uint(100_000_000),
        Cl.contractPrincipal(deployerAddress, "sBTC"),
        Cl.uint(0),
        Cl.contractPrincipal(deployerAddress, "sBTC"),
        Cl.uint(300),
        Cl.uint(payment_period * num_payments),
        Cl.uint(payment_period),
        Cl.contractPrincipal(deployerAddress, "coll-vault"),
        Cl.contractPrincipal(deployerAddress, "funding-vault"),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-v2-0`,
      "fund-loan",
      [
        Cl.uint(0),
        Cl.contractPrincipal(deployerAddress, "lp-token-0"),
        Cl.uint(0),
        Cl.contractPrincipal(deployerAddress, "liquidity-vault-v1-0"),
        Cl.contractPrincipal(deployerAddress, "funding-vault"),
        Cl.contractPrincipal(deployerAddress, "sBTC"),
      ],
      Delegate_1
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.supplier-interface`,
      "drawdown",
      [
        Cl.uint(0),
        Cl.contractPrincipal(deployerAddress, "lp-token-0"),
        Cl.uint(0),
        Cl.contractPrincipal(deployerAddress, "sBTC"),
        Cl.contractPrincipal(deployerAddress, "coll-vault"),
        Cl.contractPrincipal(deployerAddress, "funding-vault"),

        Cl.bufferFromHex("00"),
        Cl.bufferFromHex("0000000000000000000000000000000000000000"),

        Cl.contractPrincipal(deployerAddress, "swap-router"),
        Cl.contractPrincipal(deployerAddress, "sBTC"),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.supplier-interface`,
      "finalize-drawdown",
      [
        Cl.uint(0),
        Cl.contractPrincipal(deployerAddress, "lp-token-0"),
        Cl.uint(0),
        Cl.contractPrincipal(deployerAddress, "sBTC"),
        Cl.contractPrincipal(deployerAddress, "coll-vault"),
        Cl.contractPrincipal(deployerAddress, "funding-vault"),
        Cl.contractPrincipal(deployerAddress, "sBTC"),
      ],
      Borrower_1
    );

    // Send Bitcoin to address
    const sbtcPaymentCaller = readFileSync(
      "./contracts/v2_sbtc/bitcoin/sbtc-payment-caller.clar"
    );
    deployRes = simnet.deployContract(
      "sbtc-payment-caller-001",
      sbtcPaymentCaller.toString("utf8"),
      null,
      simnet.deployer
    );

    const loanPaymentRes = simnet.callReadOnlyFn(
      "payment-fixed",
      "get-current-loan-payment",
      [Cl.uint(0), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "sBTC",
      "mint",
      [
        loanPaymentRes.result,
        Cl.contractPrincipal(deployerAddress, "sbtc-payment-caller-001"),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.sbtc-payment-caller-001`,
      "make-payment",
      [
        Cl.contractPrincipal(deployerAddress, "payment-fixed"),
        Cl.contractPrincipal(deployerAddress, "lp-token-0"),
        Cl.contractPrincipal(deployerAddress, "liquidity-vault-v1-0"),
        Cl.contractPrincipal(deployerAddress, "cp-token"),
        Cl.contractPrincipal(deployerAddress, "cp-rewards-token"),
        Cl.contractPrincipal(deployerAddress, "zest-reward-dist"),
        Cl.contractPrincipal(deployerAddress, "swap-router"),
        Cl.contractPrincipal(deployerAddress, "sBTC"),
      ],
      deployerAddress
    );

    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log(simnet.getAssetsMap().get(".sBTC.sBTC"));
    // console.log(callResponse)
    // console.log(simnet.getAssetsMap().get(".lp-token-0.lp-token-0"))

    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!))
  });
});
