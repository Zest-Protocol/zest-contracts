import { Simnet } from "@hirosystems/clarinet-sdk";
import { IntegerType } from "@stacks/common";
import { Cl } from "@stacks/transactions";

class ZToken {
  simnet: Simnet;
  deployerAddress: string;
  contractName: string;

  constructor(simnet: Simnet, deployerAddress: string, contractName: string) {
    this.simnet = simnet;
    this.deployerAddress = deployerAddress;
    this.contractName = contractName;
  }

  withdraw(
    poolDeployer: string,
    poolContractName: string,
    assetDeployer: string,
    assetContractName: string,
    oracleDeployer: string,
    oracleContractName: string,
    amount: IntegerType,
    owner: string,
    assetsToCalculate: {
      asset: { deployerAddress: string; contractName: string };
      "lp-token": { deployerAddress: string; contractName: string };
      oracle: { deployerAddress: string; contractName: string };
    }[],
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "withdraw",
      [
        Cl.contractPrincipal(poolDeployer, poolContractName),
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.contractPrincipal(oracleDeployer, oracleContractName),
        Cl.uint(amount),
        Cl.standardPrincipal(owner),
        Cl.list(
          assetsToCalculate.map((asset) => {
            return Cl.tuple({
              asset: Cl.contractPrincipal(
                asset.asset.deployerAddress,
                asset.asset.contractName
              ),
              "lp-token": Cl.contractPrincipal(
                asset["lp-token"].deployerAddress,
                asset["lp-token"].contractName
              ),
              oracle: Cl.contractPrincipal(
                asset.oracle.deployerAddress,
                asset.oracle.contractName
              ),
            });
          })
        ),
      ],
      caller
    );
  }
}

export { ZToken };
