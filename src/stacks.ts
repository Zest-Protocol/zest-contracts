import { StacksNetwork, StacksMocknet } from '@stacks/network';
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  TransactionVersion,
  contractPrincipalCV,
  trueCV,
  uintCV,
  // stringAsciiCV,
  intCV,
  someCV,
  tupleCV,
  bufferCV,
  listCV,
  PostConditionMode,
  // noneCV,
  getNonce,
  StacksTransaction,
  ContractCallOptions,
  createStacksPrivateKey,
  publicKeyToString,
  pubKeyfromPrivKey,
  makeUnsignedContractCall,
  TransactionSigner,
  TxBroadcastResult,
  makeContractDeploy,
  falseCV,
} from '@stacks/transactions';

import fetch from 'cross-fetch';
import {
  MagicProtocolContract,
  CpTokenContract,
  GlobalsContract,
  LpTokenContract,
  PoolV10Contract,
  SupplierInterfaceContract,
  ZestRewardDistContract,
  SupplierController0Contract,
  LiquidityVaultV10Contract,
  WrappedBitcoinContract,
  RewardsCalcContract
} from '../onchain/artifacts/contracts.js';
import { Wallet, Account, getStxAddress } from "@stacks/wallet-sdk";
import {
  BlocksApi,
  BlocksApiInterface,
  Configuration,
  InfoApi,
  InfoApiInterface,
  TransactionsApi
} from '@stacks/blockchain-api-client';
import { principalCV } from '@stacks/transactions/dist/clarity/types/principalCV.js';
import { Proof } from "./bitcoin.js";

import { debuglog } from 'util';
import { readFileSync } from 'fs';
const debug = debuglog('1');

// import { Proof } from './bitcoin.js';
const network = new StacksMocknet();

export async function sendTransactionCalls(
  startNonce: bigint,
  txOptions: ContractCallOptions[],
  senderKey: string,
  network: any
) {
  let contractCalls = await makeContractCalls(startNonce, txOptions, senderKey);
  return await broadcastTransactions(contractCalls, network);
}

export async function makeContractCalls(
  startNonce: bigint,
  txOptions: ContractCallOptions[],
  senderKey: string
) {
  let nTransactions = txOptions.length;
  const publicKey = publicKeyToString(pubKeyfromPrivKey(createStacksPrivateKey(senderKey).data));
  let transactions: StacksTransaction[] = [];

  for (let i = 0; i < nTransactions; i++) {
    const transaction = await makeUnsignedContractCall({
      publicKey,
      ...txOptions[i],
      nonce: startNonce + BigInt(i),
    });
    const privKey = createStacksPrivateKey(senderKey);
    const signer = new TransactionSigner(transaction);
    signer.signOrigin(privKey);

    transactions.push(transaction);
  }

  return transactions;
}

export async function broadcastTransactions(stacksTransaction: StacksTransaction[], network: any) {
  let responses: TxBroadcastResult[] = [];
  for (let i = 0; i < stacksTransaction.length; i++) {
    let broadcastResponse = await broadcastTransaction(stacksTransaction[i], network);
    responses.push(broadcastResponse);
    debug(JSON.stringify(broadcastResponse));
  }

  return responses;
}

export async function waitForStacksBlock() {
  const apiConfig: Configuration = new Configuration({
    fetchApi: fetch,
    basePath: 'http://localhost:3999',
  });
  const infoApi: InfoApiInterface = new InfoApi(apiConfig);
  const blocksApi: BlocksApiInterface = new BlocksApi(apiConfig);

  let tipHeight = (await infoApi.getCoreApiInfo()).stacks_tip_height;

  console.log(`Waiting for block #${tipHeight} to be confirmed...`);
  while (tipHeight == (await infoApi.getCoreApiInfo()).stacks_tip_height) {
    await new Promise(f => setTimeout(f, 1_000));
    debug('Checking...');
  }

  return await blocksApi.getBlockByHeight({ height: tipHeight });
}

