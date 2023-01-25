import { StacksTestnet, StacksMainnet, StacksNetwork, StacksMocknet } from '@stacks/network';
import { StacksDevnetOrchestrator } from '@hirosystems/stacks-devnet-js';
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
  cvToJSON} from "@stacks/transactions";

import { ClarityBitcoinContract, CollVaultContract, CpRewardsTokenContract, CpTokenContract, FundingVaultContract, GlobalsContract, LiquidityVaultV10Contract, LoanV10Contract, LpTokenContract, MagicProtocolContract, PaymentFixedContract, PoolV10Contract, RewardsCalcContract, SupplierInterfaceContract, SwapRouterContract, WrappedBitcoinContract, ZestRewardDistContract } from '../onchain/stacks-lending/artifacts/contracts';
import { generateNewAccount, generateSecretKey, generateWallet, getStxAddress, restoreWalletAccounts } from "@stacks/wallet-sdk";
import { compressPrivateKey, getPublicKeyFromPrivate } from "@stacks/encryption";
import { getPublicKey, utils } from 'noble-secp256k1';
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
import { optionalCVOf } from '@stacks/transactions/dist/clarity/types/optionalCV';
import wif from 'wif';
import { principalCV } from '@stacks/transactions/dist/clarity/types/principalCV';

import {
  blockchainRequest,
  generateHTLCAddress,
  generateRandomHexString,
  sendToAddress,
  setupBitcoinAddresses,
  walletRequest,
  numberToLE,
  getHash,
  reverseBuffer,
  generateHTLCScript,
  getScriptHash,
  parseBtcAddress,
  getProof,
  waitForTxConfirmation,
  encodeExpiration,
} from './bitcoin';
import {
  setupContracts,
  makeContractCalls,
  broadcastTransactions,
  sendTransactionCalls,
  waitForStacksBlock,
  Loan,
} from './stacks';

import MerkleTree from 'merkletreejs';
import { hashSha256Sync } from '@stacks/encryption';
import sha256 from 'crypto-js/sha256';
import { debuglog } from 'util';
import { stringCV } from '@stacks/transactions/dist/clarity/types/stringCV';
import { getWallets } from './accounts';
import { generateRandomBitcoinSigner, generateBitcoinSignerFromStxPrivKey } from './util';
import { numberToHex } from './bitcoin';

const debug = debuglog('1');

const network = new StacksMocknet();
const btcNetwork = networks.regtest;

const DEPLOYER = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const LP1 = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';

