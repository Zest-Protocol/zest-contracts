import { Simnet } from "@hirosystems/clarinet-sdk";
import { IntegerType } from "@stacks/common";
import { Cl, cvToValue } from "@stacks/transactions";
import * as config from "../tools/config";

class PythOracle {
  simnet: Simnet;
  deployerAddress: string;
  contractName: string;

  constructor(simnet: Simnet, deployerAddress: string, contractName: string) {
    this.simnet = simnet;
    this.deployerAddress = deployerAddress;
    this.contractName = contractName;
  }

  getRemainingTimeUntilPriceIsStale(
    assetDeployerAddress: string,
    assetContractName: string,
    priceFeedId: string,
    time: bigint,
    caller: string
  ) {
    let callResponse = this.simnet.callReadOnlyFn(
      `${this.deployerAddress}.${config.pythStorage}`,
      "get-price",
      [
        Cl.bufferFromHex(priceFeedId),
      ],
      this.deployerAddress
    );
    const publishTime = BigInt(cvToValue(callResponse.result).value["publish-time"].value);
    callResponse = this.simnet.callReadOnlyFn(
      this.contractName,
      "get-stale-price-threshold",
      [],
      this.deployerAddress
    );
    let stalePriceThreshold = time + (this.simnet.getBlockTime() - BigInt(Math.floor(Date.now() / 1000)));

    // const stalePriceThreshold = BigInt(cvToValue(callResponse.result));
    console.log("catched")
    console.log(this.simnet.getBlockTime());
    console.log(publishTime);
    console.log(stalePriceThreshold);
    return this.simnet.getBlockTime() - publishTime - stalePriceThreshold;
  }


  getAssetPrice(
    priceTimeThreshold: number,
    assetDeployerAddress: string,
    assetContractName: string,
    caller: string
  ) {
    let regtestDelay = this.simnet.getBlockTime() - BigInt(Math.floor(Date.now() / 1000));
    const stalePriceThreshold = this.simnet.callReadOnlyFn(
      this.contractName,
      "get-stale-price-threshold",
      [],
      this.deployerAddress
    );
    this.simnet.callPublicFn(
      this.contractName,
      "set-stale-price-threshold",
      [Cl.uint(BigInt(priceTimeThreshold) + regtestDelay)],
      this.deployerAddress
    );
    return this.simnet.callPublicFn(
      this.contractName,
      "get-asset-price",
      [
        Cl.contractPrincipal(assetDeployerAddress, assetContractName),
      ],
      caller
    );
  }
}

export { PythOracle };
