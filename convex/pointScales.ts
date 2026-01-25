// Point scale presets for planning poker

export const POINT_SCALE_PRESETS = {
  fibonacci: ["1", "2", "3", "5", "8", "13", "21", "?"],
  tshirt: ["XS", "S", "M", "L", "XL", "?"],
  powers: ["1", "2", "4", "8", "16", "32", "?"],
  linear: ["0.5", "1", "2", "4", "8", "12", "16", "24", "?"],
} as const;

export type PointScalePreset = keyof typeof POINT_SCALE_PRESETS | "custom";

export const PRESET_LABELS: Record<PointScalePreset, string> = {
  fibonacci: "Fibonacci (1, 2, 3, 5, 8, 13, 21, ?)",
  tshirt: "T-Shirt Sizes (XS, S, M, L, XL, ?)",
  powers: "Powers of 2 (1, 2, 4, 8, 16, 32, ?)",
  linear: "Linear (0.5, 1, 2, 4, 8, 12, 16, 24, ?)",
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
