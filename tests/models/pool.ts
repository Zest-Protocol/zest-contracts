import { LiquidityVaultV10Contract, LpTokenContract, PaymentFixedContract, PoolV10Contract, SpTokenContract } from '../../onchain/stacks-lending/artifacts/contracts';
import { StacksDevnetOrchestrator } from "@hirosystems/stacks-devnet-js";
import { StacksNetwork } from "@stacks/network";
import {
  trueCV,
  falseCV,
  uintCV,
  standardPrincipalCV,
  contractPrincipalCV,
  AnchorMode,
  PostConditionMode,
  makeContractCall,
  callReadOnlyFunction,
} from '@stacks/transactions';

const DEPLOYER_KEY = "753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601";
const DEPLOYER_STX_ADDR = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";

class Pool {
  orchestrator: StacksDevnetOrchestrator;
  network: StacksNetwork;

  constructor(orchestrator: StacksDevnetOrchestrator, network: StacksNetwork) {
    this.orchestrator = orchestrator;
    this.network = network;
  }

  makecreatePoolTx(
    poolDelegate: string,
    lpToken: string,
    payment: string,
    stakingFee: number,
    delegateFee: number,
    liquidityCap: number,
    liquidityVault: string,
    spToken: string,
    open: boolean
  ) {
    const txOptions =  {
      contractAddress: PoolV10Contract.address,
      contractName: PoolV10Contract.name,
      functionName: PoolV10Contract.Functions.CreatePool.name,
      functionArgs: PoolV10Contract.Functions.CreatePool.args({
        poolDelegate: standardPrincipalCV(poolDelegate),
        lpToken: contractPrincipalCV(LpTokenContract.address, lpToken),
        payment: contractPrincipalCV(PaymentFixedContract.address, payment),
        stakingFee: uintCV(stakingFee),
        delegateFee: uintCV(delegateFee),
        liquidityCap: uintCV(liquidityCap),
        liquidityVault: contractPrincipalCV(LiquidityVaultV10Contract.address, liquidityVault),
        spToken: contractPrincipalCV(SpTokenContract.address, spToken),
        open: open ? trueCV() : falseCV()
      }),
      senderKey: DEPLOYER_KEY,
      validateWithAbi: true,
      network: this.network,
      postConditionMode: PostConditionMode.Allow,
      fee: 400,
      // feeEstimateApiUrl: this.network.getTransactionFeeEstimateApiUrl(),
      anchorMode: AnchorMode.Any
    }
    
    return makeContractCall(txOptions);
  }

  getPool(lpToken: string) {
    const options = {
      contractAddress: PoolV10Contract.address,
      contractName: PoolV10Contract.name,
      functionName: PoolV10Contract.Functions.GetPool.name,
      functionArgs: PoolV10Contract.Functions.GetPool.args({
        lpToken: contractPrincipalCV(LpTokenContract.address, lpToken)
      }),
      network: this.network,
      senderAddress: DEPLOYER_STX_ADDR
    }

    return callReadOnlyFunction(options)
    // .then((val) => val).catch((reason) => console.log(reason));
  }
}

export { Pool };