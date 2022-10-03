// Code generated with the stacksjs-helper-generator extension
// Manual edits will be overwritten

import { ClarityValue, BooleanCV, NoneCV, IntCV, UIntCV, BufferCV, OptionalCV, ResponseCV, PrincipalCV, ListCV, TupleCV, StringAsciiCV, StringUtf8CV } from "@stacks/transactions"

export namespace LiquidityVaultV10Contract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "liquidity-vault-v1-0";

    // Functions
    export namespace Functions {
        // add-contract
        export namespace AddContract {
            export const name = "add-contract";

            export interface AddContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: AddContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // fund-loan
        export namespace FundLoan {
            export const name = "fund-loan";

            export interface FundLoanArgs {
                amount: UIntCV,
                recipient: PrincipalCV,
                ft: ClarityValue,
            }

            export function args(args: FundLoanArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.recipient,
                    args.ft,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // remove-contract
        export namespace RemoveContract {
            export const name = "remove-contract";

            export interface RemoveContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: RemoveContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                recipient: PrincipalCV,
                ft: ClarityValue,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.recipient,
                    args.ft,
                ];
            }

        }

        // is-approved-contract
        export namespace IsApprovedContract {
            export const name = "is-approved-contract";

            export interface IsApprovedContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: IsApprovedContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // is-contract-owner
        export namespace IsContractOwner {
            export const name = "is-contract-owner";

            export interface IsContractOwnerArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsContractOwnerArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

    }
}

export namespace ExtensionTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "extension-trait";

}

export namespace StakingPoolTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "staking-pool-trait";

}

export namespace ProposalTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "proposal-trait";

}

export namespace ZestRewardDistContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "zest-reward-dist";

    // Functions
    export namespace Functions {
        // add-contract
        export namespace AddContract {
            export const name = "add-contract";

            export interface AddContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: AddContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // burn
        export namespace Burn {
            export const name = "burn";

            export interface BurnArgs {
                recipient: PrincipalCV,
                amount: UIntCV,
            }

            export function args(args: BurnArgs): ClarityValue[] {
                return [
                    args.recipient,
                    args.amount,
                ];
            }

        }

        // deposit-rewards
        export namespace DepositRewards {
            export const name = "deposit-rewards";

            export interface DepositRewardsArgs {
                amount: IntCV,
            }

            export function args(args: DepositRewardsArgs): ClarityValue[] {
                return [
                    args.amount,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // mint
        export namespace Mint {
            export const name = "mint";

            export interface MintArgs {
                recipient: PrincipalCV,
                amount: UIntCV,
            }

            export function args(args: MintArgs): ClarityValue[] {
                return [
                    args.recipient,
                    args.amount,
                ];
            }

        }

        // remove-contract
        export namespace RemoveContract {
            export const name = "remove-contract";

            export interface RemoveContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: RemoveContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                value: StringUtf8CV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: NoneCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // withdraw-funds
        export namespace WithdrawFunds {
            export const name = "withdraw-funds";

        }

        // accumulative-funds-of
        export namespace AccumulativeFundsOf {
            export const name = "accumulative-funds-of";

            export interface AccumulativeFundsOfArgs {
                owner: PrincipalCV,
            }

            export function args(args: AccumulativeFundsOfArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                account: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.account,
                ];
            }

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

        }

        // get-name
        export namespace GetName {
            export const name = "get-name";

        }

        // get-symbol
        export namespace GetSymbol {
            export const name = "get-symbol";

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

        }

        // is-approved-contract
        export namespace IsApprovedContract {
            export const name = "is-approved-contract";

            export interface IsApprovedContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: IsApprovedContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // is-contract-owner
        export namespace IsContractOwner {
            export const name = "is-contract-owner";

            export interface IsContractOwnerArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsContractOwnerArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

        // withdrawable-funds-of
        export namespace WithdrawableFundsOf {
            export const name = "withdrawable-funds-of";

            export interface WithdrawableFundsOfArgs {
                owner: PrincipalCV,
            }

            export function args(args: WithdrawableFundsOfArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

    }
}

export namespace PoolV10Contract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "pool-v1-0";

    // Functions
    export namespace Functions {
        // accept-rollover
        export namespace AcceptRollover {
            export const name = "accept-rollover";

            export interface AcceptRolloverArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                loanToken: ClarityValue,
                lv: ClarityValue,
            }

            export function args(args: AcceptRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.loanToken,
                    args.lv,
                ];
            }

        }

        // add-liquidity-provider
        export namespace AddLiquidityProvider {
            export const name = "add-liquidity-provider";

            export interface AddLiquidityProviderArgs {
                liquidityProvider: PrincipalCV,
            }

            export function args(args: AddLiquidityProviderArgs): ClarityValue[] {
                return [
                    args.liquidityProvider,
                ];
            }

        }

        // create-loan
        export namespace CreateLoan {
            export const name = "create-loan";

            export interface CreateLoanArgs {
                lpToken: ClarityValue,
                loanAmount: UIntCV,
                collRatio: UIntCV,
                collToken: ClarityValue,
                apr: UIntCV,
                maturityLength: UIntCV,
                paymentPeriod: UIntCV,
                collVault: PrincipalCV,
                loanToken: PrincipalCV,
                fundingVault: PrincipalCV,
            }

            export function args(args: CreateLoanArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.loanAmount,
                    args.collRatio,
                    args.collToken,
                    args.apr,
                    args.maturityLength,
                    args.paymentPeriod,
                    args.collVault,
                    args.loanToken,
                    args.fundingVault,
                ];
            }

        }

        // create-pool
        export namespace CreatePool {
            export const name = "create-pool";

            export interface CreatePoolArgs {
                poolDelegate: PrincipalCV,
                lpToken: ClarityValue,
                payment: ClarityValue,
                stakingFee: UIntCV,
                delegateFee: UIntCV,
                liquidityCap: UIntCV,
                liquidityVault: ClarityValue,
                spToken: ClarityValue,
                open: BooleanCV,
            }

            export function args(args: CreatePoolArgs): ClarityValue[] {
                return [
                    args.poolDelegate,
                    args.lpToken,
                    args.payment,
                    args.stakingFee,
                    args.delegateFee,
                    args.liquidityCap,
                    args.liquidityVault,
                    args.spToken,
                    args.open,
                ];
            }

        }

        // deposit
        export namespace Deposit {
            export const name = "deposit";

            export interface DepositArgs {
                lpToken: ClarityValue,
                zpToken: ClarityValue,
                amount: UIntCV,
                height: UIntCV,
                lv: ClarityValue,
            }

            export function args(args: DepositArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.zpToken,
                    args.amount,
                    args.height,
                    args.lv,
                ];
            }

        }

        // disable-contract
        export namespace DisableContract {
            export const name = "disable-contract";

        }

        // enable-contract
        export namespace EnableContract {
            export const name = "enable-contract";

        }

        // fund-loan
        export namespace FundLoan {
            export const name = "fund-loan";

            export interface FundLoanArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                loanToken: ClarityValue,
                lv: ClarityValue,
                amount: UIntCV,
            }

            export function args(args: FundLoanArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.loanToken,
                    args.lv,
                    args.amount,
                ];
            }

        }

        // get-pool
        export namespace GetPool {
            export const name = "get-pool";

            export interface GetPoolArgs {
                lpToken: PrincipalCV,
            }

            export function args(args: GetPoolArgs): ClarityValue[] {
                return [
                    args.lpToken,
                ];
            }

        }

        // is-enabled
        export namespace IsEnabled {
            export const name = "is-enabled";

        }

        // is-pool-delegate
        export namespace IsPoolDelegate {
            export const name = "is-pool-delegate";

            export interface IsPoolDelegateArgs {
                poolDelegate: PrincipalCV,
            }

            export function args(args: IsPoolDelegateArgs): ClarityValue[] {
                return [
                    args.poolDelegate,
                ];
            }

        }

        // liquidate-loan
        export namespace LiquidateLoan {
            export const name = "liquidate-loan";

            export interface LiquidateLoanArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                collVault: ClarityValue,
                collToken: ClarityValue,
                spToken: ClarityValue,
            }

            export function args(args: LiquidateLoanArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.collVault,
                    args.collToken,
                    args.spToken,
                ];
            }

        }

        // remove-liquidity-provider
        export namespace RemoveLiquidityProvider {
            export const name = "remove-liquidity-provider";

            export interface RemoveLiquidityProviderArgs {
                liquidityProvider: PrincipalCV,
            }

            export function args(args: RemoveLiquidityProviderArgs): ClarityValue[] {
                return [
                    args.liquidityProvider,
                ];
            }

        }

        // set-bridge-contract
        export namespace SetBridgeContract {
            export const name = "set-bridge-contract";

            export interface SetBridgeContractArgs {
                newBridge: PrincipalCV,
            }

            export function args(args: SetBridgeContractArgs): ClarityValue[] {
                return [
                    args.newBridge,
                ];
            }

        }

        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // set-liquidity-cap
        export namespace SetLiquidityCap {
            export const name = "set-liquidity-cap";

            export interface SetLiquidityCapArgs {
                lpToken: ClarityValue,
                liquidityCap: UIntCV,
            }

            export function args(args: SetLiquidityCapArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.liquidityCap,
                ];
            }

        }

        // set-lockup-period
        export namespace SetLockupPeriod {
            export const name = "set-lockup-period";

            export interface SetLockupPeriodArgs {
                lpToken: ClarityValue,
                lockupPeriod: UIntCV,
            }

            export function args(args: SetLockupPeriodArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.lockupPeriod,
                ];
            }

        }

        // set-open
        export namespace SetOpen {
            export const name = "set-open";

            export interface SetOpenArgs {
                open: BooleanCV,
                lpToken: ClarityValue,
            }

            export function args(args: SetOpenArgs): ClarityValue[] {
                return [
                    args.open,
                    args.lpToken,
                ];
            }

        }

        // trigger-default-mode
        export namespace TriggerDefaultMode {
            export const name = "trigger-default-mode";

            export interface TriggerDefaultModeArgs {
                lpToken: ClarityValue,
            }

            export function args(args: TriggerDefaultModeArgs): ClarityValue[] {
                return [
                    args.lpToken,
                ];
            }

        }

        // unwind
        export namespace Unwind {
            export const name = "unwind";

            export interface UnwindArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                loanToken: ClarityValue,
                fv: ClarityValue,
                amount: UIntCV,
            }

            export function args(args: UnwindArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.loanToken,
                    args.fv,
                    args.amount,
                ];
            }

        }

        // withdraw
        export namespace Withdraw {
            export const name = "withdraw";

            export interface WithdrawArgs {
                lpToken: ClarityValue,
                lv: ClarityValue,
                amount: UIntCV,
                ft: ClarityValue,
            }

            export function args(args: WithdrawArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.lv,
                    args.amount,
                    args.ft,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-liquidity-cap
        export namespace GetLiquidityCap {
            export const name = "get-liquidity-cap";

            export interface GetLiquidityCapArgs {
                lpToken: PrincipalCV,
            }

            export function args(args: GetLiquidityCapArgs): ClarityValue[] {
                return [
                    args.lpToken,
                ];
            }

        }

        // is-bridge
        export namespace IsBridge {
            export const name = "is-bridge";

        }

        // is-contract-owner
        export namespace IsContractOwner {
            export const name = "is-contract-owner";

            export interface IsContractOwnerArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsContractOwnerArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

        // is-liquidity-provider
        export namespace IsLiquidityProvider {
            export const name = "is-liquidity-provider";

            export interface IsLiquidityProviderArgs {
                liquidityProvider: PrincipalCV,
            }

            export function args(args: IsLiquidityProviderArgs): ClarityValue[] {
                return [
                    args.liquidityProvider,
                ];
            }

        }

        // lc-check
        export namespace LcCheck {
            export const name = "lc-check";

            export interface LcCheckArgs {
                newLc: UIntCV,
                previousLc: UIntCV,
            }

            export function args(args: LcCheckArgs): ClarityValue[] {
                return [
                    args.newLc,
                    args.previousLc,
                ];
            }

        }

        // to-precision
        export namespace ToPrecision {
            export const name = "to-precision";

            export interface ToPrecisionArgs {
                amount: UIntCV,
            }

            export function args(args: ToPrecisionArgs): ClarityValue[] {
                return [
                    args.amount,
                ];
            }

        }

    }
}

export namespace OwnableTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "ownable-trait";

}

