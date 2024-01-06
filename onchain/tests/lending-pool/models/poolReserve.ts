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

  init(
    lpDeployer: string,
    lpContractName: string,
    assetDeployer: string,
    assetContractName: string,
    decimals: IntegerType,
    supplyCap: IntegerType,
    borrowCap: IntegerType,
    interestRateStrategyAddressDeployerAddress: string,
    interestRateStrategyContractName: string,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "init",
      [
        Cl.contractPrincipal(lpDeployer, lpContractName),
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.uint(decimals),
        Cl.uint(supplyCap),
        Cl.uint(borrowCap),
        Cl.contractPrincipal(
          interestRateStrategyAddressDeployerAddress,
          interestRateStrategyContractName
        ),
      ],
      caller
    );
  }

  setBorrowingEnabled(
    assetDeployer: string,
    assetContractName: string,
    enabled: boolean,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "set-borrowing-enabled",
      [
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.bool(enabled),
      ],
      caller
    );
  }

  setUsageAsCollateralEnabled(
    assetDeployer: string,
    assetContractName: string,
    enabled: boolean,
    baseLtvAsCollateral: IntegerType,
    liquidationThreshold: IntegerType,
    liquidationBonus: IntegerType,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "set-usage-as-collateral-enabled",
      [
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.bool(enabled),
        Cl.uint(baseLtvAsCollateral),
        Cl.uint(liquidationThreshold),
        Cl.uint(liquidationBonus),
      ],
      caller
    );
  }

  addIsolatedAsset(
    assetDeployer: string,
    assetContractName: string,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "add-isolated-asset",
      [Cl.contractPrincipal(assetDeployer, assetContractName)],
      caller
    );
  }

  setBorroweableIsolated(
    assetDeployer: string,
    assetContractName: string,
    debtCeiling: IntegerType,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "set-borroweable-isolated",
      [
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.uint(debtCeiling),
      ],
      caller
    );
  }
}

export { PoolReserve };
