import { Simnet } from "@hirosystems/clarinet-sdk";
import { IntegerType } from "@stacks/common";
import { Cl } from "@stacks/transactions";

class MintableToken {
  simnet: Simnet;
  deployerAddress: string;
  contractName: string;

  constructor(simnet: Simnet, deployerAddress: string, contractName: string) {
    this.simnet = simnet;
    this.deployerAddress = deployerAddress;
    this.contractName = contractName;
  }

  mint(amount: IntegerType, recipient: string, caller: string) {
    return simnet.callPublicFn(
      this.contractName,
      "mint",
      [Cl.uint(amount), Cl.standardPrincipal(recipient)],
      caller
    );
  }
}

export { MintableToken };