export namespace StakingPoolV10Contract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "staking-pool-v1-0";

    // Functions
    export namespace Functions {
        // add-contract
        export namespace AddContract {
            export const name = "add-contract";

            export interface AddContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: AddContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // add-staker
        export namespace AddStaker {
            export const name = "add-staker";

            export interface AddStakerArgs {
                staker: PrincipalCV,
            }

            export function args(args: AddStakerArgs): ClarityValue[] {
                return [
                    args.staker,
                ];
            }

        }

        // default-withdrawal
        export namespace DefaultWithdrawal {
            export const name = "default-withdrawal";

            export interface DefaultWithdrawalArgs {
                spToken: ClarityValue,
                remainingLoanAmount: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: DefaultWithdrawalArgs): ClarityValue[] {
                return [
                    args.spToken,
                    args.remainingLoanAmount,
                    args.recipient,
                ];
            }

        }

        // deposit
        export namespace Deposit {
            export const name = "deposit";

            export interface DepositArgs {
                spToken: ClarityValue,
                amount: UIntCV,
                cycles: UIntCV,
            }

            export function args(args: DepositArgs): ClarityValue[] {
                return [
                    args.spToken,
                    args.amount,
                    args.cycles,
                ];
            }

        }

        // disable-contract
        export namespace DisableContract {
            export const name = "disable-contract";

        }

        // enable-contract
        export namespace EnableContract {
            export const name = "enable-contract";

        }

        // get-staker-data
        export namespace GetStakerData {
            export const name = "get-staker-data";

            export interface GetStakerDataArgs {
                staker: PrincipalCV,
            }

            export function args(args: GetStakerDataArgs): ClarityValue[] {
                return [
                    args.staker,
                ];
            }

        }

        // is-enabled
        export namespace IsEnabled {
            export const name = "is-enabled";

        }

        // remove-contract
        export namespace RemoveContract {
            export const name = "remove-contract";

            export interface RemoveContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: RemoveContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // remove-staker
        export namespace RemoveStaker {
            export const name = "remove-staker";

            export interface RemoveStakerArgs {
                staker: PrincipalCV,
            }

            export function args(args: RemoveStakerArgs): ClarityValue[] {
                return [
                    args.staker,
                ];
            }

        }

        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // withdraw
        export namespace Withdraw {
            export const name = "withdraw";

            export interface WithdrawArgs {
                spToken: ClarityValue,
                amount: UIntCV,
            }

            export function args(args: WithdrawArgs): ClarityValue[] {
                return [
                    args.spToken,
                    args.amount,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // is-approved-contract
        export namespace IsApprovedContract {
            export const name = "is-approved-contract";

            export interface IsApprovedContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: IsApprovedContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // is-contract-owner
        export namespace IsContractOwner {
            export const name = "is-contract-owner";

            export interface IsContractOwnerArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsContractOwnerArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

        // is-staker
        export namespace IsStaker {
            export const name = "is-staker";

        }

        // to-precision
        export namespace ToPrecision {
            export const name = "to-precision";

            export interface ToPrecisionArgs {
                amount: UIntCV,
            }

            export function args(args: ToPrecisionArgs): ClarityValue[] {
                return [
                    args.amount,
                ];
            }

        }

    }
}

export namespace Zgp001KillEmergencyExecuteContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "zgp001-kill-emergency-execute";

    // Functions
    export namespace Functions {
        // execute
        export namespace Execute {
            export const name = "execute";

            export interface ExecuteArgs {
                sender: PrincipalCV,
            }

            export function args(args: ExecuteArgs): ClarityValue[] {
                return [
                    args.sender,
                ];
            }

        }

    }
}

export namespace RewardsMultiplierContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "rewards-multiplier";

    // Functions
    export namespace Functions {
        // add-contract
        export namespace AddContract {
            export const name = "add-contract";

            export interface AddContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: AddContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // callback
        export namespace Callback {
            export const name = "callback";

            export interface CallbackArgs {
                sender: PrincipalCV,
                memo: BufferCV,
            }

            export function args(args: CallbackArgs): ClarityValue[] {
                return [
                    args.sender,
                    args.memo,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-multiplier
        export namespace GetMultiplier {
            export const name = "get-multiplier";

            export interface GetMultiplierArgs {
                cycle: UIntCV,
            }

            export function args(args: GetMultiplierArgs): ClarityValue[] {
                return [
                    args.cycle,
                ];
            }

        }

        // mint-rewards
        export namespace MintRewards {
            export const name = "mint-rewards";

            export interface MintRewardsArgs {
                staker: PrincipalCV,
                baseAmount: UIntCV,
                cycles: UIntCV,
            }

            export function args(args: MintRewardsArgs): ClarityValue[] {
                return [
                    args.staker,
                    args.baseAmount,
                    args.cycles,
                ];
            }

        }

        // remove-contract
        export namespace RemoveContract {
            export const name = "remove-contract";

            export interface RemoveContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: RemoveContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // set-multiplier
        export namespace SetMultiplier {
            export const name = "set-multiplier";

            export interface SetMultiplierArgs {
                cycle: UIntCV,
                multiplier: UIntCV,
            }

            export function args(args: SetMultiplierArgs): ClarityValue[] {
                return [
                    args.cycle,
                    args.multiplier,
                ];
            }

        }

        // is-approved-contract
        export namespace IsApprovedContract {
            export const name = "is-approved-contract";

            export interface IsApprovedContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: IsApprovedContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // is-contract-owner
        export namespace IsContractOwner {
            export const name = "is-contract-owner";

            export interface IsContractOwnerArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsContractOwnerArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

    }
}

export namespace ExecutorDaoContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "executor-dao";

    // Functions
    export namespace Functions {
        // construct
        export namespace Construct {
            export const name = "construct";

            export interface ConstructArgs {
                proposal: ClarityValue,
            }

            export function args(args: ConstructArgs): ClarityValue[] {
                return [
                    args.proposal,
                ];
            }

        }

        // execute
        export namespace Execute {
            export const name = "execute";

            export interface ExecuteArgs {
                proposal: ClarityValue,
                sender: PrincipalCV,
            }

            export function args(args: ExecuteArgs): ClarityValue[] {
                return [
                    args.proposal,
                    args.sender,
                ];
            }

        }

        // request-extension-callback
        export namespace RequestExtensionCallback {
            export const name = "request-extension-callback";

            export interface RequestExtensionCallbackArgs {
                extension: ClarityValue,
                memo: BufferCV,
            }

            export function args(args: RequestExtensionCallbackArgs): ClarityValue[] {
                return [
                    args.extension,
                    args.memo,
                ];
            }

        }

        // set-extension
        export namespace SetExtension {
            export const name = "set-extension";

            export interface SetExtensionArgs {
                extension: PrincipalCV,
                enabled: BooleanCV,
            }

            export function args(args: SetExtensionArgs): ClarityValue[] {
                return [
                    args.extension,
                    args.enabled,
                ];
            }

        }

        // set-extensions
        export namespace SetExtensions {
            export const name = "set-extensions";

            export interface SetExtensionsArgs {
                extensionList: ListCV,
            }

            export function args(args: SetExtensionsArgs): ClarityValue[] {
                return [
                    args.extensionList,
                ];
            }

        }

        // executed-at
        export namespace ExecutedAt {
            export const name = "executed-at";

            export interface ExecutedAtArgs {
                proposal: ClarityValue,
            }

            export function args(args: ExecutedAtArgs): ClarityValue[] {
                return [
                    args.proposal,
                ];
            }

        }

        // is-extension
        export namespace IsExtension {
            export const name = "is-extension";

            export interface IsExtensionArgs {
                extension: PrincipalCV,
            }

            export function args(args: IsExtensionArgs): ClarityValue[] {
                return [
                    args.extension,
                ];
            }

        }

    }
}

export namespace StakingPoolContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "staking-pool";

    // Functions
    export namespace Functions {
        // claim-staking-reward
        export namespace ClaimStakingReward {
            export const name = "claim-staking-reward";

            export interface ClaimStakingRewardArgs {
                targetCycle: UIntCV,
            }

            export function args(args: ClaimStakingRewardArgs): ClarityValue[] {
                return [
                    args.targetCycle,
                ];
            }

        }

        // set-pool-delegate
        export namespace SetPoolDelegate {
            export const name = "set-pool-delegate";

            export interface SetPoolDelegateArgs {
                address: PrincipalCV,
            }

            export function args(args: SetPoolDelegateArgs): ClarityValue[] {
                return [
                    args.address,
                ];
            }

        }

        // stake-tokens
        export namespace StakeTokens {
            export const name = "stake-tokens";

            export interface StakeTokensArgs {
                amountToken: UIntCV,
                lockPeriod: UIntCV,
            }

            export function args(args: StakeTokensArgs): ClarityValue[] {
                return [
                    args.amountToken,
                    args.lockPeriod,
                ];
            }

        }

        // get-first-stacks-block-in-reward-cycle
        export namespace GetFirstStacksBlockInRewardCycle {
            export const name = "get-first-stacks-block-in-reward-cycle";

            export interface GetFirstStacksBlockInRewardCycleArgs {
                rewardCycle: UIntCV,
            }

            export function args(args: GetFirstStacksBlockInRewardCycleArgs): ClarityValue[] {
                return [
                    args.rewardCycle,
                ];
            }

        }

        // get-loss-at-cycle
        export namespace GetLossAtCycle {
            export const name = "get-loss-at-cycle";

            export interface GetLossAtCycleArgs {
                rewardCycle: UIntCV,
            }

            export function args(args: GetLossAtCycleArgs): ClarityValue[] {
                return [
                    args.rewardCycle,
                ];
            }

        }

        // get-loss-at-cycle-or-default
        export namespace GetLossAtCycleOrDefault {
            export const name = "get-loss-at-cycle-or-default";

            export interface GetLossAtCycleOrDefaultArgs {
                rewardCycle: UIntCV,
            }

            export function args(args: GetLossAtCycleOrDefaultArgs): ClarityValue[] {
                return [
                    args.rewardCycle,
                ];
            }

        }

        // get-reward-cycle
        export namespace GetRewardCycle {
            export const name = "get-reward-cycle";

            export interface GetRewardCycleArgs {
                stacksHeight: UIntCV,
            }

            export function args(args: GetRewardCycleArgs): ClarityValue[] {
                return [
                    args.stacksHeight,
                ];
            }

        }

        // get-staker-at-cycle
        export namespace GetStakerAtCycle {
            export const name = "get-staker-at-cycle";

            export interface GetStakerAtCycleArgs {
                rewardCycle: UIntCV,
                user: PrincipalCV,
            }

            export function args(args: GetStakerAtCycleArgs): ClarityValue[] {
                return [
                    args.rewardCycle,
                    args.user,
                ];
            }

        }

        // get-staker-at-cycle-or-default
        export namespace GetStakerAtCycleOrDefault {
            export const name = "get-staker-at-cycle-or-default";

            export interface GetStakerAtCycleOrDefaultArgs {
                rewardCycle: UIntCV,
                user: PrincipalCV,
            }

            export function args(args: GetStakerAtCycleOrDefaultArgs): ClarityValue[] {
                return [
                    args.rewardCycle,
                    args.user,
                ];
            }

        }

        // get-staker-loss-at-cycle-or-default
        export namespace GetStakerLossAtCycleOrDefault {
            export const name = "get-staker-loss-at-cycle-or-default";

            export interface GetStakerLossAtCycleOrDefaultArgs {
                rewardCycle: UIntCV,
                user: PrincipalCV,
            }

            export function args(args: GetStakerLossAtCycleOrDefaultArgs): ClarityValue[] {
                return [
                    args.rewardCycle,
                    args.user,
                ];
            }

        }

        // get-staker-tokens-at-cycle-or-default
        export namespace GetStakerTokensAtCycleOrDefault {
            export const name = "get-staker-tokens-at-cycle-or-default";

            export interface GetStakerTokensAtCycleOrDefaultArgs {
                rewardCycle: UIntCV,
                user: PrincipalCV,
            }

            export function args(args: GetStakerTokensAtCycleOrDefaultArgs): ClarityValue[] {
                return [
                    args.rewardCycle,
                    args.user,
                ];
            }

        }

        // get-staking-reward
        export namespace GetStakingReward {
            export const name = "get-staking-reward";

            export interface GetStakingRewardArgs {
                user: PrincipalCV,
                targetCycle: UIntCV,
            }

            export function args(args: GetStakingRewardArgs): ClarityValue[] {
                return [
                    args.user,
                    args.targetCycle,
                ];
            }

        }

        // get-staking-stats-at-cycle
        export namespace GetStakingStatsAtCycle {
            export const name = "get-staking-stats-at-cycle";

            export interface GetStakingStatsAtCycleArgs {
                rewardCycle: UIntCV,
            }

            export function args(args: GetStakingStatsAtCycleArgs): ClarityValue[] {
                return [
                    args.rewardCycle,
                ];
            }

        }

        // get-staking-stats-at-cycle-or-default
        export namespace GetStakingStatsAtCycleOrDefault {
            export const name = "get-staking-stats-at-cycle-or-default";

            export interface GetStakingStatsAtCycleOrDefaultArgs {
                rewardCycle: UIntCV,
            }

            export function args(args: GetStakingStatsAtCycleOrDefaultArgs): ClarityValue[] {
                return [
                    args.rewardCycle,
                ];
            }

        }

        // get-total-staked-tokens-at-cycle-or-default
        export namespace GetTotalStakedTokensAtCycleOrDefault {
            export const name = "get-total-staked-tokens-at-cycle-or-default";

            export interface GetTotalStakedTokensAtCycleOrDefaultArgs {
                rewardCycle: UIntCV,
            }

            export function args(args: GetTotalStakedTokensAtCycleOrDefaultArgs): ClarityValue[] {
                return [
                    args.rewardCycle,
                ];
            }

        }

        // loss-at-cycle
        export namespace LossAtCycle {
            export const name = "loss-at-cycle";

            export interface LossAtCycleArgs {
                rewardCycle: UIntCV,
            }

            export function args(args: LossAtCycleArgs): ClarityValue[] {
                return [
                    args.rewardCycle,
                ];
            }

        }

        // staking-active-at-cycle
        export namespace StakingActiveAtCycle {
            export const name = "staking-active-at-cycle";

            export interface StakingActiveAtCycleArgs {
                rewardCycle: UIntCV,
            }

            export function args(args: StakingActiveAtCycleArgs): ClarityValue[] {
                return [
                    args.rewardCycle,
                ];
            }

        }

    }
}

export namespace ZestContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "zest";

    // Functions
    export namespace Functions {
        // mint
        export namespace Mint {
            export const name = "mint";

            export interface MintArgs {
                amount: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: MintArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.recipient,
                ];
            }

        }

        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                value: StringUtf8CV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: NoneCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // get-asset-name
        export namespace GetAssetName {
            export const name = "get-asset-name";

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                account: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.account,
                ];
            }

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

        }

        // get-name
        export namespace GetName {
            export const name = "get-name";

        }

        // get-symbol
        export namespace GetSymbol {
            export const name = "get-symbol";

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

        }

    }
}

export namespace UsdaContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "usda";

    // Functions
    export namespace Functions {
        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                value: StringUtf8CV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: NoneCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // get-asset-name
        export namespace GetAssetName {
            export const name = "get-asset-name";

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                account: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.account,
                ];
            }

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

        }

        // get-name
        export namespace GetName {
            export const name = "get-name";

        }

        // get-symbol
        export namespace GetSymbol {
            export const name = "get-symbol";

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

        }

    }
}

export namespace PoolFactoryContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "pool-factory";

    // Functions
    export namespace Functions {
        // create-pool
        export namespace CreatePool {
            export const name = "create-pool";

            export interface CreatePoolArgs {
                btcToken: ClarityValue,
                stakingToken: ClarityValue,
                delegateFee: UIntCV,
                stakerFee: UIntCV,
            }

            export function args(args: CreatePoolArgs): ClarityValue[] {
                return [
                    args.btcToken,
                    args.stakingToken,
                    args.delegateFee,
                    args.stakerFee,
                ];
            }

        }

    }
}

export namespace GovernanceTokenTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "governance-token-trait";

}

