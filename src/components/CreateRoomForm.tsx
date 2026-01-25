import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";

export function CreateRoomForm() {
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const createRoom = useMutation(api.rooms.create);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setIsCreating(true);
    try {
      const roomId = await createRoom({ name: roomName.trim() });
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
          <Input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g., Sprint 42 Planning"
            disabled={isCreating}
          />
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
