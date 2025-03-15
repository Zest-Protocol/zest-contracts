import { describe, expect, it, beforeEach, vi } from "vitest";
import { Cl, ClarityType, cvToJSON, cvToValue, uintCV } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";
import { ZToken } from "./models/zToken";
import { tx } from "@hirosystems/clarinet-sdk";

import * as config from "./tools/config";
import { reserveExtraVariables, initContractsToV2, borrowHelper, lpStstxToken, poolBorrow as poolBorrowContractName, pool0Reserve, lpSbtcToken, zSbtc, initContractsToV2_1, incentivesDummy  } from "./tools/config";
import { initSimnetChecker } from "./tools/SimnetChecker";
import { deployPythContracts, deployV2_1Contracts, deployV2Contracts, deployV2TokenContracts, initializeRewards, initPyth } from "./tools/common";
import { getFinalRate, getPriceVaaFromTimestamp, getPriceVaaLatest, getRewardedAmount } from "../utils/utils";
import { PythOracle } from "./models/pyth-oracle";
const simnet = await initSimnetChecker();

const accounts = simnet.getAccounts();
const deployerAddress = accounts.get("deployer")!;
const LP_1 = accounts.get("wallet_1")!;
const LP_2 = accounts.get("wallet_4")!;
const LP_3 = accounts.get("wallet_5")!;
const Borrower_1 = accounts.get("wallet_2")!;
const Delegate_1 = accounts.get("wallet_3")!;
const Borrower_2 = accounts.get("wallet_4")!;

const contractInterfaces = simnet.getContractsInterfaces();
const poolv20Interface = contractInterfaces.get(`${deployerAddress}.pool-v2-0`);

const lpdiko = "lp-diko";
const lpsBTC = "lp-sbtc";
const lpsBTCv1 = "lp-sbtc-v1";
const lpsBTCv2 = "lp-sbtc-v2";
const lpsBTCv3 = "lp-sbtc-v3";
const lpstSTX = "lp-ststx";
const lpstSTXv1 = "lp-ststx-v1";
const lpstSTXv2 = "lp-ststx-v2";
const lpstSTXv3 = "lp-ststx-v3";
const lpUSDA = "lp-usda";
const lpUSDAv1 = "lp-usda-v1";
const lpUSDAv2 = "lp-usda-v2";
const lpUSDAv3 = "lp-usda-v3";
const lpxUSD = "lp-xusd";

const lpWSTXv2 = "lp-wstx-v2";
const lpWSTXv3 = "lp-wstx-v3";

const debtToken0 = "debt-token-0";
const feesCalculator = "fees-calculator";
const oracle = "oracle";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sbtc";
const stSTX = "ststx";
const zstSTX = lpstSTXv3;
const zsBTC = lpsBTCv3;
const zUSDA = lpUSDAv3;
const zwstx = lpWSTXv3;
const USDA = "usda";
const xUSD = "xusd";
const wstx = "wstx";

const max_value = BigInt("340282366920938463463374607431768211455");

