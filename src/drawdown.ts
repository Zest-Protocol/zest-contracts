import { StacksTestnet, StacksMainnet, StacksNetwork, StacksMocknet } from '@stacks/network';
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  FungibleConditionCode,
  makeStandardSTXPostCondition,
  bufferCVFromString,
  TransactionVersion,
  standardPrincipalCV,
  contractPrincipalCV,
  callReadOnlyFunction,
  trueCV,
  uintCV,
  stringAsciiCV,
  intCV,
  someCV,
  tupleCV,
  bufferCV,
  listCV,
  PostConditionMode,
  makeContractDeploy,
  cvToValue,
  noneCV,
  parseToCV,
  getAddressFromPrivateKey,
  getNonce,
  makeSTXTokenTransfer,
  getAddressFromPublicKey,
  cvToJSON,
} from '@stacks/transactions';

import BigNum from 'bn.js';
import {
  MagicProtocolContract,
  ClarityBitcoinContract,
  CollVaultContract,
  CpRewardsTokenContract,
  CpTokenContract,
  FundingVaultContract,
  GlobalsContract,
  LiquidityVaultV10Contract,
  LpTokenContract,
  PoolV10Contract,
  RewardsCalcContract,
  SupplierInterfaceContract,
  SwapRouterContract,
  WrappedBitcoinContract,
  ZestRewardDistContract,
} from '../onchain/artifacts/contracts.js';
import {
  generateNewAccount,
  generateSecretKey,
  generateWallet,
  getStxAddress,
  restoreWalletAccounts,
} from '@stacks/wallet-sdk';
import { compressPrivateKey, getPublicKeyFromPrivate } from '@stacks/encryption';
import { getPublicKey, utils } from '@noble/secp256k1';
import { ECPair, networks, payments, Psbt, script } from 'bitcoinjs-lib';
import { generateMnemonic, mnemonicToSeed } from '@scure/bip39';

import {
  BlocksApiInterface,
  Configuration,
  connectWebSocketClient,
  InfoApi,
  InfoApiInterface,
  TransactionsApi,
} from '@stacks/blockchain-api-client';

import fetch from 'cross-fetch';
import { BlocksApi } from '@stacks/blockchain-api-client';
import wif from 'wif';

import { blockchainRequest, generateHTLCAddress, generateRandomHexString, sendToAddress, setupBitcoinAddresses, walletRequest, numberToLE, getHash, reverseBuffer, generateHTLCScript, getScriptHash, parseBtcAddress, waitForTxConfirmation, getProof } from './bitcoin.js';
import { setupContracts, makeContractCalls, broadcastTransactions, sendTransactionCalls, waitForStacksBlock, onboardUserAddress, createLoan } from './stacks.js';

import MerkleTree from 'merkletreejs';
import { hashSha256Sync } from '@stacks/encryption';
import { debuglog } from 'util';
import { getWallets } from './accounts.js';
import { generateRandomBitcoinSigner, generateBitcoinSignerFromStxPrivKey } from './util.js';
import { numberToHex } from './bitcoin.js';

const debug = debuglog('1');

const network = new StacksMocknet();
const btcNetwork = networks.regtest;

const DEPLOYER = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const LP1 = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';

