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

// Example usage
// const inputStr = "{ a-token-address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.lp-token-0, base-ltv-as-collateral: u0, borrowing-enabled: false, current-average-stable-borrow-rate: u0, current-liquidity-rate: u450000, current-stable-borrow
