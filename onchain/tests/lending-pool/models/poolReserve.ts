import { Simnet } from "@hirosystems/clarinet-sdk";
import { IntegerType } from "@stacks/common";
import { Cl } from "@stacks/transactions";

class PoolReserve {
  simnet: Simnet;
  deployerAddress: string;
  contractName: string;

  constructor(simnet: Simnet, deployerAddress: string, contractName: string) {
    this.simnet = simnet;
    this.deployerAddress = deployerAddress;
    this.contractName = contractName;
  }

  setBorroweableIsolated(
    assetDeployer: string,
    assetContractName: string,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "set-borroweable-isolated",
      [Cl.list([Cl.contractPrincipal(assetDeployer, assetContractName)])],
      caller
    );
  }
}

export { PoolReserve };
