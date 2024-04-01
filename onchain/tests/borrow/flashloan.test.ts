import { initSimnet } from "@hirosystems/clarinet-sdk";
import { describe, expect, it, beforeEach } from "vitest";
import { Cl, cvToJSON, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";
import { ZToken } from "./models/zToken";
import { MintableToken } from "./models/token";

const simnet = await initSimnet();

const accounts = simnet.getAccounts();
const deployerAddress = accounts.get("deployer")!;
const LP_1 = accounts.get("wallet_1")!;
const LP_2 = accounts.get("wallet_4")!;
const LP_3 = accounts.get("wallet_5")!;
const Borrower_1 = accounts.get("wallet_2")!;
const Delegate_1 = accounts.get("wallet_3")!;
const Borrower_2 = accounts.get("wallet_4")!;
const Liquidator_1 = accounts.get("wallet_5")!;
const FlashLoaner = accounts.get("wallet_6")!;

const contractInterfaces = simnet.getContractsInterfaces();
const poolv20Interface = contractInterfaces.get(`${deployerAddress}.pool-v2-0`);

const lpdiko = "lp-diko";
const lpsBTC = "lp-sbtc";
const lpsBTCv1 = "lp-sbtc-v1";
const lpstSTX = "lp-ststx";
const lpstSTXv1 = "lp-ststx-v1";
const lpUSDA = "lp-usda";
const lpxUSD = "lp-xusd";
const lpxUSDv1 = "lp-xusd-v1";

const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const oracle = "oracle";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sbtc";
const stSTX = "ststx";
const zStSTX = lpstSTXv1;
const zsBTC = lpsBTCv1;
const zxUSD = "lp-xusd";
const USDA = "usda";
const xUSD = "xusd";

const lpwstx = "lp-wstx";
const wstx = "wstx";

const max_value = BigInt("340282366920938463463374607431768211455");

describe("Flashloans", () => {
  beforeEach(() => {
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
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

    poolBorrow.init(
      deployerAddress,
      lpstSTXv1,
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
    poolBorrow.addAsset(
      deployerAddress,
      stSTX,
      deployerAddress
    );

    poolBorrow.init(
      deployerAddress,
      lpsBTCv1,
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
    poolBorrow.addAsset(
      deployerAddress,
      sBTC,
      deployerAddress
    );

    poolBorrow.init(
      deployerAddress,
      lpxUSDv1,
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

    poolBorrow.addAsset(
      deployerAddress,
      xUSD,
      deployerAddress
    );

    simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(0) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(0) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(0) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(0) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(0) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-base-variable-borrow-rate", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(0) ], deployerAddress);

    simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(4000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(4000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(4000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(4000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(4000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-1", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(4000000) ], deployerAddress);

    simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(300000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(300000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(300000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(300000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(300000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-variable-rate-slope-2", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(300000000) ], deployerAddress);

    simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(80000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(80000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(80000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(80000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(80000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-optimal-utilization-rate", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(80000000) ], deployerAddress);

    simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(50000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(50000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(50000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(50000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(50000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-liquidation-close-factor-percent", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(50000000) ], deployerAddress);

    simnet.callPublicFn("pool-0-reserve", "set-flashloan-fee-total", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(35) ], deployerAddress);
    simnet.callPublicFn("pool-0-reserve", "set-flashloan-fee-total", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(35) ], deployerAddress);
    
    simnet.callPublicFn("pool-0-reserve", "set-flashloan-fee-protocol", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(3000) ], deployerAddress);
    simnet.callPublicFn("pool-0-reserve", "set-flashloan-fee-protocol", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(3000) ], deployerAddress);

    simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(25) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(25) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(25) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(25) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(25) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-origination-fee-prc", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(25) ], deployerAddress);

    simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, stSTX), Cl.uint(15000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, sBTC), Cl.uint(10000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, diko), Cl.uint(10000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, xUSD), Cl.uint(10000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, USDA), Cl.uint(10000000) ], deployerAddress);
    simnet.callPublicFn("pool-reserve-data", "set-reserve-factor", [ Cl.contractPrincipal(deployerAddress, wstx), Cl.uint(10000000) ], deployerAddress);

    simnet.deployContract("run-1", readFileSync(`contracts/borrow/mocks/upgrade-contract-v1-1.clar`).toString(), null, deployerAddress);
  });
  it("Flashloan executes properly only when fees are paid back to the protocol", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow-v1-1");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const xUSDZToken = new ZToken(simnet, deployerAddress, zxUSD);

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    let callResponse = stSTXToken.mint(400_000_000_000, LP_1, deployerAddress);
    callResponse = sBTCToken.mint(2_000_000_000, Borrower_1, deployerAddress);

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      sBTC,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpstSTXv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.uint(400_000_000_000),
        Cl.standardPrincipal(LP_1),
        Cl.none(),
      ],
      LP_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "supply",
      [
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.standardPrincipal(Borrower_1),
        Cl.none(),
      ],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "flashloan",
      [
        Cl.standardPrincipal(FlashLoaner),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.contractPrincipal(deployerAddress, "flashloan-script"),
      ],
      FlashLoaner
    );
    expect(callResponse.result).toBeErr(Cl.uint(30015));

    // console.log(simnet.getAssetsMap().get(".sBTC.sBTC"));
    // callResponse = simnet.callReadOnlyFn(
    //   "pool-borrow",
    //   "get-reserve-state",
    //   [Cl.contractPrincipal(deployerAddress, sBTC)],
    //   deployerAddress
    // );
    // console.log(Cl.prettyPrint(callResponse.result));
    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "set-reserve",
      [
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.tuple({
          "a-token-address": Cl.contractPrincipal(
            "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
            "lp-sbtc-v1"
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
    expect(callResponse.result).toBeOk(Cl.bool(true));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "flashloan",
      [
        Cl.standardPrincipal(FlashLoaner),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.contractPrincipal(deployerAddress, "flashloan-script"),
      ],
      FlashLoaner
    );
    expect(callResponse.result).toBeErr(Cl.uint(30016));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "flashloan",
      [
        Cl.standardPrincipal(FlashLoaner),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.contractPrincipal(deployerAddress, "flashloan-script-1"),
      ],
      FlashLoaner
    );
    expect(callResponse.result).toBeErr(Cl.uint(1));

    callResponse = simnet.callPublicFn(
      "borrow-helper",
      "flashloan",
      [
        Cl.standardPrincipal(FlashLoaner),
        Cl.contractPrincipal(deployerAddress, lpsBTCv1),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.uint(2_000_000_000),
        Cl.contractPrincipal(deployerAddress, "flashloan-script-2"),
      ],
      FlashLoaner
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
