import { hexToBytes, intToHex, bytesToHex } from '@stacks/common';
import { payments, script, networks, Psbt, address as bAddress } from 'bitcoinjs-lib';
import fetch, { Headers } from 'node-fetch';
import { assert } from 'console';
import sha256 from 'crypto-js/sha256.js';
import { hashSha256Sync } from '@stacks/encryption';
import { MerkleTree } from 'merkletreejs';

import { debuglog } from 'util';
const debug = debuglog('1');

export interface Proof {
  proof: Buffer[],
  txIndex: number,
  depth: number,
  blockHash: string,
  blockHeaderHex: string,
  height: number,
  paymentTxHex: string,
}

const btcNetwork = networks.regtest;

export function numberToLE(num: number, length = 4) {
  const hexBE = intToHex(num, length);
  let le = '';
  // reverse the buffer
  for (let i = 0; i < length; i++) {
    le += hexBE.slice(-2 * (i + 1), -2 * i || length * 2);
  }
  return le;
}

export function numberToLEBytes(num: number, length = 4) {
  return hexToBytes(numberToLE(num, length));
}

export function getHash(contents: string) {
  const hash = hashSha256Sync(Buffer.from(contents, 'hex'));
  return hash;
}

export function reverseBuffer(buffer: Buffer): Uint8Array {
  if (buffer.length < 1) return buffer;
  let j = buffer.length - 1;
  let tmp = 0;
  for (let i = 0; i < buffer.length / 2; i++) {
    tmp = buffer[i];
    buffer[i] = buffer[j];
    buffer[j] = tmp;
    j--;
  }
  return Uint8Array.from(buffer);
}

export const CSV_DELAY = 500;
export const CSV_DELAY_BUFF = script.number.encode(CSV_DELAY);
export const CSV_DELAY_HEX = CSV_DELAY_BUFF.toString('hex');

export function encodeExpiration(expiration?: number): Buffer {
  return typeof expiration === 'undefined' ? CSV_DELAY_BUFF : script.number.encode(expiration);
}