export async function waitForStacksTransaction(txId: string) {
  const apiConfig: Configuration = new Configuration({
    fetchApi: fetch,
    basePath: 'http://localhost:3999',
  });
  const transactionApi = new TransactionsApi(apiConfig);

  let pending = true
  console.log(`Waiting for Transaction #${txId} to be confirmed...`);
  while (pending) {
    await new Promise(f => setTimeout(f, 1_000));
    pending = (await
      transactionApi.getTransactionById({ txId })
        .then((val) => { console.log((val as any).tx_status); return (val as any).tx_status === "pending" })
        .catch(() => false)
    );
    debug('Checking...');
  };
}

export declare enum cvTypes {
  uint = 'uint',
  principal = 'principal',
  buff = 'buff',
}

export interface Loan {
  apr: { type: cvTypes.uint; value: string };
  asset: {
    type: cvTypes.principal;
    value: string;
  };
  borrower: {
    type: cvTypes.principal;
    value: string;
  };
  'coll-ratio': { type: string; value: string };
  'coll-token': {
    type: cvTypes.principal;
    value: string;
  };
  'coll-vault': {
    type: cvTypes.principal;
    value: string;
  };
  created: { type: cvTypes.uint; value: string };
  'funding-vault': {
    type: cvTypes.principal;
    value: string;
  };
  'loan-amount': { type: cvTypes.uint; value: string };
  'next-payment': { type: cvTypes.uint; value: string };
  'payment-period': { type: cvTypes.uint; value: string };
  'remaining-payments': { type: cvTypes.uint; value: string };
  status: { type: cvTypes.buff; value: string };
}

