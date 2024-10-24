
import { Sha256 } from "https://deno.land/std@0.67.0/hash/sha256.ts";
import { createHash } from "https://deno.land/std@0.67.0/hash/mod.ts";
import { Buffer } from "https://deno.land/std@0.159.0/node/buffer.ts";

export const CSV_DELAY = 500;
export const CSV_DELAY_HEX = encode(numberToHex(CSV_DELAY));
export const OP_DROP = "75";
export const OP_DUP = "76";
export const OP_IF = "63";
export const OP_SHA256 = "a8";
export const OP_EQUALVERIFY = "88";
export const OP_ELSE = "67";
export const OP_CHECKSEQUENCEVERIFY = "b2";
export const OP_ENDIF = "68";
export const OP_CHECKSIG = "ac";
export const OP_HASH160 = "a9";
export const OP_EQUAL   = "87";

function getHash(contents: string) {
  const hash = new Sha256().update(Buffer.from(contents, "hex"));
  return hash.toString();
}

function getReverseTxId(rawTx: string) {
  let hash = new Sha256().update(Buffer.from(rawTx, "hex"));
  hash = new Sha256().update(hash.array());
  return hash.hex();
}

function getTxId(rawTx: string) {
  let txId = getReverseTxId(rawTx);
  return toLittleEndian(txId);
}

export function generateRandomHexString(numBytes: number) {
  const letters = "0123456789ABCDEF";
  let result = "";
  for (let i = 0; i < numBytes * 2; i++)
    result += letters[(Math.floor(Math.random() * 16))];

  return result;
}

export function toLittleEndian(hex: string) {
  let s = "";
  for(let i = 0; i < hex.length; i++) {
    if(i % 2 == 0) {
      s = (hex.slice(i, i+2)).concat(s);
    }
  }
  return s;
}

export function numberToHex(num: number) {
  let s = Number(num).toString(16);
  s = s.length % 2 ? "0".concat(s) : s;
  return s;
}

export function padTo(hex: string, length = 4) {
  return hex.padStart(length * 2, "0");
}

function encode(value: string) {
  return toLittleEndian(numberToHex(value.length / 2)).concat(toLittleEndian(value));
}

function addVarInt(scriptHex: string) {
  return toLittleEndian(numberToHex(scriptHex.length / 2)).concat(scriptHex);
}

function generateP2SHTx(
  sender: string,
  recipient: string,
  expiration: number, // in integer value
  hash: string,
  swapper: number,  // in hex LE
  outputValue: number
) {
  const valueHex = padTo(numberToHex(outputValue), 8);

  const s = `0200000001f01c1021c9d15a6ddda9e7f016586c5e1e57e8b456a90a5f741238a3ea5f01b1010000006a47\
304402206f2e00a06d84a629d1583d3e37d046dc768346e9cfb9f29a54fca8e25401661a022055bfb842f1baaad40da4ff\
1e53431c30e383007ac53b9a93c938423c3d217b950121031aa68bfad0576216e20a30892af32e49948fbd2892c339c373\
bc28e49e04f9bffdffffff02${toLittleEndian(valueHex)}17${generateP2SHScript(sender, recipient, expiration, hash, swapper)}c0da0\
000000000001976a914c5b8cc55ab829cc07b08936234b14a039a38f4e288ac89692200`;

  return s;
}

function generateP2PKHTx(
  hash: string,
  outputValue: number
) {
  let valueHex = padTo(numberToHex(outputValue), 8);

  let s = `0200000001f01c1021c9d15a6ddda9e7f016586c5e1e57e8b456a90a5f741238a3ea5f01b1010000006a47\
304402206f2e00a06d84a629d1583d3e37d046dc768346e9cfb9f29a54fca8e25401661a022055bfb842f1baaad40da4ff\
1e53431c30e383007ac53b9a93c938423c3d217b950121031aa68bfad0576216e20a30892af32e49948fbd2892c339c373\
bc28e49e04f9bffdffffff02${toLittleEndian(valueHex)}19${generateP2PKHScript(hash)}c0da0\
000000000001976a914c5b8cc55ab829cc07b08936234b14a039a38f4e288ac89692200`;

  return s;
}

function generateHtclScript(
  sender: string,
  recipient: string,
  expiration: number, // in integer value
  hash: string,
  swapper: number,  // in hex LE
  // outputValue: number // in integer value
) {
  return `\
${encode(padTo(numberToHex(swapper), 4))}${OP_DROP}\
${OP_IF}\
${OP_SHA256}${addVarInt(hash)}\
${OP_EQUALVERIFY}\
${addVarInt(recipient)}\
${OP_ELSE}\
${expiration !== undefined ? encode(numberToHex(expiration)) : CSV_DELAY_HEX}\
${OP_CHECKSEQUENCEVERIFY}\
${OP_DROP}\
${addVarInt(sender)}\
${OP_ENDIF}\
${OP_CHECKSIG}`
    .replace(/\s+/g, ' ')
    .trim();
}

function generateP2SHScript(
  sender: string,
  recipient: string,
  expiration: number, // in integer value
  hash: string,
  swapper: number,  // in hex LE
  ) {
    let htlc = generateHtclScript(sender, recipient, expiration, hash, swapper);
    return `${OP_HASH160}${addVarInt(generateScriptHash(htlc))}${OP_EQUAL}`;
}

export function generateP2PKHScript(
  hash: string,
) {
  return `${OP_DUP}${OP_HASH160}${addVarInt(hash)}${OP_EQUALVERIFY}${OP_CHECKSIG}`;
}

function generateScriptHash(script: string) {
  let s = script;
  const hash = createHash("ripemd160").update(createHash("sha256").update(Buffer.from(s, "hex")).digest());
  return hash.toString();
}

function getExpiration(expirationVal: number) {
  return toLittleEndian(padTo(numberToHex(expirationVal), 2));
}

function swapperBuff(swapperVal: number) {
  return toLittleEndian(padTo(numberToHex(swapperVal), 4));
}

export { getHash, getReverseTxId, getTxId, generateHtclScript, generateP2SHTx, generateP2SHScript, getExpiration, generateP2PKHTx, swapperBuff };