describe("Pyth oracle", () => {
  beforeEach(() => {
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      160_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      4000000000000,
      deployerAddress
    );
    oracleContract.setPrice(deployerAddress, diko, 40000000, deployerAddress);
    oracleContract.setPrice(deployerAddress, USDA, 99000000, deployerAddress);
    oracleContract.setPrice(
      deployerAddress,
      xUSD,
      100_000_000,
      deployerAddress
    );

    let callResponse = simnet.deployContract(
      "run-reserve-extra-variables",
      readFileSync(reserveExtraVariables).toString(),
      null,
      deployerAddress
    );

    simnet.setEpoch("3.0");
    deployV2Contracts(simnet, deployerAddress);
    deployV2TokenContracts(simnet, deployerAddress);
    deployV2_1Contracts(simnet, deployerAddress);

    callResponse = simnet.deployContract(
      "run-1",
      readFileSync(initContractsToV2_1).toString(),
      null,
      deployerAddress
    );

    initializeRewards(simnet, deployerAddress);

    deployPythContracts(simnet, deployerAddress);

  });
  // test might fail because the timestamp in regtest is ahead of real time by 7640 seconds
  // it might also be 7639 seconds. 
  it("Gets asset price before it's stale and after, then refresh and get again", async () => {
    initPyth(simnet, deployerAddress);

    const oracle = new PythOracle(simnet, deployerAddress, "pyth-oracle");

    let callResponse = simnet.deployContract(
      "pyth-oracle",
      readFileSync(config.pyth_oracle_path).toString(),
      {
        clarityVersion: 3,
      },
      deployerAddress
    );

    const pythTimestamp = Math.floor(Date.now() / 1000) - 2;
    const btcPriceFeedId = "e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";
    const stxPriceFeedId = "ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17";
    const aeusdcPriceFeedId = "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a";
    let vaa = await getPriceVaaFromTimestamp('btc', pythTimestamp) as string;

    callResponse = simnet.callPublicFnCheckOk(
      config.pythOracle,
      "verify-and-update-price-feeds",
      [
        Cl.bufferFromHex(vaa),
        Cl.tuple({
          "pyth-storage-contract": Cl.contractPrincipal(deployerAddress, config.pythStorage),
          "pyth-decoder-contract": Cl.contractPrincipal(deployerAddress, config.pythPnauDecoder),
          "wormhole-core-contract": Cl.contractPrincipal(deployerAddress, config.wormholeCore),
        })
      ],
      deployerAddress
    );

    vaa = await getPriceVaaFromTimestamp('stx', pythTimestamp) as string;
    callResponse = simnet.callPublicFnCheckOk(
      config.pythOracle,
      "verify-and-update-price-feeds",
      [
        Cl.bufferFromHex(vaa),
        Cl.tuple({
          "pyth-storage-contract": Cl.contractPrincipal(deployerAddress, config.pythStorage),
          "pyth-decoder-contract": Cl.contractPrincipal(deployerAddress, config.pythPnauDecoder),
          "wormhole-core-contract": Cl.contractPrincipal(deployerAddress, config.wormholeCore),
        })
      ],
      deployerAddress
    );

    vaa = await getPriceVaaFromTimestamp('usdc', pythTimestamp) as string;
    callResponse = simnet.callPublicFnCheckOk(
      config.pythOracle,
      "verify-and-update-price-feeds",
      [
        Cl.bufferFromHex(vaa),
        Cl.tuple({
          "pyth-storage-contract": Cl.contractPrincipal(deployerAddress, config.pythStorage),
          "pyth-decoder-contract": Cl.contractPrincipal(deployerAddress, config.pythPnauDecoder),
          "wormhole-core-contract": Cl.contractPrincipal(deployerAddress, config.wormholeCore),
        })
      ],
      deployerAddress
    );

    callResponse = oracle.getAssetPrice(
      10,
      deployerAddress,
      config.sBTC,
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));
    // console.log((callResponse.events[0].data.value as any).value);
    // console.log((callResponse.events[1].data.value as any).value);

    const remainingTime = oracle.getRemainingTimeUntilPriceIsStale(
      deployerAddress,
      config.sBTC,
      btcPriceFeedId,
      10n,
      deployerAddress
    );
    console.log(remainingTime);

    // let 6 seconds pass before price is stale
    // await new Promise(resolve => setTimeout(resolve, 6000));
    callResponse = oracle.getAssetPrice(
      10,
      deployerAddress,
      config.sBTC,
      deployerAddress
    );
    // console.log((callResponse.events[0].data.value as any).value);
    // console.log((callResponse.events[1].data.value as any).value);
    // expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);

    // price should fail after it's over the 10 seconds threshold
    // await new Promise(resolve => setTimeout(resolve, 6000));
    callResponse = oracle.getAssetPrice(
      10,
      deployerAddress,
      config.sBTC,
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));
    // expect(callResponse.result).toBeErr(Cl.uint(5001));

    callResponse = simnet.callReadOnlyFn(
      "pyth-oracle",
      "get-price",
      [
        Cl.contractPrincipal(deployerAddress, config.stSTX),
      ],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callReadOnlyFn(
      "pyth-oracle",
      "get-price",
      [
        Cl.contractPrincipal(deployerAddress, config.wstx),
      ],
      deployerAddress
    );
    console.log(Cl.prettyPrint(callResponse.result));

    // const convertToFixed8 = simnet.callReadOnlyFn(
    //   "pyth-oracle",
    //   "convert-to-fixed-8",
    //   [
    //     Cl.int(1500),
    //     Cl.int(-5)
    //   ],
    //   deployerAddress
    // );
    // console.log(Cl.prettyPrint(convertToFixed8.result));
    // force wait to get a new vaa, wait 11 seconds because 1 block increase 10 secs in regtest
    //  1 more second for the vaa to be ahead by 1 second
    // await new Promise(resolve => setTimeout(resolve, 100000));

    // vaa = await getPriceVaaLatest('btc') as string;

    // let block = simnet.mineBlock([
    //   tx.callPublicFn(
    //     config.pythOracle,
    //     "verify-and-update-price-feeds",
    //     [
    //       Cl.bufferFromHex(vaa),
    //       Cl.tuple({
    //         "pyth-storage-contract": Cl.contractPrincipal(deployerAddress, config.pythStorage),
    //         "pyth-decoder-contract": Cl.contractPrincipal(deployerAddress, config.pythPnauDecoder),
    //         "wormhole-core-contract": Cl.contractPrincipal(deployerAddress, config.wormholeCore),
    //       })
    //     ],
    //     deployerAddress
    //   ),
    // ])

    // callResponse = oracle.getAssetPrice(
    //   10,
    //   deployerAddress,
    //   config.sBTC,
    //   deployerAddress
    // );
    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log((callResponse.events[0].data.value as any).value);
    // console.log((callResponse.events[1].data.value as any).value);

    // // expect(block[1].result).toBeErr(Cl.uint(5001));
    // // console.log(Cl.prettyPrint(block[0].result));
    // expect(block[0].result).toHaveClarityType(ClarityType.ResponseOk);
  });
});
