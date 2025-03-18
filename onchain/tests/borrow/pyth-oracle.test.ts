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
import { deployPythContracts, deployV2_1Contracts, deployV2Contracts, deployV2TokenContracts, getReserveState, initializeRewards, initPyth } from "./tools/common";
import { getFinalRate, getPriceVaaFromTimestamp, getPriceVaaLatest, getPriceVaas, getRewardedAmount, verifyTxsOk } from "../utils/utils";
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
    deployPythContracts(simnet, deployerAddress);
    deployV2_1Contracts(simnet, deployerAddress);

    callResponse = simnet.deployContract(
      "run-1",
      readFileSync(initContractsToV2_1).toString(),
      null,
      deployerAddress
    );

    initializeRewards(simnet, deployerAddress);

  });
  it("Update 2 assets to pyth oracle, only update the price of one.", async () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      poolBorrowContractName
    );
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zstSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);

    let callResponse = oracleContract.setPrice(
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

    callResponse = poolBorrow.init(
      deployerAddress,
      zstSTX,
      deployerAddress,
      stSTX,
      6,
      max_value,
      max_value,
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    callResponse = poolBorrow.addAsset(deployerAddress, stSTX, deployerAddress);
    callResponse = poolBorrow.init(
      deployerAddress,
      zsBTC,
      deployerAddress,
      sBTC,
      8,
      max_value,
      max_value,
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    callResponse = poolBorrow.addAsset(deployerAddress, sBTC, deployerAddress);
    callResponse = poolBorrow.init(
      deployerAddress,
      zUSDA,
      deployerAddress,
      USDA,
      6,
      max_value,
      max_value,
      deployerAddress,
      "pyth-oracle",
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    callResponse = poolBorrow.addAsset(deployerAddress, USDA, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );
    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      USDA,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(2_000_000_000), Cl.standardPrincipal(Borrower_1)],
      deployerAddress
    );

    simnet.deployContract(
      "pyth-oracle",
      readFileSync(config.pyth_oracle_path).toString(),
      {
        clarityVersion: 3,
      },
      deployerAddress
    );
    initPyth(simnet, deployerAddress);

    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zsBTC),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      Borrower_1
    );

    let reserveValues = await getReserveState(simnet, deployerAddress, sBTC);

    // enable flashloan
    callResponse = simnet.callPublicFnCheckOk(
      poolBorrowContractName,
      "set-reserve",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.tuple({ 
          ...reserveValues,
          "oracle": Cl.contractPrincipal(deployerAddress, "pyth-oracle"),
        }),
      ],
      deployerAddress
    );


    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, zstSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "pyth-oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, zUSDA),
            oracle: Cl.contractPrincipal(deployerAddress, "pyth-oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
        Cl.none(),
      ],
      LP_1
    );

    let vaa = await getPriceVaaLatest('btc') as string;

    // works when updating only the assets the user is using
    callResponse = simnet.callPublicFnCheckOk(
      borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, zsBTC),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, "pyth-oracle"),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "pyth-oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, zUSDA),
            oracle: Cl.contractPrincipal(deployerAddress, "pyth-oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
        Cl.some(Cl.bufferFromHex(vaa)),
      ],
      Borrower_1
    );
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

    let vaas = await getPriceVaas(['btc', 'stx', 'usdc']);
    callResponse = simnet.callPublicFnCheckOk(
      config.pythOracle,
      "verify-and-update-price-feeds",
      [
        Cl.bufferFromHex(vaas),
        Cl.tuple({
          "pyth-storage-contract": Cl.contractPrincipal(deployerAddress, config.pythStorage),
          "pyth-decoder-contract": Cl.contractPrincipal(deployerAddress, config.pythPnauDecoder),
          "wormhole-core-contract": Cl.contractPrincipal(deployerAddress, config.wormholeCore),
        })
      ],
      deployerAddress
    );
    const expectedTimeThreshold = 10;

    let getAssetPriceResponse = oracle.getAssetPrice(
      expectedTimeThreshold,
      deployerAddress,
      config.sBTC,
      deployerAddress
    );
    verifyTxsOk(getAssetPriceResponse);
    // console.log((callResponse.events[0].data.value as any).value);

    const remainingSeconds = oracle.getRemainingTimeUntilPriceIsStale(
      deployerAddress,
      config.sBTC,
      btcPriceFeedId,
      expectedTimeThreshold,
      deployerAddress
    );
    // let 6 seconds pass before price is stale
    await new Promise(resolve => setTimeout(resolve, 1000 * Number(remainingSeconds - 1n)));
    getAssetPriceResponse = oracle.getAssetPrice(
      expectedTimeThreshold,
      deployerAddress,
      config.sBTC,
      deployerAddress
    );
    verifyTxsOk(getAssetPriceResponse);

    // price should fail after
    await new Promise(resolve => setTimeout(resolve, 1000));
    getAssetPriceResponse = oracle.getAssetPrice(
      expectedTimeThreshold,
      deployerAddress,
      config.sBTC,
      deployerAddress
    );
    expect(getAssetPriceResponse[1].result).toBeErr(Cl.uint(6001));

    callResponse = simnet.callReadOnlyFn(
      "pyth-oracle",
      "get-price",
      [
        Cl.contractPrincipal(deployerAddress, config.wstx),
      ],
      deployerAddress
    );
    const wstxPrice = BigInt(cvToValue(callResponse.result).value);

    callResponse = simnet.callReadOnlyFn(
      "pyth-oracle",
      "get-price",
      [
        Cl.contractPrincipal(deployerAddress, config.stSTX),
      ],
      deployerAddress
    );
    const ststxPrice = BigInt(cvToValue(callResponse.result).value);

    const ratio = 1080000n;
    const stxDecimals = 1000000n;
    expect(ststxPrice).toBe(wstxPrice * ratio / stxDecimals);

    vaas = await getPriceVaas(['btc', 'stx', 'usdc']);
    callResponse = simnet.callPublicFnCheckOk(
      config.pythOracle,
      "verify-and-update-price-feeds",
      [
        Cl.bufferFromHex(vaas),
        Cl.tuple({
          "pyth-storage-contract": Cl.contractPrincipal(deployerAddress, config.pythStorage),
          "pyth-decoder-contract": Cl.contractPrincipal(deployerAddress, config.pythPnauDecoder),
          "wormhole-core-contract": Cl.contractPrincipal(deployerAddress, config.wormholeCore),
        })
      ],
      deployerAddress
    );

    // after updating, price feed should be ok
    getAssetPriceResponse = oracle.getAssetPrice(
      expectedTimeThreshold,
      deployerAddress,
      config.sBTC,
      deployerAddress
    );
    verifyTxsOk(getAssetPriceResponse);

  });
  it("convert-to-fixed-8", async () => {
    initPyth(simnet, deployerAddress);
    const oracle = new PythOracle(simnet, deployerAddress, "pyth-oracle");
    simnet.deployContract(
      "pyth-oracle",
      readFileSync(config.pyth_oracle_path).toString(),
      {
        clarityVersion: 3,
      },
      deployerAddress
    );

    let convertToFixed8 = oracle.convertToFixed8(1500, -5);
    expect(convertToFixed8.result).toBeOk(Cl.uint(1500000));
    convertToFixed8 = oracle.convertToFixed8(12276250, -5);
    expect(convertToFixed8.result).toBeOk(Cl.uint(12276250000));
    convertToFixed8 = oracle.convertToFixed8(1500, 0);
    expect(convertToFixed8.result).toBeOk(Cl.uint(150000000000));
    convertToFixed8 = oracle.convertToFixed8(1500, -8);
    expect(convertToFixed8.result).toBeOk(Cl.uint(1500));
    convertToFixed8 = oracle.convertToFixed8(123456789, -10);
    expect(convertToFixed8.result).toBeOk(Cl.uint(1234567));
    convertToFixed8 = oracle.convertToFixed8(123456789, -16);
    expect(convertToFixed8.result).toBeOk(Cl.uint(1));
    convertToFixed8 = oracle.convertToFixed8(123456789, 1);
    expect(convertToFixed8.result).toBeErr(Cl.uint(6004));
    convertToFixed8 = oracle.convertToFixed8(123456789, 8);
    expect(convertToFixed8.result).toBeErr(Cl.uint(6004));
  });
});
