import {
  broadcastTransaction,
} from '@stacks/transactions';
import { StacksTestnet }from '@stacks/network';
import { StacksDevnetOrchestrator } from "@hirosystems/stacks-devnet-js";
import BigNum from 'bn.js';
// import { PoolV10Contract } from '../onchain/stacks-lending/artifacts/contracts';
// import { Pool } from './models/pool';

const DEPLOYER_KEY = "753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601";

const orchestrator = new StacksDevnetOrchestrator({
  path: `Clarinet_simnet.toml`,
  logs: true,
});

// beforeAll(() => {
console.log("start");
orchestrator.start();
// });


// test('Block height changes when blocks are mined', async () => {
  const network = new StacksTestnet({ url: orchestrator.getStacksNodeUrl() });
  // let pool = new Pool(orchestrator, network);

  // wait for deployment of contracts
  let result = orchestrator.waitForStacksBlock();
  console.log(result);
  result = orchestrator.waitForStacksBlock();
  console.log(result);
  result = orchestrator.waitForStacksBlock();
  console.log(result);
  result = orchestrator.waitForStacksBlock();
  console.log(result);
  result = orchestrator.waitForStacksBlock();
  console.log(result);
  // result = orchestrator.waitForStacksBlock();
  // console.log(result);
  // result = orchestrator.waitForStacksBlock();
  // console.log(result);
  // result = orchestrator.waitForStacksBlock();
  // console.log(result);
  
// afterAll(() => {
console.log("stop");
orchestrator.stop();
// });

  // let transaction = await pool.makecreatePoolTx(
  //   "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  //   "lp-token",
  //   "payment-fixed",
  //   50,
  //   50,
  //   10_000_000_000,
  //   "liquidity-vault-v1-0",
  //   "sp-token",
  //   true
  // );
  // let broadcastResponse = await broadcastTransaction(transaction, network);
  
  // orchestrator.waitForStacksBlock();

  // let response = await pool.getPool("lp-token");
  // console.log(response);

  // console.log(broadcastResponse);
  // let response = await pool.getPool("lp-token");
  // block = orchestrator.waitForStacksBlock();

  // console.log(JSON.stringify(block));
// });