import { Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

class LiquidityVault {
  chain: Chain;
  liquidityVault: string;
  deployer: Account;

  constructor(chain: Chain, liquidityContract: string, deployer: Account) {
    this.chain = chain;
    this.liquidityVault = liquidityContract;
    this.deployer = deployer;
  }

  getAsset(tokenId: number) {
    return this.chain.callReadOnlyFn(`${this.liquidityVault}`, "get-asset", [
      types.uint(tokenId)
    ], this.deployer.address);
  }
}

export { LiquidityVault };