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

  setOptimalUtilizationRate(
    assetDeployer: string,
    assetContractName: string,
    rate: IntegerType,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "set-optimal-utilization-rate",
      [
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.uint(rate),
      ],
      caller
    );
  }

  setBaseVariableBorrowRate(
    assetDeployer: string,
    assetContractName: string,
    rate: IntegerType,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "set-base-variable-borrow-rate",
      [
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.uint(rate),
      ],
      caller
    );
  }

  setvariablerateslope1(
    assetDeployer: string,
    assetContractName: string,
    rate: IntegerType,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "set-variable-rate-slope-1",
      [
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.uint(rate),
      ],
      caller
    );
  }

  setvariablerateslope2(
    assetDeployer: string,
    assetContractName: string,
    rate: IntegerType,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "set-variable-rate-slope-2",
      [
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.uint(rate),
      ],
      caller
    );
  }

  setLiquidationCloseFactorPercent(
    assetDeployer: string,
    assetContractName: string,
    rate: IntegerType,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "set-liquidation-close-factor-percent",
      [
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.uint(rate),
      ],
      caller
    );
  }

  setFlashloanFeeTotal(
    assetDeployer: string,
    assetContractName: string,
    rate: IntegerType,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "set-flashloan-fee-total",
      [
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.uint(rate),
      ],
      caller
    );
  }

  setFlashloanFeeProtocol(
    assetDeployer: string,
    assetContractName: string,
    rate: IntegerType,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "set-flashloan-fee-protocol",
      [
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.uint(rate),
      ],
      caller
    );
  }
  
}

export { PoolReserve };
