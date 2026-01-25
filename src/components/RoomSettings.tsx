import { useState } from "react";
import * as React from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import { Settings, Globe, Lock, Copy, Timer } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "./ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

// Point scale presets - should match convex/pointScales.ts
const POINT_SCALE_PRESETS = {
  fibonacci: ["1", "2", "3", "5", "8", "13", "21", "?"],
  tshirt: ["XS", "S", "M", "L", "XL", "?"],
  powers: ["1", "2", "4", "8", "16", "32", "?"],
  linear: ["0.5", "1", "2", "4", "8", "12", "16", "24", "?"],
} as const;

const PRESET_OPTIONS = [
  { value: "fibonacci", label: "Fibonacci (1, 2, 3, 5, 8, 13, 21, ?)" },
  { value: "tshirt", label: "T-Shirt Sizes (XS, S, M, L, XL, ?)" },
  { value: "powers", label: "Powers of 2 (1, 2, 4, 8, 16, 32, ?)" },
  { value: "linear", label: "Linear (0.5, 1, 2, 4, 8, 12, 16, 24, ?)" },
  { value: "custom", label: "Custom" },
];

interface RoomSettingsProps {
  roomId: Id<"rooms">;
  currentVisibility: "public" | "private";
  currentPreset: string;
  currentPointScale: string[];
  currentTimerDuration: number;
  isAdmin: boolean;
}

export function RoomSettings({
  roomId,
  currentVisibility,
  currentPreset,
  currentPointScale,
  currentTimerDuration,
  isAdmin,
}: RoomSettingsProps) {
  const updateSettings = useMutation(api.rooms.updateSettings);

  const [visibility, setVisibility] = useState(currentVisibility);
  const [preset, setPreset] = useState(currentPreset || "fibonacci");
  const [customScale, setCustomScale] = useState(
    currentPreset === "custom" ? currentPointScale.join(", ") : "",
  );
  const [timerDuration, setTimerDuration] = useState(() => {
    const duration = currentTimerDuration || 180;
    // Ensure duration is within valid range
    if (duration < 15) return 15;
    if (duration > 600) return 600;
    // Round to nearest 15-second increment
    return Math.round(duration / 15) * 15;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPublicConfirm, setShowPublicConfirm] = useState(false);

  if (!isAdmin) {
    return null;
  }

  const handlePresetChange = async (newPreset: string | null) => {
    if (!newPreset) return;

    setPreset(newPreset);

    if (newPreset !== "custom") {
      setIsSaving(true);
      try {
        await updateSettings({
          roomId,
          pointScalePreset: newPreset,
        });
      } catch (error) {
        console.error("Failed to update point scale:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCustomScaleSave = async () => {
    const values = customScale
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (values.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings({
        roomId,
        pointScalePreset: "custom",
        pointScale: values,
      });
    } catch (error) {
      console.error("Failed to save custom scale:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVisibilityChange = async (
    newVisibility: "public" | "private",
  ) => {
    // If changing to public, show confirmation dialog
    if (newVisibility === "public" && visibility === "private") {
      setShowPublicConfirm(true);
      return;
    }

    // Otherwise, update immediately
    setVisibility(newVisibility);
    setIsSaving(true);
    try {
      await updateSettings({
        roomId,
        visibility: newVisibility,
      });
    } catch (error) {
      console.error("Failed to update visibility:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmMakePublic = async () => {
    setShowPublicConfirm(false);
    setVisibility("public");
    setIsSaving(true);
    try {
      await updateSettings({
        roomId,
        visibility: "public",
      });
    } catch (error) {
      console.error("Failed to update visibility:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyShareLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  // Debounce timer for saving
  const saveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleTimerDurationChange = (newDuration: number) => {
    // Update local state immediately for responsive UI
    setTimerDuration(newDuration);

    // Clear existing timeout
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Debounce the save operation
    saveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateSettings({
          roomId,
          timerDurationSeconds: newDuration,
        });
      } catch (error) {
        console.error("Failed to update timer duration:", error);
        toast.error("Failed to update timer duration");
        // Revert on error
        setTimerDuration(currentTimerDuration || 180);
      } finally {
        setIsSaving(false);
      }
    }, 500);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const formatTimerDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <Accordion className="w-full">
      <AccordionItem value="room-settings">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <Settings className="size-4" />
            Room Settings
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
        {/* Timer Duration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Timer className="size-4" />
              Default Timer Duration
            </Label>
            <span className="text-sm text-muted-foreground">
              {formatTimerDuration(timerDuration)}
            </span>
          </div>
          <Slider
            min={15}
            max={600}
            step={15}
            value={[timerDuration]}
            onValueChange={(newValue) => {
              // BaseUI slider passes the value directly as a number
              const value =
                typeof newValue === "number"
                  ? newValue
                  : Array.isArray(newValue)
                    ? newValue[0]
                    : timerDuration;
              handleTimerDurationChange(value);
            }}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTimerDuration(15)}</span>
            <span>{formatTimerDuration(600)}</span>
          </div>
        </div>

        {/* Point Scale Preset */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Point Scale</Label>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a point scale" />
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
            {/* Current Scale Preview */}
            <div className="flex flex-wrap gap-1 items-center pt-2">
              {(preset === "custom" && customScale
                ? customScale
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean)
                : POINT_SCALE_PRESETS[
                    preset as keyof typeof POINT_SCALE_PRESETS
                  ] || currentPointScale
              ).map((value, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Scale Input */}
        {preset === "custom" && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Values</Label>
            <div className="flex gap-2">
              <Input
                value={customScale}
                onChange={(e) => setCustomScale(e.target.value)}
                placeholder="1, 2, 3, 5, 8, ?"
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleCustomScaleSave}
                disabled={isSaving || !customScale.trim()}
              >
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter comma-separated values
            </p>
          </div>
        )}

        <Separator />

        {/* Visibility Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              {visibility === "public" ? (
                <Globe className="size-4" />
              ) : (
                <Lock className="size-4" />
              )}
              Room Visibility
            </Label>
            <Switch
              checked={visibility === "public"}
              onCheckedChange={(checked) =>
                handleVisibilityChange(checked ? "public" : "private")
              }
              disabled={isSaving}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {visibility === "public"
              ? "Anyone with the link can view (sign in required to vote)"
              : "Only signed-in users can access this room"}
          </p>
        </div>

        {/* Confirm Public Dialog */}
        <AlertDialog
          open={showPublicConfirm}
          onOpenChange={setShowPublicConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Make Room Public?</AlertDialogTitle>
              <AlertDialogDescription>
                Making this room public means anyone with the link can view it
                (though they'll need to sign in to vote). Are you sure you want
                to make this room public?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmMakePublic}>
                Make Public
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Share Link */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Share Link</Label>
          <div className="flex gap-2">
            <Input
              value={typeof window !== "undefined" ? window.location.href : ""}
              readOnly
              className="flex-1 text-xs"
            />
            <Button size="sm" variant="outline" onClick={copyShareLink}>
              <Copy className="size-4" />
            </Button>
          </div>
        </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
