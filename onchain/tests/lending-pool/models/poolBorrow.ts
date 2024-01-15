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

  init(
    lpDeployer: string,
    lpContractName: string,
    assetDeployer: string,
    assetContractName: string,
    decimals: IntegerType,
    supplyCap: IntegerType,
    borrowCap: IntegerType,
    oracleDeployerAddress: string,
    oracleContractName: string,
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
        Cl.contractPrincipal(oracleDeployerAddress, oracleContractName),
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

  borrow(
    poolReserveDeployer: string,
    poolReserveContractName: string,
    oracleDeployer: string,
    oracleContractName: string,
    assetDeployer: string,
    assetContractName: string,
    lpDeployer: string,
    lpContractName: string,
    amountToBeBorrowed: IntegerType,
    feeCalculatorDeployer: string,
    feeCalculatorContractName: string,
    interestRateMode: IntegerType,
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
      "borrow",
      [
        Cl.contractPrincipal(poolReserveDeployer, poolReserveContractName),
        Cl.contractPrincipal(oracleDeployer, oracleContractName),
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.contractPrincipal(lpDeployer, lpContractName),
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
        Cl.uint(amountToBeBorrowed),
        Cl.contractPrincipal(feeCalculatorDeployer, feeCalculatorContractName),
        Cl.uint(interestRateMode),
        Cl.standardPrincipal(owner),
      ],
      caller
    );
  }

  setUserUseReserveAsCollateral(
    caller: string,
    lpDeployer: string,
    lpContractName: string,
    assetDeployer: string,
    assetContractName: string,
    useAsCollateral: boolean,
    oracleDeployer: string,
    oracleContractName: string,
    assetsToCalculate: {
      asset: { deployerAddress: string; contractName: string };
      "lp-token": { deployerAddress: string; contractName: string };
      oracle: { deployerAddress: string; contractName: string };
    }[]
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "set-user-use-reserve-as-collateral",
      [
        Cl.standardPrincipal(caller),
        Cl.contractPrincipal(lpDeployer, lpContractName),
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.bool(useAsCollateral),
        Cl.contractPrincipal(oracleDeployer, oracleContractName),
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

  repay(
    assetDeployer: string,
    assetContractName: string,
    amountToRepay: IntegerType,
    onBehalfOf: string,
    caller: string
  ) {
    return simnet.callPublicFn(
      this.contractName,
      "repay",
      [
        Cl.contractPrincipal(assetDeployer, assetContractName),
        Cl.uint(amountToRepay),
        Cl.standardPrincipal(onBehalfOf),
      ],
      caller
    );
  }
}

export { PoolBorrow };