export async function setupContracts(supplierPublicKey: Buffer, deployerWallet: Wallet, nonce: bigint) {
  const apiConfig: Configuration = new Configuration({
    fetchApi: fetch,
    basePath: 'http://localhost:3999',
  });
  // initiate the /accounts API with the basepath and fetch library
  const infoApi: InfoApiInterface = new InfoApi(apiConfig);

  // REGISTER SUPPLIER ON STACKS
  let transaction = await makeContractCall({
    contractAddress: SupplierController0Contract.address,
    contractName: SupplierController0Contract.name,
    functionName: SupplierController0Contract.Functions.RegisterSupplier.name,
    functionArgs: SupplierController0Contract.Functions.RegisterSupplier.args({
      publicKey: bufferCV(Buffer.from(supplierPublicKey)),
      inboundFee: someCV(intCV(10)),
      outboundFee: someCV(intCV(10)),
      outboundBaseFee: intCV(500),
      inboundBaseFee: intCV(500),
      funds: uintCV(1_000_000_000_000),
    }),
    senderKey: deployerWallet.accounts[0].stxPrivateKey,
    network,
    fee: 8767,
    nonce: nonce + BigInt(0),
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
  });

  let broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

  transaction = await makeContractCall({
    contractAddress: MagicProtocolContract.address,
    contractName: PoolV10Contract.name,
    functionName: PoolV10Contract.Functions.CreatePool.name,
    functionArgs: PoolV10Contract.Functions.CreatePool.args({
      poolDelegate: principalCV('ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ'),
      lpToken: contractPrincipalCV('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'lp-token'),
      zpToken: contractPrincipalCV('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'zest-reward-dist'),
      payment: contractPrincipalCV('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'payment-fixed'),
      rewardsCalc: contractPrincipalCV('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'rewards-calc'),
      coverFee: uintCV(1000),
      delegateFee: uintCV(1000),
      liquidityCap: uintCV(10000000000),
      coverCap: uintCV(10000000000),
      minCycles: uintCV(1),
      maxMaturityLength: uintCV(157680),
      liquidityVault: contractPrincipalCV(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'liquidity-vault-v1-0'
      ),
      cpToken: contractPrincipalCV('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'cp-token'),
      coverVault: contractPrincipalCV('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'cover-vault'),
      cpRewardsToken: contractPrincipalCV(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'cp-rewards-token'
      ),
      cpCoverToken: contractPrincipalCV(
        'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        'Wrapped-Bitcoin'
      ),
      open: trueCV(),
    }),
    senderKey: deployerWallet.accounts[0].stxPrivateKey,
    network,
    fee: 1000,
    nonce: nonce + BigInt(1),
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
  });

  broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

  let tipHeight = (await infoApi.getCoreApiInfo()).burn_block_height;

  transaction = await makeContractCall({
    contractAddress: SupplierInterfaceContract.address,
    contractName: SupplierInterfaceContract.name,
    functionName: SupplierInterfaceContract.Functions.UpdateLiquidity.name,
    functionArgs: SupplierInterfaceContract.Functions.UpdateLiquidity.args({
      height: uintCV(tipHeight),
      liquidity: uintCV(1_000_000_000_000),
    }),
    senderKey: deployerWallet.accounts[0].stxPrivateKey,
    network,
    fee: 8765,
    nonce: nonce + BigInt(2),
    anchorMode: AnchorMode.Any,
  });

  broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

  return nonce + BigInt(2);
};

export const getTrasactionVersion = (network: StacksNetwork) => {
  return network.isMainnet() ? TransactionVersion.Mainnet : TransactionVersion.Testnet
}

export async function createPool(
  callerAccount: Account,
  deployerAccount: Account,
  delegateAccount: Account,
  coverFee: number,
  delegateFee: number,
  liquidityCap: number,
  coverCap: number,
  minCycles: number,
  maxMaturityLength: number,
  open: boolean,
  network: StacksNetwork,
  nonce?: bigint) {
  let addr = getStxAddress({ account: callerAccount, transactionVersion: getTrasactionVersion(network) });
  let deployerAddr = getStxAddress({ account: deployerAccount, transactionVersion: getTrasactionVersion(network) });
  let delegateAddr = getStxAddress({ account: delegateAccount, transactionVersion: getTrasactionVersion(network) });

  let lastNonce = nonce ? nonce : (await getNonce(addr, network));

  let transaction = await makeContractCall({
    contractAddress: MagicProtocolContract.address,
    contractName: PoolV10Contract.name,
    functionName: PoolV10Contract.Functions.CreatePool.name,
    functionArgs: PoolV10Contract.Functions.CreatePool.args({
      poolDelegate: principalCV(delegateAddr),
      lpToken: contractPrincipalCV(deployerAddr, 'lp-token'),
      zpToken: contractPrincipalCV(deployerAddr, 'zest-reward-dist'),
      payment: contractPrincipalCV(deployerAddr, 'payment-fixed'),
      rewardsCalc: contractPrincipalCV(deployerAddr, 'rewards-calc'),
      coverFee: uintCV(coverFee),
      delegateFee: uintCV(delegateFee),
      liquidityCap: uintCV(liquidityCap),
      coverCap: uintCV(coverCap),
      minCycles: uintCV(minCycles),
      maxMaturityLength: uintCV(maxMaturityLength),
      liquidityVault: contractPrincipalCV(
        deployerAddr,
        'liquidity-vault-v1-0'
      ),
      cpToken: contractPrincipalCV(deployerAddr, 'cp-token'),
      coverVault: contractPrincipalCV(deployerAddr, 'cover-vault'),
      cpRewardsToken: contractPrincipalCV(
        deployerAddr,
        'cp-rewards-token'
      ),
      cpCoverToken: contractPrincipalCV(
        deployerAddr,
        'Wrapped-Bitcoin'
      ),
      open: open ? trueCV() : falseCV(),
    }),
    senderKey: callerAccount.stxPrivateKey,
    network,
    fee: 8764,
    nonce: lastNonce,
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
  });

  let broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

  return { broadcastResponse, lastNonce };
}


export async function finalizePool(callerAccount: Account, deployerAccount: Account, tokenId: number, network: StacksNetwork, nonce?: bigint) {
  let addr = getStxAddress({ account: callerAccount, transactionVersion: getTrasactionVersion(network) });

  let transaction = await makeContractCall({
    contractAddress: PoolV10Contract.address,
    contractName: PoolV10Contract.name,
    functionName: PoolV10Contract.Functions.FinalizePool.name,
    functionArgs: PoolV10Contract.Functions.FinalizePool.args({
      lpToken: contractPrincipalCV(LpTokenContract.address, LpTokenContract.name),
      zpToken: contractPrincipalCV(ZestRewardDistContract.address, ZestRewardDistContract.name),
      cpToken: contractPrincipalCV(CpTokenContract.address, CpTokenContract.name),
      tokenId: uintCV(tokenId),
    }),
    senderKey: callerAccount.stxPrivateKey,
    network,
    fee: 8763,
    nonce: nonce ? nonce : (await getNonce(addr, network)),
    anchorMode: AnchorMode.Any,
  });

  let broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));
  return broadcastResponse;
};

export async function initializeSwapper(callerAccount: Account, network: StacksNetwork, nonce?: bigint) {
  let addr = getStxAddress({ account: callerAccount, transactionVersion: getTrasactionVersion(network) });

  let transaction = await makeContractDeploy({
    contractName: "magic-caller",
    codeBody: readFileSync(`/Users/fernandofoy/Documents/zest-contracts/onchain/contracts/bitcoin/test/magic-caller.clar`).toString(),
    senderKey: callerAccount.stxPrivateKey,
    network,
    fee: 8768,
    nonce: nonce ? nonce : (await getNonce(addr, network)),
    anchorMode: AnchorMode.Any,
  });

  let broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));
  return broadcastResponse;
}

export async function onboardUserAddress(contractOwner: Account, user: string, btcVersion: string, btcHash: string, network: StacksNetwork, nonce?: bigint) {
  let addr = getStxAddress({ account: contractOwner, transactionVersion: getTrasactionVersion(network) });
  
  let transaction = await makeContractCall({
    contractAddress: GlobalsContract.address,
    contractName: GlobalsContract.name,
    functionName: GlobalsContract.Functions.OnboardUserAddress.name,
    functionArgs: GlobalsContract.Functions.OnboardUserAddress.args({
      user: principalCV(user),
      btcVersion: bufferCV(Buffer.from(btcVersion, "hex")),
      btcHash: bufferCV(Buffer.from(btcHash, "hex")),
    }),
    senderKey: contractOwner.stxPrivateKey,
    network,
    fee: 1000,
    nonce: nonce ? nonce : (await getNonce(addr, network)),
    anchorMode: AnchorMode.Any,
  });

  let broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));
  return broadcastResponse;
}

