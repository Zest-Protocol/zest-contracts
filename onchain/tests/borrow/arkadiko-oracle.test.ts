import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";
import { ZToken } from "./models/zToken";
import { MintableToken } from "./models/token";

import * as config from "./tools/config";
import { initSimnetChecker } from "./tools/SimnetChecker";
import { tx } from "@hirosystems/clarinet-sdk";

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
const FlashLoaner = accounts.get("wallet_6")!;

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
const zStSTX = lpstSTXv1;
const zsBTC = lpsBTCv1;
const zxUSD = "lp-xusd";
const USDA = "usda";
const xUSD = "xusd";

const lpwstx = "lp-wstx";
const wstx = "wstx";

const max_value = BigInt("340282366920938463463374607431768211455");

const wstxDeployerAddress = "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR";
const wstxContractName = "wrapped-stx-token";
const dikoDeployerAddress = "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR";
const dikoContractName = "arkadiko-token";
const usdaDeployerAddress = "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR";
const usdaContractName = "usda-token";

describe("Flashloans", () => {
  beforeEach(() => {});
  it("Get DIKO price, after 3 continuous blocks", () => {
    let callResponse = simnet.callPublicFnCheckOk(
      "arkadiko-oracle",
      "update-price-multi",
      [
        Cl.uint(simnet.blockHeight),
        Cl.uint(5),
        Cl.uint(200_000),
        Cl.uint(1_000_000),
        Cl.list([]),
      ],
      deployerAddress
    );
    simnet.callPublicFnCheckOk(
      "dex",
      "set-pair-details",
      [
        Cl.contractPrincipal(wstxDeployerAddress, wstxContractName),
        Cl.contractPrincipal(dikoDeployerAddress, dikoContractName),
        Cl.uint(250853822317),
        Cl.uint(2624482668551),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      "arkadiko-oracle",
      "update-price-multi",
      [
        Cl.uint(simnet.blockHeight),
        Cl.uint(5),
        Cl.uint(200_001),
        Cl.uint(1_000_000),
        Cl.list([]),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      "arkadiko-oracle",
      "update-price-multi",
      [
        Cl.uint(simnet.blockHeight),
        Cl.uint(5),
        Cl.uint(200_002),
        Cl.uint(1_000_000),
        Cl.list([]),
      ],
      deployerAddress
    );
    callResponse = simnet.callPublicFnCheckOk(
      "arkadiko-oracle",
      "update-price-multi",
      [
        Cl.uint(simnet.blockHeight),
        Cl.uint(5),
        Cl.uint(200_003),
        Cl.uint(1_000_000),
        Cl.list([]),
      ],
      deployerAddress
    );
    simnet.mineBlock([
      tx.callPublicFn(
        "arkadiko-oracle",
        "update-price-multi",
        [
          Cl.uint(simnet.blockHeight),
          Cl.uint(5),
          Cl.uint(190_059),
          Cl.uint(1_000_000),
          Cl.list([]),
        ],
        deployerAddress
      ),
      tx.callPublicFn(
        "arkadiko-oracle",
        "update-price-multi",
        [
          Cl.uint(simnet.blockHeight),
          Cl.uint(1),
          Cl.uint(2_000_000),
          Cl.uint(1_000_000),
          Cl.list([]),
        ],
        deployerAddress
      ),
    ]);
    simnet.mineEmptyBlocks(30);
    callResponse = simnet.callReadOnlyFn(
      `diko-oracle`,
      "get-y-for-x",
      [
        Cl.contractPrincipal(wstxDeployerAddress, wstxContractName),
        Cl.contractPrincipal(dikoDeployerAddress, dikoContractName),
        Cl.uint(1000000),
      ],
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callReadOnlyFn(
      `diko-oracle`,
      "get-diko-dex-price",
      [],
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));

    callResponse = simnet.callReadOnlyFn(
      `diko-oracle`,
      "get-price",
      [],
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));
  });
  it("Enable validate price and oracle price is higher than dex price", () => {
    let callResponses = simnet.mineBlock([
      tx.callPublicFn(
        "diko-oracle",
        "set-validate-oracle-price",
        [Cl.bool(true)],
        deployerAddress
      ),
      tx.callPublicFn(
        "dex",
        "set-pair-details",
        [
          Cl.contractPrincipal(wstxDeployerAddress, wstxContractName),
          Cl.contractPrincipal(dikoDeployerAddress, dikoContractName),
          Cl.uint(250853822317),
          Cl.uint(2624482668551),
        ],
        deployerAddress
      ),
      tx.callPublicFn(
        "arkadiko-oracle",
        "update-price-multi",
        [
          Cl.uint(simnet.blockHeight),
          Cl.uint(5),
          Cl.uint(190_059),
          Cl.uint(1_000_000),
          Cl.list([]),
        ],
        deployerAddress
      ),
      tx.callPublicFn(
        "arkadiko-oracle",
        "update-price-multi",
        [
          Cl.uint(simnet.blockHeight),
          Cl.uint(1),
          Cl.uint(2_000_000),
          Cl.uint(1_000_000),
          Cl.list([]),
        ],
        deployerAddress
      ),
    ]);
    simnet.mineEmptyBlocks(20);
    callResponses = simnet.mineBlock([
      tx.callPublicFn(
        "arkadiko-oracle",
        "update-price-multi",
        [
          Cl.uint(simnet.blockHeight),
          Cl.uint(5),
          Cl.uint(190_059),
          Cl.uint(1_000_000),
          Cl.list([]),
        ],
        deployerAddress
      ),
      tx.callPublicFn(
        "arkadiko-oracle",
        "update-price-multi",
        [
          Cl.uint(simnet.blockHeight),
          Cl.uint(1),
          Cl.uint(2_000_000),
          Cl.uint(1_000_000),
          Cl.list([]),
        ],
        deployerAddress
      ),
    ]);
    callResponses = simnet.mineBlock([
      tx.callPublicFn(
        "arkadiko-oracle",
        "update-price-multi",
        [
          Cl.uint(simnet.blockHeight),
          Cl.uint(5),
          Cl.uint(390_059),
          Cl.uint(1_000_000),
          Cl.list([]),
        ],
        deployerAddress
      ),
      tx.callPublicFn(
        "arkadiko-oracle",
        "update-price-multi",
        [
          Cl.uint(simnet.blockHeight),
          Cl.uint(1),
          Cl.uint(2_000_000),
          Cl.uint(1_000_000),
          Cl.list([]),
        ],
        deployerAddress
      ),
    ]);
    simnet.mineEmptyBlocks(10);
    let callResponse = simnet.callPublicFn(
      `diko-oracle`,
      "get-asset-price",
      [Cl.contractPrincipal(deployerAddress, diko)],
      deployerAddress
    );
    expect(callResponse.result).toBeErr(Cl.uint(3003));
  });
  it("Oracle manip", () => {
    let callResponses = simnet.mineBlock([
      tx.callPublicFn(
        "dex",
        "set-pair-details",
        [
          Cl.contractPrincipal(wstxDeployerAddress, wstxContractName),
          Cl.contractPrincipal(dikoDeployerAddress, dikoContractName),
          Cl.uint(247855425984),
          Cl.uint(2706311382217),
        ],
        deployerAddress
      ),
      tx.callPublicFn(
        "dex",
        "set-pair-details",
        [
          Cl.contractPrincipal(dikoDeployerAddress, dikoContractName),
          Cl.contractPrincipal(usdaDeployerAddress, usdaContractName),
          Cl.uint(2153295399808),
          Cl.uint(418693767827),
        ],
        deployerAddress
      ),
      tx.callPublicFn(
        "arkadiko-oracle",
        "update-price-multi",
        [
          Cl.uint(simnet.blockHeight),
          Cl.uint(1),
          Cl.uint(2_000_000),
          Cl.uint(1_000_000),
          Cl.list([]),
        ],
        deployerAddress
      ),
    ]);
    let callResponse = simnet.callReadOnlyFn(
      `diko-oracle`,
      "get-diko-dex-price",
      [],
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    callResponse = simnet.callPublicFn(
      `dex`,
      "swap-x-for-y",
      [
        Cl.contractPrincipal(wstxDeployerAddress, wstxContractName),
        Cl.contractPrincipal(dikoDeployerAddress, dikoContractName),
        Cl.uint(100_000_000_000),
      ],
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));
    callResponse = simnet.callReadOnlyFn(
      `diko-oracle`,
      "get-diko-dex-price",
      [],
      deployerAddress
    );
    // console.log(Cl.prettyPrint(callResponse.result));
  });
});
