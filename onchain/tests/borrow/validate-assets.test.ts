import { initSimnet } from "@hirosystems/clarinet-sdk";
import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType, cvToJSON, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";
import { ZToken } from "./models/zToken";

import * as config from "./tools/config";
import { initSimnetChecker } from "./tools/SimnetChecker";
import { deployV2_1Contracts, deployV2Contracts, deployV2TokenContracts } from "./tools/common";

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
const lpdikoV1 = "lp-diko-v1";
const lpdikoV2 = "lp-diko-v2";
const lpsBTC = "lp-sbtc";
const lpsBTCv1 = "lp-sbtc-v1";
const lpsBTCv2 = "lp-sbtc-v2";
const lpstSTX = "lp-ststx";
const lpstSTXv1 = "lp-ststx-v1";
const lpstSTXv2 = "lp-ststx-v2";
const lpUSDA = "lp-usda";
const lpUSDAv1 = "lp-usda-v1";
const lpUSDAv2 = "lp-usda-v2";
const lpxUSD = "lp-xusd";

const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const oracle = "oracle";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sbtc";
const stSTX = "ststx";
const zstSTX = lpstSTXv2;
const zsBTC = lpsBTCv2;
const zwstx = "lp-wstx-v1";
const USDA = "usda";
const xUSD = "xusd";
const wstx = "wstx";

const zsbtc = config.lpSbtc;
const zststx = config.lpStstx;

const max_value = BigInt("340282366920938463463374607431768211455");

describe("Supply and redeem", () => {
  beforeEach(() => {
    let callResponse = simnet.deployContract(
      "run-reserve-extra-variables",
      readFileSync(config.reserveExtraVariables).toString(),
      null,
      deployerAddress
    );

    simnet.setEpoch("3.0");
    deployV2Contracts(simnet, deployerAddress);
    deployV2TokenContracts(simnet, deployerAddress);
    deployV2_1Contracts(simnet, deployerAddress);

    callResponse = simnet.deployContract(
      "run-1",
      readFileSync(config.initContractsToV2_1).toString(),
      null,
      deployerAddress
    );
  });
  it("Call validate-assets on even number of assets", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    let callResponse = poolBorrow.init(
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
      zsbtc,
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

    // expected list
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);

    // duplicated list
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));

    // only 1 of the assets
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));

    // only 1 of the assets
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));

    // cannot use the same asset multiple times until length
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeErr(Cl.uint(30025));

    // correct assets, plus an extra used asset
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));

    // empty list
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [Cl.list([])],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));

    // correct assets, plus an extra unused asset
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, wstx),
            "lp-token": Cl.contractPrincipal(deployerAddress, zwstx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));

    let assets = [];
    for (let i = 0; i < 50; i++) {
      assets.push(
        Cl.tuple({
          asset: Cl.contractPrincipal(deployerAddress, sBTC),
          "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
          oracle: Cl.contractPrincipal(deployerAddress, oracle),
        }),
        Cl.tuple({
          asset: Cl.contractPrincipal(deployerAddress, sBTC),
          "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
          oracle: Cl.contractPrincipal(deployerAddress, oracle),
        })
      );
    }
    expect(assets.length).toBe(100);
    // hit the limit of 100 assets
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [Cl.list(assets)],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));
    // hit the limit of 100 assets
    expect(
      () =>
        (callResponse = simnet.callReadOnlyFn(
          config.poolBorrow,
          "validate-assets",
          [
            Cl.list([
              ...assets,
              Cl.tuple({
                asset: Cl.contractPrincipal(deployerAddress, sBTC),
                "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
                oracle: Cl.contractPrincipal(deployerAddress, oracle),
              }),
            ]),
          ],
          LP_1
        ))
    ).toThrowError();
  });
  it("Call validate-assets on odd number of assets", () => {
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    let callResponse = poolBorrow.init(
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
      zsbtc,
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
      lpUSDAv2,
      deployerAddress,
      USDA,
      6,
      max_value,
      max_value,
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    callResponse = poolBorrow.addAsset(deployerAddress, USDA, deployerAddress);

    // expected list
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv2),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toHaveClarityType(ClarityType.ResponseOk);

    let assets = [];
    for (let i = 0; i < 33; i++) {
      assets.push(
        Cl.tuple({
          asset: Cl.contractPrincipal(deployerAddress, stSTX),
          "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
          oracle: Cl.contractPrincipal(deployerAddress, oracle),
        }),
        Cl.tuple({
          asset: Cl.contractPrincipal(deployerAddress, sBTC),
          "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
          oracle: Cl.contractPrincipal(deployerAddress, oracle),
        }),
        Cl.tuple({
          asset: Cl.contractPrincipal(deployerAddress, USDA),
          "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv2),
          oracle: Cl.contractPrincipal(deployerAddress, oracle),
        })
      );
    }
    expect(assets.length).toBe(99);

    // hit the limit of 99 assets
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [Cl.list(assets)],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));
    // add an asset before 100 assets
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          ...assets,
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv2),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));
    // add an asset before 100 assets
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          ...assets,
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));

    // add an asset before 100 assets
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          ...assets,
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));

    // duplicated list
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv2),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv2),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));

    // only 1 of the assets
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));

    // only 1 of the assets
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));

    // only 1 of the assets
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv2),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));

    // cannot use the same asset multiple times until length
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30025));

    // correct assets, plus an extra used asset
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv2),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));

    // correct assets, plus an extra unused asset
    callResponse = simnet.callReadOnlyFn(
      config.poolBorrow,
      "validate-assets",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, zststx),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, zsbtc),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, USDA),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpUSDAv2),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, diko),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpdikoV2),
            oracle: Cl.contractPrincipal(deployerAddress, oracle),
          }),
        ]),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30024));
  });
});
