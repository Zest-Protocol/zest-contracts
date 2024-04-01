import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

class Globals {
  static getGlobals(chain: Chain, caller: string) {
    return chain.callReadOnlyFn(`globals`, "get-globals", [], caller).result;
  }

  static isOnboarded(chain: Chain, user: string) {
    return chain.callReadOnlyFn(`globals`, "is-onboarded", [ types.principal(user) ], user).result;
  }

  static getCycleLengthDefault(chain: Chain, user: string) {
    return chain.callReadOnlyFn(`globals`, "get-cycle-length-default", [], user).result;
  }

  static getDayLengthDefault(chain: Chain, user: string) {
    return chain.callReadOnlyFn(`globals`, "get-day-length-default", [], user).result;
  }

  static onboardUserAddress(
    chain: Chain,
    user: string,
    btcVersion: string,
    btcHash: string,
    contractOwner: string) {
    return chain.mineBlock([
      Tx.contractCall(
        "globals",
        "onboard-user-address",
        [
          types.principal(user),
          types.buff(Buffer.from(btcVersion, "hex")),
          types.buff(Buffer.from(btcHash, "hex")),
        ],
        contractOwner
      )
    ])
  }

  static addGovernor(
    chain: Chain,
    governor: string,
    contractOwner: string) {
    return chain.mineBlock([
      Tx.contractCall(
        "globals",
        "add-governor",
        [
          types.principal(governor),
        ],
        contractOwner
      )
    ])
  }

  static setContractOwner(
    chain: Chain,
    newOwner: string,
    contractOwner: string) {
    return chain.mineBlock([
      Tx.contractCall(
        "globals",
        "set-contract-owner",
        [
          types.principal(newOwner),
        ],
        contractOwner
      )
    ])
  }

  static addCollateralContract(chain: Chain, collateralContract: string, contractOwner: string) {
    return chain.mineBlock([
      Tx.contractCall(
        "globals",
        "set-coll-contract",
        [ types.principal(collateralContract) ],
        contractOwner
      )
    ])
  }

  static setcontingencyPlan(chain: Chain, enable: boolean, contractOwner: string) {
    return chain.mineBlock([
      Tx.contractCall(
        "globals",
        "set-contingency-plan",
        [ types.bool(enable) ],
        contractOwner
      )
    ])
  }

}

export { Globals };