export namespace ClarityBitcoinContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "clarity-bitcoin";

    // Functions
    export namespace Functions {
        // buff-to-u8
        export namespace BuffToU8 {
            export const name = "buff-to-u8";

            export interface BuffToU8Args {
                byte: BufferCV,
            }

            export function args(args: BuffToU8Args): ClarityValue[] {
                return [
                    args.byte,
                ];
            }

        }

        // get-reversed-txid
        export namespace GetReversedTxid {
            export const name = "get-reversed-txid";

            export interface GetReversedTxidArgs {
                tx: BufferCV,
            }

            export function args(args: GetReversedTxidArgs): ClarityValue[] {
                return [
                    args.tx,
                ];
            }

        }

        // get-txid
        export namespace GetTxid {
            export const name = "get-txid";

            export interface GetTxidArgs {
                tx: BufferCV,
            }

            export function args(args: GetTxidArgs): ClarityValue[] {
                return [
                    args.tx,
                ];
            }

        }

        // inner-buff32-permutation
        export namespace InnerBuff32Permutation {
            export const name = "inner-buff32-permutation";

            export interface InnerBuff32PermutationArgs {
                targetIndex: UIntCV,
                state: TupleCV,
            }

            export function args(args: InnerBuff32PermutationArgs): ClarityValue[] {
                return [
                    args.targetIndex,
                    args.state,
                ];
            }

        }

        // inner-merkle-proof-verify
        export namespace InnerMerkleProofVerify {
            export const name = "inner-merkle-proof-verify";

            export interface InnerMerkleProofVerifyArgs {
                ctr: UIntCV,
                state: TupleCV,
            }

            export function args(args: InnerMerkleProofVerifyArgs): ClarityValue[] {
                return [
                    args.ctr,
                    args.state,
                ];
            }

        }

        // inner-read-slice
        export namespace InnerReadSlice {
            export const name = "inner-read-slice";

            export interface InnerReadSliceArgs {
                chunk_size: UIntCV,
                input: TupleCV,
            }

            export function args(args: InnerReadSliceArgs): ClarityValue[] {
                return [
                    args.chunk_size,
                    args.input,
                ];
            }

        }

        // inner-read-slice-1024
        export namespace InnerReadSlice1024 {
            export const name = "inner-read-slice-1024";

            export interface InnerReadSlice1024Args {
                ignored: BooleanCV,
                input: TupleCV,
            }

            export function args(args: InnerReadSlice1024Args): ClarityValue[] {
                return [
                    args.ignored,
                    args.input,
                ];
            }

        }

        // is-bit-set
        export namespace IsBitSet {
            export const name = "is-bit-set";

            export interface IsBitSetArgs {
                val: UIntCV,
                bit: UIntCV,
            }

            export function args(args: IsBitSetArgs): ClarityValue[] {
                return [
                    args.val,
                    args.bit,
                ];
            }

        }

        // parse-block-header
        export namespace ParseBlockHeader {
            export const name = "parse-block-header";

            export interface ParseBlockHeaderArgs {
                headerbuff: BufferCV,
            }

            export function args(args: ParseBlockHeaderArgs): ClarityValue[] {
                return [
                    args.headerbuff,
                ];
            }

        }

        // parse-tx
        export namespace ParseTx {
            export const name = "parse-tx";

            export interface ParseTxArgs {
                tx: BufferCV,
            }

            export function args(args: ParseTxArgs): ClarityValue[] {
                return [
                    args.tx,
                ];
            }

        }

        // read-hashslice
        export namespace ReadHashslice {
            export const name = "read-hashslice";

            export interface ReadHashsliceArgs {
                oldCtx: TupleCV,
            }

            export function args(args: ReadHashsliceArgs): ClarityValue[] {
                return [
                    args.oldCtx,
                ];
            }

        }

        // read-next-txin
        export namespace ReadNextTxin {
            export const name = "read-next-txin";

            export interface ReadNextTxinArgs {
                ignored: BooleanCV,
                stateRes: ClarityValue,
            }

            export function args(args: ReadNextTxinArgs): ClarityValue[] {
                return [
                    args.ignored,
                    args.stateRes,
                ];
            }

        }

        // read-next-txout
        export namespace ReadNextTxout {
            export const name = "read-next-txout";

            export interface ReadNextTxoutArgs {
                ignored: BooleanCV,
                stateRes: ClarityValue,
            }

            export function args(args: ReadNextTxoutArgs): ClarityValue[] {
                return [
                    args.ignored,
                    args.stateRes,
                ];
            }

        }

        // read-slice
        export namespace ReadSlice {
            export const name = "read-slice";

            export interface ReadSliceArgs {
                data: BufferCV,
                offset: UIntCV,
                size: UIntCV,
            }

            export function args(args: ReadSliceArgs): ClarityValue[] {
                return [
                    args.data,
                    args.offset,
                    args.size,
                ];
            }

        }

        // read-slice-1
        export namespace ReadSlice1 {
            export const name = "read-slice-1";

            export interface ReadSlice1Args {
                input: TupleCV,
            }

            export function args(args: ReadSlice1Args): ClarityValue[] {
                return [
                    args.input,
                ];
            }

        }

        // read-slice-128
        export namespace ReadSlice128 {
            export const name = "read-slice-128";

            export interface ReadSlice128Args {
                input: TupleCV,
            }

            export function args(args: ReadSlice128Args): ClarityValue[] {
                return [
                    args.input,
                ];
            }

        }

        // read-slice-16
        export namespace ReadSlice16 {
            export const name = "read-slice-16";

            export interface ReadSlice16Args {
                input: TupleCV,
            }

            export function args(args: ReadSlice16Args): ClarityValue[] {
                return [
                    args.input,
                ];
            }

        }

        // read-slice-2
        export namespace ReadSlice2 {
            export const name = "read-slice-2";

            export interface ReadSlice2Args {
                input: TupleCV,
            }

            export function args(args: ReadSlice2Args): ClarityValue[] {
                return [
                    args.input,
                ];
            }

        }

        // read-slice-256
        export namespace ReadSlice256 {
            export const name = "read-slice-256";

            export interface ReadSlice256Args {
                input: TupleCV,
            }

            export function args(args: ReadSlice256Args): ClarityValue[] {
                return [
                    args.input,
                ];
            }

        }

        // read-slice-32
        export namespace ReadSlice32 {
            export const name = "read-slice-32";

            export interface ReadSlice32Args {
                input: TupleCV,
            }

            export function args(args: ReadSlice32Args): ClarityValue[] {
                return [
                    args.input,
                ];
            }

        }

        // read-slice-4
        export namespace ReadSlice4 {
            export const name = "read-slice-4";

            export interface ReadSlice4Args {
                input: TupleCV,
            }

            export function args(args: ReadSlice4Args): ClarityValue[] {
                return [
                    args.input,
                ];
            }

        }

        // read-slice-512
        export namespace ReadSlice512 {
            export const name = "read-slice-512";

            export interface ReadSlice512Args {
                input: TupleCV,
            }

            export function args(args: ReadSlice512Args): ClarityValue[] {
                return [
                    args.input,
                ];
            }

        }

        // read-slice-64
        export namespace ReadSlice64 {
            export const name = "read-slice-64";

            export interface ReadSlice64Args {
                input: TupleCV,
            }

            export function args(args: ReadSlice64Args): ClarityValue[] {
                return [
                    args.input,
                ];
            }

        }

        // read-slice-8
        export namespace ReadSlice8 {
            export const name = "read-slice-8";

            export interface ReadSlice8Args {
                input: TupleCV,
            }

            export function args(args: ReadSlice8Args): ClarityValue[] {
                return [
                    args.input,
                ];
            }

        }

        // read-txins
        export namespace ReadTxins {
            export const name = "read-txins";

            export interface ReadTxinsArgs {
                ctx: TupleCV,
            }

            export function args(args: ReadTxinsArgs): ClarityValue[] {
                return [
                    args.ctx,
                ];
            }

        }

        // read-txouts
        export namespace ReadTxouts {
            export const name = "read-txouts";

            export interface ReadTxoutsArgs {
                ctx: TupleCV,
            }

            export function args(args: ReadTxoutsArgs): ClarityValue[] {
                return [
                    args.ctx,
                ];
            }

        }

        // read-uint16
        export namespace ReadUint16 {
            export const name = "read-uint16";

            export interface ReadUint16Args {
                ctx: TupleCV,
            }

            export function args(args: ReadUint16Args): ClarityValue[] {
                return [
                    args.ctx,
                ];
            }

        }

        // read-uint32
        export namespace ReadUint32 {
            export const name = "read-uint32";

            export interface ReadUint32Args {
                ctx: TupleCV,
            }

            export function args(args: ReadUint32Args): ClarityValue[] {
                return [
                    args.ctx,
                ];
            }

        }

        // read-uint64
        export namespace ReadUint64 {
            export const name = "read-uint64";

            export interface ReadUint64Args {
                ctx: TupleCV,
            }

            export function args(args: ReadUint64Args): ClarityValue[] {
                return [
                    args.ctx,
                ];
            }

        }

        // read-varint
        export namespace ReadVarint {
            export const name = "read-varint";

            export interface ReadVarintArgs {
                ctx: TupleCV,
            }

            export function args(args: ReadVarintArgs): ClarityValue[] {
                return [
                    args.ctx,
                ];
            }

        }

        // read-varslice
        export namespace ReadVarslice {
            export const name = "read-varslice";

            export interface ReadVarsliceArgs {
                oldCtx: TupleCV,
            }

            export function args(args: ReadVarsliceArgs): ClarityValue[] {
                return [
                    args.oldCtx,
                ];
            }

        }

        // reverse-buff32
        export namespace ReverseBuff32 {
            export const name = "reverse-buff32";

            export interface ReverseBuff32Args {
                input: BufferCV,
            }

            export function args(args: ReverseBuff32Args): ClarityValue[] {
                return [
                    args.input,
                ];
            }

        }

        // verify-block-header
        export namespace VerifyBlockHeader {
            export const name = "verify-block-header";

            export interface VerifyBlockHeaderArgs {
                headerbuff: BufferCV,
                expectedBlockHeight: UIntCV,
            }

            export function args(args: VerifyBlockHeaderArgs): ClarityValue[] {
                return [
                    args.headerbuff,
                    args.expectedBlockHeight,
                ];
            }

        }

        // verify-merkle-proof
        export namespace VerifyMerkleProof {
            export const name = "verify-merkle-proof";

            export interface VerifyMerkleProofArgs {
                reversedTxid: BufferCV,
                merkleRoot: BufferCV,
                proof: TupleCV,
            }

            export function args(args: VerifyMerkleProofArgs): ClarityValue[] {
                return [
                    args.reversedTxid,
                    args.merkleRoot,
                    args.proof,
                ];
            }

        }

        // verify-prev-block
        export namespace VerifyPrevBlock {
            export const name = "verify-prev-block";

            export interface VerifyPrevBlockArgs {
                block: BufferCV,
                parent: BufferCV,
            }

            export function args(args: VerifyPrevBlockArgs): ClarityValue[] {
                return [
                    args.block,
                    args.parent,
                ];
            }

        }

        // verify-prev-blocks
        export namespace VerifyPrevBlocks {
            export const name = "verify-prev-blocks";

            export interface VerifyPrevBlocksArgs {
                block: BufferCV,
                prevBlocks: ListCV,
            }

            export function args(args: VerifyPrevBlocksArgs): ClarityValue[] {
                return [
                    args.block,
                    args.prevBlocks,
                ];
            }

        }

        // verify-prev-blocks-fold
        export namespace VerifyPrevBlocksFold {
            export const name = "verify-prev-blocks-fold";

            export interface VerifyPrevBlocksFoldArgs {
                parent: BufferCV,
                nextResp: ClarityValue,
            }

            export function args(args: VerifyPrevBlocksFoldArgs): ClarityValue[] {
                return [
                    args.parent,
                    args.nextResp,
                ];
            }

        }

        // was-tx-mined-prev?
        export namespace WasTxMinedPrev {
            export const name = "was-tx-mined-prev?";

            export interface WasTxMinedPrevArgs {
                block: TupleCV,
                prevBlocks: ListCV,
                tx: BufferCV,
                proof: TupleCV,
            }

            export function args(args: WasTxMinedPrevArgs): ClarityValue[] {
                return [
                    args.block,
                    args.prevBlocks,
                    args.tx,
                    args.proof,
                ];
            }

        }

        // was-tx-mined?
        export namespace WasTxMined {
            export const name = "was-tx-mined?";

            export interface WasTxMinedArgs {
                block: TupleCV,
                tx: BufferCV,
                proof: TupleCV,
            }

            export function args(args: WasTxMinedArgs): ClarityValue[] {
                return [
                    args.block,
                    args.tx,
                    args.proof,
                ];
            }

        }

    }
}