export function htlcASM(
  hash: Uint8Array,
  senderPublicKey: Uint8Array,
  recipientPublicKey: Uint8Array,
  expiration: number,
  swapper: number
) {
  const swapperHex = numberToLE(swapper);
  return `
  ${swapperHex} OP_DROP
	OP_IF
    OP_SHA256 ${bytesToHex(hash)}
    OP_EQUALVERIFY
		${bytesToHex(recipientPublicKey)}
	OP_ELSE
		${encodeExpiration(expiration).toString('hex')}
		OP_CHECKSEQUENCEVERIFY
		OP_DROP
		${bytesToHex(senderPublicKey)}
	OP_ENDIF
	OP_CHECKSIG`
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateHTLCScript(
  hash: Uint8Array,
  senderPublicKey: Uint8Array,
  recipientPublicKey: Uint8Array,
  expiration: number,
  swapper: number
): Buffer {
  const asm = htlcASM(hash, senderPublicKey, recipientPublicKey, expiration, swapper);
  const output = script.fromASM(asm);
  return output;
}

export function generateHTLCAddress(
  hash: Uint8Array,
  senderPublicKey: Uint8Array,
  recipientPublicKey: Uint8Array,
  expiration: number,
  swapper: number
): payments.Payment {
  const network = btcNetwork;
  const script = generateHTLCScript(hash, senderPublicKey, recipientPublicKey, expiration, swapper);
  const payment = payments.p2sh({ redeem: { output: script, network }, network });
  return payment;
}

export function generateRandomHexString(numBytes: number) {
  const letters = '0123456789ABCDEF';
  let result = '';
  for (let i = 0; i < numBytes * 2; i++) result += letters[Math.floor(Math.random() * 16)];

  return result;
}

export function getScriptHash(output: Buffer): Uint8Array {
  const uintOutput = Uint8Array.from(output);
  const hash = hashSha256Sync(uintOutput);
  const reversed = reverseBuffer(Buffer.from(hash));
  return reversed;
}

async function request(method: string, endPoint: string, params: any[]) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    Authorization: `Basic ${Buffer.from(`${'devnet'}:${'devnet'}`).toString('base64')}`,
  });

  const response = await fetch(`http://${'localhost'}:${18443}/${endPoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
    }),
  });
  const json: any = await response.json();

  if (response.status === 200) {
    return json.result;
  }

  return Promise.reject(new Error(json.error.message));
}

export async function walletRequest(method: string, wallet: string, params: any[]) {
  return request(method, `wallet/${wallet}`, params);
}

export async function blockchainRequest(method: string, params: any[]) {
  return request(method, ``, params);
}

export const addressVersionToMainnetVersion: Record<number, number> = {
  [0]: 0,
  [5]: 5,
  [111]: 0,
  [196]: 5,
};

export interface BitcoinBlock {
  hash: string;
  confirmations: number;
  strippedsize: number;
  size: number;
  weight: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: string[];
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash: string;
}

export interface BlockHeader {
  hash: string;
  confirmations: number;
  height: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  time: number;
  mediantime: number;
  nonce: number;
  bits: string;
  difficulty: number;
  chainwork: string;
  nTx: number;
  previousblockhash: string;
}

export interface Transaction {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: {
    txid: string;
    vout: number;
    scriptSig: {
      asm: string;
      hex: string;
    };
    sequence: number;
    txinwitness: string[];
  }[];
  vout: {
    value: number;
    n: number;
    scriptPubKey: {
      asm: string;
      hex: string;
      reqSigs: number;
      type: string;
      addresses: string[];
    };
  }[];
  hex: string;
  blockhash: string | undefined;
  confirmations: number;
  time: number;
  blocktime: number;
}

export function numberToHex(num: number) {
  let s = Number(num).toString(16);
  s = s.length % 2 ? '0'.concat(s) : s;
  return s;
}

export function parseBtcAddress(address: string) {
  const b58 = bAddress.fromBase58Check(address);
  const version = addressVersionToMainnetVersion[b58.version] as number | undefined;
  if (typeof version !== 'number') throw new Error('Invalid address version.');
  return {
    version,
    hash: b58.hash,
  };
}

// mineBtcSigner is ECPair type
export async function setupBitcoinAddresses(lp1FundingAddress: string, minerBtcSigner: any) {
  const minerPayment = payments.p2pkh({ pubkey: minerBtcSigner.publicKey, network: btcNetwork });
  const block_rewards = 5000000000;

  // GIVE FUNDS TO LP_1 wallet
  let inputBlockHash = await blockchainRequest('getblockhash', [5]);
  let inputBlock = await blockchainRequest('getblock', [inputBlockHash]);
  let inputTxHash = inputBlock.tx[0];

  return sendToAddress(
    inputTxHash,
    minerBtcSigner,
    minerPayment.address as string,
    0,
    lp1FundingAddress,
    block_rewards,
    100000000
  );
}

export async function sendToAddress(
  txoutId: string,
  txoutSigner: any,
  changeAddress: string,
  txoutIdx: number,
  payToAddress: string,
  txoutAmount: number,
  amount: number
) {
  // GIVE FUNDS TO LP_1 wallet
  assert(txoutAmount > amount + 10000);
  let inputTxHex = await blockchainRequest('getrawtransaction', [txoutId]);

  const psbt = new Psbt({ network: btcNetwork });
  psbt.addInput({
    hash: txoutId,
    index: txoutIdx,
    nonWitnessUtxo: Buffer.from(inputTxHex, 'hex'),
  });

  psbt.addOutput({
    address: payToAddress,
    value: amount,
  });

  psbt.addOutput({
    address: changeAddress as string,
    value: txoutAmount - (amount + 10000),
  });

  debug('Pay To output value: ', amount);
  debug('Change output value: ', txoutAmount - (amount + 10000));

  // console.log(psbt.txInputs);
  // console.log(psbt.txOutputs);

  psbt.signInput(0, txoutSigner);
  psbt.finalizeInput(0);

  let result = await blockchainRequest('sendrawtransaction', [psbt.extractTransaction().toHex()]);
  return result;
}

export async function getProof(txId: string): Promise<Proof> {
  let paymentTransaction: Transaction = (await blockchainRequest("getrawtransaction", [txId, true]));
  let paymentTxHex = paymentTransaction.hex;
  let paymentBlockHash = paymentTransaction.blockhash;

  let block: BitcoinBlock = await blockchainRequest('getblock', [paymentBlockHash]);
  let blockHeaderHex = await blockchainRequest('getblockheader', [paymentBlockHash, false]);
  let blockHeaderObj: BlockHeader = await blockchainRequest('getblockheader', [
    paymentBlockHash,
    true,
  ]);
  let blockTxs = block.tx;

  let tree = new MerkleTree(blockTxs, sha256, { isBitcoinTree: true });
  let depth = tree.getDepth();
  let proof = tree.getProof(txId, depth).map((merkle: any) => Buffer.from(reverseBuffer(merkle.data)));

  let txIndex = blockTxs.findIndex((compare: string) => compare === txId);

  return {
    proof,
    txIndex,
    depth,
    blockHash: block.hash,
    blockHeaderHex,
    height: blockHeaderObj.height,
    paymentTxHex,
  };
}

export async function waitForTxConfirmation(txId: string) {
  let txConfirmations = 0;
  console.log(`Waiting for transaction ${txId} to be confirmed...`);
  while (txConfirmations == (await blockchainRequest('gettxout', [txId, 0])).confirmations) {
    await new Promise(f => setTimeout(f, 1_000));
    debug('Checking...');
  }

  return (await blockchainRequest('getrawtransaction', [txId, true])) as Transaction;
}


export async function waitForBitcoinBlock() {
  let height = (await blockchainRequest("getblockcount", []));
  console.log(`Waiting for block of height ${height + 1} to be confirmed...`);
  while (height == (await blockchainRequest("getblockcount", []))) {
    await new Promise(f => setTimeout(f, 1_000));
    debug("Checking...");
  }

  return height + 1;
}
