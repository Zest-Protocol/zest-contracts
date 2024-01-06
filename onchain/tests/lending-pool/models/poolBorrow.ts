import { Simnet } from "@hirosystems/clarinet-sdk";
import { IntegerType } from "@stacks/common";
import { Cl } from "@stacks/transactions";

class PoolBorrow {
  simnet: Simnet;
  deployerAddress: string;
  contractName: string;

  constructor(simnet: Simnet, deployerAddress: string, contractName: string) {
    this.simnet = simnet;
    this.deployerAddress = deployerAddress;
    this.contractName = contractName;
  }

  supply(
    lpDeployer: string,
    lpContractName: string,
    reserveDeployer: string,
    reserveContractName: string,
    assetDeployer: string,
    assetContractName: string,
    amount: IntegerType,
    user: string,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "supply",
      [
        Cl.contractPrincipal(lpDeployer, lpContractName),
        Cl.contractPrincipal(reserveDeployer, reserveContractName),
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.uint(amount),
        Cl.standardPrincipal(user),
      ],
      caller
    );
  }
}

export { PoolBorrow };