export namespace LiquidityVaultTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "liquidity-vault-trait";

}

export namespace PaymentFixedContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "payment-fixed";

    // Functions
    export namespace Functions {
        // add-contract
        export namespace AddContract {
            export const name = "add-contract";

            export interface AddContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: AddContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // callback
        export namespace Callback {
            export const name = "callback";

            export interface CallbackArgs {
                sender: PrincipalCV,
                memo: BufferCV,
            }

            export function args(args: CallbackArgs): ClarityValue[] {
                return [
                    args.sender,
                    args.memo,
                ];
            }

        }

        // make-full-payment
        export namespace MakeFullPayment {
            export const name = "make-full-payment";

            export interface MakeFullPaymentArgs {
                lpToken: ClarityValue,
                spToken: ClarityValue,
                height: UIntCV,
                loanId: UIntCV,
            }

            export function args(args: MakeFullPaymentArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.spToken,
                    args.height,
                    args.loanId,
                ];
            }

        }

        // make-next-payment
        export namespace MakeNextPayment {
            export const name = "make-next-payment";

            export interface MakeNextPaymentArgs {
                lpToken: ClarityValue,
                spToken: ClarityValue,
                height: UIntCV,
                loanId: UIntCV,
            }

            export function args(args: MakeNextPaymentArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.spToken,
                    args.height,
                    args.loanId,
                ];
            }

        }

        // remove-contract
        export namespace RemoveContract {
            export const name = "remove-contract";

            export interface RemoveContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: RemoveContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // set-early-repayment-fee
        export namespace SetEarlyRepaymentFee {
            export const name = "set-early-repayment-fee";

            export interface SetEarlyRepaymentFeeArgs {
                fee: UIntCV,
            }

            export function args(args: SetEarlyRepaymentFeeArgs): ClarityValue[] {
                return [
                    args.fee,
                ];
            }

        }

        // set-late-fee
        export namespace SetLateFee {
            export const name = "set-late-fee";

            export interface SetLateFeeArgs {
                fee: UIntCV,
            }

            export function args(args: SetLateFeeArgs): ClarityValue[] {
                return [
                    args.fee,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-payment
        export namespace GetPayment {
            export const name = "get-payment";

            export interface GetPaymentArgs {
                amount: UIntCV,
                paymentPeriod: UIntCV,
                apr: UIntCV,
                height: UIntCV,
                nextPayment: UIntCV,
            }

            export function args(args: GetPaymentArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.paymentPeriod,
                    args.apr,
                    args.height,
                    args.nextPayment,
                ];
            }

        }

        // get-prc
        export namespace GetPrc {
            export const name = "get-prc";

            export interface GetPrcArgs {
                amount: UIntCV,
                bp: UIntCV,
            }

            export function args(args: GetPrcArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.bp,
                ];
            }

        }

        // is-approved-contract
        export namespace IsApprovedContract {
            export const name = "is-approved-contract";

            export interface IsApprovedContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: IsApprovedContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // is-contract-owner
        export namespace IsContractOwner {
            export const name = "is-contract-owner";

            export interface IsContractOwnerArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsContractOwnerArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

    }
}

export namespace ProtocolTreasuryContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "protocol-treasury";

    // Functions
    export namespace Functions {
        // add-funds
        export namespace AddFunds {
            export const name = "add-funds";

            export interface AddFundsArgs {
                amount: UIntCV,
            }

            export function args(args: AddFundsArgs): ClarityValue[] {
                return [
                    args.amount,
                ];
            }

        }

    }
}

export namespace CollVaultTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "coll-vault-trait";

}

export namespace LoanTokenContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "loan-token";

    // Functions
    export namespace Functions {
        // burn
        export namespace Burn {
            export const name = "burn";

            export interface BurnArgs {
                recipient: PrincipalCV,
                amount: UIntCV,
            }

            export function args(args: BurnArgs): ClarityValue[] {
                return [
                    args.recipient,
                    args.amount,
                ];
            }

        }

        // deposit-rewards
        export namespace DepositRewards {
            export const name = "deposit-rewards";

            export interface DepositRewardsArgs {
                amount: IntCV,
            }

            export function args(args: DepositRewardsArgs): ClarityValue[] {
                return [
                    args.amount,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // mint
        export namespace Mint {
            export const name = "mint";

            export interface MintArgs {
                recipient: PrincipalCV,
                amount: UIntCV,
            }

            export function args(args: MintArgs): ClarityValue[] {
                return [
                    args.recipient,
                    args.amount,
                ];
            }

        }

        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                value: StringUtf8CV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: NoneCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // withdraw-funds
        export namespace WithdrawFunds {
            export const name = "withdraw-funds";

        }

        // accumulative-funds-of
        export namespace AccumulativeFundsOf {
            export const name = "accumulative-funds-of";

            export interface AccumulativeFundsOfArgs {
                owner: PrincipalCV,
            }

            export function args(args: AccumulativeFundsOfArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                account: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.account,
                ];
            }

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

        }

        // get-name
        export namespace GetName {
            export const name = "get-name";

        }

        // get-symbol
        export namespace GetSymbol {
            export const name = "get-symbol";

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

        }

        // is-contract-owner
        export namespace IsContractOwner {
            export const name = "is-contract-owner";

            export interface IsContractOwnerArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsContractOwnerArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

        // withdrawable-funds-of
        export namespace WithdrawableFundsOf {
            export const name = "withdrawable-funds-of";

            export interface WithdrawableFundsOfArgs {
                owner: PrincipalCV,
            }

            export function args(args: WithdrawableFundsOfArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

    }
}

export namespace FundingVaultContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "funding-vault";

    // Functions
    export namespace Functions {
        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                recipient: PrincipalCV,
                ft: ClarityValue,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.recipient,
                    args.ft,
                ];
            }

        }

        // is-contract-owner
        export namespace IsContractOwner {
            export const name = "is-contract-owner";

            export interface IsContractOwnerArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsContractOwnerArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

    }
}

export namespace LoanPaymentTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "loan-payment-trait";

}

export namespace BridgeRouterTestContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "bridge-router-test";

    // Functions
    export namespace Functions {
        // add-deposit
        export namespace AddDeposit {
            export const name = "add-deposit";

            export interface AddDepositArgs {
                depositId: UIntCV,
                amount: UIntCV,
                burnchainHeight: UIntCV,
            }

            export function args(args: AddDepositArgs): ClarityValue[] {
                return [
                    args.depositId,
                    args.amount,
                    args.burnchainHeight,
                ];
            }

        }

        // add-withdrawal
        export namespace AddWithdrawal {
            export const name = "add-withdrawal";

            export interface AddWithdrawalArgs {
                withdrawalId: UIntCV,
                amount: UIntCV,
                burnchainHeight: UIntCV,
            }

            export function args(args: AddWithdrawalArgs): ClarityValue[] {
                return [
                    args.withdrawalId,
                    args.amount,
                    args.burnchainHeight,
                ];
            }

        }

        // deposit-to-pool
        export namespace DepositToPool {
            export const name = "deposit-to-pool";

            export interface DepositToPoolArgs {
                lpToken: ClarityValue,
                zpToken: ClarityValue,
                lv: ClarityValue,
            }

            export function args(args: DepositToPoolArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.zpToken,
                    args.lv,
                ];
            }

        }

        // drawdown
        export namespace Drawdown {
            export const name = "drawdown";

            export interface DrawdownArgs {
                loanId: UIntCV,
                height: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
            }

            export function args(args: DrawdownArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.height,
                    args.collToken,
                    args.collVault,
                    args.fv,
                ];
            }

        }

        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // set-loan-contract
        export namespace SetLoanContract {
            export const name = "set-loan-contract";

            export interface SetLoanContractArgs {
                loan: PrincipalCV,
            }

            export function args(args: SetLoanContractArgs): ClarityValue[] {
                return [
                    args.loan,
                ];
            }

        }

        // transfer-funds
        export namespace TransferFunds {
            export const name = "transfer-funds";

            export interface TransferFundsArgs {
                amount: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: TransferFundsArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.recipient,
                ];
            }

        }

        // verify-full-payment
        export namespace VerifyFullPayment {
            export const name = "verify-full-payment";

            export interface VerifyFullPaymentArgs {
                loanId: UIntCV,
                height: UIntCV,
                payment: ClarityValue,
                lpToken: ClarityValue,
                spToken: ClarityValue,
                amount: UIntCV,
            }

            export function args(args: VerifyFullPaymentArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.height,
                    args.payment,
                    args.lpToken,
                    args.spToken,
                    args.amount,
                ];
            }

        }

        // verify-payment
        export namespace VerifyPayment {
            export const name = "verify-payment";

            export interface VerifyPaymentArgs {
                loanId: UIntCV,
                height: UIntCV,
                payment: ClarityValue,
                lpToken: ClarityValue,
                spToken: ClarityValue,
                amount: UIntCV,
            }

            export function args(args: VerifyPaymentArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.height,
                    args.payment,
                    args.lpToken,
                    args.spToken,
                    args.amount,
                ];
            }

        }

        // withdraw-from-pool
        export namespace WithdrawFromPool {
            export const name = "withdraw-from-pool";

            export interface WithdrawFromPoolArgs {
                lpToken: ClarityValue,
                lv: ClarityValue,
                amount: UIntCV,
            }

            export function args(args: WithdrawFromPoolArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.lv,
                    args.amount,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-deposit
        export namespace GetDeposit {
            export const name = "get-deposit";

            export interface GetDepositArgs {
                id: UIntCV,
            }

            export function args(args: GetDepositArgs): ClarityValue[] {
                return [
                    args.id,
                ];
            }

        }

        // is-contract-owner
        export namespace IsContractOwner {
            export const name = "is-contract-owner";

            export interface IsContractOwnerArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsContractOwnerArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

    }
}

export namespace DistributionTokenTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "distribution-token-trait";

}

