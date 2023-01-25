import { utils } from '@noble/secp256k1';
import { ECPair } from 'bitcoinjs-lib';
import wif from 'wif';

function privateKeyToWIF(private_key_hex: any, mainnet: Boolean) {
  return wif.encode(mainnet ? 0x80 : 0xef, Buffer.from(private_key_hex, 'hex'), true);
}

export function generateRandomBitcoinSigner(network: any) {
  const supplierBtcKey = utils.randomPrivateKey();
  return ECPair.fromPrivateKey(Buffer.from(supplierBtcKey), { network });
}

export function generateBitcoinSignerFromStxPrivKey(network: any, stxPrivateKey: string) {
  return ECPair.fromWIF(privateKeyToWIF(stxPrivateKey, false), network);
}

// remove compression byte
export function getSignerFromStxPrivateKey(stxPrivateKey: string, network: any) {
  return ECPair.fromPrivateKey(Buffer.from(stxPrivateKey.slice(0, -2), "hex"), { network , compressed: true });
}
