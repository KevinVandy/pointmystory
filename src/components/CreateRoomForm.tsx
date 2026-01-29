import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  useOrganization,
  useOrganizationList,
  OrganizationSwitcher,
} from "@clerk/tanstack-react-start";
import { Users, Globe, Lock, Timer, Building2 } from "lucide-react";
import {
  PRESET_OPTIONS_WITH_CUSTOM,
  DEFAULT_PRESET,
  PointScalePreset,
} from "@/lib/pointScales";

const formatTimerDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export function CreateRoomForm() {
  const [roomName, setRoomName] = useState("");
  const [pointScalePreset, setPointScalePreset] =
    useState<PointScalePreset>(DEFAULT_PRESET);
  const [customScale, setCustomScale] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [timerDuration, setTimerDuration] = useState(180);
  const [autoStartTimer, setAutoStartTimer] = useState(false);
  const [autoRevealVotes, setAutoRevealVotes] = useState(true);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);
  const createRoom = useMutation(api.rooms.create);
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const { userMemberships, isLoaded: orgListLoaded } = useOrganizationList();

  // Sync selected organization with current active organization from switcher
  useEffect(() => {
    if (organization) {
      setSelectedOrganizationId(organization.id);
    } else {
      // If no organization is active, default to personal room
      setSelectedOrganizationId(null);
    }
  }, [organization]);

  const handlePresetChange = (newPreset: PointScalePreset | null) => {
    if (newPreset !== null) {
      setPointScalePreset(newPreset);
    }
  };

  const handleOrganizationChange = (value: string | null) => {
    const orgId = value === "personal" || value === null ? null : value;
    setSelectedOrganizationId(orgId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsCreating(true);
    try {
      // Parse custom scale if preset is custom
      let pointScale: string[] | undefined;
      if (pointScalePreset === "custom" && customScale.trim()) {
        pointScale = customScale
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v.length > 0);

        if (pointScale.length === 0) {
          // If custom is selected but no values provided, don't create room
          setIsCreating(false);
          return;
        }
      }

      const roomId = await createRoom({
        name: roomName.trim() || undefined,
        pointScalePreset,
        pointScale,
        visibility,
        timerDurationSeconds: timerDuration,
        autoStartTimer,
        autoRevealVotes,
        organizationId: selectedOrganizationId || undefined,
      });
      navigate({ to: "/room/$roomId", params: { roomId } });
    } catch (error) {
      console.error("Failed to create room:", error);
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Create a Planning Room</CardTitle>
        <CardDescription>
          Start a new sprint story pointing session and invite your team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Name */}
          <div className="space-y-2">
            <Label htmlFor="roomName">Room Name (Optional)</Label>
            <Input
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., Sprint 42 Planning"
              disabled={isCreating}
            />
          </div>

          {/* Point Scale Preset */}
          <div className="space-y-2">
            <Label>Point Scale</Label>
            <Select
              value={pointScalePreset}
              onValueChange={handlePresetChange}
              disabled={isCreating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a point scale">
                  {PRESET_OPTIONS_WITH_CUSTOM.find(
                    (opt) => opt.value === pointScalePreset,
                  )?.label || pointScalePreset}
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

          {/* Custom Scale Input */}
          {pointScalePreset === "custom" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Custom Values</Label>
              <Input
                value={customScale}
                onChange={(e) => setCustomScale(e.target.value)}
                placeholder="1, 2, 3, 5, 8, ?"
                disabled={isCreating}
              />
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
              onCheckedChange={(checked) =>
                setAutoRevealVotes(checked === true)
              }
              disabled={isCreating}
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
                onCheckedChange={(checked) =>
                  setAutoStartTimer(checked === true)
                }
                disabled={isCreating}
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
                setTimerDuration(value);
              }}
              disabled={isCreating}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTimerDuration(15)}</span>
              <span>{formatTimerDuration(600)}</span>
            </div>
          </div>

          {/* Organization Selection */}
          <div className="space-y-2">
            <Label>Organization</Label>
            <div className="space-y-2">
              <OrganizationSwitcher
                appearance={{
                  elements: {
                    organizationSwitcherTrigger:
                      "w-full justify-between px-3 py-2",
                  },
                }}
              />
              {orgListLoaded &&
                userMemberships &&
                userMemberships.data &&
                userMemberships.data.length > 0 && (
                  <Select
                    value={selectedOrganizationId || "personal"}
                    onValueChange={handleOrganizationChange}
                    disabled={isCreating}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Personal Room
                        </div>
                      </SelectItem>
                      {userMemberships.data.map(
                        (membership: {
                          organization: { id: string; name: string };
                        }) => (
                          <SelectItem
                            key={membership.organization.id}
                            value={membership.organization.id}
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              {membership.organization.name}
                            </div>
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedOrganizationId
                ? "Room will be scoped to this organization"
                : "Personal room (not scoped to any organization)"}
            </p>
          </div>

          {/* Room Visibility */}
          <div className="space-y-2">
            <Label>Room Visibility</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={visibility === "private" ? "default" : "outline"}
                size="sm"
                onClick={() => setVisibility("private")}
                disabled={isCreating}
                className="flex-1"
              >
                <Lock className="w-4 h-4 mr-1" />
                Private
              </Button>
              <Button
                type="button"
                variant={visibility === "public" ? "default" : "outline"}
                size="sm"
                onClick={() => setVisibility("public")}
                disabled={isCreating}
                className="flex-1"
              >
                <Globe className="w-4 h-4 mr-1" />
                Public
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedOrganizationId
                ? visibility === "public"
                  ? "Anyone with the link can view (sign in required to vote)"
                  : "Only members of this organization can access this room"
                : visibility === "public"
                  ? "Anyone with the link can view (sign in required to vote)"
                  : "Only signed-in users can access this room"}
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Room"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
