import { useState } from "react";
import { VotingChoiceButton } from "@/components/VotingChoiceButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  POINT_SCALE_PRESETS,
  PRESET_OPTIONS,
  DEFAULT_PRESET,
  type PointScalePreset,
} from "@/lib/pointScales";

export function VotingPreview() {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] =
    useState<Exclude<PointScalePreset, "custom">>(DEFAULT_PRESET);

  const currentPointScale = POINT_SCALE_PRESETS[selectedPreset];
  const currentOption = PRESET_OPTIONS.find(
    (opt) => opt.value === selectedPreset,
  );

  const handlePresetChange = (
    preset: Exclude<PointScalePreset, "custom"> | null,
  ) => {
    if (preset) {
      setSelectedPreset(preset);
      // Reset selected value when switching presets since it might not exist in new scale
      setSelectedValue(null);
    }
  };

  return (
    <div className="mb-16">
      <div className="flex flex-wrap justify-center gap-4 mb-10">
        {currentPointScale.map((value, index) => (
          <VotingChoiceButton
            key={`${selectedPreset}-${value}-${index}`}
            value={value}
            index={index}
            isSelected={selectedValue === value}
            onClick={() =>
              setSelectedValue(selectedValue === value ? null : value)
            }
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-4">
        <Select value={selectedPreset} onValueChange={handlePresetChange}>
          <SelectTrigger
            id="point-scale-select"
            aria-label="Point Scale"
            className="w-[300px]"
          >
            <SelectValue>{currentOption?.label || selectedPreset}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PRESET_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
