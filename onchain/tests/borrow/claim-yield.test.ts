import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";

import * as config from "./tools/config";
import { initSimnetChecker } from "./tools/SimnetChecker";
import { deployV2_1Contracts, deployV2Contracts, deployV2TokenContracts } from "./tools/common";

const simnet = await initSimnetChecker();

const accounts = simnet.getAccounts();
const deployerAddress = accounts.get("deployer")!;
const LP_1 = accounts.get("wallet_1")!;
const LP_2 = accounts.get("wallet_4")!;
const LP_3 = accounts.get("wallet_5")!;
const Liquidator_1 = accounts.get("wallet_5")!;
const Borrower_1 = accounts.get("wallet_2")!;
const Delegate_1 = accounts.get("wallet_3")!;
const Borrower_2 = accounts.get("wallet_4")!;

const contractInterfaces = simnet.getContractsInterfaces();
const poolv20Interface = contractInterfaces.get(`${deployerAddress}.pool-v2-0`);


const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const oracle = "oracle";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sbtc";
const stSTX = "ststx";
const USDA = "usda";
const xUSD = "xusd";
const wstx = "wstx";

const max_value = BigInt("340282366920938463463374607431768211455");

const assets = [
  Cl.tuple({
    asset: Cl.contractPrincipal(deployerAddress, stSTX),
    "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
    oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
  }),
  Cl.tuple({
    asset: Cl.contractPrincipal(deployerAddress, sBTC),
    "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
    oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
  }),
]

