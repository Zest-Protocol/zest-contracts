import { initSimnet } from "@hirosystems/clarinet-sdk";
import { describe, expect, it, beforeEach } from "vitest";
import { Cl, cvToJSON, cvToString, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { MintableToken } from "./models/token";
import { Oracle } from "./models/oracle";

import * as config from "./tools/config";
import { deployV2Contracts } from "./tools/common";

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
const lpsBTC = "lp-sbtc";
const lpstSTX = "lp-ststx";
const lpUSDA = "lp-usda";
const lpxUSD = "lp-xusd";

const debtToken0 = "debt-token-0";
const pool0Reserve = "pool-0-reserve";
const feesCalculator = "fees-calculator";
const interestRateStrategyDefault = "interest-rate-strategy-default";
const oracle = "oracle";
const diko = "diko";
const sBTC = "sBTC";
const stSTX = "ststx";
const USDA = "usda";
const xUSD = "xusd";

const max_value = BigInt("340282366920938463463374607431768211455");

const ONE = 100_000_000;

describe("Math", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
    simnet.deployContract(
      "math-v2-0",
      readFileSync(config.mathV2_0_path).toString(),
      {
        clarityVersion: 3,
      },
      deployerAddress
    );
  });
  it("Get correct price from assets with different decimals", () => {
    let callResponse = simnet.callReadOnlyFn(
      config.math,
      "mul-to-fixed-precision",
      [Cl.uint(100_000_000), Cl.uint(8), Cl.uint(40_000 * ONE)],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(40_000 * ONE);

    callResponse = simnet.callReadOnlyFn(
      config.math,
      "mul-to-fixed-precision",
      [Cl.uint(50_000_000), Cl.uint(8), Cl.uint(40_000 * ONE)],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(20_000 * ONE);

    callResponse = simnet.callReadOnlyFn(
      config.math,
      "mul-to-fixed-precision",
      [Cl.uint(123), Cl.uint(8), Cl.uint(40_000 * ONE)],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(4920000);

    callResponse = simnet.callReadOnlyFn(
      config.math,
      "mul-to-fixed-precision",
      [Cl.uint(1_234_567), Cl.uint(6), Cl.uint(1 * ONE)],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(123456700);

    callResponse = simnet.callReadOnlyFn(
      config.math,
      "mul-to-fixed-precision",
      [Cl.uint(2_222_333), Cl.uint(6), Cl.uint(ONE / 2)],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(111116650);
  });
  it("Get Y from X", () => {
    let callResponse = simnet.callReadOnlyFn(
      config.math,
      "get-y-from-x",
      [
        Cl.uint(100_000_000),
        Cl.uint(8),
        Cl.uint(6),
        Cl.uint(40000 * ONE),
        Cl.uint(2 * ONE),
      ],
      deployerAddress
    );
    // should get 20000 of x units in y units
    expect(callResponse.result).toBeUint(20_000_000_000);
    callResponse = simnet.callReadOnlyFn(
      config.math,
      "get-y-from-x",
      [
        Cl.uint(123_456_789),
        Cl.uint(8),
        Cl.uint(6),
        Cl.uint(40000 * ONE),
        Cl.uint(2 * ONE),
      ],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(24_691_357_800);
    // console.log(Cl.prettyPrint(callResponse.result));
  });
  it("mul-perc", () => {
    let ZERO_ZERO_5 = ONE / 20;
    let callResponse = simnet.callReadOnlyFn(
      config.math,
      "mul-perc",
      [Cl.uint(20_000_000_000), Cl.uint(6), Cl.uint(ONE + ZERO_ZERO_5)],
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeUint(21_000_000_000);
    callResponse = simnet.callReadOnlyFn(
      config.math,
      "mul-perc",
      [Cl.uint(24_691_357_800), Cl.uint(6), Cl.uint(ONE + ZERO_ZERO_5)],
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    expect(callResponse.result).toBeUint(25_925_925_690);
  });

  it("get-y-from-x", () => {
    let ZERO_ZERO_5 = ONE / 20;
    const collateralBalance = 10572178
    // console.log("Calculating collateral from purchased debt")
    let callResponse = simnet.callReadOnlyFn(
      config.math,
      "get-y-from-x",
      [
        // aeusdc
        Cl.uint(10_000_000_000),
        Cl.uint(6),
        Cl.uint(8),
        Cl.uint(1 * ONE),
        Cl.uint(94587.89 * ONE),
      ],
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    const collateralAmount = cvToValue(callResponse.result);
    // console.log(`Collateral purchased: ${Number(collateralAmount) / 100000000}`);
    callResponse = simnet.callReadOnlyFn(
      config.math,
      "mul-perc",
      [
        // aeusdc
        Cl.uint(collateralAmount),
        Cl.uint(8),
        Cl.uint(1 * ONE + (0.1 * ONE)),
      ],
      deployerAddress
    );
    const collateralAndLiquidationBonus = cvToValue(callResponse.result);
    // console.log(`Collateral and liquidation bonus: ${Number(collateralAndLiquidationBonus) / 100000000}`);
    // console.log(`Bonus Only: ${Number(collateralAndLiquidationBonus - collateralAmount) / 100000000}`);

    // console.log("Calculating debt from collateral balance")
    callResponse = simnet.callReadOnlyFn(
      config.math,
      "div",
      [
        Cl.uint(ONE),
        Cl.uint(ONE + (0.1 * ONE)),
      ],
      deployerAddress
    );
    const mulFactor = cvToValue(callResponse.result);

    callResponse = simnet.callReadOnlyFn(
      config.math,
      "get-y-from-x",
      [
        // aeusdc
        Cl.uint(collateralBalance),
        Cl.uint(8),
        Cl.uint(6),
        Cl.uint(94587.89 * ONE),
        Cl.uint(1 * ONE),
      ],
      deployerAddress
    );
    const step1 = cvToValue(callResponse.result);
    callResponse = simnet.callReadOnlyFn(
      config.math,
      "mul-perc",
      [
        // aeusdc
        Cl.uint(step1),
        Cl.uint(8),
        Cl.uint(mulFactor),
      ],
      deployerAddress
    );
    const debtNeeded = cvToValue(callResponse.result);
    // console.log(`Mul Factor: ${Number(mulFactor) / 100000000}`);
    // console.log(`Debt needed from Balance: ${Number(debtNeeded) / 100000000}`);
    callResponse = simnet.callReadOnlyFn(
      config.math,
      "mul-perc",
      [
        // aeusdc
        Cl.uint(collateralAmount),
        Cl.uint(8),
        Cl.uint(BigInt(ONE) - mulFactor),
      ],
      deployerAddress
    );
    const bonusFromDebt = cvToValue(callResponse.result);
    // console.log(`Bonus from Debt: ${Number(bonusFromDebt) / 100000000}`);
    // console.log(`Collateral and Bonus: ${Number(collateralAmount + bonusFromDebt) / 100000000}`);
  });

  it("calculate-linear-interest", () => {
    let callResponse = simnet.callReadOnlyFn(
      `pool-0-reserve`,
      "calculate-linear-interest",
      [Cl.uint(5000000), Cl.uint(144 * 365)],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(105001084);

    callResponse = simnet.callReadOnlyFn(
      `pool-0-reserve`,
      "calculate-compounded-interest",
      [Cl.uint(5_000_000), Cl.uint(144 * 365)],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(105128249);
    callResponse = simnet.callReadOnlyFn(
      `pool-0-reserve`,
      "calculate-compounded-interest",
      [Cl.uint(100_000_000), Cl.uint(144 * 365)],
      deployerAddress
    );
    expect(callResponse.result).toBeUint(271_864_460);
  });
});

// describe("Math with timestamps", () => {
//   it("calculate-linear-interest", () => {
//     simnet.mineEmptyBlocks(5000);
//     simnet.setEpoch("3.0");
//     let callResponse = simnet.deployContract(
//       "test-user-asset",
//       readFileSync("/Users/fernandofoy/Documents/zest-protocol-repos/zest-contracts/onchain/contracts/borrow/production/mocks/test-wrappers/user-asset.clar").toString(),
//       {
//         clarityVersion: 3,
//       },
//       deployerAddress
//     );
//     // callResponse = simnet.deployContract(
//     //   "pool-0-reserve-v2-0",
//     //   readFileSync(config.mathV2_0).toString(),
//     //   {
//     //     clarityVersion: 3,
//     //   },
//     //   deployerAddress
//     // );
//     // const lastUpdatedBlock = simnet.blockHeight;
//     simnet.mineEmptyBlocks(1);

//     // console.log("Blockheight ", simnet.blockHeight);
//     // console.log("StacksBlock ", simnet.stacksBlockHeight);
//     // console.log("BurnBlockHeight ", simnet.burnBlockHeight);

//     callResponse = simnet.callReadOnlyFn(
//       `test-user-asset`,
//       "calculate-user-global-data",
//       [
//         Cl.uint(10000000),
//         Cl.uint((31536000))
//       ],
//       deployerAddress
//     );
//     console.log(cvToValue(callResponse.result));
//   });
// });

// function calculateLinearInterestEarned(
//   yearlyInterestRate: number,
//   time: number
// ): BigInt {
//   // Calculate interest using simple interest formula: I = P * r * t
//   const interestRate =
//     (BigInt(yearlyInterestRate * 100_000_000) * BigInt(time)) /
//     BigInt(365 * 24 * 60 * 60);

//   // Round to 6 decimal places for more precision with small time units
//   return interestRate;
// }