export namespace SpTokenContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "sp-token";

    // Functions
    export namespace Functions {
        // add-contract
        export namespace AddContract {
            export const name = "add-contract";

            export interface AddContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: AddContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // burn
        export namespace Burn {
            export const name = "burn";

            export interface BurnArgs {
                owner: PrincipalCV,
                amount: UIntCV,
            }

            export function args(args: BurnArgs): ClarityValue[] {
                return [
                    args.owner,
                    args.amount,
                ];
            }

        }

        // deposit-rewards
        export namespace DepositRewards {
            export const name = "deposit-rewards";

            export interface DepositRewardsArgs {
                amount: IntCV,
            }

            export function args(args: DepositRewardsArgs): ClarityValue[] {
                return [
                    args.amount,
                ];
            }

        }

        // distribute-losses-public
        export namespace DistributeLossesPublic {
            export const name = "distribute-losses-public";

            export interface DistributeLossesPublicArgs {
                delta: IntCV,
            }

            export function args(args: DistributeLossesPublicArgs): ClarityValue[] {
                return [
                    args.delta,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // mint
        export namespace Mint {
            export const name = "mint";

            export interface MintArgs {
                recipient: PrincipalCV,
                amount: UIntCV,
            }

            export function args(args: MintArgs): ClarityValue[] {
                return [
                    args.recipient,
                    args.amount,
                ];
            }

        }

        // remove-contract
        export namespace RemoveContract {
            export const name = "remove-contract";

            export interface RemoveContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: RemoveContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                value: StringUtf8CV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: NoneCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // withdraw-deposit
        export namespace WithdrawDeposit {
            export const name = "withdraw-deposit";

            export interface WithdrawDepositArgs {
                owner: PrincipalCV,
            }

            export function args(args: WithdrawDepositArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // withdraw-funds
        export namespace WithdrawFunds {
            export const name = "withdraw-funds";

        }

        // accumulative-funds-of
        export namespace AccumulativeFundsOf {
            export const name = "accumulative-funds-of";

            export interface AccumulativeFundsOfArgs {
                owner: PrincipalCV,
            }

            export function args(args: AccumulativeFundsOfArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // accumulative-losses-of
        export namespace AccumulativeLossesOf {
            export const name = "accumulative-losses-of";

            export interface AccumulativeLossesOfArgs {
                owner: PrincipalCV,
            }

            export function args(args: AccumulativeLossesOfArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                account: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.account,
                ];
            }

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

        }

        // get-name
        export namespace GetName {
            export const name = "get-name";

        }

        // get-symbol
        export namespace GetSymbol {
            export const name = "get-symbol";

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

        }

        // is-approved-contract
        export namespace IsApprovedContract {
            export const name = "is-approved-contract";

            export interface IsApprovedContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: IsApprovedContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // is-contract-owner
        export namespace IsContractOwner {
            export const name = "is-contract-owner";

            export interface IsContractOwnerArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsContractOwnerArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

        // recognizable-losses-of
        export namespace RecognizableLossesOf {
            export const name = "recognizable-losses-of";

            export interface RecognizableLossesOfArgs {
                owner: PrincipalCV,
            }

            export function args(args: RecognizableLossesOfArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // withdrawable-funds-of
        export namespace WithdrawableFundsOf {
            export const name = "withdrawable-funds-of";

            export interface WithdrawableFundsOfArgs {
                owner: PrincipalCV,
            }

            export function args(args: WithdrawableFundsOfArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

    }
}

export namespace Zge002EmergencyProposalsContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "zge002-emergency-proposals";

    // Functions
    export namespace Functions {
        // callback
        export namespace Callback {
            export const name = "callback";

            export interface CallbackArgs {
                sender: PrincipalCV,
                memo: BufferCV,
            }

            export function args(args: CallbackArgs): ClarityValue[] {
                return [
                    args.sender,
                    args.memo,
                ];
            }

        }

        // emergency-propose
        export namespace EmergencyPropose {
            export const name = "emergency-propose";

            export interface EmergencyProposeArgs {
                proposal: ClarityValue,
            }

            export function args(args: EmergencyProposeArgs): ClarityValue[] {
                return [
                    args.proposal,
                ];
            }

        }

        // is-dao-or-extension
        export namespace IsDaoOrExtension {
            export const name = "is-dao-or-extension";

        }

        // set-emergency-proposal-duration
        export namespace SetEmergencyProposalDuration {
            export const name = "set-emergency-proposal-duration";

            export interface SetEmergencyProposalDurationArgs {
                duration: UIntCV,
            }

            export function args(args: SetEmergencyProposalDurationArgs): ClarityValue[] {
                return [
                    args.duration,
                ];
            }

        }

        // set-emergency-team-member
        export namespace SetEmergencyTeamMember {
            export const name = "set-emergency-team-member";

            export interface SetEmergencyTeamMemberArgs {
                who: PrincipalCV,
                member: BooleanCV,
            }

            export function args(args: SetEmergencyTeamMemberArgs): ClarityValue[] {
                return [
                    args.who,
                    args.member,
                ];
            }

        }

        // set-emergency-team-sunset-height
        export namespace SetEmergencyTeamSunsetHeight {
            export const name = "set-emergency-team-sunset-height";

            export interface SetEmergencyTeamSunsetHeightArgs {
                height: UIntCV,
            }

            export function args(args: SetEmergencyTeamSunsetHeightArgs): ClarityValue[] {
                return [
                    args.height,
                ];
            }

        }

        // is-emergency-team-member
        export namespace IsEmergencyTeamMember {
            export const name = "is-emergency-team-member";

            export interface IsEmergencyTeamMemberArgs {
                who: PrincipalCV,
            }

            export function args(args: IsEmergencyTeamMemberArgs): ClarityValue[] {
                return [
                    args.who,
                ];
            }

        }

    }
}

export namespace TestUtilsContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "test-utils";

    // Functions
    export namespace Functions {
        // set-burn-header
        export namespace SetBurnHeader {
            export const name = "set-burn-header";

            export interface SetBurnHeaderArgs {
                height: UIntCV,
                header: BufferCV,
            }

            export function args(args: SetBurnHeaderArgs): ClarityValue[] {
                return [
                    args.height,
                    args.header,
                ];
            }

        }

        // set-mined
        export namespace SetMined {
            export const name = "set-mined";

            export interface SetMinedArgs {
                txid: BufferCV,
            }

            export function args(args: SetMinedArgs): ClarityValue[] {
                return [
                    args.txid,
                ];
            }

        }

        // burn-block-header
        export namespace BurnBlockHeader {
            export const name = "burn-block-header";

            export interface BurnBlockHeaderArgs {
                height: UIntCV,
            }

            export function args(args: BurnBlockHeaderArgs): ClarityValue[] {
                return [
                    args.height,
                ];
            }

        }

        // was-mined
        export namespace WasMined {
            export const name = "was-mined";

            export interface WasMinedArgs {
                txid: BufferCV,
            }

            export function args(args: WasMinedArgs): ClarityValue[] {
                return [
                    args.txid,
                ];
            }

        }

    }
}

export namespace Zge000GovernanceTokenContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "zge000-governance-token";

    // Functions
    export namespace Functions {
        // callback
        export namespace Callback {
            export const name = "callback";

            export interface CallbackArgs {
                sender: PrincipalCV,
                memo: BufferCV,
            }

            export function args(args: CallbackArgs): ClarityValue[] {
                return [
                    args.sender,
                    args.memo,
                ];
            }

        }

        // edg-burn
        export namespace EdgBurn {
            export const name = "edg-burn";

            export interface EdgBurnArgs {
                amount: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: EdgBurnArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.owner,
                ];
            }

        }

        // edg-lock
        export namespace EdgLock {
            export const name = "edg-lock";

            export interface EdgLockArgs {
                amount: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: EdgLockArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.owner,
                ];
            }

        }

        // edg-mint
        export namespace EdgMint {
            export const name = "edg-mint";

            export interface EdgMintArgs {
                amount: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: EdgMintArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.recipient,
                ];
            }

        }

        // edg-mint-many
        export namespace EdgMintMany {
            export const name = "edg-mint-many";

            export interface EdgMintManyArgs {
                recipients: ListCV,
            }

            export function args(args: EdgMintManyArgs): ClarityValue[] {
                return [
                    args.recipients,
                ];
            }

        }

        // edg-transfer
        export namespace EdgTransfer {
            export const name = "edg-transfer";

            export interface EdgTransferArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
            }

            export function args(args: EdgTransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                ];
            }

        }

        // edg-unlock
        export namespace EdgUnlock {
            export const name = "edg-unlock";

            export interface EdgUnlockArgs {
                amount: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: EdgUnlockArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.owner,
                ];
            }

        }

        // is-dao-or-extension
        export namespace IsDaoOrExtension {
            export const name = "is-dao-or-extension";

        }

        // set-decimals
        export namespace SetDecimals {
            export const name = "set-decimals";

            export interface SetDecimalsArgs {
                newDecimals: UIntCV,
            }

            export function args(args: SetDecimalsArgs): ClarityValue[] {
                return [
                    args.newDecimals,
                ];
            }

        }

        // set-name
        export namespace SetName {
            export const name = "set-name";

            export interface SetNameArgs {
                newName: StringAsciiCV,
            }

            export function args(args: SetNameArgs): ClarityValue[] {
                return [
                    args.newName,
                ];
            }

        }

        // set-symbol
        export namespace SetSymbol {
            export const name = "set-symbol";

            export interface SetSymbolArgs {
                newSymbol: StringAsciiCV,
            }

            export function args(args: SetSymbolArgs): ClarityValue[] {
                return [
                    args.newSymbol,
                ];
            }

        }

        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                newUri: NoneCV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.newUri,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: NoneCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // edg-get-balance
        export namespace EdgGetBalance {
            export const name = "edg-get-balance";

            export interface EdgGetBalanceArgs {
                who: PrincipalCV,
            }

            export function args(args: EdgGetBalanceArgs): ClarityValue[] {
                return [
                    args.who,
                ];
            }

        }

        // edg-get-locked
        export namespace EdgGetLocked {
            export const name = "edg-get-locked";

            export interface EdgGetLockedArgs {
                owner: PrincipalCV,
            }

            export function args(args: EdgGetLockedArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // edg-has-percentage-balance
        export namespace EdgHasPercentageBalance {
            export const name = "edg-has-percentage-balance";

            export interface EdgHasPercentageBalanceArgs {
                who: PrincipalCV,
                factor: UIntCV,
            }

            export function args(args: EdgHasPercentageBalanceArgs): ClarityValue[] {
                return [
                    args.who,
                    args.factor,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                who: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.who,
                ];
            }

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

        }

        // get-name
        export namespace GetName {
            export const name = "get-name";

        }

        // get-symbol
        export namespace GetSymbol {
            export const name = "get-symbol";

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

        }

    }
}

export namespace Zge003EmergencyExecuteContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "zge003-emergency-execute";

    // Functions
    export namespace Functions {
        // callback
        export namespace Callback {
            export const name = "callback";

            export interface CallbackArgs {
                sender: PrincipalCV,
                memo: BufferCV,
            }

            export function args(args: CallbackArgs): ClarityValue[] {
                return [
                    args.sender,
                    args.memo,
                ];
            }

        }

        // executive-action
        export namespace ExecutiveAction {
            export const name = "executive-action";

            export interface ExecutiveActionArgs {
                proposal: ClarityValue,
            }

            export function args(args: ExecutiveActionArgs): ClarityValue[] {
                return [
                    args.proposal,
                ];
            }

        }

        // is-dao-or-extension
        export namespace IsDaoOrExtension {
            export const name = "is-dao-or-extension";

        }

        // set-executive-team-member
        export namespace SetExecutiveTeamMember {
            export const name = "set-executive-team-member";

            export interface SetExecutiveTeamMemberArgs {
                who: PrincipalCV,
                member: BooleanCV,
            }

            export function args(args: SetExecutiveTeamMemberArgs): ClarityValue[] {
                return [
                    args.who,
                    args.member,
                ];
            }

        }

        // set-executive-team-sunset-height
        export namespace SetExecutiveTeamSunsetHeight {
            export const name = "set-executive-team-sunset-height";

            export interface SetExecutiveTeamSunsetHeightArgs {
                height: UIntCV,
            }

            export function args(args: SetExecutiveTeamSunsetHeightArgs): ClarityValue[] {
                return [
                    args.height,
                ];
            }

        }

        // set-signals-required
        export namespace SetSignalsRequired {
            export const name = "set-signals-required";

            export interface SetSignalsRequiredArgs {
                newRequirement: UIntCV,
            }

            export function args(args: SetSignalsRequiredArgs): ClarityValue[] {
                return [
                    args.newRequirement,
                ];
            }

        }

        // get-signals
        export namespace GetSignals {
            export const name = "get-signals";

            export interface GetSignalsArgs {
                proposal: PrincipalCV,
            }

            export function args(args: GetSignalsArgs): ClarityValue[] {
                return [
                    args.proposal,
                ];
            }

        }

        // get-signals-required
        export namespace GetSignalsRequired {
            export const name = "get-signals-required";

        }

        // has-signalled
        export namespace HasSignalled {
            export const name = "has-signalled";

            export interface HasSignalledArgs {
                proposal: PrincipalCV,
                who: PrincipalCV,
            }

            export function args(args: HasSignalledArgs): ClarityValue[] {
                return [
                    args.proposal,
                    args.who,
                ];
            }

        }

        // is-executive-team-member
        export namespace IsExecutiveTeamMember {
            export const name = "is-executive-team-member";

            export interface IsExecutiveTeamMemberArgs {
                who: PrincipalCV,
            }

            export function args(args: IsExecutiveTeamMemberArgs): ClarityValue[] {
                return [
                    args.who,
                ];
            }

        }

    }
}

export namespace BridgeContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "bridge";

    // Functions
    export namespace Functions {
        // add-funds
        export namespace AddFunds {
            export const name = "add-funds";

            export interface AddFundsArgs {
                amount: UIntCV,
            }

            export function args(args: AddFundsArgs): ClarityValue[] {
                return [
                    args.amount,
                ];
            }

        }

        // escrow-swap
        export namespace EscrowSwap {
            export const name = "escrow-swap";

            export interface EscrowSwapArgs {
                block: TupleCV,
                prevBlocks: ListCV,
                tx: BufferCV,
                proof: TupleCV,
                outputIndex: UIntCV,
                sender: BufferCV,
                recipient: BufferCV,
                expirationBuff: BufferCV,
                hash: BufferCV,
                swapperBuff: BufferCV,
                supplierId: UIntCV,
            }

            export function args(args: EscrowSwapArgs): ClarityValue[] {
                return [
                    args.block,
                    args.prevBlocks,
                    args.tx,
                    args.proof,
                    args.outputIndex,
                    args.sender,
                    args.recipient,
                    args.expirationBuff,
                    args.hash,
                    args.swapperBuff,
                    args.supplierId,
                ];
            }

        }

        // finalize-outbound-swap
        export namespace FinalizeOutboundSwap {
            export const name = "finalize-outbound-swap";

            export interface FinalizeOutboundSwapArgs {
                block: TupleCV,
                prevBlocks: ListCV,
                tx: BufferCV,
                proof: TupleCV,
                outputIndex: UIntCV,
                swapId: UIntCV,
            }

            export function args(args: FinalizeOutboundSwapArgs): ClarityValue[] {
                return [
                    args.block,
                    args.prevBlocks,
                    args.tx,
                    args.proof,
                    args.outputIndex,
                    args.swapId,
                ];
            }

        }

        // finalize-swap
        export namespace FinalizeSwap {
            export const name = "finalize-swap";

            export interface FinalizeSwapArgs {
                txid: BufferCV,
                preimage: BufferCV,
            }

            export function args(args: FinalizeSwapArgs): ClarityValue[] {
                return [
                    args.txid,
                    args.preimage,
                ];
            }

        }

        // initialize-swapper
        export namespace InitializeSwapper {
            export const name = "initialize-swapper";

        }

        // initiate-outbound-swap
        export namespace InitiateOutboundSwap {
            export const name = "initiate-outbound-swap";

            export interface InitiateOutboundSwapArgs {
                xbtc: UIntCV,
                btcVersion: BufferCV,
                btcHash: BufferCV,
                supplierId: UIntCV,
            }

            export function args(args: InitiateOutboundSwapArgs): ClarityValue[] {
                return [
                    args.xbtc,
                    args.btcVersion,
                    args.btcHash,
                    args.supplierId,
                ];
            }

        }

        // register-supplier
        export namespace RegisterSupplier {
            export const name = "register-supplier";

            export interface RegisterSupplierArgs {
                publicKey: BufferCV,
                inboundFee: NoneCV,
                outboundFee: NoneCV,
                outboundBaseFee: IntCV,
                inboundBaseFee: IntCV,
                name: StringAsciiCV,
                funds: UIntCV,
            }

            export function args(args: RegisterSupplierArgs): ClarityValue[] {
                return [
                    args.publicKey,
                    args.inboundFee,
                    args.outboundFee,
                    args.outboundBaseFee,
                    args.inboundBaseFee,
                    args.name,
                    args.funds,
                ];
            }

        }

        // remove-funds
        export namespace RemoveFunds {
            export const name = "remove-funds";

            export interface RemoveFundsArgs {
                amount: UIntCV,
            }

            export function args(args: RemoveFundsArgs): ClarityValue[] {
                return [
                    args.amount,
                ];
            }

        }

        // revoke-expired-outbound
        export namespace RevokeExpiredOutbound {
            export const name = "revoke-expired-outbound";

            export interface RevokeExpiredOutboundArgs {
                swapId: UIntCV,
            }

            export function args(args: RevokeExpiredOutboundArgs): ClarityValue[] {
                return [
                    args.swapId,
                ];
            }

        }

        // update-supplier-fees
        export namespace UpdateSupplierFees {
            export const name = "update-supplier-fees";

            export interface UpdateSupplierFeesArgs {
                inboundFee: NoneCV,
                outboundFee: NoneCV,
                outboundBaseFee: IntCV,
                inboundBaseFee: IntCV,
            }

            export function args(args: UpdateSupplierFeesArgs): ClarityValue[] {
                return [
                    args.inboundFee,
                    args.outboundFee,
                    args.outboundBaseFee,
                    args.inboundBaseFee,
                ];
            }

        }

        // update-supplier-name
        export namespace UpdateSupplierName {
            export const name = "update-supplier-name";

            export interface UpdateSupplierNameArgs {
                name: StringAsciiCV,
            }

            export function args(args: UpdateSupplierNameArgs): ClarityValue[] {
                return [
                    args.name,
                ];
            }

        }

        // update-supplier-public-key
        export namespace UpdateSupplierPublicKey {
            export const name = "update-supplier-public-key";

            export interface UpdateSupplierPublicKeyArgs {
                publicKey: BufferCV,
            }

            export function args(args: UpdateSupplierPublicKeyArgs): ClarityValue[] {
                return [
                    args.publicKey,
                ];
            }

        }

        // buff-to-u8
        export namespace BuffToU8 {
            export const name = "buff-to-u8";

            export interface BuffToU8Args {
                byte: BufferCV,
            }

            export function args(args: BuffToU8Args): ClarityValue[] {
                return [
                    args.byte,
                ];
            }

        }

        // bytes-len
        export namespace BytesLen {
            export const name = "bytes-len";

            export interface BytesLenArgs {
                bytes: BufferCV,
            }

            export function args(args: BytesLenArgs): ClarityValue[] {
                return [
                    args.bytes,
                ];
            }

        }

        // concat-buffs
        export namespace ConcatBuffs {
            export const name = "concat-buffs";

            export interface ConcatBuffsArgs {
                buffs: ListCV,
            }

            export function args(args: ConcatBuffsArgs): ClarityValue[] {
                return [
                    args.buffs,
                ];
            }

        }

        // generate-htlc-script
        export namespace GenerateHtlcScript {
            export const name = "generate-htlc-script";

            export interface GenerateHtlcScriptArgs {
                sender: BufferCV,
                recipient: BufferCV,
                expiration: BufferCV,
                hash: BufferCV,
                swapper: BufferCV,
            }

            export function args(args: GenerateHtlcScriptArgs): ClarityValue[] {
                return [
                    args.sender,
                    args.recipient,
                    args.expiration,
                    args.hash,
                    args.swapper,
                ];
            }

        }

        // generate-htlc-script-hash
        export namespace GenerateHtlcScriptHash {
            export const name = "generate-htlc-script-hash";

            export interface GenerateHtlcScriptHashArgs {
                sender: BufferCV,
                recipient: BufferCV,
                expiration: BufferCV,
                hash: BufferCV,
                swapper: BufferCV,
            }

            export function args(args: GenerateHtlcScriptHashArgs): ClarityValue[] {
                return [
                    args.sender,
                    args.recipient,
                    args.expiration,
                    args.hash,
                    args.swapper,
                ];
            }

        }

        // generate-output
        export namespace GenerateOutput {
            export const name = "generate-output";

            export interface GenerateOutputArgs {
                version: BufferCV,
                hash: BufferCV,
            }

            export function args(args: GenerateOutputArgs): ClarityValue[] {
                return [
                    args.version,
                    args.hash,
                ];
            }

        }

        // generate-p2pkh-output
        export namespace GenerateP2pkhOutput {
            export const name = "generate-p2pkh-output";

            export interface GenerateP2pkhOutputArgs {
                hash: BufferCV,
            }

            export function args(args: GenerateP2pkhOutputArgs): ClarityValue[] {
                return [
                    args.hash,
                ];
            }

        }

        // generate-p2sh-output
        export namespace GenerateP2shOutput {
            export const name = "generate-p2sh-output";

            export interface GenerateP2shOutputArgs {
                hash: BufferCV,
            }

            export function args(args: GenerateP2shOutputArgs): ClarityValue[] {
                return [
                    args.hash,
                ];
            }

        }

        // generate-script-hash
        export namespace GenerateScriptHash {
            export const name = "generate-script-hash";

            export interface GenerateScriptHashArgs {
                script: BufferCV,
            }

            export function args(args: GenerateScriptHashArgs): ClarityValue[] {
                return [
                    args.script,
                ];
            }

        }

        // get-amount-with-fee-rate
        export namespace GetAmountWithFeeRate {
            export const name = "get-amount-with-fee-rate";

            export interface GetAmountWithFeeRateArgs {
                amount: UIntCV,
                feeRate: IntCV,
            }

            export function args(args: GetAmountWithFeeRateArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.feeRate,
                ];
            }

        }

        // get-completed-outbound-swap-by-txid
        export namespace GetCompletedOutboundSwapByTxid {
            export const name = "get-completed-outbound-swap-by-txid";

            export interface GetCompletedOutboundSwapByTxidArgs {
                txid: BufferCV,
            }

            export function args(args: GetCompletedOutboundSwapByTxidArgs): ClarityValue[] {
                return [
                    args.txid,
                ];
            }

        }

        // get-completed-outbound-swap-txid
        export namespace GetCompletedOutboundSwapTxid {
            export const name = "get-completed-outbound-swap-txid";

            export interface GetCompletedOutboundSwapTxidArgs {
                id: UIntCV,
            }

            export function args(args: GetCompletedOutboundSwapTxidArgs): ClarityValue[] {
                return [
                    args.id,
                ];
            }

        }

        // get-escrow
        export namespace GetEscrow {
            export const name = "get-escrow";

            export interface GetEscrowArgs {
                id: UIntCV,
            }

            export function args(args: GetEscrowArgs): ClarityValue[] {
                return [
                    args.id,
                ];
            }

        }

        // get-full-inbound
        export namespace GetFullInbound {
            export const name = "get-full-inbound";

            export interface GetFullInboundArgs {
                txid: BufferCV,
            }

            export function args(args: GetFullInboundArgs): ClarityValue[] {
                return [
                    args.txid,
                ];
            }

        }

        // get-full-supplier
        export namespace GetFullSupplier {
            export const name = "get-full-supplier";

            export interface GetFullSupplierArgs {
                id: UIntCV,
            }

            export function args(args: GetFullSupplierArgs): ClarityValue[] {
                return [
                    args.id,
                ];
            }

        }

        // get-funds
        export namespace GetFunds {
            export const name = "get-funds";

            export interface GetFundsArgs {
                id: UIntCV,
            }

            export function args(args: GetFundsArgs): ClarityValue[] {
                return [
                    args.id,
                ];
            }

        }

        // get-inbound-meta
        export namespace GetInboundMeta {
            export const name = "get-inbound-meta";

            export interface GetInboundMetaArgs {
                txid: BufferCV,
            }

            export function args(args: GetInboundMetaArgs): ClarityValue[] {
                return [
                    args.txid,
                ];
            }

        }

        // get-inbound-swap
        export namespace GetInboundSwap {
            export const name = "get-inbound-swap";

            export interface GetInboundSwapArgs {
                txid: BufferCV,
            }

            export function args(args: GetInboundSwapArgs): ClarityValue[] {
                return [
                    args.txid,
                ];
            }

        }

        // get-next-outbound-id
        export namespace GetNextOutboundId {
            export const name = "get-next-outbound-id";

        }

        // get-next-supplier-id
        export namespace GetNextSupplierId {
            export const name = "get-next-supplier-id";

        }

        // get-next-swapper-id
        export namespace GetNextSwapperId {
            export const name = "get-next-swapper-id";

        }

        // get-outbound-swap
        export namespace GetOutboundSwap {
            export const name = "get-outbound-swap";

            export interface GetOutboundSwapArgs {
                id: UIntCV,
            }

            export function args(args: GetOutboundSwapArgs): ClarityValue[] {
                return [
                    args.id,
                ];
            }

        }

        // get-preimage
        export namespace GetPreimage {
            export const name = "get-preimage";

            export interface GetPreimageArgs {
                txid: BufferCV,
            }

            export function args(args: GetPreimageArgs): ClarityValue[] {
                return [
                    args.txid,
                ];
            }

        }

        // get-supplier
        export namespace GetSupplier {
            export const name = "get-supplier";

            export interface GetSupplierArgs {
                id: UIntCV,
            }

            export function args(args: GetSupplierArgs): ClarityValue[] {
                return [
                    args.id,
                ];
            }

        }

        // get-supplier-by-name
        export namespace GetSupplierByName {
            export const name = "get-supplier-by-name";

            export interface GetSupplierByNameArgs {
                name: StringAsciiCV,
            }

            export function args(args: GetSupplierByNameArgs): ClarityValue[] {
                return [
                    args.name,
                ];
            }

        }

        // get-supplier-id-by-controller
        export namespace GetSupplierIdByController {
            export const name = "get-supplier-id-by-controller";

            export interface GetSupplierIdByControllerArgs {
                controller: PrincipalCV,
            }

            export function args(args: GetSupplierIdByControllerArgs): ClarityValue[] {
                return [
                    args.controller,
                ];
            }

        }

        // get-supplier-id-by-public-key
        export namespace GetSupplierIdByPublicKey {
            export const name = "get-supplier-id-by-public-key";

            export interface GetSupplierIdByPublicKeyArgs {
                publicKey: BufferCV,
            }

            export function args(args: GetSupplierIdByPublicKeyArgs): ClarityValue[] {
                return [
                    args.publicKey,
                ];
            }

        }

        // get-swap-amount
        export namespace GetSwapAmount {
            export const name = "get-swap-amount";

            export interface GetSwapAmountArgs {
                amount: UIntCV,
                feeRate: IntCV,
                baseFee: IntCV,
            }

            export function args(args: GetSwapAmountArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.feeRate,
                    args.baseFee,
                ];
            }

        }

        // get-swapper-id
        export namespace GetSwapperId {
            export const name = "get-swapper-id";

            export interface GetSwapperIdArgs {
                swapper: PrincipalCV,
            }

            export function args(args: GetSwapperIdArgs): ClarityValue[] {
                return [
                    args.swapper,
                ];
            }

        }

        // get-swapper-principal
        export namespace GetSwapperPrincipal {
            export const name = "get-swapper-principal";

            export interface GetSwapperPrincipalArgs {
                id: UIntCV,
            }

            export function args(args: GetSwapperPrincipalArgs): ClarityValue[] {
                return [
                    args.id,
                ];
            }

        }

        // get-total-inbound-volume
        export namespace GetTotalInboundVolume {
            export const name = "get-total-inbound-volume";

        }

        // get-total-outbound-volume
        export namespace GetTotalOutboundVolume {
            export const name = "get-total-outbound-volume";

        }

        // get-total-volume
        export namespace GetTotalVolume {
            export const name = "get-total-volume";

        }

        // get-user-inbound-volume
        export namespace GetUserInboundVolume {
            export const name = "get-user-inbound-volume";

            export interface GetUserInboundVolumeArgs {
                user: PrincipalCV,
            }

            export function args(args: GetUserInboundVolumeArgs): ClarityValue[] {
                return [
                    args.user,
                ];
            }

        }

        // get-user-outbound-volume
        export namespace GetUserOutboundVolume {
            export const name = "get-user-outbound-volume";

            export interface GetUserOutboundVolumeArgs {
                user: PrincipalCV,
            }

            export function args(args: GetUserOutboundVolumeArgs): ClarityValue[] {
                return [
                    args.user,
                ];
            }

        }

        // get-user-total-volume
        export namespace GetUserTotalVolume {
            export const name = "get-user-total-volume";

            export interface GetUserTotalVolumeArgs {
                user: PrincipalCV,
            }

            export function args(args: GetUserTotalVolumeArgs): ClarityValue[] {
                return [
                    args.user,
                ];
            }

        }

        // read-uint32
        export namespace ReadUint32 {
            export const name = "read-uint32";

            export interface ReadUint32Args {
                num: BufferCV,
                length: UIntCV,
            }

            export function args(args: ReadUint32Args): ClarityValue[] {
                return [
                    args.num,
                    args.length,
                ];
            }

        }

        // validate-btc-addr
        export namespace ValidateBtcAddr {
            export const name = "validate-btc-addr";

            export interface ValidateBtcAddrArgs {
                version: BufferCV,
                hash: BufferCV,
            }

            export function args(args: ValidateBtcAddrArgs): ClarityValue[] {
                return [
                    args.version,
                    args.hash,
                ];
            }

        }

        // validate-expiration
        export namespace ValidateExpiration {
            export const name = "validate-expiration";

            export interface ValidateExpirationArgs {
                expiration: UIntCV,
                minedHeight: UIntCV,
            }

            export function args(args: ValidateExpirationArgs): ClarityValue[] {
                return [
                    args.expiration,
                    args.minedHeight,
                ];
            }

        }

        // validate-fee
        export namespace ValidateFee {
            export const name = "validate-fee";

            export interface ValidateFeeArgs {
                feeOpt: NoneCV,
            }

            export function args(args: ValidateFeeArgs): ClarityValue[] {
                return [
                    args.feeOpt,
                ];
            }

        }

        // validate-outbound-revocable
        export namespace ValidateOutboundRevocable {
            export const name = "validate-outbound-revocable";

            export interface ValidateOutboundRevocableArgs {
                swapId: UIntCV,
            }

            export function args(args: ValidateOutboundRevocableArgs): ClarityValue[] {
                return [
                    args.swapId,
                ];
            }

        }

    }
}

export namespace LpTokenTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "lp-token-trait";

}

export namespace LoanPaymentLateFixedContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "loan-payment-late-fixed";

    // Functions
    export namespace Functions {
        // get-interest-payment
        export namespace GetInterestPayment {
            export const name = "get-interest-payment";

            export interface GetInterestPaymentArgs {
                amount: UIntCV,
                apr: UIntCV,
                blockDelta: UIntCV,
            }

            export function args(args: GetInterestPaymentArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.apr,
                    args.blockDelta,
                ];
            }

        }

        // get-rate
        export namespace GetRate {
            export const name = "get-rate";

        }

        // get-ratio
        export namespace GetRatio {
            export const name = "get-ratio";

        }

        // set-parameters
        export namespace SetParameters {
            export const name = "set-parameters";

        }

    }
}

