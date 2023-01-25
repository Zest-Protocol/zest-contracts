import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

class FundingVault {
  chain: Chain;
  fundingVault: string;
  deployer: Account;

  constructor(chain: Chain, fundingVault: string, deployer: Account) {
    this.chain = chain;
    this.fundingVault = fundingVault;
    this.deployer = deployer;
  }

  getAsset(loanId: number) {
    return this.chain.callReadOnlyFn(`${this.fundingVault}`, "get-asset", [
      types.uint(loanId)
    ], this.deployer.address);
  }
}

export { FundingVault };