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

const max_value = BigInt("340282366920938463463374607431768211455");

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
      max_value,
      max_value,
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
      max_value,
      max_value,
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
      max_value,
      max_value,
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
      Borrower_1,
      Borrower_1
    );

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "borrow",
      [
        // Cl.contractPrincipal(deployerAddress, debtToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, lpxUSD),
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
    oracle.setPrice(deployerAddress, sBTC, 4_000_000_000_000, deployerAddress);

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
      Borrower_1,
      Borrower_1
    );

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);

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
        Cl.contractPrincipal(deployerAddress, lpxUSD),
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

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
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
  Remove some isolated collateral, cannot because not enough collateral`, () => {
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
    oracle.setPrice(deployerAddress, sBTC, 4_000_000_000_000, deployerAddress);

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
      LP_1,
      LP_1
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      900_000_000,
      Borrower_1,
      Borrower_1
    );
    console.log(Cl.prettyPrint(callResponse.result));

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);

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
    console.log(Cl.prettyPrint(callResponse.result));

    const availableBorrow = Number(cvToValue(callResponse.result)["value"]);

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "borrow",
      [
        // Cl.contractPrincipal(deployerAddress, debtToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, lpxUSD),
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
    console.log(Cl.prettyPrint(callResponse.result));

    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
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
    console.log(Cl.prettyPrint(callResponse.result));
    let beforeNonIsolatedSupply = cvToJSON(callResponse.result).value.value;

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpsBTC,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      sBTC,
      1_000_000_000,
      Borrower_1,
      Borrower_1
    );
    console.log(Cl.prettyPrint(callResponse.result));
    // console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeOk(Cl.bool(true));

    borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
      Cl.contractPrincipal(deployerAddress, sBTC),
      Cl.contractPrincipal(deployerAddress, xUSD),
    ]);

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
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
    console.log(Cl.prettyPrint(callResponse.result));

    let afterNonIsolatedSupply = cvToJSON(callResponse.result).value.value;
    expect(beforeNonIsolatedSupply["health-factor"].value).toBe("112500657");
    expect(afterNonIsolatedSupply["health-factor"].value).toBe("112500611");
    console.log(Cl.prettyPrint(callResponse.result));
  });
  it(`Supply and borrow supplying only isolated asset. \
  Supply non-isolated asset when enabled as collateral, \
  while isolate asset is allowed as collateral, non-isolated assets. \
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
    oracle.setPrice(deployerAddress, sBTC, 4_000_000_000_000, deployerAddress);

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
      900_000_000,
      Borrower_1,
      Borrower_1
    );

    let borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);

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

    let availableBorrow = Number(cvToValue(callResponse.result)["value"]);

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "borrow",
      [
        // Cl.contractPrincipal(deployerAddress, debtToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, lpxUSD),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(Math.floor(availableBorrow / 2)),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );

    availableBorrow = Number(cvToValue(callResponse.result)["value"]);
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
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
    // console.log(Cl.prettyPrint(callResponse.result));

    let beforeNonIsolatedSupply = cvToJSON(callResponse.result).value.value;

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "get-decrease-balance-allowed",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
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
    console.log(Cl.prettyPrint(callResponse.result));
    let allowedWithdrawalAmount = Number(
      cvToJSON(callResponse.result)["value"]["value"]["amount-to-decrease"][
        "value"
      ]
    );
    let factor = 1.028;
    console.log("increased: ", Math.floor(allowedWithdrawalAmount * factor));
    console.log(
      "difference: ",
      Math.floor(allowedWithdrawalAmount * factor) - allowedWithdrawalAmount
    );

    callResponse = simnet.callPublicFn(
      "lp-stSTX",
      "redeem",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.uint(Math.floor(allowedWithdrawalAmount * factor)),
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

    expect(callResponse.result).toBeOk(Cl.uint(499609885));

    borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    // console.log("After withdrawing part of the stSTX");
    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
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

    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
      Cl.contractPrincipal(deployerAddress, xUSD),
    ]);

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpsBTC,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      sBTC,
      1_000_000_000_000_000,
      Borrower_1,
      Borrower_1
    );
    // console.log(Cl.prettyPrint(callResponse.result));

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
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
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
    // console.log(callResponse.events);
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.result));

    availableBorrow = Number(cvToValue(callResponse.result)["value"]);
    expect(callResponse.result).toBeOk(Cl.uint(0));

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "borrow",
      [
        // Cl.contractPrincipal(deployerAddress, debtToken0),
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, lpxUSD),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.uint(10000000),
        Cl.contractPrincipal(deployerAddress, feesCalculator),
        Cl.uint(0),
        Cl.standardPrincipal(Borrower_1),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30003));

    // cannot enable or disable sBTC as collateral
    callResponse = poolBorrow.setUserUseReserveAsCollateral(
      Borrower_1,
      deployerAddress,
      lpsBTC,
      deployerAddress,
      sBTC,
      true,
      deployerAddress,
      "oracle",
      [
        {
          asset: { deployerAddress, contractName: stSTX },
          "lp-token": { deployerAddress, contractName: lpstSTX },
          oracle: { deployerAddress, contractName: "oracle" },
        },
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: lpsBTC },
          oracle: { deployerAddress, contractName: "oracle" },
        },
        {
          asset: { deployerAddress, contractName: xUSD },
          "lp-token": { deployerAddress, contractName: lpxUSD },
          oracle: { deployerAddress, contractName: "oracle" },
        },
      ]
    );

    expect(callResponse.result).toBeErr(Cl.uint(9456));
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = poolBorrow.setUserUseReserveAsCollateral(
      Borrower_1,
      deployerAddress,
      lpsBTC,
      deployerAddress,
      sBTC,
      true,
      deployerAddress,
      "oracle",
      [
        {
          asset: { deployerAddress, contractName: stSTX },
          "lp-token": { deployerAddress, contractName: lpstSTX },
          oracle: { deployerAddress, contractName: "oracle" },
        },
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: lpsBTC },
          oracle: { deployerAddress, contractName: "oracle" },
        },
        {
          asset: { deployerAddress, contractName: xUSD },
          "lp-token": { deployerAddress, contractName: lpxUSD },
          oracle: { deployerAddress, contractName: "oracle" },
        },
      ]
    );

    expect(callResponse.result).toBeErr(Cl.uint(9456));
    // console.log(Cl.prettyPrint(callResponse.result));

    // console.log("After withdrawing half and then borrowing xUSD again");
    xUSDToken.mint(1_000_000_000, Borrower_1, deployerAddress);

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
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
    // console.log(Cl.prettyPrint(callResponse.events[2].data.value!));
    // console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeOk(
      Cl.tuple({
        "current-liquidation-threshold": Cl.uint(90000000),
        "current-ltv": Cl.uint(80000000),
        "health-factor": Cl.uint(100097918),
        "is-health-factor-below-treshold": Cl.bool(false),
        "total-borrow-balanceUSD": Cl.uint(57456136200),
        "total-collateral-balanceUSD": Cl.uint(64062418400),
        "total-liquidity-balanceUSD": Cl.uint(64062418400),
        "user-total-feesUSD": Cl.uint(143640000),
      })
    );

    callResponse = poolBorrow.repay(
      deployerAddress,
      xUSD,
      max_value,
      Borrower_1,
      Borrower_1
    );

    expect(callResponse.result).toBeOk(Cl.uint(575997871));

    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(
      Cl.tuple({
        "current-liquidation-threshold": Cl.uint(90000000),
        "current-ltv": Cl.uint(80000000),
        "health-factor": Cl.uint(
          BigInt("340282366920938463463374607431768211455")
        ),
        "is-health-factor-below-treshold": Cl.bool(false),
        "total-borrow-balanceUSD": Cl.uint(0),
        "total-collateral-balanceUSD": Cl.uint(64062418400),
        "total-liquidity-balanceUSD": Cl.uint(64062418400),
        "user-total-feesUSD": Cl.uint(0),
      })
    );
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!));

    borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(borrower_data.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
      Cl.contractPrincipal(deployerAddress, sBTC),
    ]);

    callResponse = poolBorrow.setUserUseReserveAsCollateral(
      Borrower_1,
      deployerAddress,
      lpsBTC,
      deployerAddress,
      sBTC,
      true,
      deployerAddress,
      "oracle",
      [
        {
          asset: { deployerAddress, contractName: stSTX },
          "lp-token": { deployerAddress, contractName: lpstSTX },
          oracle: { deployerAddress, contractName: "oracle" },
        },
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: lpsBTC },
          oracle: { deployerAddress, contractName: "oracle" },
        },
      ]
    );

    expect(callResponse.result).toBeErr(Cl.uint(9457));

    callResponse = poolBorrow.setUserUseReserveAsCollateral(
      Borrower_1,
      deployerAddress,
      lpstSTX,
      deployerAddress,
      stSTX,
      false,
      deployerAddress,
      "oracle",
      [
        {
          asset: { deployerAddress, contractName: stSTX },
          "lp-token": { deployerAddress, contractName: lpstSTX },
          oracle: { deployerAddress, contractName: "oracle" },
        },
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: lpsBTC },
          oracle: { deployerAddress, contractName: "oracle" },
        },
      ]
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // console.log("After stSTX collateral has been disabled");
    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      Number(
        cvToValue(callResponse.result)["value"]["total-collateral-balanceUSD"][
          "value"
        ]
      )
    ).toBe(0);

    callResponse = poolBorrow.setUserUseReserveAsCollateral(
      Borrower_1,
      deployerAddress,
      lpsBTC,
      deployerAddress,
      sBTC,
      true,
      deployerAddress,
      "oracle",
      [
        {
          asset: { deployerAddress, contractName: stSTX },
          "lp-token": { deployerAddress, contractName: lpstSTX },
          oracle: { deployerAddress, contractName: "oracle" },
        },
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: lpsBTC },
          oracle: { deployerAddress, contractName: "oracle" },
        },
      ]
    );
    expect(callResponse.result).toBeOk(Cl.bool(true));

    // console.log("After repayment and sBTC enabled as collateral");
    callResponse = simnet.callPublicFn(
      "pool-0-reserve",
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    expect(
      Number(
        cvToValue(callResponse.result)["value"]["total-collateral-balanceUSD"][
          "value"
        ]
      )
    ).toBe(40000000000000000000);
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    borrower_data = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      "lp-stSTX",
      "redeem",
      [
        Cl.contractPrincipal(deployerAddress, pool0Reserve),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        // Cl.uint(max_value),
        Cl.uint(400390115),
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

    console.log(Cl.prettyPrint(callResponse.result));

    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[2].data.value!));
    console.log(callResponse.events);
    console.log(simnet.getAssetsMap());

    expect(simnet.getAssetsMap().get(".stSTX.stSTX")?.get(Borrower_1)).toBe(
      BigInt(1_000_000_000_000_000)
    );
  });
});
