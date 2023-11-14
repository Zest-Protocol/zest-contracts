import { StacksMocknet } from '@stacks/network';
import { TransactionVersion, getNonce } from '@stacks/transactions';

import { getStxAddress } from '@stacks/wallet-sdk';
import { networks } from "bitcoinjs-lib";

import {
  createPool,
  finalizePool,
  setupContracts,
  waitForStacksTransaction
} from './stacks.js';
import { getWallets } from './accounts.js';
import { generateRandomBitcoinSigner } from './util.js';

const network = new StacksMocknet();

export async function initializePoolSteps() {
  try {
    let wallets = await getWallets();

    const deployerWallet = wallets['deployer'];
    // const minerWallet = wallets["miner"];
    const delegate = wallets['delegate'];

    // REGISTERING SUPPLIER INTERFACE
    const btcNetwork = networks.regtest;

    const supplierBtcSigner = generateRandomBitcoinSigner(btcNetwork);
    console.log('Supplier Public Key', Buffer.from(supplierBtcSigner.publicKey).toString('hex'));

    let initNonce = await getNonce(
      getStxAddress({
        account: deployerWallet.accounts[0],
        transactionVersion: TransactionVersion.Testnet,
      }),
      network
    );
    let lastNonce = await setupContracts(supplierBtcSigner.publicKey, deployerWallet, initNonce);
    const createPooltxId = (
      await createPool(
        deployerWallet.accounts[0],
        deployerWallet.accounts[0],
        delegate.accounts[0],
        1000,
        1000,
        10000000000,
        10000000000,
        1,
        157680,
        true,
        network,
        lastNonce + BigInt(1)
      )
    ).broadcastResponse.txid;
    await waitForStacksTransaction(createPooltxId);
    await finalizePool(delegate.accounts[0], deployerWallet.accounts[0], 0, network);

    return  { supplierBtcPrivKey: supplierBtcSigner.privateKey!};
  } catch (err) {
    console.log(err);
  }
}
