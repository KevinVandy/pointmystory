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
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Users, Globe, Lock, Timer } from "lucide-react";

const PRESET_OPTIONS = [
  { value: "fibonacci", label: "Fibonacci (1, 2, 3, 5, 8, 13, 21, ?)" },
  { value: "tshirt", label: "T-Shirt Sizes (XS, S, M, L, XL, ?)" },
  { value: "powers", label: "Powers of 2 (1, 2, 4, 8, 16, 32, ?)" },
  { value: "linear", label: "Linear (0.5, 1, 2, 4, 6, 8, 12, 16, 24, ?)" },
];

const TIMER_OPTIONS = [
  { value: "60", label: "1 minute" },
  { value: "120", label: "2 minutes" },
  { value: "180", label: "3 minutes (default)" },
  { value: "300", label: "5 minutes" },
  { value: "600", label: "10 minutes" },
];

export function CreateRoomForm() {
  const [roomName, setRoomName] = useState("");
  const [pointScalePreset, setPointScalePreset] = useState("fibonacci");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [timerDuration, setTimerDuration] = useState("180");
  const [isCreating, setIsCreating] = useState(false);
  const createRoom = useMutation(api.rooms.create);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setIsCreating(true);
    try {
      const roomId = await createRoom({
        name: roomName.trim(),
        pointScalePreset,
        visibility,
        timerDurationSeconds: parseInt(timerDuration, 10),
      });
      navigate({ to: "/room/$roomId", params: { roomId } });
    } catch (error) {
      console.error("Failed to create room:", error);
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Create a Planning Room</CardTitle>
        <CardDescription>
          Start a new sprint planning poker session and invite your team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Name */}
          <div className="space-y-2">
            <Label htmlFor="roomName">Room Name</Label>
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
              onValueChange={setPointScalePreset}
              disabled={isCreating}
            >
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

          {/* Timer Duration */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Timer className="w-4 h-4" />
              Default Timer Duration
            </Label>
            <Select
              value={timerDuration}
              onValueChange={setTimerDuration}
              disabled={isCreating}
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
              {visibility === "public"
                ? "Anyone with the link can view (sign in required to vote)"
                : "Only signed-in users can access this room"}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!roomName.trim() || isCreating}
          >
            {isCreating ? "Creating..." : "Create Room"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
