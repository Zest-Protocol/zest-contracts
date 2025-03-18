import { describe, expect, it, beforeEach } from "vitest";
import { Cl, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";
import { ZToken } from "./models/zToken";
import { MintableToken } from "./models/token";

import * as config from "./tools/config";
import { initSimnetChecker } from "./tools/SimnetChecker";
import { deployPythContracts, deployV2_1Contracts, deployV2Contracts, deployV2TokenContracts, initializeRewards } from "./tools/common";
import { incentivesDummy } from "./tools/config";

let simnet = await initSimnetChecker();

const accounts = simnet.getAccounts();
const deployerAddress = accounts.get("deployer")!;
const LP_1 = accounts.get("wallet_1")!;
const LP_2 = accounts.get("wallet_4")!;
const LP_3 = accounts.get("wallet_5")!;
const Borrower_1 = accounts.get("wallet_2")!;
const Delegate_1 = accounts.get("wallet_3")!;
const Borrower_2 = accounts.get("wallet_4")!;
const Liquidator_1 = accounts.get("wallet_5")!;
const FlashLender = accounts.get("wallet_6")!;

const contractInterfaces = simnet.getContractsInterfaces();
const poolv20Interface = contractInterfaces.get(`${deployerAddress}.pool-v2-0`);

const lpdiko = "lp-diko";
const lpsBTC = "lp-sbtc";
const lpsBTCv1 = "lp-sbtc-v1";
const lpsBTCv2 = "lp-sbtc-v2";
const lpstSTX = "lp-ststx";
const lpstSTXv1 = "lp-ststx-v1";
const lpstSTXv2 = "lp-ststx-v2";
const lpUSDA = "lp-usda";
const lpxUSD = "lp-xusd";
const lpxUSDv1 = "lp-xusd-v1";
const lpxUSDv2 = "lp-xusd-v2";

const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const oracle = "oracle";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sbtc";
const stSTX = "ststx";

const zStSTX = config.lpStstx;
const zsBTC = config.lpSbtc;
const zxUSD = config.lpXusd;

const USDA = "usda";
const xUSD = "xusd";

const lpwstx = "lp-wstx";
const wstx = "wstx";

const max_value = BigInt("340282366920938463463374607431768211455");

describe("Flashloans", () => {
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
      stSTX,
      200_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      4000000000000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      xUSD,
      100_000_000,
      deployerAddress
    );

    let callResponse = simnet.callPublicFnCheckOk(
      "pool-0-reserve",
      "set-flashloan-fee-protocol",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(3000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      "pool-0-reserve",
      "set-flashloan-fee-protocol",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(3000)],
      deployerAddress
    );

    callResponse = simnet.deployContract(
      "run-reserve-extra-variables",
      readFileSync(config.reserveExtraVariables).toString(),
      null,
      deployerAddress
    );

    simnet.setEpoch("3.0");
    deployV2Contracts(simnet, deployerAddress);
    deployV2TokenContracts(simnet, deployerAddress);
    deployPythContracts(simnet, deployerAddress);
    deployV2_1Contracts(simnet, deployerAddress);

    initializeRewards(simnet, deployerAddress);

    callResponse = simnet.deployContract(
      "run-1",
      readFileSync(config.initContractsToV2_1).toString(),
      null,
      deployerAddress
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, config.poolBorrow);
    callResponse = poolBorrow.init(
      deployerAddress,
      zStSTX,
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
    poolBorrow.addAsset(deployerAddress, stSTX, deployerAddress);

    poolBorrow.init(
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
    poolBorrow.addAsset(deployerAddress, sBTC, deployerAddress);

    poolBorrow.init(
      deployerAddress,
      zxUSD,
      deployerAddress,
      xUSD,
      6,
      max_value,
      max_value,
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    poolBorrow.addAsset(deployerAddress, xUSD, deployerAddress);
  });
  it("Flashloan executes properly only when fees are paid back to the protocol", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const xUSDZToken = new ZToken(simnet, deployerAddress, zxUSD);

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    let callResponse = stSTXToken.mint(400_000_000_000, LP_1, deployerAddress);
    callResponse = sBTCToken.mint(2_000_000_000, Borrower_1, deployerAddress);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, zStSTX),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, incentivesDummy),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
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

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "flashloan",
      [
        Cl.standardPrincipal(FlashLender),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.contractPrincipal(deployerAddress, "flashloan-script"),
      ],
      FlashLender
    );
    expect(callResponse.result).toBeErr(Cl.uint(30015));

    // enable flashloan
    callResponse = simnet.callPublicFnCheckOk(
      config.poolBorrow,
      "set-reserve",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.tuple({
          "a-token-address": Cl.contractPrincipal(
            "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
            config.lpSbtc
          ),
          "base-ltv-as-collateral": Cl.uint(80000000),
          "borrow-cap": Cl.uint(max_value),
          "borrowing-enabled": Cl.bool(false),
          "current-average-stable-borrow-rate": Cl.uint(0),
          "current-liquidity-rate": Cl.uint(0),
          "current-stable-borrow-rate": Cl.uint(0),
          "current-variable-borrow-rate": Cl.uint(0),
          "debt-ceiling": Cl.uint(0),
          "accrued-to-treasury": Cl.uint(0),
          decimals: Cl.uint(8),
          "flashloan-enabled": Cl.bool(true),
          "interest-rate-strategy-address": Cl.contractPrincipal(
            "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
            "interest-rate-strategy-default"
          ),
          "is-active": Cl.bool(true),
          "is-frozen": Cl.bool(false),
          "is-stable-borrow-rate-enabled": Cl.bool(false),
          "last-liquidity-cumulative-index": Cl.uint(100000000),
          "last-updated-block": Cl.uint(18),
          "last-variable-borrow-cumulative-index": Cl.uint(100000000),
          "liquidation-bonus": Cl.uint(5000000),
          "liquidation-threshold": Cl.uint(90000000),
          oracle: Cl.contractPrincipal(
            "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
            "oracle"
          ),
          "supply-cap": Cl.uint(max_value),
          "total-borrows-stable": Cl.uint(0),
          "total-borrows-variable": Cl.uint(0),
          "usage-as-collateral-enabled": Cl.bool(true),
        }),
      ],
      deployerAddress
    );

    // console.log(cvToValue(poolBorrow.getReserveState(deployerAddress, sBTC, deployerAddress).result));

    // does not hold enough to pay initial + fee
    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "flashloan",
      [
        Cl.standardPrincipal(FlashLender),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.contractPrincipal(deployerAddress, "flashloan-script"),
      ],
      FlashLender
    );
    expect(callResponse.result).toBeErr(Cl.uint(1));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "flashloan",
      [
        Cl.standardPrincipal(FlashLender),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.contractPrincipal(deployerAddress, "flashloan-script-2"),
      ],
      FlashLender
    );
    expect(callResponse.result).toBeOk(Cl.uint(0));
    let amountFee = (2000000000n * 35n) / 10000n;
    let protocolFee = (amountFee * 3000n) / 10000n;
    expect(
      simnet
        .getAssetsMap()
        .get(".sbtc.sbtc")
        ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")
    ).toBe(amountFee + 2000000000n);
    expect(
      simnet
        .getAssetsMap()
        .get(".sbtc.sbtc")
        ?.get("ST2ZW2EKBWATT2Z7FZ2XY9KYYVFBYBDCZBRZMFNR9")
    ).toBe(protocolFee);
  });
});
