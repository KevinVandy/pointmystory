// Point scale presets for story pointing

export const POINT_SCALE_PRESETS = {
  fibonacci: ["0.5", "1", "2", "3", "5", "8", "13", "21", "34", "?"],
  powers: ["0.5", "1", "2", "4", "8", "16", "32", "64", "128", "?"],
  linear: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "?"],
  hybrid: ["0.5", "1", "2", "3", "4", "6", "8", "12", "16", "24", "?"],
  tshirt: ["XS", "S", "M", "L", "XL", "XXL", "?"],
} as const;

export type PointScalePreset = keyof typeof POINT_SCALE_PRESETS | "custom";

export const PRESET_LABELS: Record<PointScalePreset, string> = {
  fibonacci: `Fibonacci (${POINT_SCALE_PRESETS.fibonacci.join(", ")})`,
  powers: `Powers of 2 (${POINT_SCALE_PRESETS.powers.join(", ")})`,
  linear: `Linear (${POINT_SCALE_PRESETS.linear.join(", ")})`,
  hybrid: `Hybrid (${POINT_SCALE_PRESETS.hybrid.join(", ")})`,
  tshirt: `T-Shirt Sizes (${POINT_SCALE_PRESETS.tshirt.join(", ")})`,
  custom: "Custom",
};

export const DEFAULT_PRESET: PointScalePreset = "fibonacci";
export const DEFAULT_POINT_SCALE = POINT_SCALE_PRESETS.fibonacci;

/**
 * Get the point scale array for a given preset name.
 * Returns the default (fibonacci) if preset is invalid or custom.
 */
export function getPointScaleForPreset(preset: string | undefined): string[] {
  if (!preset || preset === "custom") {
    return [...DEFAULT_POINT_SCALE];
  }
  const presetScale = POINT_SCALE_PRESETS[preset as keyof typeof POINT_SCALE_PRESETS];
  return presetScale ? [...presetScale] : [...DEFAULT_POINT_SCALE];
}

/**
 * Validate that a value is in the given point scale.
 */
export function isValidPointValue(value: string, pointScale: string[]): boolean {
  return pointScale.includes(value);
}

/**
 * Get the effective point scale for a room, handling missing/default values.
 */
export function getEffectivePointScale(
  pointScale: string[] | undefined,
  pointScalePreset: string | undefined
): string[] {
  if (pointScale && pointScale.length > 0) {
    return pointScale;
  }
  return getPointScaleForPreset(pointScalePreset);
}
