import { StacksMocknet } from '@stacks/network';
import { TransactionVersion, getNonce } from '@stacks/transactions';

import { getStxAddress } from '@stacks/wallet-sdk';
import { getPublicKeyFromPrivate } from '@stacks/encryption';
import { networks, payments, script, ECPair } from 'bitcoinjs-lib';

// import {
  // BlocksApiInterface,
  // Configuration } from '@stacks/blockchain-api-client';

// import fetch from 'cross-fetch';
// import { BlocksApi } from '@stacks/blockchain-api-client';

import {
  blockchainRequest,
  generateHTLCAddress,
  generateRandomHexString,
  sendToAddress,
  setupBitcoinAddresses,
  numberToLE,
  waitForTxConfirmation,
  getProof,
} from './bitcoin.js';
import { initializeSwapper, sendFunds, sendFundsFinalize, waitForStacksBlock } from './stacks.js';

import { hashSha256Sync } from '@stacks/encryption';
import { debuglog } from 'util';
import { getWallets } from './accounts.js';
import { getSignerFromStxPrivateKey, generateRandomBitcoinSigner } from './util.js';

const debug = debuglog('1');

const network = new StacksMocknet();
const btcNetwork = networks.regtest;

export async function sendFundsSteps(supplierBtcPrivKey: Buffer) {
  try {
    let wallets = await getWallets();

    const lp1Wallet = wallets['lp'];
    const minerWallet = wallets['miner'];

    const lp1BtcSigner = generateRandomBitcoinSigner(btcNetwork);
    const supplierBtcSigner = ECPair.fromPrivateKey(supplierBtcPrivKey);

    const lp1Account = lp1Wallet.accounts[0];
    const lp1Address = getStxAddress({
      account: lp1Account,
      transactionVersion: TransactionVersion.Testnet,
    });

    // const apiConfig: Configuration = new Configuration({
    //   fetchApi: fetch,
    //   basePath: 'http://localhost:3999',
    // });
    // const blocksApi: BlocksApiInterface = new BlocksApi(apiConfig);
    // // REGISTERING SUPPLIER INTERFACE

    const lp1Payment = payments.p2pkh({ pubkey: lp1BtcSigner.publicKey, network: btcNetwork });
    console.log('Lp1 Funding Address', lp1Payment.address);

    const minerBtcSigner = getSignerFromStxPrivateKey(
      minerWallet.accounts[0].stxPrivateKey,
      btcNetwork
    );
    const minerPayment = payments.p2pkh({ pubkey: minerBtcSigner.publicKey, network: btcNetwork });
    console.log('Miner P2PKH address: ', minerPayment.address);

    
    // initializing LP_1 as swapper in the Magic Protocol
    await initializeSwapper(lp1Wallet.accounts[0], network);

    let fundingTx = await setupBitcoinAddresses(lp1Payment.address as string, minerBtcSigner);
    await waitForTxConfirmation(fundingTx);

    // GENERATE PAYMENT TO MAGIC PROTOCOL SUPPLIER
    let preimage = Buffer.from(generateRandomHexString(20), 'hex');
    let hash = hashSha256Sync(preimage);
    console.log('Preimage: ', preimage.toString('hex'));
    console.log('Hash: ', Buffer.from(hash).toString('hex'));

    const expiration = 500;
    const swapperId = 0;

    let swap1Addr = generateHTLCAddress(
      Buffer.from(hash),
      Buffer.from(getPublicKeyFromPrivate(lp1Account.stxPrivateKey), 'hex'),
      supplierBtcSigner.publicKey,
      expiration,
      swapperId
    );

    let paymentTxId = await sendToAddress(
      fundingTx,
      lp1BtcSigner,
      lp1Payment.address as string,
      0,
      swap1Addr.address as string,
      100000000,
      10000000
    );
    debug('Payment TXID', paymentTxId);
    await waitForTxConfirmation(paymentTxId);
    await waitForStacksBlock();
    await waitForStacksBlock();

    let paymentTransaction = await blockchainRequest('getrawtransaction', [paymentTxId, true]);
    let blockHeaderObj = await blockchainRequest('getblockheader', [
      paymentTransaction.blockhash,
      true,
    ]);
    let height = blockHeaderObj.height;
    let fundsProof = await getProof(paymentTxId);

    let nonce = await getNonce(lp1Address, network);
    await sendFunds(
      fundsProof,
      height,
      0,
      Buffer.from(getPublicKeyFromPrivate(lp1Account.stxPrivateKey), 'hex'),
      Buffer.from(supplierBtcSigner.publicKey.toString('hex'), 'hex'),
      script.number.encode(500),
      hash,
      Buffer.from(numberToLE(0), 'hex'),
      0,
      (10000000 * 10) / 10_000,
      0,
      0,
      1,
      "00",
      lp1Account,
      network,
      nonce
    );

    await waitForStacksBlock();

    await sendFundsFinalize(Buffer.from(paymentTxId, 'hex'), preimage, 2, 0, lp1Account, network);
    console.log('Sending funds finalized.');

    return {
      supplierBtcSigner,
      lp1BtcSigner,
    };
  } catch (err) {
    console.log(err);
  }
}