export namespace PaymentTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "payment-trait";

}

export namespace Zgp000BootstrapContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "zgp000-bootstrap";

    // Functions
    export namespace Functions {
        // execute
        export namespace Execute {
            export const name = "execute";

            export interface ExecuteArgs {
                sender: PrincipalCV,
            }

            export function args(args: ExecuteArgs): ClarityValue[] {
                return [
                    args.sender,
                ];
            }

        }

    }
}

export namespace Zge004OnboardBorrowerContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "zge004-onboard-borrower";

    // Functions
    export namespace Functions {
        // callback
        export namespace Callback {
            export const name = "callback";

            export interface CallbackArgs {
                sender: PrincipalCV,
                memo: BufferCV,
            }

            export function args(args: CallbackArgs): ClarityValue[] {
                return [
                    args.sender,
                    args.memo,
                ];
            }

        }

        // is-dao-or-extension
        export namespace IsDaoOrExtension {
            export const name = "is-dao-or-extension";

        }

    }
}

export namespace SwapRouterContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "swap-router";

    // Functions
    export namespace Functions {
        // get-y-given-x
        export namespace GetYGivenX {
            export const name = "get-y-given-x";

            export interface GetYGivenXArgs {
                xToken: ClarityValue,
                yToken: ClarityValue,
                dy: UIntCV,
            }

            export function args(args: GetYGivenXArgs): ClarityValue[] {
                return [
                    args.xToken,
                    args.yToken,
                    args.dy,
                ];
            }

        }

        // swap-x-for-y
        export namespace SwapXForY {
            export const name = "swap-x-for-y";

            export interface SwapXForYArgs {
                xToken: ClarityValue,
                yToken: ClarityValue,
                dx: UIntCV,
                minDy: NoneCV,
            }

            export function args(args: SwapXForYArgs): ClarityValue[] {
                return [
                    args.xToken,
                    args.yToken,
                    args.dx,
                    args.minDy,
                ];
            }

        }

    }
}

