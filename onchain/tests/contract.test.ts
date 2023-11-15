import { initSimnet } from "@hirosystems/clarinet-sdk"
import { describe, expect, it } from "vitest"
import { Cl } from "@stacks/transactions"
import { readFileSync } from "fs"

const simnet = await initSimnet()

const accounts = simnet.getAccounts()
const deployerAddress = accounts.get("deployer")!
const LP_1 = accounts.get("wallet_1")!

const contractInterfaces = simnet.getContractsInterfaces();
const poolv20Interface = contractInterfaces.get(`${deployerAddress}.pool-v2-0`)

describe("example tests", () => {
  it("ensures simnet is well initalise", () => {


    let callResponse = simnet.callPublicFn(
      "globals",
      "onboard-user-address",
      [
        Cl.standardPrincipal(deployerAddress),
        Cl.bufferFromHex("00"),
        Cl.bufferFromHex("0000000000000000000000000000000000000000")
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-v2-0",
      "create-pool",
      [
        Cl.standardPrincipal(deployerAddress),
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
    )

    // Send Bitcoin to address
    const source = readFileSync("./contracts/v2_sbtc/bitcoin/sbtc-deposit-caller.clar")
    const deployRes = simnet.deployContract("sbtc-deposit-caller-001", source.toString("utf8"), null, simnet.deployer)

    // // mint sBTC to address
    callResponse = simnet.callPublicFn(
      "sBTC",
      "mint",
      [
        Cl.uint(1_000_000),
        Cl.contractPrincipal(deployerAddress, "sbtc-deposit-caller-001"),
      ],
      deployerAddress
    )
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
    )

    // console.log(callResponse)
    console.log(Cl.prettyPrint(callResponse.result))
    console.log(simnet.getAssetsMap().get(".sBTC.sBTC"));
    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!))


    // SEND FUNDS NOW

  });
});
