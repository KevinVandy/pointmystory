import { useState, useEffect } from "react";
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
import { Checkbox } from "./ui/checkbox";
import { Slider } from "./ui/slider";
import { Settings, Globe, Lock, Copy, Timer, Building2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  useOrganization,
  useOrganizationList,
} from "@clerk/tanstack-react-start";
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
import { PRESET_OPTIONS_WITH_CUSTOM } from "@/lib/pointScales";

interface RoomSettingsProps {
  roomId: Id<"rooms">;
  currentRoomName: string;
  currentVisibility: "public" | "private";
  currentPreset: string;
  currentPointScale: string[];
  currentTimerDuration: number;
  currentAutoStartTimer?: boolean;
  currentAutoRevealVotes?: boolean;
  isAdmin: boolean;
  demoSessionId?: string;
  isDemoRoom?: boolean;
  organizationId?: string | null;
}

export function RoomSettings({
  roomId,
  currentRoomName,
  currentVisibility,
  currentPreset,
  currentPointScale,
  currentTimerDuration,
  currentAutoStartTimer = false,
  currentAutoRevealVotes = true,
  isAdmin,
  demoSessionId,
  isDemoRoom = false,
  organizationId,
}: RoomSettingsProps) {
  const updateSettings = useMutation(api.rooms.updateSettings);
  const { organization } = useOrganization();
  const { userMemberships, isLoaded: orgListLoaded } = useOrganizationList();
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [organizationImageUrl, setOrganizationImageUrl] = useState<
    string | null
  >(null);

  // Look up organization name and image when data is available
  useEffect(() => {
    if (!organizationId) {
      setOrganizationName(null);
      setOrganizationImageUrl(null);
      return;
    }

    // First check if it matches the current active organization
    if (organization?.id === organizationId) {
      setOrganizationName(organization.name);
      setOrganizationImageUrl(organization.imageUrl || null);
      return;
    }

    // Otherwise, look it up from the user's organization memberships
    if (orgListLoaded && userMemberships?.data) {
      const membership = userMemberships.data.find(
        (m: {
          organization: { id: string; name: string; imageUrl?: string };
        }) => m.organization.id === organizationId,
      );
      if (membership) {
        setOrganizationName(membership.organization.name || null);
        setOrganizationImageUrl(membership.organization.imageUrl || null);
      } else {
        setOrganizationName(null);
        setOrganizationImageUrl(null);
      }
    }
  }, [
    organizationId,
    organization?.id,
    organization?.name,
    organization?.imageUrl,
    orgListLoaded,
    userMemberships?.data,
  ]);

  const [roomName, setRoomName] = useState(currentRoomName || "");
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
  const [autoStartTimer, setAutoStartTimer] = useState(currentAutoStartTimer);
  const [autoRevealVotes, setAutoRevealVotes] = useState(
    currentAutoRevealVotes,
  );
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
          demoSessionId,
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
        demoSessionId,
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
        demoSessionId,
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

  // Sync roomName when prop changes
  useEffect(() => {
    setRoomName(currentRoomName || "");
  }, [currentRoomName]);

  // Debounce timer for saving
  const saveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const roomNameSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleRoomNameChange = (newName: string) => {
    // Update local state immediately for responsive UI
    setRoomName(newName);

    // Clear existing timeout
    if (roomNameSaveTimerRef.current) {
      clearTimeout(roomNameSaveTimerRef.current);
    }

    // Debounce the save operation
    roomNameSaveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateSettings({
          roomId,
          name: newName.trim() || undefined,
          demoSessionId,
        });
        toast.success("Room name updated");
      } catch (error) {
        console.error("Failed to update room name:", error);
        toast.error("Failed to update room name");
        // Revert on error
        setRoomName(currentRoomName || "");
      } finally {
        setIsSaving(false);
      }
    }, 500);
  };

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
          demoSessionId,
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

  const handleAutoStartTimerChange = async (checked: boolean) => {
    setAutoStartTimer(checked);
    setIsSaving(true);
    try {
      await updateSettings({
        roomId,
        autoStartTimer: checked,
        demoSessionId,
      });
      toast.success("Auto-start timer setting updated");
    } catch (error) {
      console.error("Failed to update auto-start timer:", error);
      toast.error("Failed to update auto-start timer");
      // Revert on error
      setAutoStartTimer(currentAutoStartTimer ?? false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoRevealVotesChange = async (checked: boolean) => {
    setAutoRevealVotes(checked);
    setIsSaving(true);
    try {
      await updateSettings({
        roomId,
        autoRevealVotes: checked,
        demoSessionId,
      });
      toast.success("Auto-reveal setting updated");
    } catch (error) {
      console.error("Failed to update auto-reveal setting:", error);
      toast.error("Failed to update auto-reveal setting");
      // Revert on error
      setAutoRevealVotes(currentAutoRevealVotes ?? true);
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (roomNameSaveTimerRef.current) {
        clearTimeout(roomNameSaveTimerRef.current);
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
          <div className="space-y-6 py-4">
            {/* Room Name */}
            <div className="space-y-2">
              <Label htmlFor="roomName">Room Name</Label>
              <Input
                id="roomName"
                value={roomName}
                onChange={(e) => handleRoomNameChange(e.target.value)}
                placeholder="e.g., Sprint 42 Planning"
                disabled={isSaving}
              />
            </div>

            {/* Point Scale Preset */}
            <div className="space-y-2">
              <Label>Point Scale</Label>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <Select
                    value={preset}
                    onValueChange={handlePresetChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a point scale">
                        {PRESET_OPTIONS_WITH_CUSTOM.find(
                          (opt) => opt.value === preset,
                        )?.label || preset}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_OPTIONS_WITH_CUSTOM.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    disabled={isSaving}
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

            {/* Auto-reveal Votes Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoRevealVotes"
                checked={autoRevealVotes}
                onCheckedChange={handleAutoRevealVotesChange}
                disabled={isSaving}
              />
              <Label
                htmlFor="autoRevealVotes"
                className="text-sm font-medium cursor-pointer"
              >
                Auto Reveal Votes When Everyone Has Voted
              </Label>
            </div>

            {/* Timer Duration */}
            <div className="space-y-3">
              {/* Auto-start Timer Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoStartTimer"
                  checked={autoStartTimer}
                  onCheckedChange={handleAutoStartTimerChange}
                  disabled={isSaving}
                />
                <Label
                  htmlFor="autoStartTimer"
                  className="text-sm font-medium cursor-pointer"
                >
                  Auto-start timer when starting a new round
                </Label>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Timer className="w-4 h-4" />
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
                  const value =
                    typeof newValue === "number"
                      ? newValue
                      : Array.isArray(newValue)
                        ? newValue[0]
                        : timerDuration;
                  handleTimerDurationChange(value);
                }}
                disabled={isSaving}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTimerDuration(15)}</span>
                <span>{formatTimerDuration(600)}</span>
              </div>
            </div>

            {/* Room Visibility */}
            <div className="space-y-2">
              <Label>Room Visibility</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={visibility === "private" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleVisibilityChange("private")}
                  disabled={isSaving || isDemoRoom}
                  className="flex-1"
                >
                  <Lock className="w-4 h-4 mr-1" />
                  Private
                </Button>
                <Button
                  type="button"
                  variant={visibility === "public" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleVisibilityChange("public")}
                  disabled={isSaving || isDemoRoom}
                  className="flex-1"
                >
                  <Globe className="w-4 h-4 mr-1" />
                  Public
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isDemoRoom
                  ? "Demo rooms are always public"
                  : organizationId
                    ? visibility === "public"
                      ? "Anyone with the link can view (sign in required to vote)"
                      : "Only members of this organization can access this room"
                    : visibility === "public"
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
                    Making this room public means anyone with the link can view
                    it (though they'll need to sign in to vote). Are you sure
                    you want to make this room public?
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

            <Separator />

            {/* Share Link */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Share Link</Label>
              <div className="flex gap-2">
                <Input
                  value={
                    typeof window !== "undefined" ? window.location.href : ""
                  }
                  readOnly
                  className="flex-1 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyShareLink}
                  disabled={isDemoRoom}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>

            {/* Organization Indicator - at the bottom */}
            {organizationId && (
              <>
                <Separator />
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                  {organizationImageUrl ? (
                    <Avatar size="sm">
                      <AvatarImage
                        src={organizationImageUrl}
                        alt={organizationName || "Organization"}
                      />
                      <AvatarFallback>
                        <Building2 className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Building2 className="size-4 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {organizationName || `Organization (${organizationId})`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This room belongs to an organization
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
