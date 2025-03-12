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