export namespace WSTXContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "wSTX";

    // Functions
    export namespace Functions {
        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                value: StringUtf8CV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: NoneCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // get-asset-name
        export namespace GetAssetName {
            export const name = "get-asset-name";

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                account: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.account,
                ];
            }

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

        }

        // get-name
        export namespace GetName {
            export const name = "get-name";

        }

        // get-symbol
        export namespace GetSymbol {
            export const name = "get-symbol";

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

        }

    }
}

export namespace Zge001ProposalVotingContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "zge001-proposal-voting";

    // Functions
    export namespace Functions {
        // add-proposal
        export namespace AddProposal {
            export const name = "add-proposal";

            export interface AddProposalArgs {
                proposal: ClarityValue,
                data: TupleCV,
            }

            export function args(args: AddProposalArgs): ClarityValue[] {
                return [
                    args.proposal,
                    args.data,
                ];
            }

        }

        // callback
        export namespace Callback {
            export const name = "callback";

            export interface CallbackArgs {
                sender: PrincipalCV,
                memo: BufferCV,
            }

            export function args(args: CallbackArgs): ClarityValue[] {
                return [
                    args.sender,
                    args.memo,
                ];
            }

        }

        // conclude
        export namespace Conclude {
            export const name = "conclude";

            export interface ConcludeArgs {
                proposal: ClarityValue,
            }

            export function args(args: ConcludeArgs): ClarityValue[] {
                return [
                    args.proposal,
                ];
            }

        }

        // is-dao-or-extension
        export namespace IsDaoOrExtension {
            export const name = "is-dao-or-extension";

        }

        // reclaim-and-vote
        export namespace ReclaimAndVote {
            export const name = "reclaim-and-vote";

            export interface ReclaimAndVoteArgs {
                amount: UIntCV,
                for: BooleanCV,
                proposal: PrincipalCV,
                reclaimFrom: ClarityValue,
                governanceToken: ClarityValue,
            }

            export function args(args: ReclaimAndVoteArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.for,
                    args.proposal,
                    args.reclaimFrom,
                    args.governanceToken,
                ];
            }

        }

        // reclaim-votes
        export namespace ReclaimVotes {
            export const name = "reclaim-votes";

            export interface ReclaimVotesArgs {
                proposal: ClarityValue,
                governanceToken: ClarityValue,
            }

            export function args(args: ReclaimVotesArgs): ClarityValue[] {
                return [
                    args.proposal,
                    args.governanceToken,
                ];
            }

        }

        // set-governance-token
        export namespace SetGovernanceToken {
            export const name = "set-governance-token";

            export interface SetGovernanceTokenArgs {
                governanceToken: ClarityValue,
            }

            export function args(args: SetGovernanceTokenArgs): ClarityValue[] {
                return [
                    args.governanceToken,
                ];
            }

        }

        // vote
        export namespace Vote {
            export const name = "vote";

            export interface VoteArgs {
                amount: UIntCV,
                for: BooleanCV,
                proposal: PrincipalCV,
                governanceToken: ClarityValue,
            }

            export function args(args: VoteArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.for,
                    args.proposal,
                    args.governanceToken,
                ];
            }

        }

        // get-current-total-votes
        export namespace GetCurrentTotalVotes {
            export const name = "get-current-total-votes";

            export interface GetCurrentTotalVotesArgs {
                proposal: PrincipalCV,
                voter: PrincipalCV,
                governanceToken: PrincipalCV,
            }

            export function args(args: GetCurrentTotalVotesArgs): ClarityValue[] {
                return [
                    args.proposal,
                    args.voter,
                    args.governanceToken,
                ];
            }

        }

        // get-governance-token
        export namespace GetGovernanceToken {
            export const name = "get-governance-token";

        }

        // get-proposal-data
        export namespace GetProposalData {
            export const name = "get-proposal-data";

            export interface GetProposalDataArgs {
                proposal: PrincipalCV,
            }

            export function args(args: GetProposalDataArgs): ClarityValue[] {
                return [
                    args.proposal,
                ];
            }

        }

    }
}