export async function drawdownSteps(supplierBtcPrivKey: Buffer, lp1BtcPrivKey: Buffer) {
  let wallets = await getWallets();

  const deployerWallet = wallets["deployer"];
  const lp1Wallet = wallets["lp"];
  const minerWallet = wallets["miner"];
  const delegateWallet = wallets["delegate"];
  const borrowerWallet = wallets["borrower"];
  
  const lp1Account = wallets["lp"].accounts[0];

  const apiConfig: Configuration = new Configuration({ fetchApi: fetch, basePath: "http://localhost:3999" });
  // initiate the /accounts API with the basepath and fetch library
  const blocksApi: BlocksApiInterface = new BlocksApi(apiConfig);
  const infoApi: InfoApiInterface = new InfoApi(apiConfig);
  // // REGISTERING SUPPLIER INTERFACE
  const lp1BtcSigner = ECPair.fromPrivateKey(lp1BtcPrivKey);
  const supplierBtcSigner = ECPair.fromPrivateKey(supplierBtcPrivKey);
  const borrower1Signer = generateRandomBitcoinSigner(btcNetwork);
  const minerBtcSigner = generateBitcoinSignerFromStxPrivKey(btcNetwork, wallets["miner"].accounts[0].stxPrivateKey);

  const lp1Address = payments.p2pkh({ pubkey: lp1BtcSigner.publicKey, network: btcNetwork }).address!;
  const minerAddress = payments.p2pkh({ pubkey: minerBtcSigner.publicKey, network: btcNetwork }).address!;
  const borrower1Address = payments.p2pkh({ pubkey: borrower1Signer.publicKey, network: btcNetwork }).address!;
  const borrowerStxAddress = getStxAddress({ account: wallets.borrower.accounts[0], transactionVersion: TransactionVersion.Testnet });

  let parsedBorrowerAddr = parseBtcAddress(borrower1Address as string);
  await onboardUserAddress(
    deployerWallet.accounts[0],
    borrowerStxAddress,
    numberToHex(parsedBorrowerAddr.version),
    parsedBorrowerAddr.hash.toString('hex'),
    network);

  await waitForStacksBlock();

  await createLoan(
    `${DEPLOYER}.lp-token`,
    0,
    10000000,
    `${DEPLOYER}.Wrapped-Bitcoin`,
    0,
    `${DEPLOYER}.Wrapped-Bitcoin`,
    300,
    1296,
    144,
    `${DEPLOYER}.coll-vault`,
    `${DEPLOYER}.funding-vault`,
    borrowerWallet.accounts[0],
    network,
  );

  await waitForStacksBlock();

  let transaction = await makeContractCall({
    contractAddress: PoolV10Contract.address,
    contractName: PoolV10Contract.name,
    functionName: PoolV10Contract.Functions.FundLoan.name,
    functionArgs: PoolV10Contract.Functions.FundLoan.args({
      loanId: uintCV(0),
      lpToken: contractPrincipalCV(LpTokenContract.address, LpTokenContract.name),
      tokenId: uintCV(0),
      lv: contractPrincipalCV(LiquidityVaultV10Contract.address, LiquidityVaultV10Contract.name),
      fv: contractPrincipalCV(FundingVaultContract.address, FundingVaultContract.name),
      xbtc: contractPrincipalCV(WrappedBitcoinContract.address, WrappedBitcoinContract.name),
    }),
    senderKey: wallets["delegate"].accounts[0].stxPrivateKey,
    network,
    fee: 1000,
    // nonce: 54,
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
  });

  let broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

  await waitForStacksBlock();

  // Drawdown
  transaction = await makeContractCall({
    contractAddress: SupplierInterfaceContract.address,
    contractName: SupplierInterfaceContract.name,
    functionName: SupplierInterfaceContract.Functions.Drawdown.name,
    functionArgs: SupplierInterfaceContract.Functions.Drawdown.args({
      loanId: uintCV(0),
      lpToken: contractPrincipalCV(LpTokenContract.address, LpTokenContract.name),
      tokenId: uintCV(0),
      collToken: contractPrincipalCV(WrappedBitcoinContract.address, WrappedBitcoinContract.name),
      collVault: contractPrincipalCV(CollVaultContract.address, CollVaultContract.name),
      fv: contractPrincipalCV(FundingVaultContract.address, FundingVaultContract.name),
      btcVersion: bufferCV(Buffer.from(numberToHex(parsedBorrowerAddr.version), 'hex')),
      btcHash: bufferCV(parsedBorrowerAddr.hash),
      supplierId: uintCV(0),
      swapRouter: contractPrincipalCV(SwapRouterContract.address, SwapRouterContract.name),
      xbtcFt: contractPrincipalCV(WrappedBitcoinContract.address, WrappedBitcoinContract.name),
    }),
    senderKey: wallets["borrower"].accounts[0].stxPrivateKey,
    network,
    fee: 1000,
    // nonce: 54,
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
  });

  broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

  let inputBlockHash = await blockchainRequest('getblockhash', [6]);
  let inputBlock = await blockchainRequest('getblock', [inputBlockHash]);
  let inputTxHash = inputBlock.tx[0];

  let drawdownTxId = await sendToAddress(inputTxHash, minerBtcSigner, minerAddress as string, 0, borrower1Address as string, 5000000000, 100000000);
  debug(`DRAWDOWN TXID: ${drawdownTxId}`);
  await waitForTxConfirmation(drawdownTxId);
  await waitForStacksBlock();
  await waitForStacksBlock();

  let drawdownProof = await getProof(drawdownTxId);

  let height = (await blocksApi.getBlockByBurnBlockHeight({ burnBlockHeight: drawdownProof.height })).height;

  let drawdownArgs = {
    loanId: 0,
    lpToken: contractPrincipalCV(LpTokenContract.address, LpTokenContract.name),
    tokenId: 0,
    collToken: contractPrincipalCV(WrappedBitcoinContract.address, WrappedBitcoinContract.name),
    collVault: contractPrincipalCV(CollVaultContract.address, CollVaultContract.name),
    fv: contractPrincipalCV(FundingVaultContract.address, FundingVaultContract.name),
    xbtcFt: contractPrincipalCV(WrappedBitcoinContract.address, WrappedBitcoinContract.name),
    block: {
      header: Buffer.from(drawdownProof.blockHeaderHex, "hex").toString("hex"),
      height: drawdownProof.height,
    },
    prevBlocks: [],
    tx: Buffer.from(drawdownProof.paymentTxHex, "hex").toString("hex"),
    proof: {
      "tx-index": drawdownProof.txIndex,
      "hashes": drawdownProof.proof.map((merkle) => merkle.toString("hex")),
      "tree-depth": drawdownProof.depth
    },
    outputIndex: 0, // points to the out that goes to supplier
    swapId: 0,
  };

  transaction = await makeContractCall({
    contractAddress: SupplierInterfaceContract.address,
    contractName: SupplierInterfaceContract.name,
    functionName: SupplierInterfaceContract.Functions.FinalizeDrawdown.name,
    functionArgs: SupplierInterfaceContract.Functions.FinalizeDrawdown.args({
      loanId: uintCV(0),
      lpToken: contractPrincipalCV(LpTokenContract.address, LpTokenContract.name),
      tokenId: uintCV(0),
      collToken: contractPrincipalCV(WrappedBitcoinContract.address, WrappedBitcoinContract.name),
      collVault: contractPrincipalCV(CollVaultContract.address, CollVaultContract.name),
      fv: contractPrincipalCV(FundingVaultContract.address, FundingVaultContract.name),
      xbtcFt: contractPrincipalCV(WrappedBitcoinContract.address, WrappedBitcoinContract.name),
      block: tupleCV({
        header: bufferCV(Buffer.from(drawdownProof.blockHeaderHex, "hex")),
        height: uintCV(drawdownProof.height),
      }),
      prevBlocks: listCV([]),
      tx: bufferCV(Buffer.from(drawdownProof.paymentTxHex, "hex")),
      proof: tupleCV({
        "tx-index": uintCV(drawdownProof.txIndex),
        "hashes": listCV(drawdownProof.proof.map((merkle) => bufferCV(merkle))),
        "tree-depth": uintCV(drawdownProof.depth)
      }),
      outputIndex: uintCV(0), // points to the out that goes to supplier
      swapId: uintCV(0),
    }),
    senderKey: wallets.deployer.accounts[0].stxPrivateKey,
    network,
    fee: 1000,
    // nonce: 54,
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
  });

  broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

};