describe("Claim rewards", () => {
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
      4_000_000_000_000,
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
    oracleContract.setPrice(
      deployerAddress,
      wstx,
      160_000_000,
      deployerAddress
    );

    let callResponse = simnet.callPublicFn(
      config.poolReserveData,
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(0)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      config.poolReserveData,
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(0)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      config.poolReserveData,
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.uint(0)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(0)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(0)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-base-variable-borrow-rate",
      [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(0)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-1",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(4000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-1",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(4000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-1",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.uint(4000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-1",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(4000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-1",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(4000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-1",
      [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(4000000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-2",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(300000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-2",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(300000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-2",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.uint(300000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-2",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(300000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-2",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(300000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-variable-rate-slope-2",
      [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(300000000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-optimal-utilization-rate",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(80000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-optimal-utilization-rate",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(80000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-optimal-utilization-rate",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.uint(80000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-optimal-utilization-rate",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(80000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-optimal-utilization-rate",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(80000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-optimal-utilization-rate",
      [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(80000000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-liquidation-close-factor-percent",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(50000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-liquidation-close-factor-percent",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(50000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-liquidation-close-factor-percent",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.uint(50000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-liquidation-close-factor-percent",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(50000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-liquidation-close-factor-percent",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(50000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-liquidation-close-factor-percent",
      [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(50000000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-flashloan-fee-total",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(35)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-flashloan-fee-total",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(35)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-flashloan-fee-protocol",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(3000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "set-flashloan-fee-protocol",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(3000)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-origination-fee-prc",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(25)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-origination-fee-prc",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(25)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-origination-fee-prc",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.uint(25)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-origination-fee-prc",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(25)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-origination-fee-prc",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(25)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-origination-fee-prc",
      [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(25)],
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-reserve-factor",
      [Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(15000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-reserve-factor",
      [Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(10000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-reserve-factor",
      [Cl.contractPrincipal(deployerAddress, diko), Cl.uint(10000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-reserve-factor",
      [Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(10000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-reserve-factor",
      [Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(10000000)],
      deployerAddress
    );
    callResponse = simnet.callPublicFn(
      "pool-reserve-data",
      "set-reserve-factor",
      [Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(10000000)],
      deployerAddress
    );

    simnet.deployContract(
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


    const poolBorrow = new PoolBorrow(
      simnet,
      deployerAddress,
      config.poolBorrow
    );

    poolBorrow.init(
      deployerAddress,
      config.lpStstx,
      deployerAddress,
      stSTX,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    poolBorrow.addAsset(deployerAddress, stSTX, deployerAddress);

    poolBorrow.init(
      deployerAddress,
      config.lpSbtc,
      deployerAddress,
      sBTC,
      8,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );
    poolBorrow.addAsset(deployerAddress, sBTC, deployerAddress);

    simnet.callPublicFnCheckOk(
      config.rewardsData,
      "set-approved-contract",
      [
        Cl.contractPrincipal(deployerAddress, config.incentives),
        Cl.bool(true),
      ],
      deployerAddress
    );
    simnet.callPublicFnCheckOk(
      config.incentives,
      "initialize-reward-program-data",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, wstx),
      ],
      deployerAddress
    );
    simnet.callPublicFnCheckOk(
      config.incentives,
      "set-liquidity-rate",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(0),
      ],
      deployerAddress
    );
    simnet.callPublicFnCheckOk(
      config.incentives,
      "set-price",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(9200000000000),
      ],
      deployerAddress
    );
    simnet.callPublicFnCheckOk(
      config.incentives,
      "set-price",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(80000000),
      ],
      deployerAddress
    );
    simnet.callPublicFnCheckOk(
      config.incentives,
      "set-precision",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(8),
      ],
      deployerAddress
    );
    simnet.callPublicFnCheckOk(
      config.incentives,
      "set-precision",
      [
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(6),
      ],
      deployerAddress
    );

    simnet.callPublicFnCheckOk(
      stSTX,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

  });
  it(`Incentives not active beginning:Supply and receive no rewards, when no distribution.
    Activate yield, claim supply after, withdraw and supply again and withdraw everything.`, () => {

    simnet.transferSTX(100000000000, `${deployerAddress}.incentives`, deployerAddress);

    let callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentivesDummy),
      ],
      LP_1
    );
    // console.log(simnet.getAssetsMap());
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, config.incentivesDummy),
      ],
      LP_1
    );
    // console.log(simnet.getAssetsMap());
    expect(callResponse.result).toBeOk(Cl.bool(true));
    expect(
      simnet
        .getAssetsMap()
        .get(".sbtc.sbtc")
        ?.get(`${deployerAddress}.pool-vault`)!
    ).toBe(0n);
    expect(simnet.getAssetsMap().get(".sbtc.sbtc")?.get(LP_1)!).toBe(1_000_000_000n);
    expect(simnet.getAssetsMap().get(".wstx.wstx")?.get(LP_1)!).toBe(undefined);

    // set to 1% APY
    callResponse = simnet.callPublicFnCheckOk(
      config.incentives,
      "set-liquidity-rate",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(1010000),
      ],
      deployerAddress
    );

    simnet.mineEmptyStacksBlocks(100000);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentivesDummy),
      ],
      LP_1
    );

    simnet.mineEmptyStacksBlocks(100000);
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "claim-rewards",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    const wstxBalanceFirstClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;

    simnet.mineEmptyStacksBlocks(100000);
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "claim-rewards",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    const wstxBalanceSecondClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;
    expect(wstxBalanceSecondClaim).toBeGreaterThan(wstxBalanceFirstClaim);
    // console.log(callResponse.events);
    // console.log((callResponse.events[callResponse.events.length - 2] as any).data.value.data);
    // console.log((callResponse.events[callResponse.events.length - 1] as any).data.value.data);
    // console.log((callResponse.events[callResponse.events.length - 8] as any).data.value.data['update-index-result']);s
    // withdraw and get some yields
    // console.log(simnet.getAssetsMap());
    simnet.mineEmptyStacksBlocks(100);
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(max_value),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    // console.log(simnet.getAssetsMap());
  });
  it(`Incentives active beginning: Supply and receive no rewards, when no distribution.
    Activate yield, claim supply after, withdraw and supply again and withdraw everything.`, () => {

    simnet.transferSTX(100000000000, `${deployerAddress}.incentives`, deployerAddress);

    let callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    // console.log(simnet.getAssetsMap());
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    // console.log(simnet.getAssetsMap());
    expect(callResponse.result).toBeOk(Cl.bool(true));
    expect(
      simnet
        .getAssetsMap()
        .get(".sbtc.sbtc")
        ?.get(`${deployerAddress}.pool-vault`)!
    ).toBe(0n);
    expect(simnet.getAssetsMap().get(".sbtc.sbtc")?.get(LP_1)!).toBe(1_000_000_000n);
    expect(simnet.getAssetsMap().get(".wstx.wstx")?.get(LP_1)!).toBe(undefined);

    // set to 1% APY
    callResponse = simnet.callPublicFnCheckOk(
      config.incentives,
      "set-liquidity-rate",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(1010000),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );

    simnet.mineEmptyStacksBlocks(100000);
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "claim-rewards",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    const wstxBalanceFirstClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;

    simnet.mineEmptyStacksBlocks(100000);
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "claim-rewards",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    const wstxBalanceSecondClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;
    expect(wstxBalanceSecondClaim).toBeGreaterThan(wstxBalanceFirstClaim);
    // console.log(callResponse.events);
    // console.log((callResponse.events[callResponse.events.length - 2] as any).data.value.data);
    // console.log((callResponse.events[callResponse.events.length - 1] as any).data.value.data);
    // console.log((callResponse.events[callResponse.events.length - 8] as any).data.value.data['update-index-result']);s
    // withdraw and get some yields
    // console.log(simnet.getAssetsMap());
    simnet.mineEmptyStacksBlocks(100);
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(max_value),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    // console.log(simnet.getAssetsMap());
  });

  it(`Incentives not active beginning:Supply and receive no rewards, when no distribution.
    Activate yield, claim supply after, withdraw and supply again and withdraw everything.`, () => {

    simnet.transferSTX(100000000000, `${deployerAddress}.incentives`, deployerAddress);

    let callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentivesDummy),
      ],
      LP_1
    );
    // console.log(simnet.getAssetsMap());
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, config.incentivesDummy),
      ],
      LP_1
    );
    // console.log(simnet.getAssetsMap());
    expect(callResponse.result).toBeOk(Cl.bool(true));
    expect(
      simnet
        .getAssetsMap()
        .get(".sbtc.sbtc")
        ?.get(`${deployerAddress}.pool-vault`)!
    ).toBe(0n);
    expect(simnet.getAssetsMap().get(".sbtc.sbtc")?.get(LP_1)!).toBe(1_000_000_000n);
    expect(simnet.getAssetsMap().get(".wstx.wstx")?.get(LP_1)!).toBe(undefined);

    // set to 1% APY
    callResponse = simnet.callPublicFnCheckOk(
      config.incentives,
      "set-liquidity-rate",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(1010000),
      ],
      deployerAddress
    );

    simnet.mineEmptyStacksBlocks(100000);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentivesDummy),
      ],
      LP_1
    );

    simnet.mineEmptyStacksBlocks(100000);
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "claim-rewards",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    const wstxBalanceFirstClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;

    simnet.mineEmptyStacksBlocks(100000);
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "claim-rewards",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    const wstxBalanceSecondClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;
    expect(wstxBalanceSecondClaim).toBeGreaterThan(wstxBalanceFirstClaim);
    // console.log(callResponse.events);
    // console.log((callResponse.events[callResponse.events.length - 2] as any).data.value.data);
    // console.log((callResponse.events[callResponse.events.length - 1] as any).data.value.data);
    // console.log((callResponse.events[callResponse.events.length - 8] as any).data.value.data['update-index-result']);s
    // withdraw and get some yields
    // console.log(simnet.getAssetsMap());
    simnet.mineEmptyStacksBlocks(100);
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(max_value),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
  });
  it(`Supply before yield is active, claim rewards after yield is active and earn rewards.`, () => {
    const assets = [
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, stSTX),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      }),
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, sBTC),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      }),
    ]

    simnet.transferSTX(100000000000, `${deployerAddress}.incentives`, deployerAddress);

    let callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );

    // set to 1% APY
    callResponse = simnet.callPublicFnCheckOk(
      config.incentives,
      "set-liquidity-rate",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(1010000),
      ],
      deployerAddress
    );


    simnet.mineEmptyStacksBlocks(100000);
    const wstxBalanceBeforeClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "claim-rewards",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    const wstxBalanceAfterClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;
    expect(wstxBalanceAfterClaim).toBeGreaterThan(wstxBalanceBeforeClaim);
  });

  it(`Supply before yield is active, withdraw after yield is active and earn rewards.`, () => {

    simnet.transferSTX(100000000000, `${deployerAddress}.incentives`, deployerAddress);

    let callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );

    // set to 1% APY
    callResponse = simnet.callPublicFnCheckOk(
      config.incentives,
      "set-liquidity-rate",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(1010000),
      ],
      deployerAddress
    );


    simnet.mineEmptyStacksBlocks(100000);
    const wstxBalanceBeforeClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(max_value),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    const wstxBalanceAfterClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;
    expect(wstxBalanceAfterClaim).toBeGreaterThan(wstxBalanceBeforeClaim);
  });

  it(`Supply before yield is active, supply after yield is active and earn rewards.`, () => {
    const assets = [
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, stSTX),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      }),
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, sBTC),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      }),
    ]

    simnet.transferSTX(100000000000, `${deployerAddress}.incentives`, deployerAddress);

    let callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );

    // set to 1% APY
    callResponse = simnet.callPublicFnCheckOk(
      config.incentives,
      "set-liquidity-rate",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(1010000),
      ],
      deployerAddress
    );

    callResponse = simnet.callPublicFnCheckOk(
      sBTC,
      "mint",
      [Cl.uint(1_000_000_000), Cl.standardPrincipal(LP_1)],
      deployerAddress
    );

    simnet.mineEmptyStacksBlocks(100000);
    const wstxBalanceBeforeClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    const wstxBalanceAfterClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;
    expect(wstxBalanceAfterClaim).toBeGreaterThan(wstxBalanceBeforeClaim);
  });

  it(`Activate yield before supply, fully withdraw and earn rewards.`, () => {
    const assets = [
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, stSTX),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      }),
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, sBTC),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      }),
    ]

    simnet.transferSTX(100000000000, `${deployerAddress}.incentives`, deployerAddress);

    let callResponse = simnet.callPublicFnCheckOk(
      config.incentives,
      "set-liquidity-rate",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(1010000),
      ],
      deployerAddress
    );

    const wstxBalanceBefore = simnet.getAssetsMap().get("STX")!.get(LP_1)!;

    // console.log(simnet.getAssetsMap());
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );

    simnet.mineEmptyStacksBlocks(100000);

    expect(simnet.getAssetsMap().get("STX")!.get(LP_1)!).toBeLessThanOrEqual(wstxBalanceBefore);
    // console.log(simnet.getAssetsMap().get("STX")!.get(LP_1));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(max_value),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    // console.log(simnet.getAssetsMap().get("STX")!.get(LP_1));
    const wstxBalanceFirstClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;

    expect(wstxBalanceFirstClaim).toBeGreaterThan(wstxBalanceBefore);
  });
  it(`Activate yield, claim supply after, partial withdraw and earn rewards.`, () => {
    const assets = [
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, stSTX),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpStstx),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      }),
      Cl.tuple({
        asset: Cl.contractPrincipal(deployerAddress, sBTC),
        "lp-token": Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
      }),
    ]

    simnet.transferSTX(100000000000, `${deployerAddress}.incentives`, deployerAddress);

    let callResponse = simnet.callPublicFnCheckOk(
      config.incentives,
      "set-liquidity-rate",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(1010000),
      ],
      deployerAddress
    );

    const wstxBalanceBefore = simnet.getAssetsMap().get("STX")!.get(LP_1)!;

    // console.log(simnet.getAssetsMap());
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentivesDummy),
      ],
      LP_1
    );

    simnet.mineEmptyStacksBlocks(100000);
    // console.log(simnet.getAssetsMap().get("STX")!.get(LP_1));

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(1000),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    // console.log(simnet.getAssetsMap().get("STX")!.get(LP_1));
    const wstxBalanceFirstClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;

    expect(wstxBalanceFirstClaim).toBeGreaterThan(wstxBalanceBefore);
  });
  it(`Supply and receive no rewards, when no distribution.
    Activate yield, supply, supply again and earn rewards.`, () => {

    simnet.transferSTX(100000000000, `${deployerAddress}.incentives`, deployerAddress);

    let callResponse = simnet.callPublicFnCheckOk(
      config.incentives,
      "set-liquidity-rate",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(1010000),
      ],
      deployerAddress
    );

    const wstxBalanceBefore = simnet.getAssetsMap().get("STX")!.get(LP_1)!;

    // console.log(simnet.getAssetsMap());
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(500_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentivesDummy),
      ],
      LP_1
    );
    simnet.mineEmptyStacksBlocks(100000);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(500_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    // console.log(simnet.getAssetsMap().get("STX")!.get(LP_1));
    const wstxBalanceFirstClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;

    expect(wstxBalanceFirstClaim).toBeGreaterThan(wstxBalanceBefore);
  });
  it(`Activate yield before supply, fully withdraw and earn rewards. Try to claim rewards after and fails.`, () => {
    simnet.transferSTX(100000000000, `${deployerAddress}.incentives`, deployerAddress);

    let callResponse = simnet.callPublicFnCheckOk(
      config.incentives,
      "set-liquidity-rate",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.uint(1010000),
      ],
      deployerAddress
    );

    const wstxBalanceBefore = simnet.getAssetsMap().get("STX")!.get(LP_1)!;

    // console.log(simnet.getAssetsMap());
    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(1_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );

    simnet.mineEmptyStacksBlocks(100000);

    expect(simnet.getAssetsMap().get("STX")!.get(LP_1)!).toBeLessThanOrEqual(wstxBalanceBefore);

    callResponse = simnet.callPublicFnCheckOk(
      config.borrowHelper,
      "withdraw",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.uint(max_value),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    const wstxBalanceFirstClaim = simnet.getAssetsMap().get("STX")!.get(LP_1)!;
    expect(wstxBalanceFirstClaim).toBeGreaterThan(wstxBalanceBefore);

    callResponse = simnet.callPublicFn(
      config.borrowHelper,
      "claim-rewards",
      [
        Cl.contractPrincipal(deployerAddress, config.lpSbtc),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, oracle),
        Cl.standardPrincipal(LP_1),
        Cl.list(assets),
        Cl.contractPrincipal(deployerAddress, wstx),
        Cl.contractPrincipal(deployerAddress, config.incentives),
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30002));
  });

});
