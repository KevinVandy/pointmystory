import { Button } from "@/components/ui/button";
import { Share2, LogOut, Lock, Unlock } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import { ParticipantTypeToggle } from "./ParticipantTypeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RoomControlsProps {
  roomId: Id<"rooms">;
  roomName: string;
  currentStory: string | undefined;
  currentRoundName?: string;
  currentTicketNumber?: string;
  isRevealed: boolean;
  isHost: boolean;
  roomStatus?: "open" | "closed";
  isAdmin?: boolean;
  isDemoRoom?: boolean;
  isAuthenticated?: boolean;
  demoSessionId?: string;
  isParticipant?: boolean;
  participantType?: "voter" | "observer";
}

export function RoomControls({
  roomId,
  roomName,
  currentStory,
  currentRoundName: _currentRoundName,
  currentTicketNumber: _currentTicketNumber,
  isRevealed: _isRevealed,
  isHost,
  roomStatus = "open",
  isAdmin = false,
  isDemoRoom = false,
  isAuthenticated = false,
  demoSessionId,
  isParticipant = false,
  participantType,
}: RoomControlsProps) {
  const navigate = useNavigate();
  const leaveRoom = useMutation(api.participants.leave);
  const closeRoom = useMutation(api.rooms.closeRoom);
  const reopenRoom = useMutation(api.rooms.reopenRoom);

  const copyRoomLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Room link copied");
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom({ roomId });
      toast.success("Left room");
      navigate({ to: "/" });
    } catch (error: any) {
      toast.error(error.message || "Failed to leave room");
    }
  };

  const handleCloseRoom = async () => {
    try {
      await closeRoom({ roomId, demoSessionId });
      toast.success("Room closed");
    } catch (error: any) {
      toast.error(error.message || "Failed to close room");
    }
  };

  const handleReopenRoom = async () => {
    try {
      await reopenRoom({ roomId, demoSessionId });
      toast.success("Room reopened");
    } catch (error: any) {
      toast.error(error.message || "Failed to reopen room");
    }
  };

  const isClosed = roomStatus === "closed";

  return (
    <div className="space-y-4">
      {/* Room Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Room name - left */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{roomName}</h1>
        </div>

        {/* Participant type toggle - center */}
        <div className="flex items-center justify-center flex-1">
          {isAuthenticated && isParticipant && participantType && (
            <ParticipantTypeToggle roomId={roomId} currentType={participantType} />
          )}
        </div>

        {/* Action buttons - right */}
        <div className="flex gap-2 flex-1 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={copyRoomLink}
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Link
          </Button>
          {!isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveRoom}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Leave Room
            </Button>
          )}
          {isAdmin && (
            <>
              {isClosed ? (
                // Hide reopen button for demo rooms when user is not signed in
                !(isDemoRoom && !isAuthenticated) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReopenRoom}
                    className="gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    Reopen Room
                  </Button>
                )
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="outline" size="sm" className="gap-2">
                        <Lock className="w-4 h-4" />
                        Close Room
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Close Room</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to close "{roomName}"? Once
                        closed, participants will not be able to vote or start
                        new rounds, but they can still view the room. You can
                        reopen it at any time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCloseRoom}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Close Room
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>
      </div>

      {/* Non-host message */}
      {!isHost && !currentStory && (
        <p className="text-muted-foreground text-sm">
          Waiting for the host to set a story to vote on...
        </p>
      )}
    </div>
  );
}
