import { describe, expect, it, beforeEach } from "vitest";
import { Cl, ClarityType, cvToValue } from "@stacks/transactions";
import { readFileSync } from "fs";

import * as config from "./tools/config";
import { initSimnetChecker } from "./tools/SimnetChecker";
import {
	deployPythContracts,
	deployV2_1Contracts,
	deployV2Contracts,
	deployV2TokenContracts,
	initializeRewards
} from "./tools/common";

const simnet = await initSimnetChecker();

const accounts = simnet.getAccounts();
const deployerAddress = accounts.get("deployer")!;
const wallet_1 = accounts.get("wallet_1")!;
const wallet_2 = accounts.get("wallet_2")!;
const wallet_3 = accounts.get("wallet_3")!;
const wallet_4 = accounts.get("wallet_4")!;
const wallet_5 = accounts.get("wallet_5")!;
const wallet_6 = accounts.get("wallet_6")!;
const wallet_7 = accounts.get("wallet_7")!;

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

		// check not set yet
		let callResult = simnet.callReadOnlyFn(
			config.poolReserveData,
			"get-optimal-utilization-rate-read",
			[
				Cl.contractPrincipal(deployerAddress, stSTX),
			],
			deployerAddress
		);
		expect(callResult.result).toBeNone();
	});

	it("Execute signer proposal, end block height is not reached", () => {
		simnet.deployContractCheckOk(
			"proposal-1",
			readFileSync("contracts/borrow/legacy/archive/deployment_testnet/proposal-1.clar").toString(),
			{
				clarityVersion: 3,
			},
			deployerAddress
		);

		const delay = 10;
		const proposalCoolDownPeriod = 144;
		const day = 144;
		const startBlockHeight = simnet.burnBlockHeight + proposalCoolDownPeriod;
		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-signer-proposal",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
				Cl.tuple({
					"start-block-height": Cl.uint(startBlockHeight),
					"end-block-height": Cl.uint(startBlockHeight + day - 1),
					"proposer": Cl.principal(wallet_1)
				})
			],
			wallet_1
		);
		// TODO
	});

	it("Execute signer proposal, wrong proposer, should fail", () => {
		simnet.deployContractCheckOk(
			"proposal-1",
			readFileSync("contracts/borrow/legacy/archive/deployment_testnet/proposal-1.clar").toString(),
			{
				clarityVersion: 3,
			},
			deployerAddress
		);

		const proposalCoolDownPeriod = 144;
		const startBlockHeight = simnet.burnBlockHeight + proposalCoolDownPeriod;
		const callResult = simnet.callPublicFn(
			config.zest_governance,
			"add-signer-proposal",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
				Cl.tuple({
					"start-block-height": Cl.uint(startBlockHeight),
					"end-block-height": Cl.uint(startBlockHeight + proposalCoolDownPeriod - 1),
					"proposer": Cl.principal(wallet_7)
				})
			],
			wallet_7
		);
		expect(callResult.result).toBeErr(Cl.uint(3007));
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

		const proposalDuration = 1440;
		const proposalCoolDownPeriod = 144;
		const startBlockHeight = simnet.burnBlockHeight;
		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-signer-proposal",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
				Cl.tuple({
					"start-block-height": Cl.uint(startBlockHeight),
					"end-block-height": Cl.uint(startBlockHeight),
					"proposer": Cl.principal(wallet_1)
				})
			],
			wallet_1
		);

		simnet.mineEmptyBurnBlock();

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

		simnet.mineEmptyBurnBlocks(proposalCoolDownPeriod);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"execute-proposal",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
			],
			deployerAddress
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

	it("Execute signer proposal, propose same proposal again, should fail", () => {
		simnet.deployContractCheckOk(
			"proposal-1",
			readFileSync("contracts/borrow/legacy/archive/deployment_testnet/proposal-1.clar").toString(),
			{
				clarityVersion: 3,
			},
			deployerAddress
		);

		const proposalCoolDownPeriod = 144;
		let startBlockHeight = simnet.burnBlockHeight;
		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-signer-proposal",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
				Cl.tuple({
					"start-block-height": Cl.uint(startBlockHeight),
					"end-block-height": Cl.uint(startBlockHeight + proposalCoolDownPeriod),
					"proposer": Cl.principal(wallet_1)
				})
			],
			wallet_1
		);

		let callResult = simnet.callPublicFn(
			config.zest_governance,
			"add-signer-proposal",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
				Cl.tuple({
					"start-block-height": Cl.uint(startBlockHeight),
					"end-block-height": Cl.uint(startBlockHeight + proposalCoolDownPeriod),
					"proposer": Cl.principal(wallet_1)
				})
			],
			wallet_1
		);
		expect(callResult.result).toBeErr(Cl.uint(3005));

		simnet.mineEmptyBurnBlock();

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
		simnet.mineEmptyBurnBlocks(proposalCoolDownPeriod);


		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"execute-proposal",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
			],
			deployerAddress
		);
		callResult = simnet.callReadOnlyFn(
			config.poolReserveData,
			"get-optimal-utilization-rate-read",
			[
				Cl.contractPrincipal(deployerAddress, stSTX),
			],
			deployerAddress
		);
		expect(callResult.result).toBeSome(Cl.uint(50000000));

		startBlockHeight = simnet.burnBlockHeight + proposalCoolDownPeriod;
		// try to propose again, should fail
		callResult = simnet.callPublicFn(
			config.zest_governance,
			"add-signer-proposal",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
				Cl.tuple({
					"start-block-height": Cl.uint(startBlockHeight),
					"end-block-height": Cl.uint(startBlockHeight + proposalCoolDownPeriod),
					"proposer": Cl.principal(wallet_1)
				})
			],
			wallet_1
		);
		expect(callResult.result).toBeErr(Cl.uint(3005));
	});


	it("Execute signer proposal, same user tries to sign again, should fail", () => {
		simnet.deployContractCheckOk(
			"proposal-1",
			readFileSync("contracts/borrow/legacy/archive/deployment_testnet/proposal-1.clar").toString(),
			{
				clarityVersion: 3,
			},
			deployerAddress
		);

		const proposalCoolDownPeriod = 144;
		const startBlockHeight = simnet.burnBlockHeight;
		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-signer-proposal",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
				Cl.tuple({
					"start-block-height": Cl.uint(startBlockHeight),
					"end-block-height": Cl.uint(startBlockHeight + proposalCoolDownPeriod),
					"proposer": Cl.principal(wallet_1)
				})
			],
			wallet_1
		);

		simnet.mineEmptyBurnBlock();

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"signer-action",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
			],
			wallet_1
		);

		const callResult = simnet.callPublicFn(
			config.zest_governance,
			"signer-action",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
			],
			wallet_1
		);
		expect(callResult.result).toBeErr(Cl.uint(3018));
	});

	it("Execute signer proposal, execute a second proposal", () => {
		simnet.deployContractCheckOk(
			"proposal-1",
			readFileSync("contracts/borrow/legacy/archive/deployment_testnet/proposal-1.clar").toString(),
			{
				clarityVersion: 3,
			},
			deployerAddress
		);

		simnet.deployContractCheckOk(
			"proposal-2",
			readFileSync("contracts/borrow/legacy/archive/deployment_testnet/proposal-2.clar").toString(),
			{
				clarityVersion: 3,
			},
			deployerAddress
		);

		const proposalCoolDownPeriod = 144;
		let startBlockHeight = simnet.burnBlockHeight;
		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-signer-proposal",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
				Cl.tuple({
					"start-block-height": Cl.uint(startBlockHeight),
					"end-block-height": Cl.uint(startBlockHeight + proposalCoolDownPeriod),
					"proposer": Cl.principal(wallet_1)
				})
			],
			wallet_1
		);

		simnet.mineEmptyBurnBlock();

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

		simnet.mineEmptyBurnBlocks(proposalCoolDownPeriod);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"execute-proposal",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-1"),
			],
			deployerAddress
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

		startBlockHeight = simnet.burnBlockHeight;
		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-signer-proposal",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-2"),
				Cl.tuple({
					"start-block-height": Cl.uint(startBlockHeight),
					"end-block-height": Cl.uint(startBlockHeight + proposalCoolDownPeriod),
					"proposer": Cl.principal(wallet_1)
				})
			],
			wallet_1
		);

		simnet.mineEmptyBurnBlock();

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"signer-action",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-2"),
			],
			wallet_1
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"signer-action",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-2"),
			],
			wallet_2
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"signer-action",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-2"),
			],
			wallet_3
		);

		simnet.mineEmptyBurnBlocks(proposalCoolDownPeriod);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"execute-proposal",
			[
				Cl.contractPrincipal(deployerAddress, "proposal-2"),
			],
			deployerAddress
		);

		callResult = simnet.callReadOnlyFn(
			config.poolReserveData,
			"get-optimal-utilization-rate-read",
			[
				Cl.contractPrincipal(deployerAddress, stSTX),
			],
			deployerAddress
		);
		expect(callResult.result).toBeSome(Cl.uint(10000000));

	});

	it("Execute executive proposal", () => {
		simnet.deployContractCheckOk(
			"proposal-1",
			readFileSync("contracts/borrow/legacy/archive/deployment_testnet/proposal-1.clar").toString(),
			{
				clarityVersion: 3,
			},
			deployerAddress
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-executive-proposal",
			[],
			wallet_5
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_5
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_6
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_7
		);

		let callResult = simnet.callReadOnlyFn(
			config.zest_governance,
			"get-emergency-shutdown",
			[],
			deployerAddress
		);
		expect(callResult.result).toStrictEqual(Cl.bool(true));
	});

	it("Execute executive proposal, try to propose again, should fail", () => {
		simnet.deployContractCheckOk(
			"proposal-1",
			readFileSync("contracts/borrow/legacy/archive/deployment_testnet/proposal-1.clar").toString(),
			{
				clarityVersion: 3,
			},
			deployerAddress
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-executive-proposal",
			[],
			wallet_5
		);

		// try to propose again, should fail
		const callResult = simnet.callPublicFn(
			config.zest_governance,
			"add-executive-proposal",
			[],
			wallet_5
		);
		expect(callResult.result).toBeErr(Cl.uint(3016));
	});

	it("Execute executive proposal, try to propose again, should fail", () => {
		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-executive-proposal",
			[],
			wallet_5
		);

		// try to propose again, should fail
		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_5
		);

		// try to propose again, should fail
		const callResult = simnet.callPublicFn(
			config.zest_governance,
			"executive-action",
			[],
			wallet_5
		);
		expect(callResult.result).toBeErr(Cl.uint(3018));
	});

	it("Execute without being in process, should fail", () => {
		let callResult = simnet.callPublicFn(
			config.zest_governance,
			"executive-action",
			[],
			wallet_5
		);
		expect(callResult.result).toBeErr(Cl.uint(3017));
	});

	it("Execute action, wrong team member, should fail", () => {
		let callResult = simnet.callPublicFn(
			config.zest_governance,
			"executive-action",
			[],
			wallet_1
		);
		expect(callResult.result).toBeErr(Cl.uint(3006));
	});

	it("Execute emergency shutdown, check minimum wait time, then disable emergency shutdown. It's back online.", () => {
		simnet.deployContractCheckOk(
			"proposal-1",
			readFileSync("contracts/borrow/legacy/archive/deployment_testnet/proposal-1.clar").toString(),
			{
				clarityVersion: 3,
			},
			deployerAddress
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-executive-proposal",
			[],
			wallet_5
		);


		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_5
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_6
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_7
		);

		let callResult = simnet.callPublicFn(
			config.zest_governance,
			"add-executive-proposal",
			[],
			wallet_5
		);
		expect(callResult.result).toBeErr(Cl.uint(3013));

		// mine 99 blocks to make sure the toggle period is reached
		simnet.mineEmptyBurnBlocks(101);


		// should not be able to propose again
		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-executive-proposal",
			[],
			wallet_5
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_5
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_6
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_7
		);
		// should be set to false, emergency shutdown is disabled
		callResult = simnet.callReadOnlyFn(
			config.zest_governance,
			"get-emergency-shutdown",
			[],
			deployerAddress
		);
		expect(callResult.result).toStrictEqual(Cl.bool(false));

	});

	it("Execute emergency shutdown, check minimum wait time, then disable emergency shutdown. It's back online. Immediate shutdown again.", () => {
		simnet.deployContractCheckOk(
			"proposal-1",
			readFileSync("contracts/borrow/legacy/archive/deployment_testnet/proposal-1.clar").toString(),
			{
				clarityVersion: 3,
			},
			deployerAddress
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-executive-proposal",
			[],
			wallet_5
		);


		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_5
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_6
		);

		let callResult = simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_7
		);

		callResult = simnet.callReadOnlyFn(
			config.zest_governance,
			"get-emergency-shutdown",
			[],
			deployerAddress
		);
		expect(callResult.result).toStrictEqual(Cl.bool(true));

		callResult = simnet.callReadOnlyFn(
			config.zest_governance,
			"get-last-emergency-shutdown",
			[],
			deployerAddress
		);
		// TODO: checking toggle-executive-period values
		// console.log(Cl.prettyPrint(callResult.result));

		callResult = simnet.callReadOnlyFn(
			config.zest_governance,
			"get-executive-toggle-period",
			[],
			deployerAddress
		);
		// console.log(Cl.prettyPrint(callResult.result));
		// mine 99 blocks to make sure the toggle period is reached
		simnet.mineEmptyBurnBlocks(101);


		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-executive-proposal",
			[],
			wallet_5
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_5
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_6
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_7
		);
		// should be set to false, emergency shutdown is disabled
		callResult = simnet.callReadOnlyFn(
			config.zest_governance,
			"get-emergency-shutdown",
			[],
			deployerAddress
		);
		expect(callResult.result).toStrictEqual(Cl.bool(false));


		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"add-executive-proposal",
			[],
			wallet_5
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_5
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_6
		);

		simnet.callPublicFnCheckOk(
			config.zest_governance,
			"executive-action",
			[],
			wallet_7
		);
		// should be set to false, emergency shutdown is disabled
		callResult = simnet.callReadOnlyFn(
			config.zest_governance,
			"get-emergency-shutdown",
			[],
			deployerAddress
		);
		expect(callResult.result).toStrictEqual(Cl.bool(true));

	});

});
