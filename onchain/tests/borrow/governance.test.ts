import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";
import { PoolReserve } from "./models/poolReserve";
import { PoolBorrow } from "./models/poolBorrow";
import { Oracle } from "./models/oracle";

import * as config from "./tools/config";
import { initSimnetChecker } from "./tools/SimnetChecker";
import { deployPythContracts, deployV2_1Contracts, deployV2Contracts, deployV2TokenContracts, initializeRewards } from "./tools/common";
import { incentivesDummy } from "./tools/config";

const simnet = await initSimnetChecker();

const accounts = simnet.getAccounts();
const deployerAddress = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_3 = accounts.get("wallet_3")!;
const wallet_4 = accounts.get("wallet_4")!;
const wallet_5 = accounts.get("wallet_5")!;
const wallet_6 = accounts.get("wallet_6")!;

const contractInterfaces = simnet.getContractsInterfaces();


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

describe("Execute bootstrap proposal", () => {
	beforeEach(() => {
		simnet.setEpoch("3.0");
		deployV2Contracts(simnet, deployerAddress);
		deployV2TokenContracts(simnet, deployerAddress);
		deployPythContracts(simnet, deployerAddress);
		deployV2_1Contracts(simnet, deployerAddress);

		simnet.deployContract(
			"run-1",
			readFileSync(config.initContractsToV2_1).toString(),
			null,
			deployerAddress
		);
		initializeRewards(simnet, deployerAddress);

		simnet.deployContractCheckOk(
			"pass-governance",
			readFileSync("contracts/borrow/legacy/archive/deployment_testnet/pass-governance.clar").toString(),
			{
				clarityVersion: 3,
			},
			deployerAddress
		);

		// pass governance to .zest-governance
		simnet.callPublicFnCheckOk(
			"pass-governance",
			"run-update",
			[],
			deployerAddress
		);

		simnet.deployContractCheckOk(
			"bootstrap-1",
			readFileSync("contracts/borrow/legacy/archive/deployment_testnet/bootstrap-1.clar").toString(),
			{
				clarityVersion: 3,
			},
			deployerAddress
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"construct",
			[
				Cl.contractPrincipal(deployerAddress, "bootstrap-1"),
			],
			deployerAddress
		);
	});

	it("Execute signer proposal", () => {

		simnet.deployContractCheckOk(
			"proposal-1",
			readFileSync("contracts/borrow/legacy/archive/deployment_testnet/proposal-1.clar").toString(),
			{
				clarityVersion: 3,
			},
			deployerAddress
		);

		const delay = 10;
		const day = 144;
		const startBlockHeight = simnet.burnBlockHeight + delay;
		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-signer-proposal",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
				Cl.tuple({
					"start-block-height": Cl.uint(startBlockHeight),
					"end-block-height": Cl.uint(startBlockHeight + day),
					"proposer": Cl.principal(wallet_1)
				})
			],
			wallet_1
		);

		simnet.mineEmptyBurnBlocks(day + delay);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"signer-action",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
			],
			wallet_1
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"signer-action",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
			],
			wallet_2
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"signer-action",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
			],
			wallet_3
		);

		let callResult = simnet.callReadOnlyFn(
			config.poolReserveData,
			"get-optimal-utilization-rate-read",
			[
				Cl.contractPrincipal(deployerAddress, stSTX),
			],
			deployerAddress
		);
		expect(callResult.result).toBeSome(Cl.uint(50000000));


	});
});
