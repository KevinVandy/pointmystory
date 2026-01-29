import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Edit2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { roundToNearestPointScale } from "./participantUtils";

interface EditableFinalNumberProps {
  roundId: Id<"rounds">;
  averageScore?: number | null;
  medianScore?: number | null;
  finalScore?: string | null;
  pointScale?: string[];
  pointScalePreset?: string;
  isAdmin: boolean;
  demoSessionId?: string;
}

export function EditableFinalNumber({
  roundId,
  averageScore,
  medianScore,
  finalScore,
  pointScale,
  pointScalePreset,
  isAdmin,
  demoSessionId,
}: EditableFinalNumberProps) {
  const [open, setOpen] = useState(false);
  const setFinalScore = useMutation(api.rounds.setFinalScore);

  // Calculate default value from average or median score
  const defaultScore = React.useMemo(() => {
    if (!pointScale || pointScale.length === 0) return null;
    const scoreToUse = averageScore ?? medianScore;
    return roundToNearestPointScale(scoreToUse, pointScale, pointScalePreset);
  }, [averageScore, medianScore, pointScale, pointScalePreset]);

  // Use finalScore if set, otherwise use default
  const displayValue = finalScore || defaultScore || "-";
  const [value, setValue] = useState((finalScore || defaultScore || "").toString());

  // Update local value when round changes
  useEffect(() => {
    setValue((finalScore || defaultScore || "").toString());
  }, [finalScore, defaultScore]);

  const handleSave = async (scoreValue?: string) => {
    // Use provided value, trimmed value, or default
    const finalValue = (scoreValue || value.trim() || (defaultScore || "").toString()).toString();
    if (finalValue) {
      try {
        await setFinalScore({
          roundId,
          finalScore: finalValue,
          demoSessionId,
        });
        setOpen(false);
      } catch (error) {
        console.error("Failed to set final score:", error);
      }
    } else {
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setValue((finalScore || defaultScore || "").toString());
    setOpen(false);
  };

  return (
    <div className="py-4 border-t">
      <div className="relative inline-block w-full group">
        <div
          className={cn(
            "text-6xl font-bold text-center mt-2",
            finalScore ? "text-primary" : "text-muted-foreground",
          )}
        >
          {displayValue}
        </div>
        {isAdmin && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className="absolute top-2 right-0 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 opacity-0 group-hover:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0">
              <Edit2 className="h-4 w-4" />
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Final Score</label>
                  <div className="flex flex-wrap gap-2">
                    {pointScale && pointScale.length > 0 ? (
                      pointScale.map((scaleValue) => (
                        <Button
                          key={scaleValue}
                          variant={value === scaleValue ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setValue(scaleValue);
                            handleSave(scaleValue);
                          }}
                          className="min-w-12"
                        >
                          {scaleValue}
                        </Button>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No point scale available
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
