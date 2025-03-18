import { Simnet, tx } from "@hirosystems/clarinet-sdk";
import { IntegerType } from "@stacks/common";
import { Cl, cvToValue } from "@stacks/transactions";
import * as config from "../tools/config";
import { SimnetChecker } from "../tools/SimnetChecker";

class PythOracle {
  simnet: SimnetChecker;
  deployerAddress: string;
  contractName: string;

  constructor(simnet: SimnetChecker, deployerAddress: string, contractName: string) {
    this.simnet = simnet;
    this.deployerAddress = deployerAddress;
    this.contractName = contractName;
  }

  getRemainingTimeUntilPriceIsStale(
    assetDeployerAddress: string,
    assetContractName: string,
    priceFeedId: string,
    // expected threshold time in seconds
    time: number,
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
    let stalePriceThreshold = BigInt(time) + (this.simnet.getBlockTime() - BigInt(Math.floor(Date.now() / 1000)));

    return (publishTime + stalePriceThreshold) - this.simnet.getBlockTime();
  }


  getAssetPrice(
    priceTimeThreshold: number,
    assetDeployerAddress: string,
    assetContractName: string,
    caller: string
  ) {
    let regtestDelay = this.simnet.getBlockTime() - BigInt(Math.floor(Date.now() / 1000));
    // increase delay by delay of the test suite and priceTimeThreshold
    const txs = [
      tx.callPublicFn(
        this.contractName,
        "set-stale-price-threshold",
        [Cl.uint(BigInt(priceTimeThreshold) + regtestDelay)],
        this.deployerAddress
      ),
      tx.callPublicFn(
        this.contractName,
        "get-asset-price",
        [
          Cl.contractPrincipal(assetDeployerAddress, assetContractName),
        ],
        caller
      )
    ];

    return this.simnet.mineBlock(txs);
  }


  convertToFixed8(price: number, expo: number) {
    return this.simnet.callReadOnlyFn(
      this.contractName,
      "convert-to-fixed-8",
      [Cl.int(price), Cl.int(expo)],
      this.deployerAddress
    );
  }
}

export { PythOracle };
