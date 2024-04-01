import { Simnet } from "@hirosystems/clarinet-sdk";
import { IntegerType } from "@stacks/common";
import { Cl } from "@stacks/transactions";

class Oracle {
  simnet: Simnet;
  deployerAddress: string;
  contractName: string;

  constructor(simnet: Simnet, deployerAddress: string, contractName: string) {
    this.simnet = simnet;
    this.deployerAddress = deployerAddress;
    this.contractName = contractName;
  }
  setPrice(
    assetDeployerAddress: string,
    assetContractName: string,
    price: IntegerType,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "set-price",
      [
        Cl.contractPrincipal(assetDeployerAddress, assetContractName),
        Cl.uint(price),
      ],
      caller
    );
  }
}

export { Oracle };