(async function() {
  let accounts = await getWallets();
  const lp1Account = accounts["lp"].accounts[0];
  const borrower1Account = accounts.borrower.accounts[0];

  const apiConfig: Configuration = new Configuration({
    fetchApi: fetch,
    basePath: 'http://localhost:3999',
  });
  // initiate the /accounts API with the basepath and fetch library
  const blocksApi: BlocksApiInterface = new BlocksApi(apiConfig);
  const infoApi: InfoApiInterface = new InfoApi(apiConfig);
  // // REGISTERING SUPPLIER INTERFACE
  const supplierBtcSigner = generateRandomBitcoinSigner(btcNetwork);
  const lp1BtcSigner = generateRandomBitcoinSigner(btcNetwork);
  const borrower1Signer = generateRandomBitcoinSigner(btcNetwork);
  const minerBtcSigner = generateBitcoinSignerFromStxPrivKey(btcNetwork, accounts["miner"].accounts[0].stxPrivateKey);

  const lp1Address = payments.p2pkh({
    pubkey: lp1BtcSigner.publicKey,
    network: btcNetwork,
  }).address;
  const minerAddress = payments.p2pkh({
    pubkey: minerBtcSigner.publicKey,
    network: btcNetwork,
  }).address;
  const borrower1Address = payments.p2pkh({
    pubkey: borrower1Signer.publicKey,
    network: btcNetwork,
  }).address;

  const loan0Amount = 50000000;

  let parsedBorrowerAddr = parseBtcAddress(borrower1Address as string);
  let parsedlp1Addr = parseBtcAddress(lp1Address as string);

  console.log('Supplier Public Key', Buffer.from(supplierBtcSigner.publicKey).toString('hex'));
  console.log('Lp1 Funding Address', lp1Address);
  console.log('Miner P2PKH address: ', minerAddress);

  let transactions = [{
    contractAddress: MagicProtocolContract.address,
    contractName: MagicProtocolContract.name,
    functionName: MagicProtocolContract.Functions.InitializeSwapper.name,
    functionArgs: [],
    // senderKey: accounts["lp"].accounts[0].stxPrivateKey,
    network,
    fee: 1000,
    // nonce: 0,
    anchorMode: AnchorMode.Any,
  }]

  let transaction = await makeContractCall({
    contractAddress: GlobalsContract.address,
    contractName: GlobalsContract.name,
    functionName: GlobalsContract.Functions.OnboardUserAddress.name,
    functionArgs: GlobalsContract.Functions.OnboardUserAddress.args({
      user: principalCV(
        getStxAddress({
          account: accounts.borrower.accounts[0],
          transactionVersion: TransactionVersion.Testnet,
        })
      ),
      btcVersion: bufferCV(Buffer.from(numberToHex(parsedBorrowerAddr.version), 'hex')),
      btcHash: bufferCV(parsedBorrowerAddr.hash),
    }),
    senderKey: accounts.deployer.accounts[0].stxPrivateKey,
    network,
    fee: 1000,
    nonce: 54,
    anchorMode: AnchorMode.Any,
  });

  let broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

  let initNonce = await getNonce(
    getStxAddress({
      account: accounts['lp'].accounts[0],
      transactionVersion: TransactionVersion.Testnet,
    }),
    network
  );

  await sendTransactionCalls(
    initNonce,
    transactions,
    accounts['lp'].accounts[0].stxPrivateKey,
    network
  );

  let fundingTx = await setupBitcoinAddresses(lp1Address as string, minerBtcSigner);

  // GENERATE PAYMENT TO MAGIC PROTOCOL SUPPLIER
  let preimage = Buffer.from(generateRandomHexString(20), 'hex');
  let hash = hashSha256Sync(preimage);
  console.log('Preimage: ', preimage.toString('hex'));
  console.log('Hash: ', Buffer.from(hash).toString('hex'));
  let swap1Addr = generateHTLCAddress(
    Buffer.from(hash),
    Buffer.from(getPublicKeyFromPrivate(lp1Account.stxPrivateKey), 'hex'),
    supplierBtcSigner.publicKey,
    500,
    0
  );

  await waitForTxConfirmation(fundingTx);

  // Send funds to pool
  let fundsTxId = await sendToAddress(
    fundingTx,
    lp1BtcSigner,
    lp1Address as string,
    0,
    swap1Addr.address as string,
    100000000,
    loan0Amount
  );
  debug('Payment TXID', fundsTxId);

  await waitForTxConfirmation(fundsTxId);
  initNonce = ( await getNonce( getStxAddress({ account: accounts.deployer.accounts[0], transactionVersion: TransactionVersion.Testnet }), network) );
  await setupContracts(supplierBtcSigner.publicKey, accounts["deployer"], accounts["lp"], initNonce);
  await waitForStacksBlock();

  let fundsProof = await getProof(fundsTxId);
  let height = (await blocksApi.getBlockByBurnBlockHeight({ burnBlockHeight: fundsProof.height }))
    .height;

  let args = {
    block: tupleCV({
      header: bufferCV(Buffer.from(fundsProof.blockHeaderHex, 'hex')),
      height: uintCV(height),
    }),
    prevBlocks: listCV([]),
    tx: bufferCV(Buffer.from(fundsProof.paymentTxHex, 'hex')),
    proof: tupleCV({
      'tx-index': uintCV(fundsProof.txIndex),
      hashes: listCV(fundsProof.proof.map(merkle => bufferCV(merkle))),
      'tree-depth': uintCV(fundsProof.depth),
    }),
    outputIndex: uintCV(0), // points to the out that goes to supplier
    sender: bufferCV(Buffer.from(getPublicKeyFromPrivate(lp1Account.stxPrivateKey), 'hex')),
    recipient: bufferCV(supplierBtcSigner.publicKey),
    expirationBuff: bufferCV(Buffer.from(script.number.encode(500).toString('hex'), 'hex')),
    hash: bufferCV(Buffer.from(hash)),
    swapperBuff: bufferCV(Buffer.from(numberToLE(0), 'hex')), // swapper is 0
    supplierId: uintCV(0),
    minToReceive: uintCV((50000000 * 10) / 10_000),
  };

  transaction = await makeContractCall({
    contractAddress: SupplierInterfaceContract.address,
    contractName: SupplierInterfaceContract.name,
    functionName: SupplierInterfaceContract.Functions.SendFunds.name,
    functionArgs: SupplierInterfaceContract.Functions.SendFunds.args(args),
    senderKey: lp1Account.stxPrivateKey,
    network,
    fee: 1000,
    // nonce: 54,
    anchorMode: AnchorMode.Any,
  });

  await waitForStacksBlock();

  broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

  transaction = await makeContractCall({
    contractAddress: PoolV10Contract.address,
    contractName: PoolV10Contract.name,
    functionName: PoolV10Contract.Functions.FinalizePool.name,
    functionArgs: PoolV10Contract.Functions.FinalizePool.args({
      lpToken: contractPrincipalCV(LpTokenContract.address, LpTokenContract.name),
      zpToken: contractPrincipalCV(ZestRewardDistContract.address, ZestRewardDistContract.name),
      cpToken: contractPrincipalCV(CpTokenContract.address, CpTokenContract.name),
      tokenId: uintCV(0),
    }),
    senderKey: accounts['delegate'].accounts[0].stxPrivateKey,
    network,
    fee: 1000,
    // nonce: 54,
    anchorMode: AnchorMode.Any,
  });

  broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

  await waitForStacksBlock();

  transaction = await makeContractCall({
    contractAddress: SupplierInterfaceContract.address,
    contractName: SupplierInterfaceContract.name,
    functionName: SupplierInterfaceContract.Functions.SendFundsFinalize.name,
    functionArgs: SupplierInterfaceContract.Functions.SendFundsFinalize.args({
      txid: bufferCV(Buffer.from(fundsTxId, 'hex')),
      preimage: bufferCV(preimage),
      factor: uintCV(1),
      lpToken: contractPrincipalCV(LpTokenContract.address, LpTokenContract.name),
      tokenId: uintCV(0),
      zpToken: contractPrincipalCV(ZestRewardDistContract.address, ZestRewardDistContract.name),
      lv: contractPrincipalCV(LiquidityVaultV10Contract.address, LiquidityVaultV10Contract.name),
      xbtcFt: contractPrincipalCV(WrappedBitcoinContract.address, WrappedBitcoinContract.name),
      rewardsCalc: contractPrincipalCV(RewardsCalcContract.address, RewardsCalcContract.name),
    }),
    senderKey: lp1Account.stxPrivateKey,
    network,
    fee: 1000,
    nonce: 2,
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
  });

  broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));
  console.log('Sending funds finalized.');

  transaction = await makeContractCall({
    contractAddress: PoolV10Contract.address,
    contractName: PoolV10Contract.name,
    functionName: PoolV10Contract.Functions.CreateLoan.name,
    functionArgs: PoolV10Contract.Functions.CreateLoan.args({
      lpToken: contractPrincipalCV(LpTokenContract.address, LpTokenContract.name),
      tokenId: uintCV(0),
      loanAmount: uintCV(loan0Amount),
      asset: contractPrincipalCV(WrappedBitcoinContract.address, WrappedBitcoinContract.name),
      collRatio: uintCV(0),
      collToken: contractPrincipalCV(WrappedBitcoinContract.address, WrappedBitcoinContract.name),
      apr: uintCV(300),
      maturityLength: uintCV(1296),
      paymentPeriod: uintCV(144),
      collVault: contractPrincipalCV(CollVaultContract.address, CollVaultContract.name),
      fundingVault: contractPrincipalCV(FundingVaultContract.address, FundingVaultContract.name),
    }),
    senderKey: accounts['borrower'].accounts[0].stxPrivateKey,
    network,
    fee: 1000,
    // nonce: 54,
    anchorMode: AnchorMode.Any,
  });

  broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

  await waitForStacksBlock();

  transaction = await makeContractCall({
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
    senderKey: accounts['delegate'].accounts[0].stxPrivateKey,
    network,
    fee: 1000,
    // nonce: 54,
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
  });

  broadcastResponse = await broadcastTransaction(transaction, network);
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
    senderKey: accounts['borrower'].accounts[0].stxPrivateKey,
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

  let drawdownTxId = await sendToAddress(
    inputTxHash,
    minerBtcSigner,
    minerAddress as string,
    0,
    borrower1Address as string,
    5000000000,
    loan0Amount
  );
  debug('Drawdown TXID: ', drawdownTxId);

  await waitForTxConfirmation(drawdownTxId);
  await waitForStacksBlock();

  const drawdownProof = await getProof(drawdownTxId);
  height = (await blocksApi.getBlockByBurnBlockHeight({ burnBlockHeight: drawdownProof.height }))
    .height;

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
        header: bufferCV(Buffer.from(drawdownProof.blockHeaderHex, 'hex')),
        height: uintCV(height),
      }),
      prevBlocks: listCV([]),
      tx: bufferCV(Buffer.from(drawdownProof.paymentTxHex, 'hex')),
      proof: tupleCV({
        'tx-index': uintCV(drawdownProof.txIndex),
        hashes: listCV(drawdownProof.proof.map(merkle => bufferCV(merkle))),
        'tree-depth': uintCV(drawdownProof.depth),
      }),
      outputIndex: uintCV(0), // points to the out that goes to supplier
      swapId: uintCV(0),
    }),
    senderKey: accounts.deployer.accounts[0].stxPrivateKey,
    network,
    fee: 1000,
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
  });

  broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

  transactions = [{
    contractAddress: MagicProtocolContract.address,
    contractName: MagicProtocolContract.name,
    functionName: MagicProtocolContract.Functions.InitializeSwapper.name,
    functionArgs: [],
    // senderKey: accounts["lp"].accounts[0].stxPrivateKey,
    network,
    fee: 1000,
    // nonce: 0,
    anchorMode: AnchorMode.Any,
  }];

  initNonce = await getNonce(
    getStxAddress({ account: borrower1Account, transactionVersion: TransactionVersion.Testnet }),
    network
  );
  await sendTransactionCalls(initNonce, transactions, borrower1Account.stxPrivateKey, network);

  let nextPaymentResult = await callReadOnlyFunction({
    contractAddress: LoanV10Contract.address,
    contractName: LoanV10Contract.name,
    functionName: LoanV10Contract.Functions.GetLoanRead.name,
    functionArgs: LoanV10Contract.Functions.GetLoanRead.args({
      loanId: uintCV(0),
    }),
    network,
    senderAddress: getStxAddress({
      account: borrower1Account,
      transactionVersion: TransactionVersion.Testnet,
    }),
  });

  let loan = cvToJSON(nextPaymentResult).value as Loan;
  let currentBurnBlockHeight = (await infoApi.getCoreApiInfo()).burn_block_height;

  let result = await callReadOnlyFunction({
    contractAddress: PaymentFixedContract.address,
    contractName: PaymentFixedContract.name,
    functionName: PaymentFixedContract.Functions.GetPayment.name,
    functionArgs: PaymentFixedContract.Functions.GetPayment.args({
      amount: uintCV(loan0Amount),
      paymentPeriod: uintCV(144),
      apr: uintCV(300),
      height: uintCV(currentBurnBlockHeight),
      nextPayment: uintCV(parseInt(loan['next-payment'].value)),
      caller: principalCV(
        getStxAddress({ account: borrower1Account, transactionVersion: TransactionVersion.Testnet })
      ),
    }),
    network,
    senderAddress: getStxAddress({
      account: borrower1Account,
      transactionVersion: TransactionVersion.Testnet,
    }),
  });

  let amountToPay = parseInt(cvToJSON(result).value);

  let preimage2 = Buffer.from(generateRandomHexString(20), 'hex');
  let hash2 = hashSha256Sync(preimage2);

  const swap2Addr = generateHTLCAddress(
    Buffer.from(hash2),
    Buffer.from(getPublicKeyFromPrivate(borrower1Account.stxPrivateKey), 'hex'),
    supplierBtcSigner.publicKey,
    500,
    1
  );

  let paymentTxId = await sendToAddress(
    drawdownTxId,
    borrower1Signer,
    borrower1Address as string,
    0,
    swap2Addr.address as string,
    loan0Amount,
    amountToPay
  );
  debug('Payment TXID: ', paymentTxId);
  // wait for confirmation in both Bitcoin chain and Stacks chains
  await waitForTxConfirmation(paymentTxId);
  await waitForStacksBlock();

  let paymentProof = await getProof(paymentTxId);
  height = (await blocksApi.getBlockByBurnBlockHeight({ burnBlockHeight: paymentProof.height }))
    .height;

  args = {
    block: tupleCV({
      header: bufferCV(Buffer.from(paymentProof.blockHeaderHex, 'hex')),
      height: uintCV(height),
    }),
    prevBlocks: listCV([]),
    tx: bufferCV(Buffer.from(paymentProof.paymentTxHex, 'hex')),
    proof: tupleCV({
      'tx-index': uintCV(paymentProof.txIndex),
      hashes: listCV(paymentProof.proof.map(merkle => bufferCV(merkle))),
      'tree-depth': uintCV(paymentProof.depth),
    }),
    outputIndex: uintCV(0), // points to the out that goes to supplier
    sender: bufferCV(Buffer.from(getPublicKeyFromPrivate(borrower1Account.stxPrivateKey), 'hex')),
    recipient: bufferCV(supplierBtcSigner.publicKey),
    expirationBuff: bufferCV(encodeExpiration(500)),
    hash: bufferCV(Buffer.from(hash2)),
    swapperBuff: bufferCV(Buffer.from(numberToLE(1), 'hex')), // swapper is 1
    supplierId: uintCV(0),
    minToReceive: uintCV(Math.floor((amountToPay * 10) / 10_000)),
  };

  transaction = await makeContractCall({
    contractAddress: SupplierInterfaceContract.address,
    contractName: SupplierInterfaceContract.name,
    functionName: SupplierInterfaceContract.Functions.SendFunds.name,
    functionArgs: SupplierInterfaceContract.Functions.SendFunds.args(args),
    senderKey: borrower1Account.stxPrivateKey,
    network,
    fee: 1000,
    anchorMode: AnchorMode.Any,
  });

  broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

  await waitForStacksBlock();

  transaction = await makeContractCall({
    contractAddress: SupplierInterfaceContract.address,
    contractName: SupplierInterfaceContract.name,
    functionName: SupplierInterfaceContract.Functions.MakePayment.name,
    functionArgs: SupplierInterfaceContract.Functions.MakePayment.args({
      txid: bufferCV(Buffer.from(paymentTxId, 'hex')),
      preimage: bufferCV(preimage2),
      loanId: uintCV(0),
      payment: contractPrincipalCV(PaymentFixedContract.address, PaymentFixedContract.name),
      lpToken: contractPrincipalCV(LpTokenContract.address, LpTokenContract.name),
      lv: contractPrincipalCV(LiquidityVaultV10Contract.address, LiquidityVaultV10Contract.name),
      tokenId: uintCV(0),
      cpToken: contractPrincipalCV(CpTokenContract.address, CpTokenContract.name),
      cpRewardsToken: contractPrincipalCV(
        CpRewardsTokenContract.address,
        CpRewardsTokenContract.name
      ),
      zpToken: contractPrincipalCV(ZestRewardDistContract.address, ZestRewardDistContract.name),
      swapRouter: contractPrincipalCV(SwapRouterContract.address, SwapRouterContract.name),
      xbtcFt: contractPrincipalCV(WrappedBitcoinContract.address, WrappedBitcoinContract.name),
    }),
    senderKey: borrower1Account.stxPrivateKey,
    network,
    fee: 1000,
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
  });

  broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

  await waitForStacksBlock();

  console.log('Make Payment finalized.');

  let rewardsResult = await callReadOnlyFunction({
    contractAddress: LpTokenContract.address,
    contractName: LpTokenContract.name,
    functionName: LpTokenContract.Functions.WithdrawableFundsOf.name,
    functionArgs: LpTokenContract.Functions.WithdrawableFundsOf.args({
      tokenId: uintCV(0),
      owner: principalCV(
        getStxAddress({ account: lp1Account, transactionVersion: TransactionVersion.Testnet })
      ),
    }),
    network,
    senderAddress: getStxAddress({
      account: lp1Account,
      transactionVersion: TransactionVersion.Testnet,
    }),
  });

  let rewardsAmount = parseInt(cvToJSON(rewardsResult).value);

  transaction = await makeContractCall({
    contractAddress: SupplierInterfaceContract.address,
    contractName: SupplierInterfaceContract.name,
    functionName: SupplierInterfaceContract.Functions.WithdrawRewards.name,
    functionArgs: SupplierInterfaceContract.Functions.WithdrawRewards.args({
      btcVersion: bufferCV(Buffer.from(numberToHex(parsedlp1Addr.version), 'hex')),
      btcHash: bufferCV(parsedlp1Addr.hash),
      supplierId: uintCV(0),
      lpToken: contractPrincipalCV(LpTokenContract.address, LpTokenContract.name),
      tokenId: uintCV(0),
      lv: contractPrincipalCV(LiquidityVaultV10Contract.address, LiquidityVaultV10Contract.name),
      xbtc: contractPrincipalCV(WrappedBitcoinContract.address, WrappedBitcoinContract.name),
    }),
    senderKey: lp1Account.stxPrivateKey,
    network,
    fee: 1000,
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
  });

  broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));

  debug('Rewards Being Paid:', rewardsAmount);
  // We're using the same funds that we used for the drawdown, but instead use the funds sent back to the miner
  let rewardsTxId = await sendToAddress(
    drawdownTxId,
    minerBtcSigner,
    minerAddress as string,
    1,
    lp1Address as string,
    4949990000,
    rewardsAmount
  );
  debug('Rewards Payment TXID: ', rewardsTxId);
  await waitForTxConfirmation(rewardsTxId);
  await waitForStacksBlock();

  let rewardsProof = await getProof(rewardsTxId);
  height = (await blocksApi.getBlockByBurnBlockHeight({ burnBlockHeight: rewardsProof.height }))
    .height;

  transaction = await makeContractCall({
    contractAddress: SupplierInterfaceContract.address,
    contractName: SupplierInterfaceContract.name,
    functionName: SupplierInterfaceContract.Functions.FinalizeOutbound.name,
    functionArgs: SupplierInterfaceContract.Functions.FinalizeOutbound.args({
      block: tupleCV({
        header: bufferCV(Buffer.from(rewardsProof.blockHeaderHex, 'hex')),
        height: uintCV(height),
      }),
      prevBlocks: listCV([]),
      tx: bufferCV(Buffer.from(rewardsProof.paymentTxHex, 'hex')),
      proof: tupleCV({
        'tx-index': uintCV(rewardsProof.txIndex),
        hashes: listCV(rewardsProof.proof.map(merkle => bufferCV(merkle))),
        'tree-depth': uintCV(rewardsProof.depth),
      }),
      outputIndex: uintCV(0), // points to the out that goes to supplier
      swapId: uintCV(1),
    }),
    senderKey: accounts.deployer.accounts[0].stxPrivateKey,
    network,
    fee: 1000,
    postConditionMode: PostConditionMode.Allow,
    anchorMode: AnchorMode.Any,
  });

  broadcastResponse = await broadcastTransaction(transaction, network);
  debug(JSON.stringify(broadcastResponse));
})();
