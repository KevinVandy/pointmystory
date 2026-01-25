import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Settings, Globe, Lock, Copy, Check, Timer } from "lucide-react";

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

const TIMER_OPTIONS = [
  { value: "60", label: "1 minute" },
  { value: "120", label: "2 minutes" },
  { value: "180", label: "3 minutes" },
  { value: "300", label: "5 minutes" },
  { value: "600", label: "10 minutes" },
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
  const [timerDuration, setTimerDuration] = useState(
    String(currentTimerDuration || 180),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isAdmin) {
    return null;
  }

  const handlePresetChange = async (newPreset: string) => {
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

  const copyShareLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTimerDurationChange = async (newDuration: string) => {
    setTimerDuration(newDuration);
    setIsSaving(true);
    try {
      await updateSettings({
        roomId,
        timerDurationSeconds: parseInt(newDuration, 10),
      });
    } catch (error) {
      console.error("Failed to update timer duration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="size-4" />
          Room Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Duration */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            <Timer className="size-4" />
            Default Timer Duration
          </Label>
          <Select
            value={timerDuration}
            onValueChange={handleTimerDurationChange}
            disabled={isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select timer duration" />
            </SelectTrigger>
            <SelectContent>
              {TIMER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Visibility Toggle */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Room Visibility</Label>
          <div className="flex gap-2">
            <Button
              variant={visibility === "private" ? "default" : "outline"}
              size="sm"
              onClick={() => handleVisibilityChange("private")}
              disabled={isSaving}
              className="flex-1"
            >
              <Lock className="size-4 mr-1" />
              Private
            </Button>
            <Button
              variant={visibility === "public" ? "default" : "outline"}
              size="sm"
              onClick={() => handleVisibilityChange("public")}
              disabled={isSaving}
              className="flex-1"
            >
              <Globe className="size-4 mr-1" />
              Public
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {visibility === "public"
              ? "Anyone with the link can view (sign in required to vote)"
              : "Only signed-in users can access this room"}
          </p>
        </div>

        {/* Point Scale Preset */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Point Scale</Label>
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

        {/* Current Scale Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Current Scale</Label>
          <div className="flex flex-wrap gap-1">
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
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
