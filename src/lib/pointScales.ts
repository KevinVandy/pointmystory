// Re-export point scale presets from convex (single source of truth)
// This file adds client-specific exports while keeping convex/pointScales.ts as the source

import {
  POINT_SCALE_PRESETS,
  PRESET_LABELS,
  DEFAULT_PRESET as CONVEX_DEFAULT_PRESET,
  DEFAULT_POINT_SCALE,
  type PointScalePreset,
} from "../../convex/pointScales";

// Re-export everything from convex
export {
  POINT_SCALE_PRESETS,
  PRESET_LABELS,
  DEFAULT_POINT_SCALE,
  type PointScalePreset,
};

// Export DEFAULT_PRESET with the correct type (excluding "custom")
export const DEFAULT_PRESET: Exclude<PointScalePreset, "custom"> =
  CONVEX_DEFAULT_PRESET as Exclude<PointScalePreset, "custom">;

// Options for select dropdowns (without custom) - client-specific
export const PRESET_OPTIONS: Array<{
  value: Exclude<PointScalePreset, "custom">;
  label: string;
}> = [
    { value: "fibonacci", label: PRESET_LABELS.fibonacci },
    { value: "powers", label: PRESET_LABELS.powers },
    { value: "linear", label: PRESET_LABELS.linear },
    { value: "hybrid", label: PRESET_LABELS.hybrid },
    { value: "tshirt", label: PRESET_LABELS.tshirt },
  ];

// Options for select dropdowns (with custom) - client-specific
export const PRESET_OPTIONS_WITH_CUSTOM: Array<{
  value: PointScalePreset;
  label: string;
}> = [
    ...PRESET_OPTIONS,
    { value: "custom", label: PRESET_LABELS.custom },
  ];
