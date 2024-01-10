import { initSimnet } from "@hirosystems/clarinet-sdk";
import { describe, expect, it, beforeEach } from "vitest";
import { Cl, cvToJSON, cvToString, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { MintableToken } from "./models/token";
import { Oracle } from "./models/oracle";

const simnet = await initSimnet();

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
const lpsBTC = "lp-sBTC";
const lpstSTX = "lp-stSTX";
const lpUSDA = "lp-USDA";
const lpxUSD = "lp-xUSD";

const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const oracle = "oracle";
const diko = "diko";
const sBTC = "sBTC";
const stSTX = "stSTX";
const USDA = "USDA";
const xUSD = "xUSD";

describe("Isolated mode", () => {
  beforeEach(() => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = poolBorrow.init(
      deployerAddress,
      lpstSTX,
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

    callResponse = poolBorrow.init(
      deployerAddress,
      lpsBTC,
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

    callResponse = poolBorrow.init(
      deployerAddress,
      lpxUSD,
      deployerAddress,
      xUSD,
      6,
      BigInt("340282366920938463463374607431768211455"),
      BigInt("340282366920938463463374607431768211455"),
      deployerAddress,
      oracle,
      deployerAddress,
      interestRateStrategyDefault,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      sBTC,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      stSTX,
      true,
      deployerAddress
    );

    callResponse = poolBorrow.setBorrowingEnabled(
      deployerAddress,
      xUSD,
      true,
      deployerAddress
    );
  });

  it("Supply and borrow supplying only isolated asset", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = stSTXToken.mint(
      1_000_000_000_000_000,
      Borrower_1,
      deployerAddress
    );
    xUSDToken.mint(1_000_000_000_000_000, LP_1, deployerAddress);

    oracleContract.setPrice(
      deployerAddress,
      xUSD,
      100_000_000,
      deployerAddress
    );
    oracleContract.setPrice(
      deployerAddress,
      stSTX,
      160_000_000,
      deployerAddress
    );

    callResponse = poolBorrow.addIsolatedAsset(
      deployerAddress,
      stSTX,
      deployerAddress
    );

    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      xUSD,
      1_000_000_000_000,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpxUSD,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      xUSD,
      100_000_000_000,
      true,
      LP_1,
      LP_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      1_000_000_000,
      true,
      Borrower_1,
      Borrower_1
    );

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "borrow",
      [
        // Cl.contractPrincipal(deployerAddress, debtToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(200_000_000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeOk(Cl.uint(200_000_000));
  });

  it("Supply and borrow supplying only isolated asset.", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracle = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = stSTXToken.mint(
      1_000_000_000_000_000,
      Borrower_1,
      deployerAddress
    );
    sBTCToken.mint(1_000_000_000_000_000, Borrower_1, deployerAddress);
    xUSDToken.mint(1_000_000_000_000_000, LP_1, deployerAddress);

    oracle.setPrice(deployerAddress, xUSD, 100_000_000, deployerAddress);
    oracle.setPrice(deployerAddress, stSTX, 160_000_000, deployerAddress);

    callResponse = poolBorrow.addIsolatedAsset(
      deployerAddress,
      stSTX,
      deployerAddress
    );

    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      xUSD,
      1_000_000_000_000,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      80000000,
      90000000,
      50000000,
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
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpxUSD,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      xUSD,
      100_000_000_000,
      true,
      LP_1,
      LP_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      1_000_000_000,
      true,
      Borrower_1,
      Borrower_1
    );

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "calculate-available-borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );

    const availableBorrow = Number(cvToValue(callResponse.result)["value"]);

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "borrow",
      [
        // Cl.contractPrincipal(deployerAddress, debtToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(availableBorrow),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    // console.log(callResponse.events);
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeOk(Cl.uint(availableBorrow));

    // callResponse = simnet.callPublicFn(
    //   "pool-0-reserve",
    //   "calculate-user-global-data",
    //   [
    //     Cl.standardPrincipal(Borrower_1),
    //     Cl.list([
    //       Cl.tuple({
    //         asset: Cl.contractPrincipal(deployerAddress, stSTX),
    //         "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
    //         oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
    //       }),
    //       Cl.tuple({
    //         asset: Cl.contractPrincipal(deployerAddress, xUSD),
    //         "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
    //         oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
    //       }),
    //     ]),
    //   ],
    //   Borrower_1
    // );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "calculate-available-borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );

    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!));
    // console.log(Cl.prettyPrint(callResponse.result));
  });
  it(`Supply and borrow supplying only isolated asset. \
  Supply non-isolated asset when enabled as collateral, \
  while isolate asset is allowed as collateral, fails. \
  Does not count as collateral`, () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    const oracle = new Oracle(simnet, deployerAddress, "oracle");

    let callResponse = stSTXToken.mint(
      1_000_000_000_000_000,
      Borrower_1,
      deployerAddress
    );
    sBTCToken.mint(1_000_000_000_000_000, Borrower_1, deployerAddress);
    xUSDToken.mint(1_000_000_000_000_000, LP_1, deployerAddress);

    oracle.setPrice(deployerAddress, xUSD, 100_000_000, deployerAddress);
    oracle.setPrice(deployerAddress, stSTX, 160_000_000, deployerAddress);

    callResponse = poolBorrow.addIsolatedAsset(
      deployerAddress,
      stSTX,
      deployerAddress
    );

    callResponse = poolBorrow.setBorroweableIsolated(
      deployerAddress,
      xUSD,
      1_000_000_000_000,
      deployerAddress
    );

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      stSTX,
      true,
      80000000,
      90000000,
      50000000,
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
    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      90000000,
      50000000,
      deployerAddress
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpxUSD,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      xUSD,
      100_000_000_000,
      true,
      LP_1,
      LP_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      1_000_000_000,
      true,
      Borrower_1,
      Borrower_1
    );

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      "pool-read",
      "calculate-available-borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );

    const availableBorrow = Number(cvToValue(callResponse.result)["value"]);

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "borrow",
      [
        // Cl.contractPrincipal(deployerAddress, debtToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(availableBorrow),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );

    console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeOk(Cl.uint(availableBorrow));

    callResponse = simnet.callPublicFn(
      "pool-read",
      "calculate-available-borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );

    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      1_000_000_000,
      true,
      Borrower_1,
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(6578));
    // console.log(Cl.prettyPrint(callResponse.result));
  });
});
