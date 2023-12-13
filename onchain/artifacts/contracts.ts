// Code generated with the stacksjs-helper-generator extension
// Manual edits will be overwritten

import { ClarityValue, BooleanCV, IntCV, UIntCV, BufferCV, OptionalCV, PrincipalCV, ListCV, TupleCV, StringAsciiCV, StringUtf8CV, NoneCV } from "@stacks/transactions"

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

export namespace WrappedUSDContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "Wrapped-USD";

    // Functions
    export namespace Functions {
        // add-principal-to-role
        export namespace AddPrincipalToRole {
            export const name = "add-principal-to-role";

            export interface AddPrincipalToRoleArgs {
                roleToAdd: UIntCV,
                principalToAdd: PrincipalCV,
            }

            export function args(args: AddPrincipalToRoleArgs): ClarityValue[] {
                return [
                    args.roleToAdd,
                    args.principalToAdd,
                ];
            }

        }

        // burn-tokens
        export namespace BurnTokens {
            export const name = "burn-tokens";

            export interface BurnTokensArgs {
                burnAmount: UIntCV,
                burnFrom: PrincipalCV,
            }

            export function args(args: BurnTokensArgs): ClarityValue[] {
                return [
                    args.burnAmount,
                    args.burnFrom,
                ];
            }

        }

        // initialize
        export namespace Initialize {
            export const name = "initialize";

            export interface InitializeArgs {
                nameToSet: StringAsciiCV,
                symbolToSet: StringAsciiCV,
                decimalsToSet: UIntCV,
                initialOwner: PrincipalCV,
            }

            export function args(args: InitializeArgs): ClarityValue[] {
                return [
                    args.nameToSet,
                    args.symbolToSet,
                    args.decimalsToSet,
                    args.initialOwner,
                ];
            }

        }

        // mint-tokens
        export namespace MintTokens {
            export const name = "mint-tokens";

            export interface MintTokensArgs {
                mintAmount: UIntCV,
                mintTo: PrincipalCV,
            }

            export function args(args: MintTokensArgs): ClarityValue[] {
                return [
                    args.mintAmount,
                    args.mintTo,
                ];
            }

        }

        // remove-principal-from-role
        export namespace RemovePrincipalFromRole {
            export const name = "remove-principal-from-role";

            export interface RemovePrincipalFromRoleArgs {
                roleToRemove: UIntCV,
                principalToRemove: PrincipalCV,
            }

            export function args(args: RemovePrincipalFromRoleArgs): ClarityValue[] {
                return [
                    args.roleToRemove,
                    args.principalToRemove,
                ];
            }

        }

        // revoke-tokens
        export namespace RevokeTokens {
            export const name = "revoke-tokens";

            export interface RevokeTokensArgs {
                revokeAmount: UIntCV,
                revokeFrom: PrincipalCV,
                revokeTo: PrincipalCV,
            }

            export function args(args: RevokeTokensArgs): ClarityValue[] {
                return [
                    args.revokeAmount,
                    args.revokeFrom,
                    args.revokeTo,
                ];
            }

        }

        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                updatedUri: StringUtf8CV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.updatedUri,
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

        // update-blacklisted
        export namespace UpdateBlacklisted {
            export const name = "update-blacklisted";

            export interface UpdateBlacklistedArgs {
                principalToUpdate: PrincipalCV,
                setBlacklisted: BooleanCV,
            }

            export function args(args: UpdateBlacklistedArgs): ClarityValue[] {
                return [
                    args.principalToUpdate,
                    args.setBlacklisted,
                ];
            }

        }

        // detect-transfer-restriction
        export namespace DetectTransferRestriction {
            export const name = "detect-transfer-restriction";

            export interface DetectTransferRestrictionArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
            }

            export function args(args: DetectTransferRestrictionArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                owner: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.owner,
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

        // has-role
        export namespace HasRole {
            export const name = "has-role";

            export interface HasRoleArgs {
                roleToCheck: UIntCV,
                principalToCheck: PrincipalCV,
            }

            export function args(args: HasRoleArgs): ClarityValue[] {
                return [
                    args.roleToCheck,
                    args.principalToCheck,
                ];
            }

        }

        // is-blacklisted
        export namespace IsBlacklisted {
            export const name = "is-blacklisted";

            export interface IsBlacklistedArgs {
                principalToCheck: PrincipalCV,
            }

            export function args(args: IsBlacklistedArgs): ClarityValue[] {
                return [
                    args.principalToCheck,
                ];
            }

        }

        // message-for-restriction
        export namespace MessageForRestriction {
            export const name = "message-for-restriction";

            export interface MessageForRestrictionArgs {
                restrictionCode: UIntCV,
            }

            export function args(args: MessageForRestrictionArgs): ClarityValue[] {
                return [
                    args.restrictionCode,
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

export namespace ExtensionTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "extension-trait";

}

export namespace LpTokenTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "lp-token-trait";

}

export namespace CoverPoolDataContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "cover-pool-data";

    // Functions
    export namespace Functions {
        // add-staker
        export namespace AddStaker {
            export const name = "add-staker";

            export interface AddStakerArgs {
                coverProvider: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: AddStakerArgs): ClarityValue[] {
                return [
                    args.coverProvider,
                    args.tokenId,
                ];
            }

        }

        // create-pool
        export namespace CreatePool {
            export const name = "create-pool";

            export interface CreatePoolArgs {
                tokenId: UIntCV,
                data: TupleCV,
            }

            export function args(args: CreatePoolArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.data,
                ];
            }

        }

        // get-pool
        export namespace GetPool {
            export const name = "get-pool";

            export interface GetPoolArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPoolArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-sent-funds
        export namespace GetSentFunds {
            export const name = "get-sent-funds";

            export interface GetSentFundsArgs {
                provider: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: GetSentFundsArgs): ClarityValue[] {
                return [
                    args.provider,
                    args.tokenId,
                ];
            }

        }

        // is-pool-contract
        export namespace IsPoolContract {
            export const name = "is-pool-contract";

        }

        // remove-staker
        export namespace RemoveStaker {
            export const name = "remove-staker";

            export interface RemoveStakerArgs {
                coverProvider: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: RemoveStakerArgs): ClarityValue[] {
                return [
                    args.coverProvider,
                    args.tokenId,
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

        // set-pool
        export namespace SetPool {
            export const name = "set-pool";

            export interface SetPoolArgs {
                tokenId: UIntCV,
                data: TupleCV,
            }

            export function args(args: SetPoolArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.data,
                ];
            }

        }

        // set-sent-funds
        export namespace SetSentFunds {
            export const name = "set-sent-funds";

            export interface SetSentFundsArgs {
                owner: PrincipalCV,
                tokenId: UIntCV,
                data: TupleCV,
            }

            export function args(args: SetSentFundsArgs): ClarityValue[] {
                return [
                    args.owner,
                    args.tokenId,
                    args.data,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-pool-read
        export namespace GetPoolRead {
            export const name = "get-pool-read";

            export interface GetPoolReadArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPoolReadArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-sent-funds-optional
        export namespace GetSentFundsOptional {
            export const name = "get-sent-funds-optional";

            export interface GetSentFundsOptionalArgs {
                provider: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: GetSentFundsOptionalArgs): ClarityValue[] {
                return [
                    args.provider,
                    args.tokenId,
                ];
            }

        }

        // get-sent-funds-read
        export namespace GetSentFundsRead {
            export const name = "get-sent-funds-read";

            export interface GetSentFundsReadArgs {
                provider: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: GetSentFundsReadArgs): ClarityValue[] {
                return [
                    args.provider,
                    args.tokenId,
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

            export interface IsStakerArgs {
                caller: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: IsStakerArgs): ClarityValue[] {
                return [
                    args.caller,
                    args.tokenId,
                ];
            }

        }

    }
}

export namespace PoolDataContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "pool-data";

    // Functions
    export namespace Functions {
        // add-liquidity-provider
        export namespace AddLiquidityProvider {
            export const name = "add-liquidity-provider";

            export interface AddLiquidityProviderArgs {
                tokenId: UIntCV,
                liquidityProvider: PrincipalCV,
            }

            export function args(args: AddLiquidityProviderArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.liquidityProvider,
                ];
            }

        }

        // add-pool-governor
        export namespace AddPoolGovernor {
            export const name = "add-pool-governor";

            export interface AddPoolGovernorArgs {
                governor: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: AddPoolGovernorArgs): ClarityValue[] {
                return [
                    args.governor,
                    args.tokenId,
                ];
            }

        }

        // create-pool
        export namespace CreatePool {
            export const name = "create-pool";

            export interface CreatePoolArgs {
                tokenId: UIntCV,
                data: TupleCV,
            }

            export function args(args: CreatePoolArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.data,
                ];
            }

        }

        // get-funds-sent
        export namespace GetFundsSent {
            export const name = "get-funds-sent";

            export interface GetFundsSentArgs {
                owner: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: GetFundsSentArgs): ClarityValue[] {
                return [
                    args.owner,
                    args.tokenId,
                ];
            }

        }

        // get-loan-pool-id
        export namespace GetLoanPoolId {
            export const name = "get-loan-pool-id";

            export interface GetLoanPoolIdArgs {
                loanId: UIntCV,
            }

            export function args(args: GetLoanPoolIdArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // get-pool
        export namespace GetPool {
            export const name = "get-pool";

            export interface GetPoolArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPoolArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // is-pool-contract
        export namespace IsPoolContract {
            export const name = "is-pool-contract";

        }

        // is-pool-governor
        export namespace IsPoolGovernor {
            export const name = "is-pool-governor";

            export interface IsPoolGovernorArgs {
                governor: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: IsPoolGovernorArgs): ClarityValue[] {
                return [
                    args.governor,
                    args.tokenId,
                ];
            }

        }

        // remove-liquidity-provider
        export namespace RemoveLiquidityProvider {
            export const name = "remove-liquidity-provider";

            export interface RemoveLiquidityProviderArgs {
                tokenId: UIntCV,
                liquidityProvider: PrincipalCV,
            }

            export function args(args: RemoveLiquidityProviderArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.liquidityProvider,
                ];
            }

        }

        // remove-pool-governor
        export namespace RemovePoolGovernor {
            export const name = "remove-pool-governor";

            export interface RemovePoolGovernorArgs {
                governor: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: RemovePoolGovernorArgs): ClarityValue[] {
                return [
                    args.governor,
                    args.tokenId,
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

        // set-funds-sent
        export namespace SetFundsSent {
            export const name = "set-funds-sent";

            export interface SetFundsSentArgs {
                owner: PrincipalCV,
                tokenId: UIntCV,
                data: TupleCV,
            }

            export function args(args: SetFundsSentArgs): ClarityValue[] {
                return [
                    args.owner,
                    args.tokenId,
                    args.data,
                ];
            }

        }

        // set-last-pool-id
        export namespace SetLastPoolId {
            export const name = "set-last-pool-id";

            export interface SetLastPoolIdArgs {
                id: UIntCV,
            }

            export function args(args: SetLastPoolIdArgs): ClarityValue[] {
                return [
                    args.id,
                ];
            }

        }

        // set-loan-to-pool
        export namespace SetLoanToPool {
            export const name = "set-loan-to-pool";

            export interface SetLoanToPoolArgs {
                loanId: UIntCV,
                poolId: UIntCV,
            }

            export function args(args: SetLoanToPoolArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.poolId,
                ];
            }

        }

        // set-pool
        export namespace SetPool {
            export const name = "set-pool";

            export interface SetPoolArgs {
                tokenId: UIntCV,
                data: TupleCV,
            }

            export function args(args: SetPoolArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.data,
                ];
            }

        }

        // set-pool-delegate
        export namespace SetPoolDelegate {
            export const name = "set-pool-delegate";

            export interface SetPoolDelegateArgs {
                delegate: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: SetPoolDelegateArgs): ClarityValue[] {
                return [
                    args.delegate,
                    args.tokenId,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-delegate-by-token-id
        export namespace GetDelegateByTokenId {
            export const name = "get-delegate-by-token-id";

            export interface GetDelegateByTokenIdArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetDelegateByTokenIdArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-funds-sent-read
        export namespace GetFundsSentRead {
            export const name = "get-funds-sent-read";

            export interface GetFundsSentReadArgs {
                owner: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: GetFundsSentReadArgs): ClarityValue[] {
                return [
                    args.owner,
                    args.tokenId,
                ];
            }

        }

        // get-last-pool-id
        export namespace GetLastPoolId {
            export const name = "get-last-pool-id";

        }

        // get-loan-pool-id-read
        export namespace GetLoanPoolIdRead {
            export const name = "get-loan-pool-id-read";

            export interface GetLoanPoolIdReadArgs {
                loanId: UIntCV,
            }

            export function args(args: GetLoanPoolIdReadArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // get-pool-governor
        export namespace GetPoolGovernor {
            export const name = "get-pool-governor";

            export interface GetPoolGovernorArgs {
                governor: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: GetPoolGovernorArgs): ClarityValue[] {
                return [
                    args.governor,
                    args.tokenId,
                ];
            }

        }

        // get-pool-read
        export namespace GetPoolRead {
            export const name = "get-pool-read";

            export interface GetPoolReadArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPoolReadArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-token-id-by-delegate
        export namespace GetTokenIdByDelegate {
            export const name = "get-token-id-by-delegate";

            export interface GetTokenIdByDelegateArgs {
                delegate: PrincipalCV,
            }

            export function args(args: GetTokenIdByDelegateArgs): ClarityValue[] {
                return [
                    args.delegate,
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

        // is-liquidity-provider
        export namespace IsLiquidityProvider {
            export const name = "is-liquidity-provider";

            export interface IsLiquidityProviderArgs {
                tokenId: UIntCV,
                liquidityProvider: PrincipalCV,
            }

            export function args(args: IsLiquidityProviderArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.liquidityProvider,
                ];
            }

        }

        // is-pool-governor-read
        export namespace IsPoolGovernorRead {
            export const name = "is-pool-governor-read";

            export interface IsPoolGovernorReadArgs {
                governor: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: IsPoolGovernorReadArgs): ClarityValue[] {
                return [
                    args.governor,
                    args.tokenId,
                ];
            }

        }

    }
}

export namespace RewardsCalcContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "rewards-calc";

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

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // mint-rewards
        export namespace MintRewards {
            export const name = "mint-rewards";

            export interface MintRewardsArgs {
                recipient: PrincipalCV,
                cycles: UIntCV,
                baseAmount: UIntCV,
            }

            export function args(args: MintRewardsArgs): ClarityValue[] {
                return [
                    args.recipient,
                    args.cycles,
                    args.baseAmount,
                ];
            }

        }

        // mint-rewards-base
        export namespace MintRewardsBase {
            export const name = "mint-rewards-base";

            export interface MintRewardsBaseArgs {
                recipient: PrincipalCV,
                baseAmount: UIntCV,
            }

            export function args(args: MintRewardsBaseArgs): ClarityValue[] {
                return [
                    args.recipient,
                    args.baseAmount,
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

        // get-base-reward
        export namespace GetBaseReward {
            export const name = "get-base-reward";

        }

        // get-mint-rewards
        export namespace GetMintRewards {
            export const name = "get-mint-rewards";

            export interface GetMintRewardsArgs {
                recipient: PrincipalCV,
                cycles: UIntCV,
                baseAmount: UIntCV,
            }

            export function args(args: GetMintRewardsArgs): ClarityValue[] {
                return [
                    args.recipient,
                    args.cycles,
                    args.baseAmount,
                ];
            }

        }

        // get-mint-rewards-base
        export namespace GetMintRewardsBase {
            export const name = "get-mint-rewards-base";

            export interface GetMintRewardsBaseArgs {
                recipient: PrincipalCV,
                baseAmount: UIntCV,
            }

            export function args(args: GetMintRewardsBaseArgs): ClarityValue[] {
                return [
                    args.recipient,
                    args.baseAmount,
                ];
            }

        }

        // get-multiplier
        export namespace GetMultiplier {
            export const name = "get-multiplier";

            export interface GetMultiplierArgs {
                cycles: UIntCV,
            }

            export function args(args: GetMultiplierArgs): ClarityValue[] {
                return [
                    args.cycles,
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

        // polynomial
        export namespace Polynomial {
            export const name = "polynomial";

            export interface PolynomialArgs {
                x: IntCV,
            }

            export function args(args: PolynomialArgs): ClarityValue[] {
                return [
                    args.x,
                ];
            }

        }

    }
}

export namespace CoverVaultContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "cover-vault";

    // Functions
    export namespace Functions {
        // add-asset
        export namespace AddAsset {
            export const name = "add-asset";

            export interface AddAssetArgs {
                asset: ClarityValue,
                amount: UIntCV,
                tokenId: UIntCV,
                sender: PrincipalCV,
            }

            export function args(args: AddAssetArgs): ClarityValue[] {
                return [
                    args.asset,
                    args.amount,
                    args.tokenId,
                    args.sender,
                ];
            }

        }

        // draw
        export namespace Draw {
            export const name = "draw";

            export interface DrawArgs {
                asset: ClarityValue,
                tokenId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: DrawArgs): ClarityValue[] {
                return [
                    args.asset,
                    args.tokenId,
                    args.recipient,
                ];
            }

        }

        // get-asset
        export namespace GetAsset {
            export const name = "get-asset";

            export interface GetAssetArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetAssetArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // remove-asset
        export namespace RemoveAsset {
            export const name = "remove-asset";

            export interface RemoveAssetArgs {
                asset: ClarityValue,
                amount: UIntCV,
                tokenId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: RemoveAssetArgs): ClarityValue[] {
                return [
                    args.asset,
                    args.amount,
                    args.tokenId,
                    args.recipient,
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

export namespace CoverPoolV10Contract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "cover-pool-v1-0";

    // Functions
    export namespace Functions {
        // add-staker
        export namespace AddStaker {
            export const name = "add-staker";

            export interface AddStakerArgs {
                staker: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: AddStakerArgs): ClarityValue[] {
                return [
                    args.staker,
                    args.tokenId,
                ];
            }

        }

        // create-pool
        export namespace CreatePool {
            export const name = "create-pool";

            export interface CreatePoolArgs {
                cpToken: ClarityValue,
                coverVault: ClarityValue,
                cpRewardsToken: ClarityValue,
                coverToken: ClarityValue,
                capacity: UIntCV,
                tokenId: UIntCV,
                open: BooleanCV,
                cycleLength: UIntCV,
                minCycles: UIntCV,
            }

            export function args(args: CreatePoolArgs): ClarityValue[] {
                return [
                    args.cpToken,
                    args.coverVault,
                    args.cpRewardsToken,
                    args.coverToken,
                    args.capacity,
                    args.tokenId,
                    args.open,
                    args.cycleLength,
                    args.minCycles,
                ];
            }

        }

        // default-withdrawal
        export namespace DefaultWithdrawal {
            export const name = "default-withdrawal";

            export interface DefaultWithdrawalArgs {
                cpToken: ClarityValue,
                tokenId: UIntCV,
                remainingLoanAmount: UIntCV,
                recipient: PrincipalCV,
                coverToken: ClarityValue,
                coverVault: ClarityValue,
            }

            export function args(args: DefaultWithdrawalArgs): ClarityValue[] {
                return [
                    args.cpToken,
                    args.tokenId,
                    args.remainingLoanAmount,
                    args.recipient,
                    args.coverToken,
                    args.coverVault,
                ];
            }

        }

        // default-withdrawal-otc
        export namespace DefaultWithdrawalOtc {
            export const name = "default-withdrawal-otc";

            export interface DefaultWithdrawalOtcArgs {
                cpToken: ClarityValue,
                coverVault: ClarityValue,
                tokenId: UIntCV,
                recipient: PrincipalCV,
                coverToken: ClarityValue,
            }

            export function args(args: DefaultWithdrawalOtcArgs): ClarityValue[] {
                return [
                    args.cpToken,
                    args.coverVault,
                    args.tokenId,
                    args.recipient,
                    args.coverToken,
                ];
            }

        }

        // disable-pool
        export namespace DisablePool {
            export const name = "disable-pool";

            export interface DisablePoolArgs {
                cpToken: ClarityValue,
                tokenId: UIntCV,
            }

            export function args(args: DisablePoolArgs): ClarityValue[] {
                return [
                    args.cpToken,
                    args.tokenId,
                ];
            }

        }

        // enable-pool
        export namespace EnablePool {
            export const name = "enable-pool";

            export interface EnablePoolArgs {
                cpToken: ClarityValue,
                tokenId: UIntCV,
            }

            export function args(args: EnablePoolArgs): ClarityValue[] {
                return [
                    args.cpToken,
                    args.tokenId,
                ];
            }

        }

        // finalize-pool
        export namespace FinalizePool {
            export const name = "finalize-pool";

            export interface FinalizePoolArgs {
                cpToken: ClarityValue,
                tokenId: UIntCV,
            }

            export function args(args: FinalizePoolArgs): ClarityValue[] {
                return [
                    args.cpToken,
                    args.tokenId,
                ];
            }

        }

        // get-pool
        export namespace GetPool {
            export const name = "get-pool";

            export interface GetPoolArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPoolArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-sent-funds
        export namespace GetSentFunds {
            export const name = "get-sent-funds";

            export interface GetSentFundsArgs {
                staker: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: GetSentFundsArgs): ClarityValue[] {
                return [
                    args.staker,
                    args.tokenId,
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

        // remove-staker
        export namespace RemoveStaker {
            export const name = "remove-staker";

            export interface RemoveStakerArgs {
                staker: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: RemoveStakerArgs): ClarityValue[] {
                return [
                    args.staker,
                    args.tokenId,
                ];
            }

        }

        // return-withdrawal-otc
        export namespace ReturnWithdrawalOtc {
            export const name = "return-withdrawal-otc";

            export interface ReturnWithdrawalOtcArgs {
                cpToken: ClarityValue,
                tokenId: UIntCV,
                caller: PrincipalCV,
                fundsReturned: UIntCV,
                coverToken: ClarityValue,
                coverVault: ClarityValue,
            }

            export function args(args: ReturnWithdrawalOtcArgs): ClarityValue[] {
                return [
                    args.cpToken,
                    args.tokenId,
                    args.caller,
                    args.fundsReturned,
                    args.coverToken,
                    args.coverVault,
                ];
            }

        }

        // send-funds
        export namespace SendFunds {
            export const name = "send-funds";

            export interface SendFundsArgs {
                cpToken: ClarityValue,
                coverVault: ClarityValue,
                cpRewardsToken: ClarityValue,
                coverToken: ClarityValue,
                tokenId: UIntCV,
                amount: UIntCV,
                cycles: UIntCV,
                rewardsCalc: ClarityValue,
                sender: PrincipalCV,
            }

            export function args(args: SendFundsArgs): ClarityValue[] {
                return [
                    args.cpToken,
                    args.coverVault,
                    args.cpRewardsToken,
                    args.coverToken,
                    args.tokenId,
                    args.amount,
                    args.cycles,
                    args.rewardsCalc,
                    args.sender,
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

        // set-cycle-length
        export namespace SetCycleLength {
            export const name = "set-cycle-length";

            export interface SetCycleLengthArgs {
                cpToken: ClarityValue,
                tokenId: UIntCV,
                cycleLength: UIntCV,
            }

            export function args(args: SetCycleLengthArgs): ClarityValue[] {
                return [
                    args.cpToken,
                    args.tokenId,
                    args.cycleLength,
                ];
            }

        }

        // set-min-cycles
        export namespace SetMinCycles {
            export const name = "set-min-cycles";

            export interface SetMinCyclesArgs {
                cpToken: ClarityValue,
                tokenId: UIntCV,
                minCycles: UIntCV,
            }

            export function args(args: SetMinCyclesArgs): ClarityValue[] {
                return [
                    args.cpToken,
                    args.tokenId,
                    args.minCycles,
                ];
            }

        }

        // set-open
        export namespace SetOpen {
            export const name = "set-open";

            export interface SetOpenArgs {
                cpToken: ClarityValue,
                tokenId: UIntCV,
                open: BooleanCV,
            }

            export function args(args: SetOpenArgs): ClarityValue[] {
                return [
                    args.cpToken,
                    args.tokenId,
                    args.open,
                ];
            }

        }

        // signal-withdrawal
        export namespace SignalWithdrawal {
            export const name = "signal-withdrawal";

            export interface SignalWithdrawalArgs {
                cpToken: ClarityValue,
                tokenId: UIntCV,
                amount: UIntCV,
            }

            export function args(args: SignalWithdrawalArgs): ClarityValue[] {
                return [
                    args.cpToken,
                    args.tokenId,
                    args.amount,
                ];
            }

        }

        // withdraw
        export namespace Withdraw {
            export const name = "withdraw";

            export interface WithdrawArgs {
                cpToken: ClarityValue,
                cpRewardsToken: ClarityValue,
                coverToken: ClarityValue,
                tokenId: UIntCV,
                amount: UIntCV,
                coverVault: ClarityValue,
            }

            export function args(args: WithdrawArgs): ClarityValue[] {
                return [
                    args.cpToken,
                    args.cpRewardsToken,
                    args.coverToken,
                    args.tokenId,
                    args.amount,
                    args.coverVault,
                ];
            }

        }

        // withdraw-rewards
        export namespace WithdrawRewards {
            export const name = "withdraw-rewards";

            export interface WithdrawRewardsArgs {
                cpRewardsToken: ClarityValue,
                tokenId: UIntCV,
                lv: ClarityValue,
                xbtc: ClarityValue,
                caller: PrincipalCV,
            }

            export function args(args: WithdrawRewardsArgs): ClarityValue[] {
                return [
                    args.cpRewardsToken,
                    args.tokenId,
                    args.lv,
                    args.xbtc,
                    args.caller,
                ];
            }

        }

        // withdraw-zest-rewards
        export namespace WithdrawZestRewards {
            export const name = "withdraw-zest-rewards";

            export interface WithdrawZestRewardsArgs {
                cpToken: ClarityValue,
                tokenId: UIntCV,
                rewardsCalc: ClarityValue,
            }

            export function args(args: WithdrawZestRewardsArgs): ClarityValue[] {
                return [
                    args.cpToken,
                    args.tokenId,
                    args.rewardsCalc,
                ];
            }

        }

        // funds-commitment-ends-at-height
        export namespace FundsCommitmentEndsAtHeight {
            export const name = "funds-commitment-ends-at-height";

            export interface FundsCommitmentEndsAtHeightArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: FundsCommitmentEndsAtHeightArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // funds-committed-for
        export namespace FundsCommittedFor {
            export const name = "funds-committed-for";

            export interface FundsCommittedForArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: FundsCommittedForArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-current-cycle
        export namespace GetCurrentCycle {
            export const name = "get-current-cycle";

            export interface GetCurrentCycleArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetCurrentCycleArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-cycle-at
        export namespace GetCycleAt {
            export const name = "get-cycle-at";

            export interface GetCycleAtArgs {
                tokenId: UIntCV,
                stacksHeight: UIntCV,
            }

            export function args(args: GetCycleAtArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.stacksHeight,
                ];
            }

        }

        // get-cycle-start
        export namespace GetCycleStart {
            export const name = "get-cycle-start";

            export interface GetCycleStartArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetCycleStartArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-height-of-cycle
        export namespace GetHeightOfCycle {
            export const name = "get-height-of-cycle";

            export interface GetHeightOfCycleArgs {
                tokenId: UIntCV,
                cycle: UIntCV,
            }

            export function args(args: GetHeightOfCycleArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.cycle,
                ];
            }

        }

        // get-next-cycle
        export namespace GetNextCycle {
            export const name = "get-next-cycle";

            export interface GetNextCycleArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetNextCycleArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-next-cycle-height
        export namespace GetNextCycleHeight {
            export const name = "get-next-cycle-height";

            export interface GetNextCycleHeightArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetNextCycleHeightArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-pool-read
        export namespace GetPoolRead {
            export const name = "get-pool-read";

            export interface GetPoolReadArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPoolReadArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-sent-funds-optional
        export namespace GetSentFundsOptional {
            export const name = "get-sent-funds-optional";

            export interface GetSentFundsOptionalArgs {
                staker: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: GetSentFundsOptionalArgs): ClarityValue[] {
                return [
                    args.staker,
                    args.tokenId,
                ];
            }

        }

        // get-sent-funds-read
        export namespace GetSentFundsRead {
            export const name = "get-sent-funds-read";

            export interface GetSentFundsReadArgs {
                staker: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: GetSentFundsReadArgs): ClarityValue[] {
                return [
                    args.staker,
                    args.tokenId,
                ];
            }

        }

        // has-committed-funds
        export namespace HasCommittedFunds {
            export const name = "has-committed-funds";

            export interface HasCommittedFundsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: HasCommittedFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // is-cover-provider
        export namespace IsCoverProvider {
            export const name = "is-cover-provider";

            export interface IsCoverProviderArgs {
                caller: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: IsCoverProviderArgs): ClarityValue[] {
                return [
                    args.caller,
                    args.tokenId,
                ];
            }

        }

        // is-pool
        export namespace IsPool {
            export const name = "is-pool";

        }

        // is-supplier-interface
        export namespace IsSupplierInterface {
            export const name = "is-supplier-interface";

        }

        // time-left-for-withdrawal
        export namespace TimeLeftForWithdrawal {
            export const name = "time-left-for-withdrawal";

            export interface TimeLeftForWithdrawalArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: TimeLeftForWithdrawalArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // time-left-until-withdrawal
        export namespace TimeLeftUntilWithdrawal {
            export const name = "time-left-until-withdrawal";

            export interface TimeLeftUntilWithdrawalArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: TimeLeftUntilWithdrawalArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // time-until-commitment-ends
        export namespace TimeUntilCommitmentEnds {
            export const name = "time-until-commitment-ends";

            export interface TimeUntilCommitmentEndsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: TimeUntilCommitmentEndsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
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

export namespace DistributionTokenTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "distribution-token-trait";

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
                tokenId: UIntCV,
                lv: ClarityValue,
                fv: ClarityValue,
                xbtc: ClarityValue,
            }

            export function args(args: AcceptRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.lv,
                    args.fv,
                    args.xbtc,
                ];
            }

        }

        // add-cover-provider
        export namespace AddCoverProvider {
            export const name = "add-cover-provider";

            export interface AddCoverProviderArgs {
                provider: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: AddCoverProviderArgs): ClarityValue[] {
                return [
                    args.provider,
                    args.tokenId,
                ];
            }

        }

        // add-liquidity-provider
        export namespace AddLiquidityProvider {
            export const name = "add-liquidity-provider";

            export interface AddLiquidityProviderArgs {
                tokenId: UIntCV,
                liquidityProvider: PrincipalCV,
            }

            export function args(args: AddLiquidityProviderArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.liquidityProvider,
                ];
            }

        }

        // approve-governor
        export namespace ApproveGovernor {
            export const name = "approve-governor";

            export interface ApproveGovernorArgs {
                governor: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: ApproveGovernorArgs): ClarityValue[] {
                return [
                    args.governor,
                    args.tokenId,
                ];
            }

        }

        // caller-is
        export namespace CallerIs {
            export const name = "caller-is";

            export interface CallerIsArgs {
                validPrincipal: PrincipalCV,
            }

            export function args(args: CallerIsArgs): ClarityValue[] {
                return [
                    args.validPrincipal,
                ];
            }

        }

        // cancel-drawdown
        export namespace CancelDrawdown {
            export const name = "cancel-drawdown";

            export interface CancelDrawdownArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                recoveredAmount: UIntCV,
                xbtc: ClarityValue,
            }

            export function args(args: CancelDrawdownArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.recoveredAmount,
                    args.xbtc,
                ];
            }

        }

        // cancel-rollover
        export namespace CancelRollover {
            export const name = "cancel-rollover";

            export interface CancelRolloverArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                recoveredAmount: UIntCV,
                xbtc: ClarityValue,
                caller: PrincipalCV,
            }

            export function args(args: CancelRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.recoveredAmount,
                    args.xbtc,
                    args.caller,
                ];
            }

        }

        // complete-rollover
        export namespace CompleteRollover {
            export const name = "complete-rollover";

            export interface CompleteRolloverArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                swapRouter: ClarityValue,
                xbtc: ClarityValue,
                caller: PrincipalCV,
            }

            export function args(args: CompleteRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.swapRouter,
                    args.xbtc,
                    args.caller,
                ];
            }

        }

        // complete-rollover-no-withdrawal
        export namespace CompleteRolloverNoWithdrawal {
            export const name = "complete-rollover-no-withdrawal";

            export interface CompleteRolloverNoWithdrawalArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                swapRouter: ClarityValue,
                xbtc: ClarityValue,
            }

            export function args(args: CompleteRolloverNoWithdrawalArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.swapRouter,
                    args.xbtc,
                ];
            }

        }

        // create-loan
        export namespace CreateLoan {
            export const name = "create-loan";

            export interface CreateLoanArgs {
                lpToken: ClarityValue,
                tokenId: UIntCV,
                loanAmount: UIntCV,
                asset: ClarityValue,
                collRatio: UIntCV,
                collToken: ClarityValue,
                apr: UIntCV,
                maturityLength: UIntCV,
                paymentPeriod: UIntCV,
                collVault: PrincipalCV,
                fundingVault: PrincipalCV,
            }

            export function args(args: CreateLoanArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.tokenId,
                    args.loanAmount,
                    args.asset,
                    args.collRatio,
                    args.collToken,
                    args.apr,
                    args.maturityLength,
                    args.paymentPeriod,
                    args.collVault,
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
                zpToken: ClarityValue,
                payment: ClarityValue,
                rewardsCalc: ClarityValue,
                coverFee: UIntCV,
                delegateFee: UIntCV,
                liquidityCap: UIntCV,
                coverCap: UIntCV,
                minCycles: UIntCV,
                maxMaturityLength: UIntCV,
                liquidityVault: ClarityValue,
                cpToken: ClarityValue,
                coverVault: ClarityValue,
                cpRewardsToken: ClarityValue,
                cpCoverToken: ClarityValue,
                open: BooleanCV,
            }

            export function args(args: CreatePoolArgs): ClarityValue[] {
                return [
                    args.poolDelegate,
                    args.lpToken,
                    args.zpToken,
                    args.payment,
                    args.rewardsCalc,
                    args.coverFee,
                    args.delegateFee,
                    args.liquidityCap,
                    args.coverCap,
                    args.minCycles,
                    args.maxMaturityLength,
                    args.liquidityVault,
                    args.cpToken,
                    args.coverVault,
                    args.cpRewardsToken,
                    args.cpCoverToken,
                    args.open,
                ];
            }

        }

        // declare-loan-liquidated
        export namespace DeclareLoanLiquidated {
            export const name = "declare-loan-liquidated";

            export interface DeclareLoanLiquidatedArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collVault: ClarityValue,
                collToken: ClarityValue,
                cpToken: ClarityValue,
                coverVault: ClarityValue,
                coverToken: ClarityValue,
                xbtc: ClarityValue,
            }

            export function args(args: DeclareLoanLiquidatedArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collVault,
                    args.collToken,
                    args.cpToken,
                    args.coverVault,
                    args.coverToken,
                    args.xbtc,
                ];
            }

        }

        // disable-cover
        export namespace DisableCover {
            export const name = "disable-cover";

            export interface DisableCoverArgs {
                lpToken: ClarityValue,
                cpToken: ClarityValue,
                tokenId: UIntCV,
            }

            export function args(args: DisableCoverArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.cpToken,
                    args.tokenId,
                ];
            }

        }

        // drawdown
        export namespace Drawdown {
            export const name = "drawdown";

            export interface DrawdownArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                swapRouter: ClarityValue,
                xbtc: ClarityValue,
                sender: PrincipalCV,
            }

            export function args(args: DrawdownArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.swapRouter,
                    args.xbtc,
                    args.sender,
                ];
            }

        }

        // enable-cover
        export namespace EnableCover {
            export const name = "enable-cover";

            export interface EnableCoverArgs {
                lpToken: ClarityValue,
                cpToken: ClarityValue,
                tokenId: UIntCV,
            }

            export function args(args: EnableCoverArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.cpToken,
                    args.tokenId,
                ];
            }

        }

        // finalize-drawdown
        export namespace FinalizeDrawdown {
            export const name = "finalize-drawdown";

            export interface FinalizeDrawdownArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                xbtc: ClarityValue,
            }

            export function args(args: FinalizeDrawdownArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.xbtc,
                ];
            }

        }

        // finalize-pool
        export namespace FinalizePool {
            export const name = "finalize-pool";

            export interface FinalizePoolArgs {
                lpToken: ClarityValue,
                zpToken: ClarityValue,
                cpToken: ClarityValue,
                tokenId: UIntCV,
            }

            export function args(args: FinalizePoolArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.zpToken,
                    args.cpToken,
                    args.tokenId,
                ];
            }

        }

        // finalize-rollover
        export namespace FinalizeRollover {
            export const name = "finalize-rollover";

            export interface FinalizeRolloverArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                xbtc: ClarityValue,
            }

            export function args(args: FinalizeRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.xbtc,
                ];
            }

        }

        // fund-loan
        export namespace FundLoan {
            export const name = "fund-loan";

            export interface FundLoanArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                lv: ClarityValue,
                fv: ClarityValue,
                xbtc: ClarityValue,
            }

            export function args(args: FundLoanArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.lv,
                    args.fv,
                    args.xbtc,
                ];
            }

        }

        // get-funds-sent
        export namespace GetFundsSent {
            export const name = "get-funds-sent";

            export interface GetFundsSentArgs {
                owner: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: GetFundsSentArgs): ClarityValue[] {
                return [
                    args.owner,
                    args.tokenId,
                ];
            }

        }

        // get-loan-pool-id
        export namespace GetLoanPoolId {
            export const name = "get-loan-pool-id";

            export interface GetLoanPoolIdArgs {
                loanId: UIntCV,
            }

            export function args(args: GetLoanPoolIdArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // get-pool
        export namespace GetPool {
            export const name = "get-pool";

            export interface GetPoolArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPoolArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-sent-funds
        export namespace GetSentFunds {
            export const name = "get-sent-funds";

            export interface GetSentFundsArgs {
                sender: PrincipalCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
            }

            export function args(args: GetSentFundsArgs): ClarityValue[] {
                return [
                    args.sender,
                    args.lpToken,
                    args.tokenId,
                ];
            }

        }

        // is-governor
        export namespace IsGovernor {
            export const name = "is-governor";

            export interface IsGovernorArgs {
                caller: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: IsGovernorArgs): ClarityValue[] {
                return [
                    args.caller,
                    args.tokenId,
                ];
            }

        }

        // is-supplier-interface
        export namespace IsSupplierInterface {
            export const name = "is-supplier-interface";

        }

        // liquidate-loan
        export namespace LiquidateLoan {
            export const name = "liquidate-loan";

            export interface LiquidateLoanArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                lv: ClarityValue,
                collVault: ClarityValue,
                collToken: ClarityValue,
                coverToken: ClarityValue,
                cpToken: ClarityValue,
                coverVault: ClarityValue,
                swapRouter: ClarityValue,
                xbtc: ClarityValue,
            }

            export function args(args: LiquidateLoanArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.lv,
                    args.collVault,
                    args.collToken,
                    args.coverToken,
                    args.cpToken,
                    args.coverVault,
                    args.swapRouter,
                    args.xbtc,
                ];
            }

        }

        // make-residual-payment
        export namespace MakeResidualPayment {
            export const name = "make-residual-payment";

            export interface MakeResidualPaymentArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                lv: ClarityValue,
                amount: UIntCV,
                xbtc: ClarityValue,
                caller: PrincipalCV,
            }

            export function args(args: MakeResidualPaymentArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.lv,
                    args.amount,
                    args.xbtc,
                    args.caller,
                ];
            }

        }

        // recommit-funds
        export namespace RecommitFunds {
            export const name = "recommit-funds";

            export interface RecommitFundsArgs {
                lpToken: ClarityValue,
                tokenId: UIntCV,
                zpToken: ClarityValue,
                amount: UIntCV,
                factor: UIntCV,
                height: UIntCV,
                lv: ClarityValue,
                xbtc: ClarityValue,
                rewardsCalc: ClarityValue,
                caller: PrincipalCV,
            }

            export function args(args: RecommitFundsArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.tokenId,
                    args.zpToken,
                    args.amount,
                    args.factor,
                    args.height,
                    args.lv,
                    args.xbtc,
                    args.rewardsCalc,
                    args.caller,
                ];
            }

        }

        // remove-cover-provider
        export namespace RemoveCoverProvider {
            export const name = "remove-cover-provider";

            export interface RemoveCoverProviderArgs {
                provider: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: RemoveCoverProviderArgs): ClarityValue[] {
                return [
                    args.provider,
                    args.tokenId,
                ];
            }

        }

        // remove-liquidity-provider
        export namespace RemoveLiquidityProvider {
            export const name = "remove-liquidity-provider";

            export interface RemoveLiquidityProviderArgs {
                tokenId: UIntCV,
                liquidityProvider: PrincipalCV,
            }

            export function args(args: RemoveLiquidityProviderArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.liquidityProvider,
                ];
            }

        }

        // removed-governor
        export namespace RemovedGovernor {
            export const name = "removed-governor";

            export interface RemovedGovernorArgs {
                governor: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: RemovedGovernorArgs): ClarityValue[] {
                return [
                    args.governor,
                    args.tokenId,
                ];
            }

        }

        // return-otc-liquidation
        export namespace ReturnOtcLiquidation {
            export const name = "return-otc-liquidation";

            export interface ReturnOtcLiquidationArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collVault: ClarityValue,
                collToken: ClarityValue,
                fundsReturned: UIntCV,
                lv: ClarityValue,
                xbtcRecovered: UIntCV,
                cpToken: ClarityValue,
                coverVault: ClarityValue,
                coverToken: ClarityValue,
                xbtc: ClarityValue,
            }

            export function args(args: ReturnOtcLiquidationArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collVault,
                    args.collToken,
                    args.fundsReturned,
                    args.lv,
                    args.xbtcRecovered,
                    args.cpToken,
                    args.coverVault,
                    args.coverToken,
                    args.xbtc,
                ];
            }

        }

        // send-funds
        export namespace SendFunds {
            export const name = "send-funds";

            export interface SendFundsArgs {
                lpToken: ClarityValue,
                tokenId: UIntCV,
                zpToken: ClarityValue,
                amount: UIntCV,
                factor: UIntCV,
                height: UIntCV,
                lv: ClarityValue,
                xbtc: ClarityValue,
                rewardsCalc: ClarityValue,
                caller: PrincipalCV,
            }

            export function args(args: SendFundsArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.tokenId,
                    args.zpToken,
                    args.amount,
                    args.factor,
                    args.height,
                    args.lv,
                    args.xbtc,
                    args.rewardsCalc,
                    args.caller,
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

        // set-cover-fee
        export namespace SetCoverFee {
            export const name = "set-cover-fee";

            export interface SetCoverFeeArgs {
                lpToken: ClarityValue,
                tokenId: UIntCV,
                coverFee: UIntCV,
            }

            export function args(args: SetCoverFeeArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.tokenId,
                    args.coverFee,
                ];
            }

        }

        // set-cycle-length
        export namespace SetCycleLength {
            export const name = "set-cycle-length";

            export interface SetCycleLengthArgs {
                lpToken: ClarityValue,
                cpToken: ClarityValue,
                tokenId: UIntCV,
                cycleLength: UIntCV,
            }

            export function args(args: SetCycleLengthArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.cpToken,
                    args.tokenId,
                    args.cycleLength,
                ];
            }

        }

        // set-delegate
        export namespace SetDelegate {
            export const name = "set-delegate";

            export interface SetDelegateArgs {
                lpToken: ClarityValue,
                cpToken: ClarityValue,
                tokenId: UIntCV,
                delegate: PrincipalCV,
            }

            export function args(args: SetDelegateArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.cpToken,
                    args.tokenId,
                    args.delegate,
                ];
            }

        }

        // set-delegate-fee
        export namespace SetDelegateFee {
            export const name = "set-delegate-fee";

            export interface SetDelegateFeeArgs {
                lpToken: ClarityValue,
                tokenId: UIntCV,
                delegateFee: UIntCV,
            }

            export function args(args: SetDelegateFeeArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.tokenId,
                    args.delegateFee,
                ];
            }

        }

        // set-liquidity-cap
        export namespace SetLiquidityCap {
            export const name = "set-liquidity-cap";

            export interface SetLiquidityCapArgs {
                lpToken: ClarityValue,
                tokenId: UIntCV,
                liquidityCap: UIntCV,
            }

            export function args(args: SetLiquidityCapArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.tokenId,
                    args.liquidityCap,
                ];
            }

        }

        // set-max-maturity-length
        export namespace SetMaxMaturityLength {
            export const name = "set-max-maturity-length";

            export interface SetMaxMaturityLengthArgs {
                lpToken: ClarityValue,
                tokenId: UIntCV,
                maxMaturityLength: UIntCV,
            }

            export function args(args: SetMaxMaturityLengthArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.tokenId,
                    args.maxMaturityLength,
                ];
            }

        }

        // set-min-cycles
        export namespace SetMinCycles {
            export const name = "set-min-cycles";

            export interface SetMinCyclesArgs {
                lpToken: ClarityValue,
                cpToken: ClarityValue,
                tokenId: UIntCV,
                minCycles: UIntCV,
            }

            export function args(args: SetMinCyclesArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.cpToken,
                    args.tokenId,
                    args.minCycles,
                ];
            }

        }

        // set-open
        export namespace SetOpen {
            export const name = "set-open";

            export interface SetOpenArgs {
                lpToken: ClarityValue,
                cpToken: ClarityValue,
                tokenId: UIntCV,
                open: BooleanCV,
            }

            export function args(args: SetOpenArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.cpToken,
                    args.tokenId,
                    args.open,
                ];
            }

        }

        // signal-withdrawal
        export namespace SignalWithdrawal {
            export const name = "signal-withdrawal";

            export interface SignalWithdrawalArgs {
                lpToken: ClarityValue,
                tokenId: UIntCV,
                amount: UIntCV,
            }

            export function args(args: SignalWithdrawalArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.tokenId,
                    args.amount,
                ];
            }

        }

        // trigger-default-mode
        export namespace TriggerDefaultMode {
            export const name = "trigger-default-mode";

            export interface TriggerDefaultModeArgs {
                lpToken: ClarityValue,
                tokenId: UIntCV,
            }

            export function args(args: TriggerDefaultModeArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.tokenId,
                ];
            }

        }

        // unwind
        export namespace Unwind {
            export const name = "unwind";

            export interface UnwindArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                fv: ClarityValue,
                lv: ClarityValue,
                xbtc: ClarityValue,
            }

            export function args(args: UnwindArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.fv,
                    args.lv,
                    args.xbtc,
                ];
            }

        }

        // withdraw
        export namespace Withdraw {
            export const name = "withdraw";

            export interface WithdrawArgs {
                lpToken: ClarityValue,
                zpToken: ClarityValue,
                tokenId: UIntCV,
                lv: ClarityValue,
                amount: UIntCV,
                xbtc: ClarityValue,
                recipient: PrincipalCV,
            }

            export function args(args: WithdrawArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.zpToken,
                    args.tokenId,
                    args.lv,
                    args.amount,
                    args.xbtc,
                    args.recipient,
                ];
            }

        }

        // withdraw-rewards
        export namespace WithdrawRewards {
            export const name = "withdraw-rewards";

            export interface WithdrawRewardsArgs {
                lpToken: ClarityValue,
                tokenId: UIntCV,
                lv: ClarityValue,
                xbtc: ClarityValue,
                caller: PrincipalCV,
            }

            export function args(args: WithdrawRewardsArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.tokenId,
                    args.lv,
                    args.xbtc,
                    args.caller,
                ];
            }

        }

        // withdraw-zest-rewards
        export namespace WithdrawZestRewards {
            export const name = "withdraw-zest-rewards";

            export interface WithdrawZestRewardsArgs {
                tokenId: UIntCV,
                dtc: ClarityValue,
                rewardsCalc: ClarityValue,
            }

            export function args(args: WithdrawZestRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.dtc,
                    args.rewardsCalc,
                ];
            }

        }

        // calculate-new-commitment
        export namespace CalculateNewCommitment {
            export const name = "calculate-new-commitment";

            export interface CalculateNewCommitmentArgs {
                prevFunds: UIntCV,
                amount: UIntCV,
                factor: UIntCV,
                owner: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: CalculateNewCommitmentArgs): ClarityValue[] {
                return [
                    args.prevFunds,
                    args.amount,
                    args.factor,
                    args.owner,
                    args.tokenId,
                ];
            }

        }

        // dft-to-xbtc
        export namespace DftToXbtc {
            export const name = "dft-to-xbtc";

            export interface DftToXbtcArgs {
                amount: UIntCV,
            }

            export function args(args: DftToXbtcArgs): ClarityValue[] {
                return [
                    args.amount,
                ];
            }

        }

        // funds-commitment-ends-at-height
        export namespace FundsCommitmentEndsAtHeight {
            export const name = "funds-commitment-ends-at-height";

            export interface FundsCommitmentEndsAtHeightArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: FundsCommitmentEndsAtHeightArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // funds-committed-for
        export namespace FundsCommittedFor {
            export const name = "funds-committed-for";

            export interface FundsCommittedForArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: FundsCommittedForArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // funds-locked-for
        export namespace FundsLockedFor {
            export const name = "funds-locked-for";

            export interface FundsLockedForArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: FundsLockedForArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-current-cycle
        export namespace GetCurrentCycle {
            export const name = "get-current-cycle";

            export interface GetCurrentCycleArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetCurrentCycleArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-cycle-at
        export namespace GetCycleAt {
            export const name = "get-cycle-at";

            export interface GetCycleAtArgs {
                tokenId: UIntCV,
                stacksHeight: UIntCV,
            }

            export function args(args: GetCycleAtArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.stacksHeight,
                ];
            }

        }

        // get-cycle-start
        export namespace GetCycleStart {
            export const name = "get-cycle-start";

            export interface GetCycleStartArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetCycleStartArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-funds-sent-read
        export namespace GetFundsSentRead {
            export const name = "get-funds-sent-read";

            export interface GetFundsSentReadArgs {
                owner: PrincipalCV,
                tokenId: UIntCV,
            }

            export function args(args: GetFundsSentReadArgs): ClarityValue[] {
                return [
                    args.owner,
                    args.tokenId,
                ];
            }

        }

        // get-height-of-cycle
        export namespace GetHeightOfCycle {
            export const name = "get-height-of-cycle";

            export interface GetHeightOfCycleArgs {
                tokenId: UIntCV,
                cycle: UIntCV,
            }

            export function args(args: GetHeightOfCycleArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.cycle,
                ];
            }

        }

        // get-last-pool-id
        export namespace GetLastPoolId {
            export const name = "get-last-pool-id";

            export interface GetLastPoolIdArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetLastPoolIdArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-loan-pool-id-read
        export namespace GetLoanPoolIdRead {
            export const name = "get-loan-pool-id-read";

            export interface GetLoanPoolIdReadArgs {
                loanId: UIntCV,
            }

            export function args(args: GetLoanPoolIdReadArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // get-next-cycle
        export namespace GetNextCycle {
            export const name = "get-next-cycle";

            export interface GetNextCycleArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetNextCycleArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-next-cycle-height
        export namespace GetNextCycleHeight {
            export const name = "get-next-cycle-height";

            export interface GetNextCycleHeightArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetNextCycleHeightArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-pool-read
        export namespace GetPoolRead {
            export const name = "get-pool-read";

            export interface GetPoolReadArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPoolReadArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-time-until-withdrawal
        export namespace GetTimeUntilWithdrawal {
            export const name = "get-time-until-withdrawal";

            export interface GetTimeUntilWithdrawalArgs {
                tokenId: UIntCV,
                sender: PrincipalCV,
            }

            export function args(args: GetTimeUntilWithdrawalArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.sender,
                ];
            }

        }

        // has-committed-funds
        export namespace HasCommittedFunds {
            export const name = "has-committed-funds";

            export interface HasCommittedFundsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: HasCommittedFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // has-locked-funds
        export namespace HasLockedFunds {
            export const name = "has-locked-funds";

            export interface HasLockedFundsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: HasLockedFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
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

        // is-delegate
        export namespace IsDelegate {
            export const name = "is-delegate";

            export interface IsDelegateArgs {
                delegate: PrincipalCV,
            }

            export function args(args: IsDelegateArgs): ClarityValue[] {
                return [
                    args.delegate,
                ];
            }

        }

        // is-liquidity-provider
        export namespace IsLiquidityProvider {
            export const name = "is-liquidity-provider";

            export interface IsLiquidityProviderArgs {
                tokenId: UIntCV,
                liquidityProvider: PrincipalCV,
            }

            export function args(args: IsLiquidityProviderArgs): ClarityValue[] {
                return [
                    args.tokenId,
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

        // time-left-for-withdrawal
        export namespace TimeLeftForWithdrawal {
            export const name = "time-left-for-withdrawal";

            export interface TimeLeftForWithdrawalArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: TimeLeftForWithdrawalArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // time-left-until-withdrawal
        export namespace TimeLeftUntilWithdrawal {
            export const name = "time-left-until-withdrawal";

            export interface TimeLeftUntilWithdrawalArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: TimeLeftUntilWithdrawalArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // time-until-commitment-ends
        export namespace TimeUntilCommitmentEnds {
            export const name = "time-until-commitment-ends";

            export interface TimeUntilCommitmentEndsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: TimeUntilCommitmentEndsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
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

export namespace FundingVaultTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "funding-vault-trait";

}

export namespace LoanDataContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "loan-data";

    // Functions
    export namespace Functions {
        // create-loan
        export namespace CreateLoan {
            export const name = "create-loan";

            export interface CreateLoanArgs {
                loanId: UIntCV,
                data: TupleCV,
            }

            export function args(args: CreateLoanArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.data,
                ];
            }

        }

        // create-rollover-progress
        export namespace CreateRolloverProgress {
            export const name = "create-rollover-progress";

            export interface CreateRolloverProgressArgs {
                loanId: UIntCV,
                data: TupleCV,
            }

            export function args(args: CreateRolloverProgressArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.data,
                ];
            }

        }

        // delete-rollover-progress
        export namespace DeleteRolloverProgress {
            export const name = "delete-rollover-progress";

            export interface DeleteRolloverProgressArgs {
                loanId: UIntCV,
            }

            export function args(args: DeleteRolloverProgressArgs): ClarityValue[] {
                return [
                    args.loanId,
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

        // get-rollover-progress
        export namespace GetRolloverProgress {
            export const name = "get-rollover-progress";

            export interface GetRolloverProgressArgs {
                loanId: UIntCV,
            }

            export function args(args: GetRolloverProgressArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // is-loan-contract
        export namespace IsLoanContract {
            export const name = "is-loan-contract";

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

        // set-last-loan-id
        export namespace SetLastLoanId {
            export const name = "set-last-loan-id";

            export interface SetLastLoanIdArgs {
                loanId: UIntCV,
            }

            export function args(args: SetLastLoanIdArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // set-loan
        export namespace SetLoan {
            export const name = "set-loan";

            export interface SetLoanArgs {
                loanId: UIntCV,
                data: TupleCV,
            }

            export function args(args: SetLoanArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.data,
                ];
            }

        }

        // set-rollover-progress
        export namespace SetRolloverProgress {
            export const name = "set-rollover-progress";

            export interface SetRolloverProgressArgs {
                loanId: UIntCV,
                data: TupleCV,
            }

            export function args(args: SetRolloverProgressArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.data,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-last-loan-id
        export namespace GetLastLoanId {
            export const name = "get-last-loan-id";

        }

        // get-loan-optional
        export namespace GetLoanOptional {
            export const name = "get-loan-optional";

            export interface GetLoanOptionalArgs {
                loanId: UIntCV,
            }

            export function args(args: GetLoanOptionalArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // get-loan-read
        export namespace GetLoanRead {
            export const name = "get-loan-read";

            export interface GetLoanReadArgs {
                loanId: UIntCV,
            }

            export function args(args: GetLoanReadArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // get-rollover-progress-optional
        export namespace GetRolloverProgressOptional {
            export const name = "get-rollover-progress-optional";

            export interface GetRolloverProgressOptionalArgs {
                loanId: UIntCV,
            }

            export function args(args: GetRolloverProgressOptionalArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // get-rollover-progress-read
        export namespace GetRolloverProgressRead {
            export const name = "get-rollover-progress-read";

            export interface GetRolloverProgressReadArgs {
                loanId: UIntCV,
            }

            export function args(args: GetRolloverProgressReadArgs): ClarityValue[] {
                return [
                    args.loanId,
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

export namespace GovernanceTokenTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "governance-token-trait";

}

export namespace SwapRouterContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "swap-router";

    // Functions
    export namespace Functions {
        // get-x-given-y
        export namespace GetXGivenY {
            export const name = "get-x-given-y";

            export interface GetXGivenYArgs {
                xToken: ClarityValue,
                yToken: ClarityValue,
                dy: UIntCV,
            }

            export function args(args: GetXGivenYArgs): ClarityValue[] {
                return [
                    args.xToken,
                    args.yToken,
                    args.dy,
                ];
            }

        }

        // get-y-given-x
        export namespace GetYGivenX {
            export const name = "get-y-given-x";

            export interface GetYGivenXArgs {
                xToken: ClarityValue,
                yToken: ClarityValue,
                dx: UIntCV,
            }

            export function args(args: GetYGivenXArgs): ClarityValue[] {
                return [
                    args.xToken,
                    args.yToken,
                    args.dx,
                ];
            }

        }

        // set-pair-value
        export namespace SetPairValue {
            export const name = "set-pair-value";

            export interface SetPairValueArgs {
                xToken: ClarityValue,
                yToken: ClarityValue,
                newVal: UIntCV,
            }

            export function args(args: SetPairValueArgs): ClarityValue[] {
                return [
                    args.xToken,
                    args.yToken,
                    args.newVal,
                ];
            }

        }

        // swap-x-for-y
        export namespace SwapXForY {
            export const name = "swap-x-for-y";

            export interface SwapXForYArgs {
                recipient: PrincipalCV,
                xToken: ClarityValue,
                yToken: ClarityValue,
                dx: UIntCV,
                minDy: NoneCV,
            }

            export function args(args: SwapXForYArgs): ClarityValue[] {
                return [
                    args.recipient,
                    args.xToken,
                    args.yToken,
                    args.dx,
                    args.minDy,
                ];
            }

        }

        // swap-y-for-x
        export namespace SwapYForX {
            export const name = "swap-y-for-x";

            export interface SwapYForXArgs {
                recipient: PrincipalCV,
                xToken: ClarityValue,
                yToken: ClarityValue,
                dy: UIntCV,
                minDx: NoneCV,
            }

            export function args(args: SwapYForXArgs): ClarityValue[] {
                return [
                    args.recipient,
                    args.xToken,
                    args.yToken,
                    args.dy,
                    args.minDx,
                ];
            }

        }

        // get-pair
        export namespace GetPair {
            export const name = "get-pair";

            export interface GetPairArgs {
                xToken: ClarityValue,
                yToken: ClarityValue,
            }

            export function args(args: GetPairArgs): ClarityValue[] {
                return [
                    args.xToken,
                    args.yToken,
                ];
            }

        }

        // get-relative-value-bp
        export namespace GetRelativeValueBp {
            export const name = "get-relative-value-bp";

            export interface GetRelativeValueBpArgs {
                xToken: ClarityValue,
                yToken: ClarityValue,
            }

            export function args(args: GetRelativeValueBpArgs): ClarityValue[] {
                return [
                    args.xToken,
                    args.yToken,
                ];
            }

        }

    }
}

export namespace XZestTokenContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "xZest-token";

    // Functions
    export namespace Functions {
        // add-rewards
        export namespace AddRewards {
            export const name = "add-rewards";

            export interface AddRewardsArgs {
                tokenId: UIntCV,
                delta: UIntCV,
            }

            export function args(args: AddRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.delta,
                ];
            }

        }

        // burn
        export namespace Burn {
            export const name = "burn";

            export interface BurnArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: BurnArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.owner,
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
                tokenId: UIntCV,
                amount: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: MintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.recipient,
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
                tokenId: UIntCV,
                value: StringAsciiCV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.sender,
                    args.recipient,
                ];
            }

        }

        // transfer-many
        export namespace TransferMany {
            export const name = "transfer-many";

            export interface TransferManyArgs {
                transfers: ListCV,
            }

            export function args(args: TransferManyArgs): ClarityValue[] {
                return [
                    args.transfers,
                ];
            }

        }

        // transfer-many-memo
        export namespace TransferManyMemo {
            export const name = "transfer-many-memo";

            export interface TransferManyMemoArgs {
                transfers: ListCV,
            }

            export function args(args: TransferManyMemoArgs): ClarityValue[] {
                return [
                    args.transfers,
                ];
            }

        }

        // transfer-memo
        export namespace TransferMemo {
            export const name = "transfer-memo";

            export interface TransferMemoArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: BufferCV,
            }

            export function args(args: TransferMemoArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // withdraw-rewards
        export namespace WithdrawRewards {
            export const name = "withdraw-rewards";

            export interface WithdrawRewardsArgs {
                tokenId: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: WithdrawRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.caller,
                ];
            }

        }

        // accumulative-funds-of
        export namespace AccumulativeFundsOf {
            export const name = "accumulative-funds-of";

            export interface AccumulativeFundsOfArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: AccumulativeFundsOfArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                tokenId: UIntCV,
                who: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.who,
                ];
            }

        }

        // get-balance-uint
        export namespace GetBalanceUint {
            export const name = "get-balance-uint";

            export interface GetBalanceUintArgs {
                tokenId: UIntCV,
                who: PrincipalCV,
            }

            export function args(args: GetBalanceUintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.who,
                ];
            }

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

            export interface GetDecimalsArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetDecimalsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-overall-balance
        export namespace GetOverallBalance {
            export const name = "get-overall-balance";

            export interface GetOverallBalanceArgs {
                who: PrincipalCV,
            }

            export function args(args: GetOverallBalanceArgs): ClarityValue[] {
                return [
                    args.who,
                ];
            }

        }

        // get-overall-supply
        export namespace GetOverallSupply {
            export const name = "get-overall-supply";

        }

        // get-points-correction
        export namespace GetPointsCorrection {
            export const name = "get-points-correction";

            export interface GetPointsCorrectionArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetPointsCorrectionArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-points-per-share
        export namespace GetPointsPerShare {
            export const name = "get-points-per-share";

            export interface GetPointsPerShareArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPointsPerShareArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-sent-funds
        export namespace GetSentFunds {
            export const name = "get-sent-funds";

            export interface GetSentFundsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetSentFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

            export interface GetTokenUriArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTokenUriArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

            export interface GetTotalSupplyArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTotalSupplyArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-total-supply-uint
        export namespace GetTotalSupplyUint {
            export const name = "get-total-supply-uint";

            export interface GetTotalSupplyUintArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTotalSupplyUintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-withdrawn-funds
        export namespace GetWithdrawnFunds {
            export const name = "get-withdrawn-funds";

            export interface GetWithdrawnFundsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetWithdrawnFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
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

        // withdrawable-funds-of
        export namespace WithdrawableFundsOf {
            export const name = "withdrawable-funds-of";

            export interface WithdrawableFundsOfArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: WithdrawableFundsOfArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
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

export namespace DistributionTokenCyclesLossesTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "distribution-token-cycles-losses-trait";

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

export namespace ReadDataContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "read-data";

    // Functions
    export namespace Functions {
        // active-loans-minus
        export namespace ActiveLoansMinus {
            export const name = "active-loans-minus";

        }

        // active-loans-plus
        export namespace ActiveLoansPlus {
            export const name = "active-loans-plus";

        }

        // add-active-loan-amount
        export namespace AddActiveLoanAmount {
            export const name = "add-active-loan-amount";

            export interface AddActiveLoanAmountArgs {
                tokenId: UIntCV,
                amount: UIntCV,
            }

            export function args(args: AddActiveLoanAmountArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                ];
            }

        }

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

        // add-cover-pool-balance
        export namespace AddCoverPoolBalance {
            export const name = "add-cover-pool-balance";

            export interface AddCoverPoolBalanceArgs {
                tokenId: UIntCV,
                amount: UIntCV,
            }

            export function args(args: AddCoverPoolBalanceArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                ];
            }

        }

        // add-cover-pool-btc-rewards-earned
        export namespace AddCoverPoolBtcRewardsEarned {
            export const name = "add-cover-pool-btc-rewards-earned";

            export interface AddCoverPoolBtcRewardsEarnedArgs {
                tokenId: UIntCV,
                amount: UIntCV,
            }

            export function args(args: AddCoverPoolBtcRewardsEarnedArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                ];
            }

        }

        // add-cover-pool-zest-rewards-earned
        export namespace AddCoverPoolZestRewardsEarned {
            export const name = "add-cover-pool-zest-rewards-earned";

            export interface AddCoverPoolZestRewardsEarnedArgs {
                tokenId: UIntCV,
                amount: UIntCV,
            }

            export function args(args: AddCoverPoolZestRewardsEarnedArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                ];
            }

        }

        // add-delegate-btc-rewards-earned
        export namespace AddDelegateBtcRewardsEarned {
            export const name = "add-delegate-btc-rewards-earned";

            export interface AddDelegateBtcRewardsEarnedArgs {
                delegate: PrincipalCV,
                amount: UIntCV,
            }

            export function args(args: AddDelegateBtcRewardsEarnedArgs): ClarityValue[] {
                return [
                    args.delegate,
                    args.amount,
                ];
            }

        }

        // add-pool-btc-rewards-earned
        export namespace AddPoolBtcRewardsEarned {
            export const name = "add-pool-btc-rewards-earned";

            export interface AddPoolBtcRewardsEarnedArgs {
                tokenId: UIntCV,
                amount: UIntCV,
            }

            export function args(args: AddPoolBtcRewardsEarnedArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                ];
            }

        }

        // add-pool-cash
        export namespace AddPoolCash {
            export const name = "add-pool-cash";

            export interface AddPoolCashArgs {
                tokenId: UIntCV,
                amount: UIntCV,
            }

            export function args(args: AddPoolCashArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                ];
            }

        }

        // add-pool-zest-rewards-earned
        export namespace AddPoolZestRewardsEarned {
            export const name = "add-pool-zest-rewards-earned";

            export interface AddPoolZestRewardsEarnedArgs {
                tokenId: UIntCV,
                amount: UIntCV,
            }

            export function args(args: AddPoolZestRewardsEarnedArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // loans-funded-minus
        export namespace LoansFundedMinus {
            export const name = "loans-funded-minus";

        }

        // loans-funded-plus
        export namespace LoansFundedPlus {
            export const name = "loans-funded-plus";

        }

        // remove-active-loan-amount
        export namespace RemoveActiveLoanAmount {
            export const name = "remove-active-loan-amount";

            export interface RemoveActiveLoanAmountArgs {
                tokenId: UIntCV,
                amount: UIntCV,
            }

            export function args(args: RemoveActiveLoanAmountArgs): ClarityValue[] {
                return [
                    args.tokenId,
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

        // remove-cover-pool-balance
        export namespace RemoveCoverPoolBalance {
            export const name = "remove-cover-pool-balance";

            export interface RemoveCoverPoolBalanceArgs {
                tokenId: UIntCV,
                amount: UIntCV,
            }

            export function args(args: RemoveCoverPoolBalanceArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                ];
            }

        }

        // remove-pool-cash
        export namespace RemovePoolCash {
            export const name = "remove-pool-cash";

            export interface RemovePoolCashArgs {
                tokenId: UIntCV,
                amount: UIntCV,
            }

            export function args(args: RemovePoolCashArgs): ClarityValue[] {
                return [
                    args.tokenId,
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

        // get-active-loan-amount
        export namespace GetActiveLoanAmount {
            export const name = "get-active-loan-amount";

            export interface GetActiveLoanAmountArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetActiveLoanAmountArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-active-loans
        export namespace GetActiveLoans {
            export const name = "get-active-loans";

        }

        // get-claimable-rewards
        export namespace GetClaimableRewards {
            export const name = "get-claimable-rewards";

            export interface GetClaimableRewardsArgs {
                tokenId: UIntCV,
                sender: PrincipalCV,
            }

            export function args(args: GetClaimableRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.sender,
                ];
            }

        }

        // get-cover-pool-balance
        export namespace GetCoverPoolBalance {
            export const name = "get-cover-pool-balance";

            export interface GetCoverPoolBalanceArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetCoverPoolBalanceArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-cover-pool-btc-rewards-earned
        export namespace GetCoverPoolBtcRewardsEarned {
            export const name = "get-cover-pool-btc-rewards-earned";

            export interface GetCoverPoolBtcRewardsEarnedArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetCoverPoolBtcRewardsEarnedArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-cover-pool-zest-rewards-earned
        export namespace GetCoverPoolZestRewardsEarned {
            export const name = "get-cover-pool-zest-rewards-earned";

            export interface GetCoverPoolZestRewardsEarnedArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetCoverPoolZestRewardsEarnedArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-delegate-btc-rewards-earned
        export namespace GetDelegateBtcRewardsEarned {
            export const name = "get-delegate-btc-rewards-earned";

            export interface GetDelegateBtcRewardsEarnedArgs {
                delegate: PrincipalCV,
            }

            export function args(args: GetDelegateBtcRewardsEarnedArgs): ClarityValue[] {
                return [
                    args.delegate,
                ];
            }

        }

        // get-loans-funded
        export namespace GetLoansFunded {
            export const name = "get-loans-funded";

        }

        // get-pool-balance
        export namespace GetPoolBalance {
            export const name = "get-pool-balance";

            export interface GetPoolBalanceArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPoolBalanceArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-pool-btc-rewards-earned
        export namespace GetPoolBtcRewardsEarned {
            export const name = "get-pool-btc-rewards-earned";

            export interface GetPoolBtcRewardsEarnedArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPoolBtcRewardsEarnedArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-pool-zest-rewards-earned
        export namespace GetPoolZestRewardsEarned {
            export const name = "get-pool-zest-rewards-earned";

            export interface GetPoolZestRewardsEarnedArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPoolZestRewardsEarnedArgs): ClarityValue[] {
                return [
                    args.tokenId,
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

export namespace WrappedBitcoinContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "Wrapped-Bitcoin";

    // Functions
    export namespace Functions {
        // add-principal-to-role
        export namespace AddPrincipalToRole {
            export const name = "add-principal-to-role";

            export interface AddPrincipalToRoleArgs {
                roleToAdd: UIntCV,
                principalToAdd: PrincipalCV,
            }

            export function args(args: AddPrincipalToRoleArgs): ClarityValue[] {
                return [
                    args.roleToAdd,
                    args.principalToAdd,
                ];
            }

        }

        // burn-tokens
        export namespace BurnTokens {
            export const name = "burn-tokens";

            export interface BurnTokensArgs {
                burnAmount: UIntCV,
                burnFrom: PrincipalCV,
            }

            export function args(args: BurnTokensArgs): ClarityValue[] {
                return [
                    args.burnAmount,
                    args.burnFrom,
                ];
            }

        }

        // initialize
        export namespace Initialize {
            export const name = "initialize";

            export interface InitializeArgs {
                nameToSet: StringAsciiCV,
                symbolToSet: StringAsciiCV,
                decimalsToSet: UIntCV,
                initialOwner: PrincipalCV,
            }

            export function args(args: InitializeArgs): ClarityValue[] {
                return [
                    args.nameToSet,
                    args.symbolToSet,
                    args.decimalsToSet,
                    args.initialOwner,
                ];
            }

        }

        // mint-tokens
        export namespace MintTokens {
            export const name = "mint-tokens";

            export interface MintTokensArgs {
                mintAmount: UIntCV,
                mintTo: PrincipalCV,
            }

            export function args(args: MintTokensArgs): ClarityValue[] {
                return [
                    args.mintAmount,
                    args.mintTo,
                ];
            }

        }

        // remove-principal-from-role
        export namespace RemovePrincipalFromRole {
            export const name = "remove-principal-from-role";

            export interface RemovePrincipalFromRoleArgs {
                roleToRemove: UIntCV,
                principalToRemove: PrincipalCV,
            }

            export function args(args: RemovePrincipalFromRoleArgs): ClarityValue[] {
                return [
                    args.roleToRemove,
                    args.principalToRemove,
                ];
            }

        }

        // revoke-tokens
        export namespace RevokeTokens {
            export const name = "revoke-tokens";

            export interface RevokeTokensArgs {
                revokeAmount: UIntCV,
                revokeFrom: PrincipalCV,
                revokeTo: PrincipalCV,
            }

            export function args(args: RevokeTokensArgs): ClarityValue[] {
                return [
                    args.revokeAmount,
                    args.revokeFrom,
                    args.revokeTo,
                ];
            }

        }

        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                updatedUri: StringUtf8CV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.updatedUri,
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

        // update-blacklisted
        export namespace UpdateBlacklisted {
            export const name = "update-blacklisted";

            export interface UpdateBlacklistedArgs {
                principalToUpdate: PrincipalCV,
                setBlacklisted: BooleanCV,
            }

            export function args(args: UpdateBlacklistedArgs): ClarityValue[] {
                return [
                    args.principalToUpdate,
                    args.setBlacklisted,
                ];
            }

        }

        // detect-transfer-restriction
        export namespace DetectTransferRestriction {
            export const name = "detect-transfer-restriction";

            export interface DetectTransferRestrictionArgs {
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
            }

            export function args(args: DetectTransferRestrictionArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.sender,
                    args.recipient,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                owner: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.owner,
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

        // has-role
        export namespace HasRole {
            export const name = "has-role";

            export interface HasRoleArgs {
                roleToCheck: UIntCV,
                principalToCheck: PrincipalCV,
            }

            export function args(args: HasRoleArgs): ClarityValue[] {
                return [
                    args.roleToCheck,
                    args.principalToCheck,
                ];
            }

        }

        // is-blacklisted
        export namespace IsBlacklisted {
            export const name = "is-blacklisted";

            export interface IsBlacklistedArgs {
                principalToCheck: PrincipalCV,
            }

            export function args(args: IsBlacklistedArgs): ClarityValue[] {
                return [
                    args.principalToCheck,
                ];
            }

        }

        // message-for-restriction
        export namespace MessageForRestriction {
            export const name = "message-for-restriction";

            export interface MessageForRestrictionArgs {
                restrictionCode: UIntCV,
            }

            export function args(args: MessageForRestrictionArgs): ClarityValue[] {
                return [
                    args.restrictionCode,
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

export namespace RewardsReadContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "rewards-read";

    // Functions
    export namespace Functions {
        // get-withdrawable-cover-pool-zest-rewards
        export namespace GetWithdrawableCoverPoolZestRewards {
            export const name = "get-withdrawable-cover-pool-zest-rewards";

            export interface GetWithdrawableCoverPoolZestRewardsArgs {
                tokenId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: GetWithdrawableCoverPoolZestRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.recipient,
                ];
            }

        }

        // get-withdrawable-pool-zest-rewards
        export namespace GetWithdrawablePoolZestRewards {
            export const name = "get-withdrawable-pool-zest-rewards";

            export interface GetWithdrawablePoolZestRewardsArgs {
                tokenId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: GetWithdrawablePoolZestRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.recipient,
                ];
            }

        }

        // get-withdrawable-rewards-cover-pool
        export namespace GetWithdrawableRewardsCoverPool {
            export const name = "get-withdrawable-rewards-cover-pool";

            export interface GetWithdrawableRewardsCoverPoolArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetWithdrawableRewardsCoverPoolArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-withdrawable-rewards-pool
        export namespace GetWithdrawableRewardsPool {
            export const name = "get-withdrawable-rewards-pool";

            export interface GetWithdrawableRewardsPoolArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetWithdrawableRewardsPoolArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

    }
}

export namespace DistributionTokenCyclesTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "distribution-token-cycles-trait";

}

export namespace FundingVaultContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "funding-vault";

    // Functions
    export namespace Functions {
        // add-asset
        export namespace AddAsset {
            export const name = "add-asset";

            export interface AddAssetArgs {
                xbtc: ClarityValue,
                amount: UIntCV,
                loanId: UIntCV,
                sender: PrincipalCV,
            }

            export function args(args: AddAssetArgs): ClarityValue[] {
                return [
                    args.xbtc,
                    args.amount,
                    args.loanId,
                    args.sender,
                ];
            }

        }

        // draw
        export namespace Draw {
            export const name = "draw";

            export interface DrawArgs {
                xbtc: ClarityValue,
                loanId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: DrawArgs): ClarityValue[] {
                return [
                    args.xbtc,
                    args.loanId,
                    args.recipient,
                ];
            }

        }

        // get-asset
        export namespace GetAsset {
            export const name = "get-asset";

            export interface GetAssetArgs {
                loanId: UIntCV,
            }

            export function args(args: GetAssetArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // remove-asset
        export namespace RemoveAsset {
            export const name = "remove-asset";

            export interface RemoveAssetArgs {
                xbtc: ClarityValue,
                amount: UIntCV,
                loanId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: RemoveAssetArgs): ClarityValue[] {
                return [
                    args.xbtc,
                    args.amount,
                    args.loanId,
                    args.recipient,
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

export namespace ProtocolTreasuryContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "protocol-treasury";

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

export namespace MagicProtocolContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "magic-protocol";

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
                minToReceive: UIntCV,
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
                    args.minToReceive,
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
                inboundFee: OptionalCV,
                outboundFee: OptionalCV,
                outboundBaseFee: IntCV,
                inboundBaseFee: IntCV,
                funds: UIntCV,
            }

            export function args(args: RegisterSupplierArgs): ClarityValue[] {
                return [
                    args.publicKey,
                    args.inboundFee,
                    args.outboundFee,
                    args.outboundBaseFee,
                    args.inboundBaseFee,
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

        // revoke-expired-inbound
        export namespace RevokeExpiredInbound {
            export const name = "revoke-expired-inbound";

            export interface RevokeExpiredInboundArgs {
                txid: BufferCV,
            }

            export function args(args: RevokeExpiredInboundArgs): ClarityValue[] {
                return [
                    args.txid,
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
                inboundFee: OptionalCV,
                outboundFee: OptionalCV,
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
                feeOpt: OptionalCV,
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

export namespace LpTokenContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "lp-token";

    // Functions
    export namespace Functions {
        // add-rewards
        export namespace AddRewards {
            export const name = "add-rewards";

            export interface AddRewardsArgs {
                tokenId: UIntCV,
                delta: UIntCV,
            }

            export function args(args: AddRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.delta,
                ];
            }

        }

        // burn
        export namespace Burn {
            export const name = "burn";

            export interface BurnArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: BurnArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.owner,
                ];
            }

        }

        // distribute-losses
        export namespace DistributeLosses {
            export const name = "distribute-losses";

            export interface DistributeLossesArgs {
                tokenId: UIntCV,
                delta: UIntCV,
            }

            export function args(args: DistributeLossesArgs): ClarityValue[] {
                return [
                    args.tokenId,
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
                tokenId: UIntCV,
                amount: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: MintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.recipient,
                ];
            }

        }

        // recognizable-losses-of
        export namespace RecognizableLossesOf {
            export const name = "recognizable-losses-of";

            export interface RecognizableLossesOfArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: RecognizableLossesOfArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // recognize-losses
        export namespace RecognizeLosses {
            export const name = "recognize-losses";

            export interface RecognizeLossesArgs {
                tokenId: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: RecognizeLossesArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.caller,
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

        // set-cycle-start
        export namespace SetCycleStart {
            export const name = "set-cycle-start";

            export interface SetCycleStartArgs {
                tokenId: UIntCV,
                start: UIntCV,
            }

            export function args(args: SetCycleStartArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.start,
                ];
            }

        }

        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                tokenId: UIntCV,
                value: StringAsciiCV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.sender,
                    args.recipient,
                ];
            }

        }

        // transfer-many
        export namespace TransferMany {
            export const name = "transfer-many";

            export interface TransferManyArgs {
                transfers: ListCV,
            }

            export function args(args: TransferManyArgs): ClarityValue[] {
                return [
                    args.transfers,
                ];
            }

        }

        // transfer-many-memo
        export namespace TransferManyMemo {
            export const name = "transfer-many-memo";

            export interface TransferManyMemoArgs {
                transfers: ListCV,
            }

            export function args(args: TransferManyMemoArgs): ClarityValue[] {
                return [
                    args.transfers,
                ];
            }

        }

        // transfer-memo
        export namespace TransferMemo {
            export const name = "transfer-memo";

            export interface TransferMemoArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: BufferCV,
            }

            export function args(args: TransferMemoArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // withdraw-rewards
        export namespace WithdrawRewards {
            export const name = "withdraw-rewards";

            export interface WithdrawRewardsArgs {
                tokenId: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: WithdrawRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.caller,
                ];
            }

        }

        // accumulative-funds-of
        export namespace AccumulativeFundsOf {
            export const name = "accumulative-funds-of";

            export interface AccumulativeFundsOfArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: AccumulativeFundsOfArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // accumulative-losses-of
        export namespace AccumulativeLossesOf {
            export const name = "accumulative-losses-of";

            export interface AccumulativeLossesOfArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: AccumulativeLossesOfArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                tokenId: UIntCV,
                who: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.who,
                ];
            }

        }

        // get-balance-uint
        export namespace GetBalanceUint {
            export const name = "get-balance-uint";

            export interface GetBalanceUintArgs {
                tokenId: UIntCV,
                who: PrincipalCV,
            }

            export function args(args: GetBalanceUintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.who,
                ];
            }

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

            export interface GetDecimalsArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetDecimalsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-losses-correction
        export namespace GetLossesCorrection {
            export const name = "get-losses-correction";

            export interface GetLossesCorrectionArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetLossesCorrectionArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-losses-per-share
        export namespace GetLossesPerShare {
            export const name = "get-losses-per-share";

            export interface GetLossesPerShareArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetLossesPerShareArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-overall-balance
        export namespace GetOverallBalance {
            export const name = "get-overall-balance";

            export interface GetOverallBalanceArgs {
                who: PrincipalCV,
            }

            export function args(args: GetOverallBalanceArgs): ClarityValue[] {
                return [
                    args.who,
                ];
            }

        }

        // get-overall-supply
        export namespace GetOverallSupply {
            export const name = "get-overall-supply";

        }

        // get-points-correction
        export namespace GetPointsCorrection {
            export const name = "get-points-correction";

            export interface GetPointsCorrectionArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetPointsCorrectionArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-points-per-share
        export namespace GetPointsPerShare {
            export const name = "get-points-per-share";

            export interface GetPointsPerShareArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPointsPerShareArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-pool-funds-balance
        export namespace GetPoolFundsBalance {
            export const name = "get-pool-funds-balance";

            export interface GetPoolFundsBalanceArgs {
                tokenId: UIntCV,
                sender: PrincipalCV,
            }

            export function args(args: GetPoolFundsBalanceArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.sender,
                ];
            }

        }

        // get-pool-lost-funds
        export namespace GetPoolLostFunds {
            export const name = "get-pool-lost-funds";

            export interface GetPoolLostFundsArgs {
                tokenId: UIntCV,
                sender: PrincipalCV,
            }

            export function args(args: GetPoolLostFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.sender,
                ];
            }

        }

        // get-pool-sent-funds
        export namespace GetPoolSentFunds {
            export const name = "get-pool-sent-funds";

            export interface GetPoolSentFundsArgs {
                tokenId: UIntCV,
                sender: PrincipalCV,
            }

            export function args(args: GetPoolSentFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.sender,
                ];
            }

        }

        // get-recognized-losses
        export namespace GetRecognizedLosses {
            export const name = "get-recognized-losses";

            export interface GetRecognizedLossesArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetRecognizedLossesArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

            export interface GetTokenUriArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTokenUriArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

            export interface GetTotalSupplyArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTotalSupplyArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-total-supply-uint
        export namespace GetTotalSupplyUint {
            export const name = "get-total-supply-uint";

            export interface GetTotalSupplyUintArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTotalSupplyUintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-withdrawn-funds
        export namespace GetWithdrawnFunds {
            export const name = "get-withdrawn-funds";

            export interface GetWithdrawnFundsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetWithdrawnFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
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

        // recognizable-losses-of-read
        export namespace RecognizableLossesOfRead {
            export const name = "recognizable-losses-of-read";

            export interface RecognizableLossesOfReadArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: RecognizableLossesOfReadArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // withdrawable-funds-of
        export namespace WithdrawableFundsOf {
            export const name = "withdrawable-funds-of";

            export interface WithdrawableFundsOfArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: WithdrawableFundsOfArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

    }
}

export namespace PaymentFixedContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "payment-fixed";

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

        // make-full-payment
        export namespace MakeFullPayment {
            export const name = "make-full-payment";

            export interface MakeFullPaymentArgs {
                lpToken: ClarityValue,
                lv: ClarityValue,
                tokenId: UIntCV,
                cpToken: ClarityValue,
                cpRewardsToken: ClarityValue,
                zdToken: ClarityValue,
                swapRouter: ClarityValue,
                height: UIntCV,
                loanId: UIntCV,
                paidAmount: UIntCV,
                xbtc: ClarityValue,
                caller: PrincipalCV,
            }

            export function args(args: MakeFullPaymentArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.lv,
                    args.tokenId,
                    args.cpToken,
                    args.cpRewardsToken,
                    args.zdToken,
                    args.swapRouter,
                    args.height,
                    args.loanId,
                    args.paidAmount,
                    args.xbtc,
                    args.caller,
                ];
            }

        }

        // make-next-payment
        export namespace MakeNextPayment {
            export const name = "make-next-payment";

            export interface MakeNextPaymentArgs {
                lpToken: ClarityValue,
                lv: ClarityValue,
                tokenId: UIntCV,
                cpToken: ClarityValue,
                cpRewardsToken: ClarityValue,
                zdToken: ClarityValue,
                swapRouter: ClarityValue,
                height: UIntCV,
                loanId: UIntCV,
                paidAmount: UIntCV,
                xbtc: ClarityValue,
                caller: PrincipalCV,
            }

            export function args(args: MakeNextPaymentArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.lv,
                    args.tokenId,
                    args.cpToken,
                    args.cpRewardsToken,
                    args.zdToken,
                    args.swapRouter,
                    args.height,
                    args.loanId,
                    args.paidAmount,
                    args.xbtc,
                    args.caller,
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

        // trigger-late-payment
        export namespace TriggerLatePayment {
            export const name = "trigger-late-payment";

            export interface TriggerLatePaymentArgs {
                loanId: UIntCV,
                tokenId: UIntCV,
            }

            export function args(args: TriggerLatePaymentArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.tokenId,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-current-loan-payment
        export namespace GetCurrentLoanPayment {
            export const name = "get-current-loan-payment";

            export interface GetCurrentLoanPaymentArgs {
                loanId: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: GetCurrentLoanPaymentArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.caller,
                ];
            }

        }

        // get-early-repayment-amount
        export namespace GetEarlyRepaymentAmount {
            export const name = "get-early-repayment-amount";

            export interface GetEarlyRepaymentAmountArgs {
                loanId: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: GetEarlyRepaymentAmountArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.caller,
                ];
            }

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
                caller: PrincipalCV,
            }

            export function args(args: GetPaymentArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.paymentPeriod,
                    args.apr,
                    args.height,
                    args.nextPayment,
                    args.caller,
                ];
            }

        }

        // get-payment-at-height
        export namespace GetPaymentAtHeight {
            export const name = "get-payment-at-height";

            export interface GetPaymentAtHeightArgs {
                loanId: UIntCV,
                height: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: GetPaymentAtHeightArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.height,
                    args.caller,
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

        // is-paying-late-fees
        export namespace IsPayingLateFees {
            export const name = "is-paying-late-fees";

            export interface IsPayingLateFeesArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsPayingLateFeesArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

    }
}

export namespace RestrictedTokenTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "restricted-token-trait";

}

export namespace OwnableTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "ownable-trait";

}

export namespace StakingPoolContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "staking-pool";

    // Functions
    export namespace Functions {
        // add-rewards
        export namespace AddRewards {
            export const name = "add-rewards";

            export interface AddRewardsArgs {
                spToken: ClarityValue,
                amount: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: AddRewardsArgs): ClarityValue[] {
                return [
                    args.spToken,
                    args.amount,
                    args.caller,
                ];
            }

        }

        // send-funds
        export namespace SendFunds {
            export const name = "send-funds";

            export interface SendFundsArgs {
                spToken: ClarityValue,
                amount: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: SendFundsArgs): ClarityValue[] {
                return [
                    args.spToken,
                    args.amount,
                    args.caller,
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

        // set-default
        export namespace SetDefault {
            export const name = "set-default";

        }

        // set-ready
        export namespace SetReady {
            export const name = "set-ready";

        }

        // signal-withdrawal
        export namespace SignalWithdrawal {
            export const name = "signal-withdrawal";

            export interface SignalWithdrawalArgs {
                amount: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: SignalWithdrawalArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.caller,
                ];
            }

        }

        // withdraw
        export namespace Withdraw {
            export const name = "withdraw";

            export interface WithdrawArgs {
                spToken: ClarityValue,
                amount: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: WithdrawArgs): ClarityValue[] {
                return [
                    args.spToken,
                    args.amount,
                    args.caller,
                ];
            }

        }

        // withdraw-rewards
        export namespace WithdrawRewards {
            export const name = "withdraw-rewards";

            export interface WithdrawRewardsArgs {
                spToken: ClarityValue,
                tokenId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: WithdrawRewardsArgs): ClarityValue[] {
                return [
                    args.spToken,
                    args.tokenId,
                    args.recipient,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-pool
        export namespace GetPool {
            export const name = "get-pool";

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

export namespace LiquidityVaultV10Contract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "liquidity-vault-v1-0";

    // Functions
    export namespace Functions {
        // add-asset
        export namespace AddAsset {
            export const name = "add-asset";

            export interface AddAssetArgs {
                asset: ClarityValue,
                amount: UIntCV,
                tokenId: UIntCV,
                sender: PrincipalCV,
            }

            export function args(args: AddAssetArgs): ClarityValue[] {
                return [
                    args.asset,
                    args.amount,
                    args.tokenId,
                    args.sender,
                ];
            }

        }

        // draw
        export namespace Draw {
            export const name = "draw";

            export interface DrawArgs {
                asset: ClarityValue,
                tokenId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: DrawArgs): ClarityValue[] {
                return [
                    args.asset,
                    args.tokenId,
                    args.recipient,
                ];
            }

        }

        // get-asset
        export namespace GetAsset {
            export const name = "get-asset";

            export interface GetAssetArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetAssetArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // remove-asset
        export namespace RemoveAsset {
            export const name = "remove-asset";

            export interface RemoveAssetArgs {
                asset: ClarityValue,
                amount: UIntCV,
                tokenId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: RemoveAssetArgs): ClarityValue[] {
                return [
                    args.asset,
                    args.amount,
                    args.tokenId,
                    args.recipient,
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

export namespace SupplierInterfaceContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "supplier-interface";

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

        // cancel-drawdown
        export namespace CancelDrawdown {
            export const name = "cancel-drawdown";

            export interface CancelDrawdownArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                xbtcFt: ClarityValue,
                swapId: UIntCV,
            }

            export function args(args: CancelDrawdownArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.xbtcFt,
                    args.swapId,
                ];
            }

        }

        // cancel-rollover
        export namespace CancelRollover {
            export const name = "cancel-rollover";

            export interface CancelRolloverArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                xbtcFt: ClarityValue,
                swapId: UIntCV,
            }

            export function args(args: CancelRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.xbtcFt,
                    args.swapId,
                ];
            }

        }

        // complete-rollover
        export namespace CompleteRollover {
            export const name = "complete-rollover";

            export interface CompleteRolloverArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                btcVersion: BufferCV,
                btcHash: BufferCV,
                supplierId: UIntCV,
                swapRouter: ClarityValue,
                xbtcFt: ClarityValue,
            }

            export function args(args: CompleteRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.btcVersion,
                    args.btcHash,
                    args.supplierId,
                    args.swapRouter,
                    args.xbtcFt,
                ];
            }

        }

        // drawdown
        export namespace Drawdown {
            export const name = "drawdown";

            export interface DrawdownArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                btcVersion: BufferCV,
                btcHash: BufferCV,
                supplierId: UIntCV,
                swapRouter: ClarityValue,
                xbtcFt: ClarityValue,
            }

            export function args(args: DrawdownArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.btcVersion,
                    args.btcHash,
                    args.supplierId,
                    args.swapRouter,
                    args.xbtcFt,
                ];
            }

        }

        // drawdown-xbtc
        export namespace DrawdownXbtc {
            export const name = "drawdown-xbtc";

            export interface DrawdownXbtcArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                swapRouter: ClarityValue,
                xbtcFt: ClarityValue,
            }

            export function args(args: DrawdownXbtcArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.swapRouter,
                    args.xbtcFt,
                ];
            }

        }

        // finalize-drawdown
        export namespace FinalizeDrawdown {
            export const name = "finalize-drawdown";

            export interface FinalizeDrawdownArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                xbtcFt: ClarityValue,
                block: TupleCV,
                prevBlocks: ListCV,
                tx: BufferCV,
                proof: TupleCV,
                outputIndex: UIntCV,
                swapId: UIntCV,
            }

            export function args(args: FinalizeDrawdownArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.xbtcFt,
                    args.block,
                    args.prevBlocks,
                    args.tx,
                    args.proof,
                    args.outputIndex,
                    args.swapId,
                ];
            }

        }

        // finalize-outbound
        export namespace FinalizeOutbound {
            export const name = "finalize-outbound";

            export interface FinalizeOutboundArgs {
                block: TupleCV,
                prevBlocks: ListCV,
                tx: BufferCV,
                proof: TupleCV,
                outputIndex: UIntCV,
                swapId: UIntCV,
            }

            export function args(args: FinalizeOutboundArgs): ClarityValue[] {
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

        // finalize-rollover
        export namespace FinalizeRollover {
            export const name = "finalize-rollover";

            export interface FinalizeRolloverArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                xbtcFt: ClarityValue,
                block: TupleCV,
                prevBlocks: ListCV,
                tx: BufferCV,
                proof: TupleCV,
                outputIndex: UIntCV,
                swapId: UIntCV,
            }

            export function args(args: FinalizeRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.xbtcFt,
                    args.block,
                    args.prevBlocks,
                    args.tx,
                    args.proof,
                    args.outputIndex,
                    args.swapId,
                ];
            }

        }

        // make-full-payment
        export namespace MakeFullPayment {
            export const name = "make-full-payment";

            export interface MakeFullPaymentArgs {
                txid: BufferCV,
                preimage: BufferCV,
                loanId: UIntCV,
                payment: ClarityValue,
                lpToken: ClarityValue,
                lv: ClarityValue,
                tokenId: UIntCV,
                cpToken: ClarityValue,
                cpRewardsToken: ClarityValue,
                zpToken: ClarityValue,
                swapRouter: ClarityValue,
                xbtcFt: ClarityValue,
            }

            export function args(args: MakeFullPaymentArgs): ClarityValue[] {
                return [
                    args.txid,
                    args.preimage,
                    args.loanId,
                    args.payment,
                    args.lpToken,
                    args.lv,
                    args.tokenId,
                    args.cpToken,
                    args.cpRewardsToken,
                    args.zpToken,
                    args.swapRouter,
                    args.xbtcFt,
                ];
            }

        }

        // make-full-payment-xbtc
        export namespace MakeFullPaymentXbtc {
            export const name = "make-full-payment-xbtc";

            export interface MakeFullPaymentXbtcArgs {
                amount: UIntCV,
                loanId: UIntCV,
                payment: ClarityValue,
                lpToken: ClarityValue,
                lv: ClarityValue,
                tokenId: UIntCV,
                cpToken: ClarityValue,
                cpRewardsToken: ClarityValue,
                zpToken: ClarityValue,
                swapRouter: ClarityValue,
                xbtcFt: ClarityValue,
            }

            export function args(args: MakeFullPaymentXbtcArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.loanId,
                    args.payment,
                    args.lpToken,
                    args.lv,
                    args.tokenId,
                    args.cpToken,
                    args.cpRewardsToken,
                    args.zpToken,
                    args.swapRouter,
                    args.xbtcFt,
                ];
            }

        }

        // make-payment
        export namespace MakePayment {
            export const name = "make-payment";

            export interface MakePaymentArgs {
                txid: BufferCV,
                preimage: BufferCV,
                loanId: UIntCV,
                payment: ClarityValue,
                lpToken: ClarityValue,
                lv: ClarityValue,
                tokenId: UIntCV,
                cpToken: ClarityValue,
                cpRewardsToken: ClarityValue,
                zpToken: ClarityValue,
                swapRouter: ClarityValue,
                xbtcFt: ClarityValue,
            }

            export function args(args: MakePaymentArgs): ClarityValue[] {
                return [
                    args.txid,
                    args.preimage,
                    args.loanId,
                    args.payment,
                    args.lpToken,
                    args.lv,
                    args.tokenId,
                    args.cpToken,
                    args.cpRewardsToken,
                    args.zpToken,
                    args.swapRouter,
                    args.xbtcFt,
                ];
            }

        }

        // make-payment-xbtc
        export namespace MakePaymentXbtc {
            export const name = "make-payment-xbtc";

            export interface MakePaymentXbtcArgs {
                amount: UIntCV,
                loanId: UIntCV,
                payment: ClarityValue,
                lpToken: ClarityValue,
                lv: ClarityValue,
                tokenId: UIntCV,
                cpToken: ClarityValue,
                cpRewardsToken: ClarityValue,
                zpToken: ClarityValue,
                swapRouter: ClarityValue,
                xbtcFt: ClarityValue,
            }

            export function args(args: MakePaymentXbtcArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.loanId,
                    args.payment,
                    args.lpToken,
                    args.lv,
                    args.tokenId,
                    args.cpToken,
                    args.cpRewardsToken,
                    args.zpToken,
                    args.swapRouter,
                    args.xbtcFt,
                ];
            }

        }

        // make-residual-payment
        export namespace MakeResidualPayment {
            export const name = "make-residual-payment";

            export interface MakeResidualPaymentArgs {
                txid: BufferCV,
                preimage: BufferCV,
                loanId: UIntCV,
                lpToken: ClarityValue,
                lv: ClarityValue,
                tokenId: UIntCV,
                xbtcFt: ClarityValue,
            }

            export function args(args: MakeResidualPaymentArgs): ClarityValue[] {
                return [
                    args.txid,
                    args.preimage,
                    args.loanId,
                    args.lpToken,
                    args.lv,
                    args.tokenId,
                    args.xbtcFt,
                ];
            }

        }

        // register-supplier
        export namespace RegisterSupplier {
            export const name = "register-supplier";

            export interface RegisterSupplierArgs {
                publicKey: BufferCV,
                inboundFee: OptionalCV,
                outboundFee: OptionalCV,
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

        // send-funds
        export namespace SendFunds {
            export const name = "send-funds";

            export interface SendFundsArgs {
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
                minToReceive: UIntCV,
            }

            export function args(args: SendFundsArgs): ClarityValue[] {
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
                    args.minToReceive,
                ];
            }

        }

        // send-funds-finalize
        export namespace SendFundsFinalize {
            export const name = "send-funds-finalize";

            export interface SendFundsFinalizeArgs {
                txid: BufferCV,
                preimage: BufferCV,
                factor: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                zpToken: ClarityValue,
                lv: ClarityValue,
                xbtcFt: ClarityValue,
                rewardsCalc: ClarityValue,
            }

            export function args(args: SendFundsFinalizeArgs): ClarityValue[] {
                return [
                    args.txid,
                    args.preimage,
                    args.factor,
                    args.lpToken,
                    args.tokenId,
                    args.zpToken,
                    args.lv,
                    args.xbtcFt,
                    args.rewardsCalc,
                ];
            }

        }

        // send-funds-wrap
        export namespace SendFundsWrap {
            export const name = "send-funds-wrap";

            export interface SendFundsWrapArgs {
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
                minToReceive: UIntCV,
                preimage: BufferCV,
                factor: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                zpToken: ClarityValue,
                lv: ClarityValue,
                xbtcFt: ClarityValue,
                rewardsCalc: ClarityValue,
            }

            export function args(args: SendFundsWrapArgs): ClarityValue[] {
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
                    args.minToReceive,
                    args.preimage,
                    args.factor,
                    args.lpToken,
                    args.tokenId,
                    args.zpToken,
                    args.lv,
                    args.xbtcFt,
                    args.rewardsCalc,
                ];
            }

        }

        // send-funds-xbtc
        export namespace SendFundsXbtc {
            export const name = "send-funds-xbtc";

            export interface SendFundsXbtcArgs {
                factor: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                zpToken: ClarityValue,
                lv: ClarityValue,
                xbtcFt: ClarityValue,
                amount: UIntCV,
                rewardsCalc: ClarityValue,
            }

            export function args(args: SendFundsXbtcArgs): ClarityValue[] {
                return [
                    args.factor,
                    args.lpToken,
                    args.tokenId,
                    args.zpToken,
                    args.lv,
                    args.xbtcFt,
                    args.amount,
                    args.rewardsCalc,
                ];
            }

        }

        // transfer-owner
        export namespace TransferOwner {
            export const name = "transfer-owner";

            export interface TransferOwnerArgs {
                newOwner: PrincipalCV,
            }

            export function args(args: TransferOwnerArgs): ClarityValue[] {
                return [
                    args.newOwner,
                ];
            }

        }

        // update-liquidity
        export namespace UpdateLiquidity {
            export const name = "update-liquidity";

            export interface UpdateLiquidityArgs {
                height: UIntCV,
                liquidity: UIntCV,
            }

            export function args(args: UpdateLiquidityArgs): ClarityValue[] {
                return [
                    args.height,
                    args.liquidity,
                ];
            }

        }

        // update-supplier
        export namespace UpdateSupplier {
            export const name = "update-supplier";

            export interface UpdateSupplierArgs {
                publicKey: BufferCV,
                inboundFee: NoneCV,
                outboundFee: NoneCV,
                outboundBaseFee: IntCV,
                inboundBaseFee: IntCV,
                name: StringAsciiCV,
            }

            export function args(args: UpdateSupplierArgs): ClarityValue[] {
                return [
                    args.publicKey,
                    args.inboundFee,
                    args.outboundFee,
                    args.outboundBaseFee,
                    args.inboundBaseFee,
                    args.name,
                ];
            }

        }

        // withdraw
        export namespace Withdraw {
            export const name = "withdraw";

            export interface WithdrawArgs {
                xbtc: UIntCV,
                btcVersion: BufferCV,
                btcHash: BufferCV,
                supplierId: UIntCV,
                lpToken: ClarityValue,
                zpToken: ClarityValue,
                tokenId: UIntCV,
                lv: ClarityValue,
                xbtcFt: ClarityValue,
            }

            export function args(args: WithdrawArgs): ClarityValue[] {
                return [
                    args.xbtc,
                    args.btcVersion,
                    args.btcHash,
                    args.supplierId,
                    args.lpToken,
                    args.zpToken,
                    args.tokenId,
                    args.lv,
                    args.xbtcFt,
                ];
            }

        }

        // withdraw-cover-rewards
        export namespace WithdrawCoverRewards {
            export const name = "withdraw-cover-rewards";

            export interface WithdrawCoverRewardsArgs {
                btcVersion: BufferCV,
                btcHash: BufferCV,
                supplierId: UIntCV,
                cpRewardsToken: ClarityValue,
                tokenId: UIntCV,
                lv: ClarityValue,
                xbtc: ClarityValue,
            }

            export function args(args: WithdrawCoverRewardsArgs): ClarityValue[] {
                return [
                    args.btcVersion,
                    args.btcHash,
                    args.supplierId,
                    args.cpRewardsToken,
                    args.tokenId,
                    args.lv,
                    args.xbtc,
                ];
            }

        }

        // withdraw-cover-rewards-xbtc
        export namespace WithdrawCoverRewardsXbtc {
            export const name = "withdraw-cover-rewards-xbtc";

            export interface WithdrawCoverRewardsXbtcArgs {
                btcVersion: BufferCV,
                btcHash: BufferCV,
                supplierId: UIntCV,
                cpRewardsToken: ClarityValue,
                tokenId: UIntCV,
                lv: ClarityValue,
                xbtc: ClarityValue,
            }

            export function args(args: WithdrawCoverRewardsXbtcArgs): ClarityValue[] {
                return [
                    args.btcVersion,
                    args.btcHash,
                    args.supplierId,
                    args.cpRewardsToken,
                    args.tokenId,
                    args.lv,
                    args.xbtc,
                ];
            }

        }

        // withdraw-rewards
        export namespace WithdrawRewards {
            export const name = "withdraw-rewards";

            export interface WithdrawRewardsArgs {
                btcVersion: BufferCV,
                btcHash: BufferCV,
                supplierId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                lv: ClarityValue,
                xbtc: ClarityValue,
            }

            export function args(args: WithdrawRewardsArgs): ClarityValue[] {
                return [
                    args.btcVersion,
                    args.btcHash,
                    args.supplierId,
                    args.lpToken,
                    args.tokenId,
                    args.lv,
                    args.xbtc,
                ];
            }

        }

        // withdraw-rewards-xbtc
        export namespace WithdrawRewardsXbtc {
            export const name = "withdraw-rewards-xbtc";

            export interface WithdrawRewardsXbtcArgs {
                lpToken: ClarityValue,
                tokenId: UIntCV,
                lv: ClarityValue,
                xbtc: ClarityValue,
            }

            export function args(args: WithdrawRewardsXbtcArgs): ClarityValue[] {
                return [
                    args.lpToken,
                    args.tokenId,
                    args.lv,
                    args.xbtc,
                ];
            }

        }

        // withdraw-xbtc
        export namespace WithdrawXbtc {
            export const name = "withdraw-xbtc";

            export interface WithdrawXbtcArgs {
                xbtc: UIntCV,
                lpToken: ClarityValue,
                zpToken: ClarityValue,
                tokenId: UIntCV,
                lv: ClarityValue,
                xbtcFt: ClarityValue,
            }

            export function args(args: WithdrawXbtcArgs): ClarityValue[] {
                return [
                    args.xbtc,
                    args.lpToken,
                    args.zpToken,
                    args.tokenId,
                    args.lv,
                    args.xbtcFt,
                ];
            }

        }

        // get-current-liquidity
        export namespace GetCurrentLiquidity {
            export const name = "get-current-liquidity";

        }

        // get-liquidity
        export namespace GetLiquidity {
            export const name = "get-liquidity";

            export interface GetLiquidityArgs {
                height: UIntCV,
            }

            export function args(args: GetLiquidityArgs): ClarityValue[] {
                return [
                    args.height,
                ];
            }

        }

        // get-liquidity-read
        export namespace GetLiquidityRead {
            export const name = "get-liquidity-read";

            export interface GetLiquidityReadArgs {
                height: UIntCV,
            }

            export function args(args: GetLiquidityReadArgs): ClarityValue[] {
                return [
                    args.height,
                ];
            }

        }

        // get-owner
        export namespace GetOwner {
            export const name = "get-owner";

        }

        // validate-owner
        export namespace ValidateOwner {
            export const name = "validate-owner";

        }

    }
}

export namespace VaultTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "vault-trait";

}

export namespace ZestRewardDistContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "zest-reward-dist";

    // Functions
    export namespace Functions {
        // add-rewards
        export namespace AddRewards {
            export const name = "add-rewards";

            export interface AddRewardsArgs {
                tokenId: UIntCV,
                delta: UIntCV,
            }

            export function args(args: AddRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.delta,
                ];
            }

        }

        // burn
        export namespace Burn {
            export const name = "burn";

            export interface BurnArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: BurnArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.owner,
                ];
            }

        }

        // empty-commitments
        export namespace EmptyCommitments {
            export const name = "empty-commitments";

            export interface EmptyCommitmentsArgs {
                tokenId: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: EmptyCommitmentsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.caller,
                ];
            }

        }

        // get-committed-funds
        export namespace GetCommittedFunds {
            export const name = "get-committed-funds";

            export interface GetCommittedFundsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetCommittedFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
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
                tokenId: UIntCV,
                amount: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: MintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.recipient,
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

        // set-cycle-start
        export namespace SetCycleStart {
            export const name = "set-cycle-start";

            export interface SetCycleStartArgs {
                tokenId: UIntCV,
                start: UIntCV,
            }

            export function args(args: SetCycleStartArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.start,
                ];
            }

        }

        // set-share-cycles
        export namespace SetShareCycles {
            export const name = "set-share-cycles";

            export interface SetShareCyclesArgs {
                startCycle: UIntCV,
                endCycle: UIntCV,
                tokenId: UIntCV,
                amount: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: SetShareCyclesArgs): ClarityValue[] {
                return [
                    args.startCycle,
                    args.endCycle,
                    args.tokenId,
                    args.amount,
                    args.caller,
                ];
            }

        }

        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                tokenId: UIntCV,
                value: StringAsciiCV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.sender,
                    args.recipient,
                ];
            }

        }

        // transfer-many
        export namespace TransferMany {
            export const name = "transfer-many";

            export interface TransferManyArgs {
                transfers: ListCV,
            }

            export function args(args: TransferManyArgs): ClarityValue[] {
                return [
                    args.transfers,
                ];
            }

        }

        // transfer-many-memo
        export namespace TransferManyMemo {
            export const name = "transfer-many-memo";

            export interface TransferManyMemoArgs {
                transfers: ListCV,
            }

            export function args(args: TransferManyMemoArgs): ClarityValue[] {
                return [
                    args.transfers,
                ];
            }

        }

        // transfer-memo
        export namespace TransferMemo {
            export const name = "transfer-memo";

            export interface TransferMemoArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: BufferCV,
            }

            export function args(args: TransferMemoArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // withdraw-cycle-rewards
        export namespace WithdrawCycleRewards {
            export const name = "withdraw-cycle-rewards";

            export interface WithdrawCycleRewardsArgs {
                tokenId: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: WithdrawCycleRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.caller,
                ];
            }

        }

        // withdraw-rewards
        export namespace WithdrawRewards {
            export const name = "withdraw-rewards";

            export interface WithdrawRewardsArgs {
                tokenId: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: WithdrawRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.caller,
                ];
            }

        }

        // accumulative-funds-of
        export namespace AccumulativeFundsOf {
            export const name = "accumulative-funds-of";

            export interface AccumulativeFundsOfArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: AccumulativeFundsOfArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-all-cycle-rewards-of
        export namespace GetAllCycleRewardsOf {
            export const name = "get-all-cycle-rewards-of";

            export interface GetAllCycleRewardsOfArgs {
                tokenId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: GetAllCycleRewardsOfArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.recipient,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                tokenId: UIntCV,
                who: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.who,
                ];
            }

        }

        // get-balance-uint
        export namespace GetBalanceUint {
            export const name = "get-balance-uint";

            export interface GetBalanceUintArgs {
                tokenId: UIntCV,
                who: PrincipalCV,
            }

            export function args(args: GetBalanceUintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.who,
                ];
            }

        }

        // get-claimable-rewards-by
        export namespace GetClaimableRewardsBy {
            export const name = "get-claimable-rewards-by";

            export interface GetClaimableRewardsByArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetClaimableRewardsByArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-current-cycle
        export namespace GetCurrentCycle {
            export const name = "get-current-cycle";

            export interface GetCurrentCycleArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetCurrentCycleArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-cycle-at
        export namespace GetCycleAt {
            export const name = "get-cycle-at";

            export interface GetCycleAtArgs {
                tokenId: UIntCV,
                stacksHeight: UIntCV,
            }

            export function args(args: GetCycleAtArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.stacksHeight,
                ];
            }

        }

        // get-cycle-rewards
        export namespace GetCycleRewards {
            export const name = "get-cycle-rewards";

            export interface GetCycleRewardsArgs {
                tokenId: UIntCV,
                cycle: UIntCV,
            }

            export function args(args: GetCycleRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.cycle,
                ];
            }

        }

        // get-cycle-share
        export namespace GetCycleShare {
            export const name = "get-cycle-share";

            export interface GetCycleShareArgs {
                tokenId: UIntCV,
                cycle: UIntCV,
            }

            export function args(args: GetCycleShareArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.cycle,
                ];
            }

        }

        // get-cycle-share-principal
        export namespace GetCycleSharePrincipal {
            export const name = "get-cycle-share-principal";

            export interface GetCycleSharePrincipalArgs {
                tokenId: UIntCV,
                cycle: UIntCV,
                user: PrincipalCV,
            }

            export function args(args: GetCycleSharePrincipalArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.cycle,
                    args.user,
                ];
            }

        }

        // get-cycle-start
        export namespace GetCycleStart {
            export const name = "get-cycle-start";

            export interface GetCycleStartArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetCycleStartArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

            export interface GetDecimalsArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetDecimalsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-next-cycle-height
        export namespace GetNextCycleHeight {
            export const name = "get-next-cycle-height";

            export interface GetNextCycleHeightArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetNextCycleHeightArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-overall-balance
        export namespace GetOverallBalance {
            export const name = "get-overall-balance";

            export interface GetOverallBalanceArgs {
                who: PrincipalCV,
            }

            export function args(args: GetOverallBalanceArgs): ClarityValue[] {
                return [
                    args.who,
                ];
            }

        }

        // get-overall-supply
        export namespace GetOverallSupply {
            export const name = "get-overall-supply";

        }

        // get-points-correction
        export namespace GetPointsCorrection {
            export const name = "get-points-correction";

            export interface GetPointsCorrectionArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetPointsCorrectionArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-points-per-share
        export namespace GetPointsPerShare {
            export const name = "get-points-per-share";

            export interface GetPointsPerShareArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPointsPerShareArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-sent-funds
        export namespace GetSentFunds {
            export const name = "get-sent-funds";

            export interface GetSentFundsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetSentFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-sum-cycles
        export namespace GetSumCycles {
            export const name = "get-sum-cycles";

            export interface GetSumCyclesArgs {
                startCycle: UIntCV,
                endCycle: UIntCV,
                tokenId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: GetSumCyclesArgs): ClarityValue[] {
                return [
                    args.startCycle,
                    args.endCycle,
                    args.tokenId,
                    args.recipient,
                ];
            }

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

            export interface GetTokenUriArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTokenUriArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

            export interface GetTotalSupplyArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTotalSupplyArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-total-supply-uint
        export namespace GetTotalSupplyUint {
            export const name = "get-total-supply-uint";

            export interface GetTotalSupplyUintArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTotalSupplyUintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-withdrawable-rewards
        export namespace GetWithdrawableRewards {
            export const name = "get-withdrawable-rewards";

            export interface GetWithdrawableRewardsArgs {
                tokenId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: GetWithdrawableRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.recipient,
                ];
            }

        }

        // get-withdrawn-funds
        export namespace GetWithdrawnFunds {
            export const name = "get-withdrawn-funds";

            export interface GetWithdrawnFundsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetWithdrawnFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
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

        // withdrawable-funds-of-read
        export namespace WithdrawableFundsOfRead {
            export const name = "withdrawable-funds-of-read";

            export interface WithdrawableFundsOfReadArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: WithdrawableFundsOfReadArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

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

export namespace PaymentTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "payment-trait";

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

export namespace ProposalTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "proposal-trait";

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

export namespace CollVaultTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "coll-vault-trait";

}

export namespace CpRewardsTokenContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "cp-rewards-token";

    // Functions
    export namespace Functions {
        // add-rewards
        export namespace AddRewards {
            export const name = "add-rewards";

            export interface AddRewardsArgs {
                tokenId: UIntCV,
                delta: UIntCV,
            }

            export function args(args: AddRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.delta,
                ];
            }

        }

        // burn
        export namespace Burn {
            export const name = "burn";

            export interface BurnArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: BurnArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.owner,
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
                tokenId: UIntCV,
                amount: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: MintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.recipient,
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
                tokenId: UIntCV,
                value: StringAsciiCV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.sender,
                    args.recipient,
                ];
            }

        }

        // transfer-many
        export namespace TransferMany {
            export const name = "transfer-many";

            export interface TransferManyArgs {
                transfers: ListCV,
            }

            export function args(args: TransferManyArgs): ClarityValue[] {
                return [
                    args.transfers,
                ];
            }

        }

        // transfer-many-memo
        export namespace TransferManyMemo {
            export const name = "transfer-many-memo";

            export interface TransferManyMemoArgs {
                transfers: ListCV,
            }

            export function args(args: TransferManyMemoArgs): ClarityValue[] {
                return [
                    args.transfers,
                ];
            }

        }

        // transfer-memo
        export namespace TransferMemo {
            export const name = "transfer-memo";

            export interface TransferMemoArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: BufferCV,
            }

            export function args(args: TransferMemoArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // withdraw-rewards
        export namespace WithdrawRewards {
            export const name = "withdraw-rewards";

            export interface WithdrawRewardsArgs {
                tokenId: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: WithdrawRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.caller,
                ];
            }

        }

        // accumulative-funds-of
        export namespace AccumulativeFundsOf {
            export const name = "accumulative-funds-of";

            export interface AccumulativeFundsOfArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: AccumulativeFundsOfArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                tokenId: UIntCV,
                who: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.who,
                ];
            }

        }

        // get-balance-uint
        export namespace GetBalanceUint {
            export const name = "get-balance-uint";

            export interface GetBalanceUintArgs {
                tokenId: UIntCV,
                who: PrincipalCV,
            }

            export function args(args: GetBalanceUintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.who,
                ];
            }

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

            export interface GetDecimalsArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetDecimalsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-overall-balance
        export namespace GetOverallBalance {
            export const name = "get-overall-balance";

            export interface GetOverallBalanceArgs {
                who: PrincipalCV,
            }

            export function args(args: GetOverallBalanceArgs): ClarityValue[] {
                return [
                    args.who,
                ];
            }

        }

        // get-overall-supply
        export namespace GetOverallSupply {
            export const name = "get-overall-supply";

        }

        // get-points-correction
        export namespace GetPointsCorrection {
            export const name = "get-points-correction";

            export interface GetPointsCorrectionArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetPointsCorrectionArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-points-per-share
        export namespace GetPointsPerShare {
            export const name = "get-points-per-share";

            export interface GetPointsPerShareArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPointsPerShareArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-sent-funds
        export namespace GetSentFunds {
            export const name = "get-sent-funds";

            export interface GetSentFundsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetSentFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

            export interface GetTokenUriArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTokenUriArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

            export interface GetTotalSupplyArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTotalSupplyArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-total-supply-uint
        export namespace GetTotalSupplyUint {
            export const name = "get-total-supply-uint";

            export interface GetTotalSupplyUintArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTotalSupplyUintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-withdrawn-funds
        export namespace GetWithdrawnFunds {
            export const name = "get-withdrawn-funds";

            export interface GetWithdrawnFundsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetWithdrawnFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
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

        // withdrawable-funds-of
        export namespace WithdrawableFundsOf {
            export const name = "withdrawable-funds-of";

            export interface WithdrawableFundsOfArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: WithdrawableFundsOfArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

    }
}

export namespace SwapRouterTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "swap-router-trait";

}

export namespace FtTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "ft-trait";

}

export namespace CpTokenContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "cp-token";

    // Functions
    export namespace Functions {
        // add-rewards
        export namespace AddRewards {
            export const name = "add-rewards";

            export interface AddRewardsArgs {
                tokenId: UIntCV,
                delta: UIntCV,
            }

            export function args(args: AddRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.delta,
                ];
            }

        }

        // burn
        export namespace Burn {
            export const name = "burn";

            export interface BurnArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: BurnArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.owner,
                ];
            }

        }

        // distribute-losses
        export namespace DistributeLosses {
            export const name = "distribute-losses";

            export interface DistributeLossesArgs {
                tokenId: UIntCV,
                delta: UIntCV,
            }

            export function args(args: DistributeLossesArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.delta,
                ];
            }

        }

        // empty-commitments
        export namespace EmptyCommitments {
            export const name = "empty-commitments";

            export interface EmptyCommitmentsArgs {
                tokenId: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: EmptyCommitmentsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.caller,
                ];
            }

        }

        // get-committed-funds
        export namespace GetCommittedFunds {
            export const name = "get-committed-funds";

            export interface GetCommittedFundsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetCommittedFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
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
                tokenId: UIntCV,
                amount: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: MintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.recipient,
                ];
            }

        }

        // recognizable-losses-of
        export namespace RecognizableLossesOf {
            export const name = "recognizable-losses-of";

            export interface RecognizableLossesOfArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: RecognizableLossesOfArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // recognize-losses
        export namespace RecognizeLosses {
            export const name = "recognize-losses";

            export interface RecognizeLossesArgs {
                tokenId: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: RecognizeLossesArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.caller,
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

        // set-cycle-start
        export namespace SetCycleStart {
            export const name = "set-cycle-start";

            export interface SetCycleStartArgs {
                tokenId: UIntCV,
                start: UIntCV,
            }

            export function args(args: SetCycleStartArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.start,
                ];
            }

        }

        // set-share-cycles
        export namespace SetShareCycles {
            export const name = "set-share-cycles";

            export interface SetShareCyclesArgs {
                startCycle: UIntCV,
                endCycle: UIntCV,
                tokenId: UIntCV,
                amount: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: SetShareCyclesArgs): ClarityValue[] {
                return [
                    args.startCycle,
                    args.endCycle,
                    args.tokenId,
                    args.amount,
                    args.caller,
                ];
            }

        }

        // set-token-uri
        export namespace SetTokenUri {
            export const name = "set-token-uri";

            export interface SetTokenUriArgs {
                tokenId: UIntCV,
                value: StringAsciiCV,
            }

            export function args(args: SetTokenUriArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.value,
                ];
            }

        }

        // transfer
        export namespace Transfer {
            export const name = "transfer";

            export interface TransferArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
            }

            export function args(args: TransferArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.sender,
                    args.recipient,
                ];
            }

        }

        // transfer-many
        export namespace TransferMany {
            export const name = "transfer-many";

            export interface TransferManyArgs {
                transfers: ListCV,
            }

            export function args(args: TransferManyArgs): ClarityValue[] {
                return [
                    args.transfers,
                ];
            }

        }

        // transfer-many-memo
        export namespace TransferManyMemo {
            export const name = "transfer-many-memo";

            export interface TransferManyMemoArgs {
                transfers: ListCV,
            }

            export function args(args: TransferManyMemoArgs): ClarityValue[] {
                return [
                    args.transfers,
                ];
            }

        }

        // transfer-memo
        export namespace TransferMemo {
            export const name = "transfer-memo";

            export interface TransferMemoArgs {
                tokenId: UIntCV,
                amount: UIntCV,
                sender: PrincipalCV,
                recipient: PrincipalCV,
                memo: BufferCV,
            }

            export function args(args: TransferMemoArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.amount,
                    args.sender,
                    args.recipient,
                    args.memo,
                ];
            }

        }

        // withdraw-cycle-rewards
        export namespace WithdrawCycleRewards {
            export const name = "withdraw-cycle-rewards";

            export interface WithdrawCycleRewardsArgs {
                tokenId: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: WithdrawCycleRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.caller,
                ];
            }

        }

        // withdraw-rewards
        export namespace WithdrawRewards {
            export const name = "withdraw-rewards";

            export interface WithdrawRewardsArgs {
                tokenId: UIntCV,
                caller: PrincipalCV,
            }

            export function args(args: WithdrawRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.caller,
                ];
            }

        }

        // accumulative-funds-of
        export namespace AccumulativeFundsOf {
            export const name = "accumulative-funds-of";

            export interface AccumulativeFundsOfArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: AccumulativeFundsOfArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // accumulative-losses-of
        export namespace AccumulativeLossesOf {
            export const name = "accumulative-losses-of";

            export interface AccumulativeLossesOfArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: AccumulativeLossesOfArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-balance
        export namespace GetBalance {
            export const name = "get-balance";

            export interface GetBalanceArgs {
                tokenId: UIntCV,
                who: PrincipalCV,
            }

            export function args(args: GetBalanceArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.who,
                ];
            }

        }

        // get-balance-uint
        export namespace GetBalanceUint {
            export const name = "get-balance-uint";

            export interface GetBalanceUintArgs {
                tokenId: UIntCV,
                who: PrincipalCV,
            }

            export function args(args: GetBalanceUintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.who,
                ];
            }

        }

        // get-cover-pool-funds-balance
        export namespace GetCoverPoolFundsBalance {
            export const name = "get-cover-pool-funds-balance";

            export interface GetCoverPoolFundsBalanceArgs {
                tokenId: UIntCV,
                sender: PrincipalCV,
            }

            export function args(args: GetCoverPoolFundsBalanceArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.sender,
                ];
            }

        }

        // get-cover-pool-lost-funds
        export namespace GetCoverPoolLostFunds {
            export const name = "get-cover-pool-lost-funds";

            export interface GetCoverPoolLostFundsArgs {
                tokenId: UIntCV,
                sender: PrincipalCV,
            }

            export function args(args: GetCoverPoolLostFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.sender,
                ];
            }

        }

        // get-cover-pool-sent-funds
        export namespace GetCoverPoolSentFunds {
            export const name = "get-cover-pool-sent-funds";

            export interface GetCoverPoolSentFundsArgs {
                tokenId: UIntCV,
                sender: PrincipalCV,
            }

            export function args(args: GetCoverPoolSentFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.sender,
                ];
            }

        }

        // get-current-cycle
        export namespace GetCurrentCycle {
            export const name = "get-current-cycle";

            export interface GetCurrentCycleArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetCurrentCycleArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-cycle-at
        export namespace GetCycleAt {
            export const name = "get-cycle-at";

            export interface GetCycleAtArgs {
                tokenId: UIntCV,
                stacksHeight: UIntCV,
            }

            export function args(args: GetCycleAtArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.stacksHeight,
                ];
            }

        }

        // get-cycle-rewards
        export namespace GetCycleRewards {
            export const name = "get-cycle-rewards";

            export interface GetCycleRewardsArgs {
                tokenId: UIntCV,
                cycle: UIntCV,
            }

            export function args(args: GetCycleRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.cycle,
                ];
            }

        }

        // get-cycle-share
        export namespace GetCycleShare {
            export const name = "get-cycle-share";

            export interface GetCycleShareArgs {
                tokenId: UIntCV,
                cycle: UIntCV,
            }

            export function args(args: GetCycleShareArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.cycle,
                ];
            }

        }

        // get-cycle-share-principal
        export namespace GetCycleSharePrincipal {
            export const name = "get-cycle-share-principal";

            export interface GetCycleSharePrincipalArgs {
                tokenId: UIntCV,
                cycle: UIntCV,
                user: PrincipalCV,
            }

            export function args(args: GetCycleSharePrincipalArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.cycle,
                    args.user,
                ];
            }

        }

        // get-cycle-start
        export namespace GetCycleStart {
            export const name = "get-cycle-start";

            export interface GetCycleStartArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetCycleStartArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-decimals
        export namespace GetDecimals {
            export const name = "get-decimals";

            export interface GetDecimalsArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetDecimalsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-losses-correction
        export namespace GetLossesCorrection {
            export const name = "get-losses-correction";

            export interface GetLossesCorrectionArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetLossesCorrectionArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-losses-per-share
        export namespace GetLossesPerShare {
            export const name = "get-losses-per-share";

            export interface GetLossesPerShareArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetLossesPerShareArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-next-cycle-height
        export namespace GetNextCycleHeight {
            export const name = "get-next-cycle-height";

            export interface GetNextCycleHeightArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetNextCycleHeightArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-overall-balance
        export namespace GetOverallBalance {
            export const name = "get-overall-balance";

            export interface GetOverallBalanceArgs {
                who: PrincipalCV,
            }

            export function args(args: GetOverallBalanceArgs): ClarityValue[] {
                return [
                    args.who,
                ];
            }

        }

        // get-overall-supply
        export namespace GetOverallSupply {
            export const name = "get-overall-supply";

        }

        // get-points-correction
        export namespace GetPointsCorrection {
            export const name = "get-points-correction";

            export interface GetPointsCorrectionArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetPointsCorrectionArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-points-per-share
        export namespace GetPointsPerShare {
            export const name = "get-points-per-share";

            export interface GetPointsPerShareArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetPointsPerShareArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-recognized-losses
        export namespace GetRecognizedLosses {
            export const name = "get-recognized-losses";

            export interface GetRecognizedLossesArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetRecognizedLossesArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-sent-funds
        export namespace GetSentFunds {
            export const name = "get-sent-funds";

            export interface GetSentFundsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetSentFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // get-sum-cycles
        export namespace GetSumCycles {
            export const name = "get-sum-cycles";

            export interface GetSumCyclesArgs {
                startCycle: UIntCV,
                endCycle: UIntCV,
                tokenId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: GetSumCyclesArgs): ClarityValue[] {
                return [
                    args.startCycle,
                    args.endCycle,
                    args.tokenId,
                    args.recipient,
                ];
            }

        }

        // get-token-uri
        export namespace GetTokenUri {
            export const name = "get-token-uri";

            export interface GetTokenUriArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTokenUriArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-total-supply
        export namespace GetTotalSupply {
            export const name = "get-total-supply";

            export interface GetTotalSupplyArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTotalSupplyArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-total-supply-uint
        export namespace GetTotalSupplyUint {
            export const name = "get-total-supply-uint";

            export interface GetTotalSupplyUintArgs {
                tokenId: UIntCV,
            }

            export function args(args: GetTotalSupplyUintArgs): ClarityValue[] {
                return [
                    args.tokenId,
                ];
            }

        }

        // get-withdrawable-rewards
        export namespace GetWithdrawableRewards {
            export const name = "get-withdrawable-rewards";

            export interface GetWithdrawableRewardsArgs {
                tokenId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: GetWithdrawableRewardsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.recipient,
                ];
            }

        }

        // get-withdrawn-funds
        export namespace GetWithdrawnFunds {
            export const name = "get-withdrawn-funds";

            export interface GetWithdrawnFundsArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: GetWithdrawnFundsArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
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

        // recognizable-losses-of-read
        export namespace RecognizableLossesOfRead {
            export const name = "recognizable-losses-of-read";

            export interface RecognizableLossesOfReadArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: RecognizableLossesOfReadArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // withdrawable-funds-of
        export namespace WithdrawableFundsOf {
            export const name = "withdrawable-funds-of";

            export interface WithdrawableFundsOfArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: WithdrawableFundsOfArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

        // withdrawable-funds-of-read
        export namespace WithdrawableFundsOfRead {
            export const name = "withdrawable-funds-of-read";

            export interface WithdrawableFundsOfReadArgs {
                tokenId: UIntCV,
                owner: PrincipalCV,
            }

            export function args(args: WithdrawableFundsOfReadArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.owner,
                ];
            }

        }

    }
}

export namespace GlobalsContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "globals";

    // Functions
    export namespace Functions {
        // add-admin
        export namespace AddAdmin {
            export const name = "add-admin";

            export interface AddAdminArgs {
                admin: PrincipalCV,
            }

            export function args(args: AddAdminArgs): ClarityValue[] {
                return [
                    args.admin,
                ];
            }

        }

        // add-governor
        export namespace AddGovernor {
            export const name = "add-governor";

            export interface AddGovernorArgs {
                governor: PrincipalCV,
            }

            export function args(args: AddGovernorArgs): ClarityValue[] {
                return [
                    args.governor,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // is-onboarded-address
        export namespace IsOnboardedAddress {
            export const name = "is-onboarded-address";

            export interface IsOnboardedAddressArgs {
                user: PrincipalCV,
                btcVersion: BufferCV,
                btcHash: BufferCV,
            }

            export function args(args: IsOnboardedAddressArgs): ClarityValue[] {
                return [
                    args.user,
                    args.btcVersion,
                    args.btcHash,
                ];
            }

        }

        // is-onboarded-user
        export namespace IsOnboardedUser {
            export const name = "is-onboarded-user";

            export interface IsOnboardedUserArgs {
                user: PrincipalCV,
            }

            export function args(args: IsOnboardedUserArgs): ClarityValue[] {
                return [
                    args.user,
                ];
            }

        }

        // offboard-user-address
        export namespace OffboardUserAddress {
            export const name = "offboard-user-address";

            export interface OffboardUserAddressArgs {
                user: PrincipalCV,
                btcVersion: BufferCV,
                btcHash: BufferCV,
            }

            export function args(args: OffboardUserAddressArgs): ClarityValue[] {
                return [
                    args.user,
                    args.btcVersion,
                    args.btcHash,
                ];
            }

        }

        // onboard-user-address
        export namespace OnboardUserAddress {
            export const name = "onboard-user-address";

            export interface OnboardUserAddressArgs {
                user: PrincipalCV,
                btcVersion: BufferCV,
                btcHash: BufferCV,
            }

            export function args(args: OnboardUserAddressArgs): ClarityValue[] {
                return [
                    args.user,
                    args.btcVersion,
                    args.btcHash,
                ];
            }

        }

        // remove-admin
        export namespace RemoveAdmin {
            export const name = "remove-admin";

            export interface RemoveAdminArgs {
                admin: PrincipalCV,
            }

            export function args(args: RemoveAdminArgs): ClarityValue[] {
                return [
                    args.admin,
                ];
            }

        }

        // remove-governor
        export namespace RemoveGovernor {
            export const name = "remove-governor";

            export interface RemoveGovernorArgs {
                governor: PrincipalCV,
            }

            export function args(args: RemoveGovernorArgs): ClarityValue[] {
                return [
                    args.governor,
                ];
            }

        }

        // set-coll-contract
        export namespace SetCollContract {
            export const name = "set-coll-contract";

            export interface SetCollContractArgs {
                collContract: PrincipalCV,
            }

            export function args(args: SetCollContractArgs): ClarityValue[] {
                return [
                    args.collContract,
                ];
            }

        }

        // set-coll-vault
        export namespace SetCollVault {
            export const name = "set-coll-vault";

            export interface SetCollVaultArgs {
                collVault: PrincipalCV,
            }

            export function args(args: SetCollVaultArgs): ClarityValue[] {
                return [
                    args.collVault,
                ];
            }

        }

        // set-contingency-plan
        export namespace SetContingencyPlan {
            export const name = "set-contingency-plan";

            export interface SetContingencyPlanArgs {
                contingencyPlan: BooleanCV,
            }

            export function args(args: SetContingencyPlanArgs): ClarityValue[] {
                return [
                    args.contingencyPlan,
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

        // set-cover-cooldown-period
        export namespace SetCoverCooldownPeriod {
            export const name = "set-cover-cooldown-period";

            export interface SetCoverCooldownPeriodArgs {
                coverCooldownPeriod: UIntCV,
            }

            export function args(args: SetCoverCooldownPeriodArgs): ClarityValue[] {
                return [
                    args.coverCooldownPeriod,
                ];
            }

        }

        // set-cover-pool-contract
        export namespace SetCoverPoolContract {
            export const name = "set-cover-pool-contract";

            export interface SetCoverPoolContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: SetCoverPoolContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // set-cover-pool-token
        export namespace SetCoverPoolToken {
            export const name = "set-cover-pool-token";

            export interface SetCoverPoolTokenArgs {
                token: PrincipalCV,
            }

            export function args(args: SetCoverPoolTokenArgs): ClarityValue[] {
                return [
                    args.token,
                ];
            }

        }

        // set-cover-rewards-pool-token
        export namespace SetCoverRewardsPoolToken {
            export const name = "set-cover-rewards-pool-token";

            export interface SetCoverRewardsPoolTokenArgs {
                token: PrincipalCV,
            }

            export function args(args: SetCoverRewardsPoolTokenArgs): ClarityValue[] {
                return [
                    args.token,
                ];
            }

        }

        // set-cover-unstake-window
        export namespace SetCoverUnstakeWindow {
            export const name = "set-cover-unstake-window";

            export interface SetCoverUnstakeWindowArgs {
                coverUnstakeWindow: UIntCV,
            }

            export function args(args: SetCoverUnstakeWindowArgs): ClarityValue[] {
                return [
                    args.coverUnstakeWindow,
                ];
            }

        }

        // set-cover-vault
        export namespace SetCoverVault {
            export const name = "set-cover-vault";

            export interface SetCoverVaultArgs {
                coverVault: PrincipalCV,
            }

            export function args(args: SetCoverVaultArgs): ClarityValue[] {
                return [
                    args.coverVault,
                ];
            }

        }

        // set-cp
        export namespace SetCp {
            export const name = "set-cp";

            export interface SetCpArgs {
                cp: PrincipalCV,
            }

            export function args(args: SetCpArgs): ClarityValue[] {
                return [
                    args.cp,
                ];
            }

        }

        // set-funding-period
        export namespace SetFundingPeriod {
            export const name = "set-funding-period";

            export interface SetFundingPeriodArgs {
                fundingPeriod: UIntCV,
            }

            export function args(args: SetFundingPeriodArgs): ClarityValue[] {
                return [
                    args.fundingPeriod,
                ];
            }

        }

        // set-funding-vault
        export namespace SetFundingVault {
            export const name = "set-funding-vault";

            export interface SetFundingVaultArgs {
                fundingVault: PrincipalCV,
            }

            export function args(args: SetFundingVaultArgs): ClarityValue[] {
                return [
                    args.fundingVault,
                ];
            }

        }

        // set-grace-period
        export namespace SetGracePeriod {
            export const name = "set-grace-period";

            export interface SetGracePeriodArgs {
                gracePeriod: UIntCV,
            }

            export function args(args: SetGracePeriodArgs): ClarityValue[] {
                return [
                    args.gracePeriod,
                ];
            }

        }

        // set-investor-fee
        export namespace SetInvestorFee {
            export const name = "set-investor-fee";

            export interface SetInvestorFeeArgs {
                investorFee: UIntCV,
            }

            export function args(args: SetInvestorFeeArgs): ClarityValue[] {
                return [
                    args.investorFee,
                ];
            }

        }

        // set-liquidity-vault
        export namespace SetLiquidityVault {
            export const name = "set-liquidity-vault";

            export interface SetLiquidityVaultArgs {
                liquidityVault: PrincipalCV,
            }

            export function args(args: SetLiquidityVaultArgs): ClarityValue[] {
                return [
                    args.liquidityVault,
                ];
            }

        }

        // set-loan-contract
        export namespace SetLoanContract {
            export const name = "set-loan-contract";

            export interface SetLoanContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: SetLoanContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // set-lp
        export namespace SetLp {
            export const name = "set-lp";

            export interface SetLpArgs {
                lp: PrincipalCV,
            }

            export function args(args: SetLpArgs): ClarityValue[] {
                return [
                    args.lp,
                ];
            }

        }

        // set-lp-cooldown-period
        export namespace SetLpCooldownPeriod {
            export const name = "set-lp-cooldown-period";

            export interface SetLpCooldownPeriodArgs {
                lpCooldownPeriod: UIntCV,
            }

            export function args(args: SetLpCooldownPeriodArgs): ClarityValue[] {
                return [
                    args.lpCooldownPeriod,
                ];
            }

        }

        // set-lp-unstake-window
        export namespace SetLpUnstakeWindow {
            export const name = "set-lp-unstake-window";

            export interface SetLpUnstakeWindowArgs {
                lpUnstakeWindow: UIntCV,
            }

            export function args(args: SetLpUnstakeWindowArgs): ClarityValue[] {
                return [
                    args.lpUnstakeWindow,
                ];
            }

        }

        // set-max-slippage
        export namespace SetMaxSlippage {
            export const name = "set-max-slippage";

            export interface SetMaxSlippageArgs {
                maxSlippage: UIntCV,
            }

            export function args(args: SetMaxSlippageArgs): ClarityValue[] {
                return [
                    args.maxSlippage,
                ];
            }

        }

        // set-paused
        export namespace SetPaused {
            export const name = "set-paused";

            export interface SetPausedArgs {
                paused: BooleanCV,
            }

            export function args(args: SetPausedArgs): ClarityValue[] {
                return [
                    args.paused,
                ];
            }

        }

        // set-payment
        export namespace SetPayment {
            export const name = "set-payment";

            export interface SetPaymentArgs {
                payment: PrincipalCV,
            }

            export function args(args: SetPaymentArgs): ClarityValue[] {
                return [
                    args.payment,
                ];
            }

        }

        // set-pool-contract
        export namespace SetPoolContract {
            export const name = "set-pool-contract";

            export interface SetPoolContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: SetPoolContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // set-protocol-treasury
        export namespace SetProtocolTreasury {
            export const name = "set-protocol-treasury";

            export interface SetProtocolTreasuryArgs {
                treasury: PrincipalCV,
            }

            export function args(args: SetProtocolTreasuryArgs): ClarityValue[] {
                return [
                    args.treasury,
                ];
            }

        }

        // set-rewards-calc
        export namespace SetRewardsCalc {
            export const name = "set-rewards-calc";

            export interface SetRewardsCalcArgs {
                rewardsCalc: PrincipalCV,
            }

            export function args(args: SetRewardsCalcArgs): ClarityValue[] {
                return [
                    args.rewardsCalc,
                ];
            }

        }

        // set-sp
        export namespace SetSp {
            export const name = "set-sp";

            export interface SetSpArgs {
                sp: PrincipalCV,
            }

            export function args(args: SetSpArgs): ClarityValue[] {
                return [
                    args.sp,
                ];
            }

        }

        // set-staker-cooldown-period
        export namespace SetStakerCooldownPeriod {
            export const name = "set-staker-cooldown-period";

            export interface SetStakerCooldownPeriodArgs {
                stakerCooldownPeriod: UIntCV,
            }

            export function args(args: SetStakerCooldownPeriodArgs): ClarityValue[] {
                return [
                    args.stakerCooldownPeriod,
                ];
            }

        }

        // set-staker-unstake-window
        export namespace SetStakerUnstakeWindow {
            export const name = "set-staker-unstake-window";

            export interface SetStakerUnstakeWindowArgs {
                stakerUnstakeWindow: UIntCV,
            }

            export function args(args: SetStakerUnstakeWindowArgs): ClarityValue[] {
                return [
                    args.stakerUnstakeWindow,
                ];
            }

        }

        // set-supplier-interface
        export namespace SetSupplierInterface {
            export const name = "set-supplier-interface";

            export interface SetSupplierInterfaceArgs {
                supplierInterface: PrincipalCV,
            }

            export function args(args: SetSupplierInterfaceArgs): ClarityValue[] {
                return [
                    args.supplierInterface,
                ];
            }

        }

        // set-swap
        export namespace SetSwap {
            export const name = "set-swap";

            export interface SetSwapArgs {
                swap: PrincipalCV,
            }

            export function args(args: SetSwapArgs): ClarityValue[] {
                return [
                    args.swap,
                ];
            }

        }

        // set-treasury-fee
        export namespace SetTreasuryFee {
            export const name = "set-treasury-fee";

            export interface SetTreasuryFeeArgs {
                treasuryFee: UIntCV,
            }

            export function args(args: SetTreasuryFeeArgs): ClarityValue[] {
                return [
                    args.treasuryFee,
                ];
            }

        }

        // set-xbtc-contract
        export namespace SetXbtcContract {
            export const name = "set-xbtc-contract";

            export interface SetXbtcContractArgs {
                xbtcContract: PrincipalCV,
            }

            export function args(args: SetXbtcContractArgs): ClarityValue[] {
                return [
                    args.xbtcContract,
                ];
            }

        }

        // set-zp
        export namespace SetZp {
            export const name = "set-zp";

            export interface SetZpArgs {
                zp: PrincipalCV,
            }

            export function args(args: SetZpArgs): ClarityValue[] {
                return [
                    args.zp,
                ];
            }

        }

        // get-cover-pool-contract
        export namespace GetCoverPoolContract {
            export const name = "get-cover-pool-contract";

        }

        // get-cycle-length-default
        export namespace GetCycleLengthDefault {
            export const name = "get-cycle-length-default";

        }

        // get-day-length-default
        export namespace GetDayLengthDefault {
            export const name = "get-day-length-default";

        }

        // get-globals
        export namespace GetGlobals {
            export const name = "get-globals";

        }

        // get-loan-contract
        export namespace GetLoanContract {
            export const name = "get-loan-contract";

        }

        // get-pool-contract
        export namespace GetPoolContract {
            export const name = "get-pool-contract";

        }

        // is-admin
        export namespace IsAdmin {
            export const name = "is-admin";

            export interface IsAdminArgs {
                admin: PrincipalCV,
            }

            export function args(args: IsAdminArgs): ClarityValue[] {
                return [
                    args.admin,
                ];
            }

        }

        // is-coll-contract
        export namespace IsCollContract {
            export const name = "is-coll-contract";

            export interface IsCollContractArgs {
                collContract: PrincipalCV,
            }

            export function args(args: IsCollContractArgs): ClarityValue[] {
                return [
                    args.collContract,
                ];
            }

        }

        // is-coll-vault
        export namespace IsCollVault {
            export const name = "is-coll-vault";

            export interface IsCollVaultArgs {
                collVault: PrincipalCV,
            }

            export function args(args: IsCollVaultArgs): ClarityValue[] {
                return [
                    args.collVault,
                ];
            }

        }

        // is-contract-owner
        export namespace IsContractOwner {
            export const name = "is-contract-owner";

        }

        // is-cover-pool-contract
        export namespace IsCoverPoolContract {
            export const name = "is-cover-pool-contract";

            export interface IsCoverPoolContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: IsCoverPoolContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // is-cover-pool-token
        export namespace IsCoverPoolToken {
            export const name = "is-cover-pool-token";

            export interface IsCoverPoolTokenArgs {
                token: PrincipalCV,
            }

            export function args(args: IsCoverPoolTokenArgs): ClarityValue[] {
                return [
                    args.token,
                ];
            }

        }

        // is-cover-rewards-pool-token
        export namespace IsCoverRewardsPoolToken {
            export const name = "is-cover-rewards-pool-token";

            export interface IsCoverRewardsPoolTokenArgs {
                token: PrincipalCV,
            }

            export function args(args: IsCoverRewardsPoolTokenArgs): ClarityValue[] {
                return [
                    args.token,
                ];
            }

        }

        // is-cover-vault
        export namespace IsCoverVault {
            export const name = "is-cover-vault";

            export interface IsCoverVaultArgs {
                coverVault: PrincipalCV,
            }

            export function args(args: IsCoverVaultArgs): ClarityValue[] {
                return [
                    args.coverVault,
                ];
            }

        }

        // is-cp
        export namespace IsCp {
            export const name = "is-cp";

            export interface IsCpArgs {
                cp: PrincipalCV,
            }

            export function args(args: IsCpArgs): ClarityValue[] {
                return [
                    args.cp,
                ];
            }

        }

        // is-funding-vault
        export namespace IsFundingVault {
            export const name = "is-funding-vault";

            export interface IsFundingVaultArgs {
                fundingVault: PrincipalCV,
            }

            export function args(args: IsFundingVaultArgs): ClarityValue[] {
                return [
                    args.fundingVault,
                ];
            }

        }

        // is-governor
        export namespace IsGovernor {
            export const name = "is-governor";

            export interface IsGovernorArgs {
                governor: PrincipalCV,
            }

            export function args(args: IsGovernorArgs): ClarityValue[] {
                return [
                    args.governor,
                ];
            }

        }

        // is-liquidity-vault
        export namespace IsLiquidityVault {
            export const name = "is-liquidity-vault";

            export interface IsLiquidityVaultArgs {
                liquidityVault: PrincipalCV,
            }

            export function args(args: IsLiquidityVaultArgs): ClarityValue[] {
                return [
                    args.liquidityVault,
                ];
            }

        }

        // is-loan-contract
        export namespace IsLoanContract {
            export const name = "is-loan-contract";

            export interface IsLoanContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: IsLoanContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // is-lp
        export namespace IsLp {
            export const name = "is-lp";

            export interface IsLpArgs {
                lp: PrincipalCV,
            }

            export function args(args: IsLpArgs): ClarityValue[] {
                return [
                    args.lp,
                ];
            }

        }

        // is-onboarded-address-read
        export namespace IsOnboardedAddressRead {
            export const name = "is-onboarded-address-read";

            export interface IsOnboardedAddressReadArgs {
                user: PrincipalCV,
                btcVersion: BufferCV,
                btcHash: BufferCV,
            }

            export function args(args: IsOnboardedAddressReadArgs): ClarityValue[] {
                return [
                    args.user,
                    args.btcVersion,
                    args.btcHash,
                ];
            }

        }

        // is-onboarded-user-read
        export namespace IsOnboardedUserRead {
            export const name = "is-onboarded-user-read";

            export interface IsOnboardedUserReadArgs {
                user: PrincipalCV,
            }

            export function args(args: IsOnboardedUserReadArgs): ClarityValue[] {
                return [
                    args.user,
                ];
            }

        }

        // is-payment
        export namespace IsPayment {
            export const name = "is-payment";

            export interface IsPaymentArgs {
                payment: PrincipalCV,
            }

            export function args(args: IsPaymentArgs): ClarityValue[] {
                return [
                    args.payment,
                ];
            }

        }

        // is-pool-contract
        export namespace IsPoolContract {
            export const name = "is-pool-contract";

            export interface IsPoolContractArgs {
                contract: PrincipalCV,
            }

            export function args(args: IsPoolContractArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // is-rewards-calc
        export namespace IsRewardsCalc {
            export const name = "is-rewards-calc";

            export interface IsRewardsCalcArgs {
                rewardsCalc: PrincipalCV,
            }

            export function args(args: IsRewardsCalcArgs): ClarityValue[] {
                return [
                    args.rewardsCalc,
                ];
            }

        }

        // is-sp
        export namespace IsSp {
            export const name = "is-sp";

            export interface IsSpArgs {
                sp: PrincipalCV,
            }

            export function args(args: IsSpArgs): ClarityValue[] {
                return [
                    args.sp,
                ];
            }

        }

        // is-supplier-interface
        export namespace IsSupplierInterface {
            export const name = "is-supplier-interface";

            export interface IsSupplierInterfaceArgs {
                contract: PrincipalCV,
            }

            export function args(args: IsSupplierInterfaceArgs): ClarityValue[] {
                return [
                    args.contract,
                ];
            }

        }

        // is-swap
        export namespace IsSwap {
            export const name = "is-swap";

            export interface IsSwapArgs {
                swap: PrincipalCV,
            }

            export function args(args: IsSwapArgs): ClarityValue[] {
                return [
                    args.swap,
                ];
            }

        }

        // is-treasury
        export namespace IsTreasury {
            export const name = "is-treasury";

            export interface IsTreasuryArgs {
                treasury: PrincipalCV,
            }

            export function args(args: IsTreasuryArgs): ClarityValue[] {
                return [
                    args.treasury,
                ];
            }

        }

        // is-xbtc
        export namespace IsXbtc {
            export const name = "is-xbtc";

            export interface IsXbtcArgs {
                xbtc: PrincipalCV,
            }

            export function args(args: IsXbtcArgs): ClarityValue[] {
                return [
                    args.xbtc,
                ];
            }

        }

        // is-zp
        export namespace IsZp {
            export const name = "is-zp";

            export interface IsZpArgs {
                zp: PrincipalCV,
            }

            export function args(args: IsZpArgs): ClarityValue[] {
                return [
                    args.zp,
                ];
            }

        }

    }
}

export namespace LiquidityVaultTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "liquidity-vault-trait";

}

export namespace LoanV10Contract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "loan-v1-0";

    // Functions
    export namespace Functions {
        // cancel-drawdown
        export namespace CancelDrawdown {
            export const name = "cancel-drawdown";

            export interface CancelDrawdownArgs {
                loanId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                lvPrincipal: PrincipalCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                poolDelegate: PrincipalCV,
                delegateFee: UIntCV,
                xbtc: ClarityValue,
            }

            export function args(args: CancelDrawdownArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.lvPrincipal,
                    args.lpToken,
                    args.tokenId,
                    args.poolDelegate,
                    args.delegateFee,
                    args.xbtc,
                ];
            }

        }

        // cancel-rollover
        export namespace CancelRollover {
            export const name = "cancel-rollover";

            export interface CancelRolloverArgs {
                loanId: UIntCV,
                collToken: ClarityValue,
                cv: ClarityValue,
                fv: ClarityValue,
                lvPrincipal: PrincipalCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                xbtc: ClarityValue,
                caller: PrincipalCV,
            }

            export function args(args: CancelRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.collToken,
                    args.cv,
                    args.fv,
                    args.lvPrincipal,
                    args.lpToken,
                    args.tokenId,
                    args.xbtc,
                    args.caller,
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
                swapRouter: ClarityValue,
                tokenId: UIntCV,
                xbtc: ClarityValue,
                caller: PrincipalCV,
            }

            export function args(args: CompleteRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.collType,
                    args.cv,
                    args.fv,
                    args.swapRouter,
                    args.tokenId,
                    args.xbtc,
                    args.caller,
                ];
            }

        }

        // create-loan
        export namespace CreateLoan {
            export const name = "create-loan";

            export interface CreateLoanArgs {
                loanAmount: UIntCV,
                xbtc: ClarityValue,
                collRatio: UIntCV,
                collToken: ClarityValue,
                apr: UIntCV,
                maturityLength: UIntCV,
                paymentPeriod: UIntCV,
                collVault: PrincipalCV,
                fundingVault: PrincipalCV,
                borrower: PrincipalCV,
            }

            export function args(args: CreateLoanArgs): ClarityValue[] {
                return [
                    args.loanAmount,
                    args.xbtc,
                    args.collRatio,
                    args.collToken,
                    args.apr,
                    args.maturityLength,
                    args.paymentPeriod,
                    args.collVault,
                    args.fundingVault,
                    args.borrower,
                ];
            }

        }

        // drawdown
        export namespace Drawdown {
            export const name = "drawdown";

            export interface DrawdownArgs {
                loanId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                lvPrincipal: PrincipalCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                poolDelegate: PrincipalCV,
                delegateFee: UIntCV,
                swapRouter: ClarityValue,
                xbtc: ClarityValue,
                sender: PrincipalCV,
            }

            export function args(args: DrawdownArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.lvPrincipal,
                    args.lpToken,
                    args.tokenId,
                    args.poolDelegate,
                    args.delegateFee,
                    args.swapRouter,
                    args.xbtc,
                    args.sender,
                ];
            }

        }

        // finalize-drawdown
        export namespace FinalizeDrawdown {
            export const name = "finalize-drawdown";

            export interface FinalizeDrawdownArgs {
                loanId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                lvPrincipal: PrincipalCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                poolDelegate: PrincipalCV,
                delegateFee: UIntCV,
                xbtc: ClarityValue,
            }

            export function args(args: FinalizeDrawdownArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.lvPrincipal,
                    args.lpToken,
                    args.tokenId,
                    args.poolDelegate,
                    args.delegateFee,
                    args.xbtc,
                ];
            }

        }

        // finalize-rollover
        export namespace FinalizeRollover {
            export const name = "finalize-rollover";

            export interface FinalizeRolloverArgs {
                loanId: UIntCV,
                collToken: ClarityValue,
                collVault: ClarityValue,
                fv: ClarityValue,
                tokenId: UIntCV,
                xbtc: ClarityValue,
            }

            export function args(args: FinalizeRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.collToken,
                    args.collVault,
                    args.fv,
                    args.tokenId,
                    args.xbtc,
                ];
            }

        }

        // fund-loan
        export namespace FundLoan {
            export const name = "fund-loan";

            export interface FundLoanArgs {
                loanId: UIntCV,
            }

            export function args(args: FundLoanArgs): ClarityValue[] {
                return [
                    args.loanId,
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

        // get-rollover-progress
        export namespace GetRolloverProgress {
            export const name = "get-rollover-progress";

            export interface GetRolloverProgressArgs {
                loanId: UIntCV,
            }

            export function args(args: GetRolloverProgressArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // get-withdrawable-collateral
        export namespace GetWithdrawableCollateral {
            export const name = "get-withdrawable-collateral";

            export interface GetWithdrawableCollateralArgs {
                loanId: UIntCV,
                amount: UIntCV,
                swapRouter: ClarityValue,
                collToken: ClarityValue,
                xbtc: ClarityValue,
                cv: ClarityValue,
            }

            export function args(args: GetWithdrawableCollateralArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.amount,
                    args.swapRouter,
                    args.collToken,
                    args.xbtc,
                    args.cv,
                ];
            }

        }

        // is-supplier-interface
        export namespace IsSupplierInterface {
            export const name = "is-supplier-interface";

        }

        // liquidate
        export namespace Liquidate {
            export const name = "liquidate";

            export interface LiquidateArgs {
                loanId: UIntCV,
                collVault: ClarityValue,
                collToken: ClarityValue,
                swapRouter: ClarityValue,
                xbtc: ClarityValue,
                recipient: PrincipalCV,
            }

            export function args(args: LiquidateArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.collVault,
                    args.collToken,
                    args.swapRouter,
                    args.xbtc,
                    args.recipient,
                ];
            }

        }

        // liquidate-otc
        export namespace LiquidateOtc {
            export const name = "liquidate-otc";

            export interface LiquidateOtcArgs {
                loanId: UIntCV,
                collVault: ClarityValue,
                collToken: ClarityValue,
                xbtc: ClarityValue,
                recipient: PrincipalCV,
            }

            export function args(args: LiquidateOtcArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.collVault,
                    args.collToken,
                    args.xbtc,
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
                lv: ClarityValue,
                tokenId: UIntCV,
                cpToken: ClarityValue,
                cpRewardsToken: ClarityValue,
                zdToken: ClarityValue,
                swapRouter: ClarityValue,
                amount: UIntCV,
                xbtc: ClarityValue,
                caller: PrincipalCV,
            }

            export function args(args: MakeFullPaymentArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.height,
                    args.payment,
                    args.lpToken,
                    args.lv,
                    args.tokenId,
                    args.cpToken,
                    args.cpRewardsToken,
                    args.zdToken,
                    args.swapRouter,
                    args.amount,
                    args.xbtc,
                    args.caller,
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
                lv: ClarityValue,
                tokenId: UIntCV,
                cpToken: ClarityValue,
                cpRewardsToken: ClarityValue,
                zdToken: ClarityValue,
                swapRouter: ClarityValue,
                amount: UIntCV,
                xbtc: ClarityValue,
                caller: PrincipalCV,
            }

            export function args(args: MakePaymentArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.height,
                    args.payment,
                    args.lpToken,
                    args.lv,
                    args.tokenId,
                    args.cpToken,
                    args.cpRewardsToken,
                    args.zdToken,
                    args.swapRouter,
                    args.amount,
                    args.xbtc,
                    args.caller,
                ];
            }

        }

        // make-residual-payment
        export namespace MakeResidualPayment {
            export const name = "make-residual-payment";

            export interface MakeResidualPaymentArgs {
                loanId: UIntCV,
                lpToken: ClarityValue,
                tokenId: UIntCV,
                amount: UIntCV,
                xbtc: ClarityValue,
            }

            export function args(args: MakeResidualPaymentArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.lpToken,
                    args.tokenId,
                    args.amount,
                    args.xbtc,
                ];
            }

        }

        // ready-rollover
        export namespace ReadyRollover {
            export const name = "ready-rollover";

            export interface ReadyRolloverArgs {
                loanId: UIntCV,
                sentFunds: IntCV,
            }

            export function args(args: ReadyRolloverArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.sentFunds,
                ];
            }

        }

        // request-rollover
        export namespace RequestRollover {
            export const name = "request-rollover";

            export interface RequestRolloverArgs {
                loanId: UIntCV,
                apr: NoneCV,
                newAmount: NoneCV,
                maturityLength: NoneCV,
                paymentPeriod: NoneCV,
                collRatio: NoneCV,
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

        // unwind
        export namespace Unwind {
            export const name = "unwind";

            export interface UnwindArgs {
                tokenId: UIntCV,
                loanId: UIntCV,
                fv: ClarityValue,
                lv: ClarityValue,
                xbtc: ClarityValue,
            }

            export function args(args: UnwindArgs): ClarityValue[] {
                return [
                    args.tokenId,
                    args.loanId,
                    args.fv,
                    args.lv,
                    args.xbtc,
                ];
            }

        }

        // withdraw-collateral-loan
        export namespace WithdrawCollateralLoan {
            export const name = "withdraw-collateral-loan";

            export interface WithdrawCollateralLoanArgs {
                loanId: UIntCV,
                amount: UIntCV,
                swapRouter: ClarityValue,
                collToken: ClarityValue,
                xbtc: ClarityValue,
                cv: ClarityValue,
            }

            export function args(args: WithdrawCollateralLoanArgs): ClarityValue[] {
                return [
                    args.loanId,
                    args.amount,
                    args.swapRouter,
                    args.collToken,
                    args.xbtc,
                    args.cv,
                ];
            }

        }

        // caller-is-pool
        export namespace CallerIsPool {
            export const name = "caller-is-pool";

        }

        // can-borrow
        export namespace CanBorrow {
            export const name = "can-borrow";

            export interface CanBorrowArgs {
                caller: PrincipalCV,
            }

            export function args(args: CanBorrowArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

        // can-liquidate
        export namespace CanLiquidate {
            export const name = "can-liquidate";

            export interface CanLiquidateArgs {
                loanId: UIntCV,
            }

            export function args(args: CanLiquidateArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // get-bp
        export namespace GetBp {
            export const name = "get-bp";

            export interface GetBpArgs {
                amount: UIntCV,
                bp: UIntCV,
            }

            export function args(args: GetBpArgs): ClarityValue[] {
                return [
                    args.amount,
                    args.bp,
                ];
            }

        }

        // get-contract-owner
        export namespace GetContractOwner {
            export const name = "get-contract-owner";

        }

        // get-last-loan-id
        export namespace GetLastLoanId {
            export const name = "get-last-loan-id";

        }

        // get-loan-read
        export namespace GetLoanRead {
            export const name = "get-loan-read";

            export interface GetLoanReadArgs {
                loanId: UIntCV,
            }

            export function args(args: GetLoanReadArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // get-pool-contract
        export namespace GetPoolContract {
            export const name = "get-pool-contract";

        }

        // get-rollover-progress-optional
        export namespace GetRolloverProgressOptional {
            export const name = "get-rollover-progress-optional";

            export interface GetRolloverProgressOptionalArgs {
                loanId: UIntCV,
            }

            export function args(args: GetRolloverProgressOptionalArgs): ClarityValue[] {
                return [
                    args.loanId,
                ];
            }

        }

        // get-rollover-progress-read
        export namespace GetRolloverProgressRead {
            export const name = "get-rollover-progress-read";

            export interface GetRolloverProgressReadArgs {
                loanId: UIntCV,
            }

            export function args(args: GetRolloverProgressReadArgs): ClarityValue[] {
                return [
                    args.loanId,
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

        // is-onboarded
        export namespace IsOnboarded {
            export const name = "is-onboarded";

            export interface IsOnboardedArgs {
                caller: PrincipalCV,
            }

            export function args(args: IsOnboardedArgs): ClarityValue[] {
                return [
                    args.caller,
                ];
            }

        }

        // next-payment-in
        export namespace NextPaymentIn {
            export const name = "next-payment-in";

            export interface NextPaymentInArgs {
                loanId: UIntCV,
            }

            export function args(args: NextPaymentInArgs): ClarityValue[] {
                return [
                    args.loanId,
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
                sender: PrincipalCV,
            }

            export function args(args: AddCollateralArgs): ClarityValue[] {
                return [
                    args.collType,
                    args.amount,
                    args.loanId,
                    args.sender,
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

        // remove-collateral
        export namespace RemoveCollateral {
            export const name = "remove-collateral";

            export interface RemoveCollateralArgs {
                collType: ClarityValue,
                amount: UIntCV,
                loanId: UIntCV,
                recipient: PrincipalCV,
            }

            export function args(args: RemoveCollateralArgs): ClarityValue[] {
                return [
                    args.collType,
                    args.amount,
                    args.loanId,
                    args.recipient,
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

        // store
        export namespace Store {
            export const name = "store";

            export interface StoreArgs {
                collType: ClarityValue,
                amount: UIntCV,
                loanId: UIntCV,
                sender: PrincipalCV,
            }

            export function args(args: StoreArgs): ClarityValue[] {
                return [
                    args.collType,
                    args.amount,
                    args.loanId,
                    args.sender,
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

export namespace RewardsCalcTraitContract {
    export const address = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    export const name = "rewards-calc-trait";

}
