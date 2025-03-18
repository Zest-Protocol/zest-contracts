import { ParsedTransactionResult } from "@hirosystems/clarinet-sdk";
import { ClarityType } from "@stacks/transactions";
import { expect } from "vitest";

export function parseCustomStringToJson(inputString: string): object | null {
  // Step 1: Correctly format the keys and handle boolean and numeric values
  let formattedString = inputString
    .replace(/([a-z-]+)\s*:/gi, (_, key) => `"${key}":`)
    .replace(/'([^']+)'/g, '"$1"');

  try {
    // Step 2: Parse the string into a JSON object
    const jsonObject = JSON.parse(formattedString);
    return jsonObject;
  } catch (e) {
    console.error("Error parsing string to JSON:", e);
    return null;
  }
}

/**
 * Checks if a number is within a specified margin of error from an expected value
 * @param actual The actual value to check
 * @param expected The expected value to compare against
 * @param marginOfError The acceptable margin of error (default is 0.0001 or 0.01%)
 * @returns boolean indicating if the actual value is within the margin of error
 */
export function isWithinMarginOfError(
  actual: number,
  expected: number,
  marginOfError: number = 0.0001
): boolean {
  const difference = Math.abs(actual - expected);
  const allowedDifference = expected * marginOfError;
  return difference <= allowedDifference;
}


export function getRewardedAmount(
  sBTCPrice: number,
  wSTXPrice: number,
  suppliedAmount: number,
  rate: number
) {
  const conversionRate = sBTCPrice / wSTXPrice;
  const rewardedAmount = (suppliedAmount * rate);
  return rewardedAmount * conversionRate;
}


export function getFinalRate(
  sBTCPrice: number,
  wSTXPrice: number,
  suppliedAmount: number,
  finalAmount: number,
) {
  const conversionRate = sBTCPrice / wSTXPrice;
  return finalAmount / (suppliedAmount * conversionRate);
}

export async function getPriceVaaLatest(asset: string) {
  const timestamp = Math.floor(Date.now() / 1000) - 2 // sometimes it fails with - 1, use - 2 to be safe.
  return getPriceVaaFromTimestamp(asset, timestamp);
}


export async function getPriceVaaFromTimestamp(asset: string, timestamp: number) {
  const btcid = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'
  const stxid = '0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17'
  const usdc = '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a'
  const latestURL = `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${btcid}&binary=true`;

  let timestampURL;

  if (asset === 'btc') {
    timestampURL  = `https://hermes.pyth.network/api/get_price_feed?id[]=${btcid}&publish_time=${timestamp}&binary=true`;
  } else if (asset === 'stx') {
    timestampURL  = `https://hermes.pyth.network/api/get_price_feed?id[]=${stxid}&publish_time=${timestamp}&binary=true`;
  } else if (asset === 'usdc') {
    timestampURL  = `https://hermes.pyth.network/api/get_price_feed?id[]=${usdc}&publish_time=${timestamp}&binary=true`;
  }

  try {
    const response = await fetch(timestampURL as string);
    const data = await response.json() as any;
    return Buffer.from(data.vaa, 'base64').toString('hex');
  } catch (e) {
    console.error("Error parsing string to JSON:", e);
    return null;
  }
}

export async function getPriceVaas(assets: string[]) {
  const assetsMap = {
    "btc": '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    "stx": '0xec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17',
    "usdc": '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a'
  }

  const btcid = assetsMap["btc"];
  const stxid = assetsMap["stx"];
  const usdc = assetsMap["usdc"];

  const idParams = assets.map((asset) => assetsMap[asset as keyof typeof assetsMap]).join('&ids[]=');
  const latestURL = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${idParams}`;

  try {
    const response = await fetch(latestURL as string);
    const data = await response.json() as any;
    return data.binary.data[0];
  } catch (e) {
    console.error("Error parsing string to JSON:", e);
    return null;
  }
}

export async function verifyTxsOk(txs: ParsedTransactionResult[]) {
  txs.forEach((tx) => {
    expect(tx.result).toHaveClarityType(ClarityType.ResponseOk);
  });
}
