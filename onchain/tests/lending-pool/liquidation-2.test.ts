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
const oracle = "oracle";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const diko = "diko";
const sBTC = "sBTC";
const stSTX = "stSTX";
const zStSTX = "lp-stSTX";
const zsBTC = "lp-sBTC";
const zxUSD = "lp-xUSD";
const USDA = "USDA";
const xUSD = "xUSD";

const max_value = BigInt("340282366920938463463374607431768211455");

describe("Supply and redeem", () => {
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

    poolBorrow.init(
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

    poolBorrow.init(
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
  });
  it("Supply and immediately redeem without returns", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
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

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      400_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpsBTC,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      sBTC,
      2_000_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
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
      BigInt(
        cvToJSON(callResponse.result)["value"]["value"]["health-factor"][
          "value"
        ]
      )
    ).toBe(max_value);

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    const maxBorrowAmount =
      Number(cvToValue(callResponse.result)["value"]) * 1.000006;

    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      stSTX,
      deployerAddress,
      lpstSTX,
      Math.floor(maxBorrowAmount),
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );

    expect(callResponse.result).toBeOk(Cl.uint(maxBorrowAmount));

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    let hfBefore = Number(
      cvToJSON(callResponse.result)["value"]["value"]["health-factor"]["value"]
    );

    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      2000000000000,
      deployerAddress
    );

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    let hfAfter = Number(
      cvToJSON(callResponse.result)["value"]["value"]["health-factor"]["value"]
    );
    expect(Math.ceil(hfBefore / 2)).toBeLessThanOrEqual(hfAfter + 100);

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );

    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "validate-assets",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );

    // console.log(Cl.prettyPrint(callResponse.result));

    // console.log("Before liquidation");
    // console.log("assets sBTC");
    // console.log(simnet.getAssetsMap().get(".sBTC.sBTC"));
    // console.log("assets stSTX");
    // console.log(simnet.getAssetsMap().get(".stSTX.stSTX"));

    callResponse = stSTXToken.mint(
      BigInt("10000000000000000"),
      Liquidator_1,
      deployerAddress
    );

    let prevVaultBalance = simnet
      .getAssetsMap()
      .get(".stSTX.stSTX")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTC),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    // { inside: { bonus: u95000000, collateral-amount: u1832418485, collateral-decimals: u8, collateral-price: u2000000000000, debt-currency-price: u200000000, debt-decimals: u6, debt-to-liquidate: u798004788, user-collateral-balance: u1832418485 } }
    // { inside: { bonus: u95000000, collateral-amount: u2000000000, collateral-decimals: u8, collateral-price: u2000000000000, debt-currency-price: u200000000, debt-decimals: u6, user-collateral-balance: u2000000000 } }
    // 2 000 000 000
    // 319 201 915 200
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[2].data.value!));

    // console.log(Cl.prettyPrint(callResponse.events[4].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[6].data.value!));
    // console.log(callResponse.events);
    expect(callResponse.result).toBeOk(Cl.uint(0));

    // console.log(callResponse.events);
    // console.log("after liquidation");
    // console.log("assets sBTC");
    // close to -> (((2 * (319201915200 * 0.5)) / 20_000) * 1.05);
    expect(simnet.getAssetsMap().get(".sBTC.sBTC")?.get(Liquidator_1)).toBe(
      1675816423n
    );
    // console.log(simnet.getAssetsMap());
    // console.log("LIQUIDATOR: ", Liquidator_1);

    // console.log(simnet.getAssetsMap().get(".sBTC.sBTC"));
    // console.log("assets stSTX");
    // console.log(simnet.getAssetsMap().get(".stSTX.stSTX"));
    let currVaultBalance = simnet
      .getAssetsMap()
      .get(".stSTX.stSTX")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
    expect(
      simnet
        .getAssetsMap()
        .get(".sBTC.sBTC")
        ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.protocol-treasury")!
    ).toBe(8379050n);
    expect(currVaultBalance - prevVaultBalance).toBe(159601564083n);

    console.log("Max Borrow amount: ", maxBorrowAmount);
    let prevLiquidatorCollateralBalance = simnet
      .getAssetsMap()
      .get(".sBTC.sBTC")
      ?.get(Liquidator_1)!;
    prevVaultBalance = simnet
      .getAssetsMap()
      .get(".sBTC.sBTC")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;

    console.log(simnet.getAssetsMap().get(".lp-sBTC.lp-sBTC")!);
    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, sBTC),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpsBTC),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTC),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    currVaultBalance = simnet
      .getAssetsMap()
      .get(".sBTC.sBTC")
      ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!;
    let currLiquidatorCollateralBalance = simnet
      .getAssetsMap()
      .get(".sBTC.sBTC")
      ?.get(Liquidator_1)!;
    expect(
      currLiquidatorCollateralBalance - prevLiquidatorCollateralBalance
    ).toBe(prevVaultBalance - currVaultBalance);
    // console.log(Cl.prettyPrint(callResponse.events[0].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[1].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[2].data.value!));
    // console.log(Cl.prettyPrint(callResponse.events[3].data.value!));
    // console.log(Cl.prettyPrint(callResponse.result));
    // console.log(callResponse.events);
    expect(
      simnet
        .getAssetsMap()
        .get(".sBTC.sBTC")
        ?.get("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.pool-vault")!
    ).toBe(0n);

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.pool-0-reserve`,
      "get-assets-used-by",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    expect(callResponse.result).toBeList([
      Cl.contractPrincipal(deployerAddress, stSTX),
    ]);

    expect(
      simnet.getAssetsMap().get(".lp-sBTC.lp-sBTC")!?.get(Borrower_1)!
    ).toBe(0n);
  });
  it("Supply multiple assets unused as collateral, price falls. Can withdraw other assets. Collateral can be liquidated, ", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const xUSDZToken = new ZToken(simnet, deployerAddress, zxUSD);

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    let callResponse = stSTXToken.mint(400_000_000_000, LP_1, deployerAddress);
    callResponse = sBTCToken.mint(2_000_000_000, Borrower_1, deployerAddress);
    callResponse = xUSDToken.mint(2_000_000_000, Borrower_1, deployerAddress);
    callResponse = stSTXToken.mint(
      BigInt("10000000000000000"),
      Liquidator_1,
      deployerAddress
    );

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

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      60000000,
      70000000,
      5000000,
      deployerAddress
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      400_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpsBTC,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      sBTC,
      2_000_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpxUSD,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      xUSD,
      2_000_000_000,
      Borrower_1,
      Borrower_1
    );
    poolBorrow.setUserUseReserveAsCollateral(
      Borrower_1,
      deployerAddress,
      lpxUSD,
      deployerAddress,
      xUSD,
      false,
      deployerAddress,
      oracle,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
        {
          asset: { deployerAddress, contractName: xUSD },
          "lp-token": { deployerAddress, contractName: zxUSD },
          oracle: { deployerAddress, contractName: oracle },
        },
      ]
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
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
    expect(
      BigInt(
        cvToJSON(callResponse.result)["value"]["value"]["health-factor"][
          "value"
        ]
      )
    ).toBe(max_value);

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
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
    const maxBorrowAmount =
      Number(cvToValue(callResponse.result)["value"]) * 1.000006;

    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      stSTX,
      deployerAddress,
      lpstSTX,
      Math.floor(maxBorrowAmount),
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
        {
          asset: { deployerAddress, contractName: xUSD },
          "lp-token": { deployerAddress, contractName: zxUSD },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(maxBorrowAmount));

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    let hfBefore = Number(
      cvToJSON(callResponse.result)["value"]["value"]["health-factor"]["value"]
    );

    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      2000000000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "liquidation-call",
      [
        Cl.list([
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTC),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(0));

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "liquidation-call",
      [
        Cl.list([
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTC),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );

    expect(callResponse.result).toBeOk(Cl.uint(0));

    // try to liquidate more stSTX after all sBTC collateral has been used
    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTC),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );

    expect(callResponse.result).toBeErr(Cl.uint(90001));

    // try to liquidate xUSD that is unused as collateral
    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "liquidation-call",
      [
        Cl.list([
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, xUSD),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpxUSD),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpxUSD),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(7));

    callResponse = stSTXZToken.redeem(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      xUSD,
      deployerAddress,
      oracle,
      max_value,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: xUSD },
          "lp-token": { deployerAddress, contractName: zxUSD },
          oracle: { deployerAddress, contractName: oracle },
        },
        {
          asset: { deployerAddress, contractName: stSTX },
          "lp-token": { deployerAddress, contractName: zStSTX },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      LP_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(14401));

    callResponse = simnet.callReadOnlyFn(
      `${deployerAddress}.lp-xUSD`,
      "get-principal-balance",
      [Cl.standardPrincipal(Borrower_1)],
      Borrower_1
    );
    console.log(Cl.prettyPrint(callResponse.result));

    callResponse = xUSDZToken.redeem(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      xUSD,
      deployerAddress,
      oracle,
      max_value,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: xUSD },
          "lp-token": { deployerAddress, contractName: zxUSD },
          oracle: { deployerAddress, contractName: oracle },
        },
        {
          asset: { deployerAddress, contractName: stSTX },
          "lp-token": { deployerAddress, contractName: zStSTX },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(2_000_000_000));

    expect(
      simnet.getAssetsMap().get(".lp-xUSD.lp-xUSD")?.get(Borrower_1)!
    ).toBe(0n);

    expect(simnet.getAssetsMap().get(".xUSD.xUSD")?.get(Borrower_1)!).toBe(
      2_000_000_000n
    );
  });
  it("Supply multiple assets unused as collateral, price falls. Can enable use as collateral and cannot be liquidated", () => {
    const poolReserve0 = new PoolReserve(
      simnet,
      deployerAddress,
      "pool-0-reserve"
    );
    const poolBorrow = new PoolBorrow(simnet, deployerAddress, "pool-borrow");
    const oracleContract = new Oracle(simnet, deployerAddress, "oracle");

    const stSTXZToken = new ZToken(simnet, deployerAddress, zStSTX);
    const sBTCZToken = new ZToken(simnet, deployerAddress, zsBTC);
    const xUSDZToken = new ZToken(simnet, deployerAddress, zxUSD);

    const stSTXToken = new MintableToken(simnet, deployerAddress, stSTX);
    const sBTCToken = new MintableToken(simnet, deployerAddress, sBTC);
    const xUSDToken = new MintableToken(simnet, deployerAddress, xUSD);

    let callResponse = stSTXToken.mint(400_000_000_000, LP_1, deployerAddress);
    callResponse = sBTCToken.mint(2_000_000_000, Borrower_1, deployerAddress);
    callResponse = xUSDToken.mint(400_000_000_000, Borrower_1, deployerAddress);
    callResponse = stSTXToken.mint(
      BigInt("10000000000000000"),
      Liquidator_1,
      deployerAddress
    );

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

    callResponse = poolBorrow.setUsageAsCollateralEnabled(
      deployerAddress,
      xUSD,
      true,
      80000000,
      90000000,
      5000000,
      deployerAddress
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpstSTX,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      stSTX,
      400_000_000_000,
      LP_1,
      LP_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpsBTC,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      sBTC,
      2_000_000_000,
      Borrower_1,
      Borrower_1
    );

    callResponse = poolBorrow.supply(
      deployerAddress,
      lpxUSD,
      deployerAddress,
      pool0Reserve,
      deployerAddress,
      xUSD,
      400_000_000_000,
      Borrower_1,
      Borrower_1
    );
    poolBorrow.setUserUseReserveAsCollateral(
      Borrower_1,
      deployerAddress,
      lpxUSD,
      deployerAddress,
      xUSD,
      false,
      deployerAddress,
      oracle,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
        {
          asset: { deployerAddress, contractName: xUSD },
          "lp-token": { deployerAddress, contractName: zxUSD },
          oracle: { deployerAddress, contractName: oracle },
        },
      ]
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
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
    expect(
      BigInt(
        cvToJSON(callResponse.result)["value"]["value"]["health-factor"][
          "value"
        ]
      )
    ).toBe(max_value);

    callResponse = simnet.callPublicFn(
      "pool-read",
      "borrowing-power-in-asset",
      [
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
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
    const maxBorrowAmount =
      Number(cvToValue(callResponse.result)["value"]) * 1.000006;

    callResponse = poolBorrow.borrow(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      oracle,
      deployerAddress,
      stSTX,
      deployerAddress,
      lpstSTX,
      Math.floor(maxBorrowAmount),
      deployerAddress,
      "fees-calculator",
      0,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
        {
          asset: { deployerAddress, contractName: xUSD },
          "lp-token": { deployerAddress, contractName: zxUSD },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeOk(Cl.uint(maxBorrowAmount));

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    let hfBefore = Number(
      cvToJSON(callResponse.result)["value"]["value"]["health-factor"]["value"]
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log("User data before price fall");
    let collateralValueBeforePriceFall = cvToJSON(callResponse.result)["value"][
      "value"
    ]["total-collateral-balanceUSD"]["value"];

    oracleContract.setPrice(
      deployerAddress,
      sBTC,
      2000000000000,
      deployerAddress
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log("User data after price fall");
    expect(
      cvToJSON(callResponse.result)["value"]["value"][
        "is-health-factor-below-treshold"
      ]["value"]
    ).toBeTruthy();

    poolBorrow.setUserUseReserveAsCollateral(
      Borrower_1,
      deployerAddress,
      lpxUSD,
      deployerAddress,
      xUSD,
      true,
      deployerAddress,
      oracle,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
        {
          asset: { deployerAddress, contractName: xUSD },
          "lp-token": { deployerAddress, contractName: zxUSD },
          oracle: { deployerAddress, contractName: oracle },
        },
      ]
    );

    callResponse = simnet.callPublicFn(
      `${deployerAddress}.pool-0-reserve`,
      "calculate-user-global-data",
      [
        Cl.standardPrincipal(Borrower_1),
        Cl.list([
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
      ],
      Borrower_1
    );
    // console.log("User data after enabling use as collateral");
    let collateralxUSDEnabled = cvToJSON(callResponse.result)["value"]["value"][
      "total-collateral-balanceUSD"
    ]["value"];

    expect(collateralValueBeforePriceFall).toBe(collateralxUSDEnabled);

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "liquidation-call",
      [
        Cl.list([
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpsBTC),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(90000));

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "liquidation-call",
      [
        Cl.list([
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpxUSD),
        Cl.contractPrincipal(deployerAddress, xUSD),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(90000));

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "liquidation-call",
      [
        Cl.list([
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpxUSD),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(30009));

    callResponse = simnet.callPublicFn(
      "pool-borrow",
      "liquidation-call",
      [
        Cl.list([
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
          Cl.tuple({
            asset: Cl.contractPrincipal(deployerAddress, stSTX),
            "lp-token": Cl.contractPrincipal(deployerAddress, lpstSTX),
            oracle: Cl.contractPrincipal(deployerAddress, "oracle"),
          }),
        ]),
        Cl.contractPrincipal(deployerAddress, lpstSTX),
        Cl.contractPrincipal(deployerAddress, stSTX),
        Cl.contractPrincipal(deployerAddress, sBTC),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.contractPrincipal(deployerAddress, "oracle"),
        Cl.standardPrincipal(Borrower_1),
        Cl.uint(maxBorrowAmount),
        Cl.bool(false),
      ],
      Liquidator_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(90001));
    // expect(callResponse.result).toBeOk(Cl.uint(0));

    callResponse = xUSDZToken.redeem(
      deployerAddress,
      "pool-0-reserve",
      deployerAddress,
      xUSD,
      deployerAddress,
      oracle,
      max_value,
      Borrower_1,
      [
        {
          asset: { deployerAddress, contractName: sBTC },
          "lp-token": { deployerAddress, contractName: zsBTC },
          oracle: { deployerAddress, contractName: oracle },
        },
        {
          asset: { deployerAddress, contractName: xUSD },
          "lp-token": { deployerAddress, contractName: zxUSD },
          oracle: { deployerAddress, contractName: oracle },
        },
        {
          asset: { deployerAddress, contractName: stSTX },
          "lp-token": { deployerAddress, contractName: zStSTX },
          oracle: { deployerAddress, contractName: oracle },
        },
      ],
      Borrower_1
    );
    expect(callResponse.result).toBeErr(Cl.uint(14402));
  });
});