export async function sendFunds(
  proof: Proof,
  height: number,
  outputIndex: number,
  senderPubKey: Uint8Array,
  recipientPubKey: Uint8Array,
  expirationBuff: Uint8Array,
  hash: Uint8Array,
  swapperBuff: Uint8Array,
  supplierId: number,
  minToReceive: number,
  tokenId: number,
  loanId: number,
  factor: number,
  action: string,
  callerAccount: Account,
  network: StacksNetwork,
  nonce?: bigint 
  ) {
  const args = [
    tupleCV({
      header: bufferCV(Buffer.from(proof.blockHeaderHex, "hex")),
      height: uintCV(height),
    }),
    listCV([]),
    bufferCV(Buffer.from(proof.paymentTxHex, "hex")),
    tupleCV({
      "tx-index": uintCV(proof.txIndex),
      "hashes": listCV(proof.proof.map((merkle) => bufferCV(merkle))),
      "tree-depth": uintCV(proof.depth)
    }),
    uintCV(outputIndex),                                                         // points to the out that goes to supplier
    bufferCV(Buffer.from(senderPubKey)),
    bufferCV(Buffer.from(recipientPubKey)),
    bufferCV(Buffer.from(expirationBuff)),
    bufferCV(Buffer.from(hash)),
    bufferCV(Buffer.from(swapperBuff)),                                   // swapper is 0
    uintCV(supplierId),
    uintCV(minToReceive),
    uintCV(tokenId),
    uintCV(loanId),
    uintCV(factor),
    bufferCV(Buffer.from(action, "hex")),
  ];

  let addr = getStxAddress({ account: callerAccount, transactionVersion: getTrasactionVersion(network) });

  let transaction = await makeContractCall({
    contractAddress: addr,
    contractName: "magic-caller",
    functionName: "commit-funds",
    functionArgs: args,
    senderKey: callerAccount.stxPrivateKey,
    network,
    fee: 1000,
    nonce: nonce ? nonce : (await getNonce(addr, network)),
    anchorMode: AnchorMode.Any,
  });

  let broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));
  // console.log(args);
};

