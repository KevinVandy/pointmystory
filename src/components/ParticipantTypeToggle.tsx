import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Eye, Vote } from "lucide-react";

interface ParticipantTypeToggleProps {
  roomId: Id<"rooms">;
  currentType: "voter" | "observer";
  disabled?: boolean;
}

export function ParticipantTypeToggle({
  roomId,
  currentType,
  disabled = false,
}: ParticipantTypeToggleProps) {
  const updateParticipantType = useMutation(
    api.participants.updateParticipantType,
  );

  const handleToggle = async (newType: "voter" | "observer") => {
    if (newType === currentType) return;

    try {
      await updateParticipantType({
        roomId,
        participantType: newType,
      });
    } catch (error) {
      console.error("Failed to update participant type:", error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Mode:</span>
      <div className="flex rounded-lg border border-border overflow-hidden">
        <Button
          variant={currentType === "voter" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleToggle("voter")}
          disabled={disabled}
          className="rounded-none border-0"
        >
          <Vote className="size-4 mr-1" />
          Voter
        </Button>
        <Button
          variant={currentType === "observer" ? "default" : "ghost"}
          size="sm"
          onClick={() => handleToggle("observer")}
          disabled={disabled}
          className="rounded-none border-0"
        >
          <Eye className="size-4 mr-1" />
          Observer
        </Button>
      </div>
    </div>
  );
}
