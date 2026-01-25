// Mapping for t-shirt sizes to numeric values
export const TSHIRT_SIZE_MAP: Record<string, number> = {
  XS: 1,
  S: 2,
  M: 3,
  L: 5,
  XL: 8,
};

// Reverse mapping: number to t-shirt size (for display)
export const NUMBER_TO_TSHIRT: Record<number, string> = {
  1: "XS",
  2: "S",
  3: "M",
  5: "L",
  8: "XL",
};

/**
 * Convert a vote value to a number for calculations.
 * Handles numeric strings, t-shirt sizes, and "?" (unsure).
 */
export function voteValueToNumber(value: string | null): number | null {
  if (!value || value === "?") {
    return null;
  }

  // Check if it's a t-shirt size
  const upperValue = value.toUpperCase();
  if (TSHIRT_SIZE_MAP[upperValue] !== undefined) {
    return TSHIRT_SIZE_MAP[upperValue];
  }

  // Try parsing as a number
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/**
 * Convert a number back to t-shirt size (finds closest match).
 * Returns the number as string if no t-shirt size matches.
 */
export function numberToTShirtSize(num: number): string {
  // Find closest t-shirt size
  const tshirtValues = Object.values(TSHIRT_SIZE_MAP).sort((a, b) => a - b);
  let closest = tshirtValues[0];
  let minDiff = Math.abs(num - closest);

  for (const val of tshirtValues) {
    const diff = Math.abs(num - val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = val;
    }
  }

  return NUMBER_TO_TSHIRT[closest] || num.toFixed(1);
}

/**
 * Round a number to the nearest value in the point scale.
 * Handles numeric values and t-shirt sizes.
 */
export function roundToNearestPointScale(
  num: number | undefined | null,
  pointScale: string[] | undefined,
  pointScalePreset?: string,
): string | null {
  if (
    num === undefined ||
    num === null ||
    !pointScale ||
    pointScale.length === 0
  ) {
    return null;
  }

  const isTShirtScale = pointScalePreset === "tshirt";

  // For t-shirt sizes, convert number to nearest t-shirt size
  if (isTShirtScale) {
    return numberToTShirtSize(num);
  }

  // For numeric scales, find the closest numeric value
  const numericValues = pointScale
    .filter((v) => v !== "?")
    .map((v) => parseFloat(v))
    .filter((v) => !isNaN(v))
    .sort((a, b) => a - b);

  if (numericValues.length === 0) {
    return null;
  }

  // Find the closest numeric value
  let closest = numericValues[0];
  let minDiff = Math.abs(num - closest);

  for (const val of numericValues) {
    const diff = Math.abs(num - val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = val;
    }
  }

  // Return as string, matching the format in point scale (e.g., "8" not "8.0")
  const closestStr = closest.toString();
  return pointScale.includes(closestStr) ? closestStr : closest.toFixed(1);
}
