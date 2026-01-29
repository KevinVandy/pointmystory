import { useState } from "react";
import {
  VotingChoiceButton,
  DEFAULT_POINT_VALUES,
} from "@/components/VotingChoiceButton";

export function VotingPreview() {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  return (
    <div className="mb-16">
      <div className="flex flex-wrap justify-center gap-4">
        {DEFAULT_POINT_VALUES.map((value) => (
          <VotingChoiceButton
            key={value}
            value={value}
            isSelected={selectedValue === value}
            onClick={() =>
              setSelectedValue(selectedValue === value ? null : value)
            }
          />
        ))}
      </div>
    </div>
  );
}
