import {
  initSimnet,
  ParsedTransactionResult,
  Simnet,
} from "@hirosystems/clarinet-sdk";

import { Cl, ClarityType, ClarityValue } from "@stacks/transactions";
import { expect } from "vitest";

type SimnetChecker = {
  callPublicFnCheckOk: (
    contract: string,
    method: string,
    args: ClarityValue[],
    sender: string
  ) => ParsedTransactionResult;
} & Simnet;

export const initSimnetChecker = async () => {
  let simnet = (await initSimnet()) as SimnetChecker;

  simnet.callPublicFnCheckOk = function (
    contract: string,
    method: string,
    args: ClarityValue[],
    sender: string
  ) {
    const ret = this.callPublicFn(
      contract,
      method,
      args,
      sender
    ) as ParsedTransactionResult;
    try {
      expect(ret.result).toHaveClarityType(ClarityType.ResponseOk);
    } catch (error) {
      throw new Error(
        `actual value must be a ${(error as any).expected}, received ${
          (error as any).actual
        } ${Cl.prettyPrint(ret.result)}`
      );
    }
    return ret;
  };

  return simnet;
};