export namespace LoanV10Contract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "loan-v1-0";

    // Functions
    export namespace Functions {
        // accept-rollover
        export namespace AcceptRollover {
            export const name = "accept-rollover";

            export interface AcceptRolloverArgs {
                loanId: UIntCV,
            }

            export function args(args: AcceptRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // add-borrower
        export namespace AddBorrower {
            export const name = "add-borrower";

            export interface AddBorrowerArgs {
                borrower: PrincipalCV,
            }

            export function args(args: AddBorrowerArgs): ClarityValue[] {
                return [
                    args.borrower,
                ];
            }

        }

        // complete-rollover
        export namespace CompleteRollover {
            export const name = "complete-rollover";

            export interface CompleteRolloverArgs {
                loanId: UIntCV,
                collType: ClarityValue,
                cv: ClarityValue,
                fv: ClarityValue,
            }

            export function args(args: CompleteRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.collType,
                    args.cv,
                    args.fv,
                ];
            }

        }

        // create-loan
        export namespace CreateLoan {
            export const name = "create-loan";

            export interface CreateLoanArgs {
                loanAmount: UIntCV,
                collRatio: UIntCV,
                collToken: ClarityValue,
                apr: UIntCV,
                maturityLength: UIntCV,
                paymentPeriod: UIntCV,
                collVault: PrincipalCV,
                loanToken: PrincipalCV,
                fundingVault: PrincipalCV,
            }

            export function args(args: CreateLoanArgs): ClarityValue[] {
                return [
                    args.loanAmount,
                    args.collRatio,
                    args.collToken,
                    args.apr,
                    args.maturityLength,
                    args.paymentPeriod,
                    args.collVault,
                    args.loanToken,
                    args.fundingVault,
                ];
            }

        }

        // drawdown
        export namespace Drawdown {
            export const name = "drawdown";

            export interface DrawdownArgs {
                loanId: UIntCV,
                height: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
            }

            export function args(args: DrawdownArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.height,
                    args.collToken,
                    args.collVault,
                    args.fv,
                ];
            }

        }

        // fund-loan
        export namespace FundLoan {
            export const name = "fund-loan";

            export interface FundLoanArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                loanToken: ClarityValue,
                amount: UIntCV,
            }

            export function args(args: FundLoanArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.loanToken,
                    args.amount,
                ];
            }

        }

        // get-loan
        export namespace GetLoan {
            export const name = "get-loan";

            export interface GetLoanArgs {
                loanId: UIntCV,
            }

            export function args(args: GetLoanArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // get-rollover
        export namespace GetRollover {
            export const name = "get-rollover";

            export interface GetRolloverArgs {
                loanId: UIntCV,
            }

            export function args(args: GetRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // liquidate
        export namespace Liquidate {
            export const name = "liquidate";

            export interface LiquidateArgs {
                loanId: UIntCV,
                collVault: ClarityValue,
                collToken: ClarityValue,
                recipient: PrincipalCV,
            }

            export function args(args: LiquidateArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.collVault,
                    args.collToken,
                    args.recipient,
                ];
            }

        }

        // make-full-payment
        export namespace MakeFullPayment {
            export const name = "make-full-payment";

            export interface MakeFullPaymentArgs {
                loanId: UIntCV,
                height: UIntCV,
                payment: ClarityValue,
                lpToken: ClarityValue,
                spToken: ClarityValue,
                amount: UIntCV,
            }

            export function args(args: MakeFullPaymentArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.height,
                    args.payment,
                    args.lpToken,
                    args.spToken,
                    args.amount,
                ];
            }

        }

        // make-payment
        export namespace MakePayment {
            export const name = "make-payment";

            export interface MakePaymentArgs {
                loanId: UIntCV,
                height: UIntCV,
                payment: ClarityValue,
                lpToken: ClarityValue,
                spToken: ClarityValue,
                amount: UIntCV,
            }

            export function args(args: MakePaymentArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.height,
                    args.payment,
                    args.lpToken,
                    args.spToken,
                    args.amount,
                ];
            }

        }

        // remove-borrower
        export namespace RemoveBorrower {
            export const name = "remove-borrower";

            export interface RemoveBorrowerArgs {
                borrower: PrincipalCV,
            }

            export function args(args: RemoveBorrowerArgs): ClarityValue[] {
                return [
                    args.borrower,
                ];
            }

        }

        // request-rollover
        export namespace RequestRollover {
            export const name = "request-rollover";

            export interface RequestRolloverArgs {
                loanId: UIntCV,
                apr: UIntCV,
                newAmount: UIntCV,
                maturityLength: UIntCV,
                paymentPeriod: UIntCV,
                collRatio: UIntCV,
                collType: ClarityValue,
            }

            export function args(args: RequestRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.apr,
                    args.newAmount,
                    args.maturityLength,
                    args.paymentPeriod,
                    args.collRatio,
                    args.collType,
                ];
            }

        }

        // set-bridge-contract
        export namespace SetBridgeContract {
            export const name = "set-bridge-contract";

            export interface SetBridgeContractArgs {
                newBridge: PrincipalCV,
            }

            export function args(args: SetBridgeContractArgs): ClarityValue[] {
                return [
                    args.newBridge,
                ];
            }

        }

        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // set-pool-contract
        export namespace SetPoolContract {
            export const name = "set-pool-contract";

            export interface SetPoolContractArgs {
                newPool: PrincipalCV,
            }

            export function args(args: SetPoolContractArgs): ClarityValue[] {
                return [
                    args.newPool,
                ];
            }

        }

        // unwind
        export namespace Unwind {
            export const name = "unwind";

            export interface UnwindArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                loanToken: ClarityValue,
                amount: UIntCV,
            }

            export function args(args: UnwindArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.loanToken,
                    args.amount,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-loan-data
        export namespace GetLoanData {
            export const name = "get-loan-data";

            export interface GetLoanDataArgs {
                loanId: UIntCV,
            }

            export function args(args: GetLoanDataArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // get-pool-contract
        export namespace GetPoolContract {
            export const name = "get-pool-contract";

        }

        // is-borrower
        export namespace IsBorrower {
            export const name = "is-borrower";

        }

        // is-bridge
        export namespace IsBridge {
            export const name = "is-bridge";

        }

        // is-contract-owner
        export namespace IsContractOwner {
            export const name = "is-contract-owner";

            export interface IsContractOwnerArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsContractOwnerArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

        // is-pool
        export namespace IsPool {
            export const name = "is-pool";

        }

        // to-precision
        export namespace ToPrecision {
            export const name = "to-precision";

            export interface ToPrecisionArgs {
                amount: UIntCV,
            }

            export function args(args: ToPrecisionArgs): ClarityValue[] {
                return [
                    args.amount,
                ];
            }

        }

    }
}

export namespace LpTokenContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "lp-token";

    // Functions
    export namespace Functions {
        // add-contract
        export namespace AddContract {
            export const name = "add-contract";

            export interface AddContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: AddContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // burn
        export namespace Burn {
            export const name = "burn";

            export interface BurnArgs {
                owner: PrincipalCV,
                amount: UIntCV,
            }

            export function args(args: BurnArgs): ClarityValue[] {
                return [
                    args.owner,
                    args.amount,
                ];
            }

        }

        // deposit-rewards
        export namespace DepositRewards {
            export const name = "deposit-rewards";

            export interface DepositRewardsArgs {
                amount: IntCV,
            }

            export function args(args: DepositRewardsArgs): ClarityValue[] {
                return [
                    args.amount,
                ];
            }

        }

        // distribute-losses-public
        export namespace DistributeLossesPublic {
            export const name = "distribute-losses-public";

            export interface DistributeLossesPublicArgs {
                delta: IntCV,
            }

            export function args(args: DistributeLossesPublicArgs): ClarityValue[] {
                return [
                    args.delta,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // mint
        export namespace Mint {
            export const name = "mint";

            export interface MintArgs {
                recipient: PrincipalCV,
                amount: UIntCV,
            }

            export function args(args: MintArgs): ClarityValue[] {
                return [
                    args.recipient,
                    args.amount,
                ];
            }

        }

        // remove-contract
        export namespace RemoveContract {
            export const name = "remove-contract";

            export interface RemoveContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: RemoveContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                value: StringUtf8CV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: NoneCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // withdraw-deposit
        export namespace WithdrawDeposit {
            export const name = "withdraw-deposit";

            export interface WithdrawDepositArgs {
                owner: PrincipalCV,
            }

            export function args(args: WithdrawDepositArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // withdraw-funds
        export namespace WithdrawFunds {
            export const name = "withdraw-funds";

        }

        // accumulative-funds-of
        export namespace AccumulativeFundsOf {
            export const name = "accumulative-funds-of";

            export interface AccumulativeFundsOfArgs {
                owner: PrincipalCV,
            }

            export function args(args: AccumulativeFundsOfArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // accumulative-losses-of
        export namespace AccumulativeLossesOf {
            export const name = "accumulative-losses-of";

            export interface AccumulativeLossesOfArgs {
                owner: PrincipalCV,
            }

            export function args(args: AccumulativeLossesOfArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                account: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.account,
                ];
            }

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

        }

        // get-name
        export namespace GetName {
            export const name = "get-name";

        }

        // get-symbol
        export namespace GetSymbol {
            export const name = "get-symbol";

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

        }

        // is-approved-contract
        export namespace IsApprovedContract {
            export const name = "is-approved-contract";

            export interface IsApprovedContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: IsApprovedContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // is-contract-owner
        export namespace IsContractOwner {
            export const name = "is-contract-owner";

            export interface IsContractOwnerArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsContractOwnerArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

        // recognizable-losses-of
        export namespace RecognizableLossesOf {
            export const name = "recognizable-losses-of";

            export interface RecognizableLossesOfArgs {
                owner: PrincipalCV,
            }

            export function args(args: RecognizableLossesOfArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // withdrawable-funds-of
        export namespace WithdrawableFundsOf {
            export const name = "withdrawable-funds-of";

            export interface WithdrawableFundsOfArgs {
                owner: PrincipalCV,
            }

            export function args(args: WithdrawableFundsOfArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

    }
}

export namespace XbtcContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "xbtc";

    // Functions
    export namespace Functions {
        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                value: StringUtf8CV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: NoneCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                account: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.account,
                ];
            }

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

        }

        // get-name
        export namespace GetName {
            export const name = "get-name";

        }

        // get-symbol
        export namespace GetSymbol {
            export const name = "get-symbol";

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

        }

    }
}

export namespace Sip010TraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "sip-010-trait";

}

export namespace AssetTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "asset-trait";

}

export namespace LiquidityVaultContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "liquidity-vault";

    // Functions
    export namespace Functions {
        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                recipient: PrincipalCV,
                ft: ClarityValue,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.recipient,
                    args.ft,
                ];
            }

        }

        // is-loan
        export namespace IsLoan {
            export const name = "is-loan";

        }

        // is-pool
        export namespace IsPool {
            export const name = "is-pool";

        }

    }
}

export namespace CollVaultContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "coll-vault";

    // Functions
    export namespace Functions {
        // add-collateral
        export namespace AddCollateral {
            export const name = "add-collateral";

            export interface AddCollateralArgs {
                collType: ClarityValue,
                amount: UIntCV,
                loanId: UIntCV,
            }

            export function args(args: AddCollateralArgs): ClarityValue[] {
                return [
                    args.collType,
                    args.amount,
                    args.loanId,
                ];
            }

        }

        // draw
        export namespace Draw {
            export const name = "draw";

            export interface DrawArgs {
                collType: ClarityValue,
                loanId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: DrawArgs): ClarityValue[] {
                return [
                    args.collType,
                    args.loanId,
                    args.recipient,
                ];
            }

        }

        // get-loan-coll
        export namespace GetLoanColl {
            export const name = "get-loan-coll";

            export interface GetLoanCollArgs {
                loanId: UIntCV,
            }

            export function args(args: GetLoanCollArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // set-contract-owner
        export namespace SetContractOwner {
            export const name = "set-contract-owner";

            export interface SetContractOwnerArgs {
                owner: PrincipalCV,
            }

            export function args(args: SetContractOwnerArgs): ClarityValue[] {
                return [
                    args.owner,
                ];
            }

        }

        // set-loan-contract
        export namespace SetLoanContract {
            export const name = "set-loan-contract";

            export interface SetLoanContractArgs {
                loan: PrincipalCV,
            }

            export function args(args: SetLoanContractArgs): ClarityValue[] {
                return [
                    args.loan,
                ];
            }

        }

        // store
        export namespace Store {
            export const name = "store";

            export interface StoreArgs {
                collType: ClarityValue,
                amount: UIntCV,
                loanId: UIntCV,
            }

            export function args(args: StoreArgs): ClarityValue[] {
                return [
                    args.collType,
                    args.amount,
                    args.loanId,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                amount: UIntCV,
                recipient: PrincipalCV,
                ft: ClarityValue,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.recipient,
                    args.ft,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-loan-contract
        export namespace GetLoanContract {
            export const name = "get-loan-contract";

        }

        // is-contract-owner
        export namespace IsContractOwner {
            export const name = "is-contract-owner";

            export interface IsContractOwnerArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsContractOwnerArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

        // is-loan
        export namespace IsLoan {
            export const name = "is-loan";

        }

    }
}

export namespace VaultTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "vault-trait";

}