export async function sendFundsFinalize(
  paymentTxId: Uint8Array,
  preimage: Uint8Array,
  commitment: number,
  tokenId: number,
  callerAccount: Account,
  network: StacksNetwork,
  nonce?: bigint,
  ) {
  let addr = getStxAddress({ account: callerAccount, transactionVersion: getTrasactionVersion(network) });

  let transaction = await makeContractCall({
    contractAddress: addr,
    contractName: "magic-caller",
    functionName: "send-funds-to-pool",
    functionArgs: [
      bufferCV(Buffer.from(paymentTxId)),
      bufferCV(Buffer.from(preimage)),
      contractPrincipalCV(LpTokenContract.address, LpTokenContract.name),
      contractPrincipalCV(ZestRewardDistContract.address, ZestRewardDistContract.name),
      contractPrincipalCV(LiquidityVaultV10Contract.address, LiquidityVaultV10Contract.name),
      contractPrincipalCV(WrappedBitcoinContract.address, WrappedBitcoinContract.name),
      contractPrincipalCV(RewardsCalcContract.address, RewardsCalcContract.name),
      contractPrincipalCV(SupplierController0Contract.address, SupplierController0Contract.name),
    ],
    senderKey: callerAccount.stxPrivateKey,
    network,
    fee: 1000,
    nonce: nonce ? nonce : (await getNonce(addr, network)),
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  });

  let broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));
  debug(addr);
};

export async function createLoan(
  lpToken: string,
  tokenId: number,
  loanAmount: number,
  asset: string,
  collRatio: number,
  collToken: string,
  apr: number,
  maturityLength: number,
  paymentPeriod: number,
  collVault: string,
  fundingVault: string,
  borrowerAccount: Account,
  network: StacksNetwork,
  nonce?: bigint,
) {
  let addr = getStxAddress({ account: borrowerAccount, transactionVersion: getTrasactionVersion(network) });

  let transaction = await makeContractCall({
    contractAddress: PoolV10Contract.address,
    contractName: PoolV10Contract.name,
    functionName: PoolV10Contract.Functions.CreateLoan.name,
    functionArgs: PoolV10Contract.Functions.CreateLoan.args({
      lpToken: principalCV(lpToken),
      tokenId: uintCV(tokenId),
      loanAmount: uintCV(loanAmount),
      asset: principalCV(asset),
      collRatio: uintCV(collRatio),
      collToken: principalCV(collToken),
      apr: uintCV(apr),
      maturityLength: uintCV(maturityLength),
      paymentPeriod: uintCV(paymentPeriod),
      collVault: principalCV(collVault),
      fundingVault: principalCV(fundingVault),
    }),
    senderKey: borrowerAccount.stxPrivateKey,
    network,
    fee: 1000,
    nonce: nonce ? nonce: (await getNonce(addr, network)),
    anchorMode: AnchorMode.Any,
  });

  let broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));
  
  return broadcastResponse;
}