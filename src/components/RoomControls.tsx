import { Button } from "@/components/ui/button";
import { Eye, Share2, Timer, TimerOff, LogOut, Lock, Unlock, FileText } from "lucide-react";
import { VotingTimer } from "./VotingTimer";
import { NewRoundDialog } from "./NewRoundDialog";
import type { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
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
  hasVotes: boolean;
  onReveal: () => void;
  timerEndsAt?: number | null;
  timerStartedAt?: number | null;
  onStartTimer?: () => void;
  onStopTimer?: () => void;
  roomStatus?: "open" | "closed";
  isAdmin?: boolean;
}

export function RoomControls({
  roomId,
  roomName,
  currentStory,
  currentRoundName,
  currentTicketNumber,
  isRevealed,
  isHost,
  hasVotes,
  onReveal,
  timerEndsAt,
  timerStartedAt,
  onStartTimer,
  onStopTimer,
  roomStatus = "open",
  isAdmin = false,
}: RoomControlsProps) {
  const navigate = useNavigate();
  const leaveRoom = useMutation(api.participants.leave);
  const closeRoom = useMutation(api.rooms.closeRoom);
  const reopenRoom = useMutation(api.rooms.reopenRoom);

  // Display the current round info
  const displayStory = currentStory || currentRoundName || currentTicketNumber;

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
      await closeRoom({ roomId });
      toast.success("Room closed");
    } catch (error: any) {
      toast.error(error.message || "Failed to close room");
    }
  };

  const handleReopenRoom = async () => {
    try {
      await reopenRoom({ roomId });
      toast.success("Room reopened");
    } catch (error: any) {
      toast.error(error.message || "Failed to reopen room");
    }
  };

  const isTimerRunning = timerEndsAt && timerStartedAt;
  const isClosed = roomStatus === "closed";

  return (
    <div className="space-y-4">
      {/* Room Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{roomName}</h1>
          {displayStory && (
            <p className="text-muted-foreground mt-1">
              Voting on: <span className="font-medium">{displayStory}</span>
              {currentTicketNumber && currentTicketNumber !== displayStory && (
                <span className="ml-2 font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                  {currentTicketNumber}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Timer Display */}
        {isTimerRunning && (
          <VotingTimer
            timerEndsAt={timerEndsAt}
            timerStartedAt={timerStartedAt}
          />
        )}

        <div className="flex gap-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReopenRoom}
                  className="gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  Reopen Room
                </Button>
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

      {/* Host Controls */}
      {isHost && !isClosed && (
        <div className="flex gap-2 flex-wrap">
          {/* Set Story Button - only show before votes are revealed */}
          {!isRevealed && (
            <NewRoundDialog
              roomId={roomId}
              mode="setStory"
              initialName={currentRoundName || currentStory}
              initialTicketNumber={currentTicketNumber}
              trigger={
                <Button variant="outline" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Set Story
                </Button>
              }
              onStoryUpdated={() => {
                // Story will be updated via the mutation, no need for callback
              }}
            />
          )}

          {/* Timer Controls */}
          {!isRevealed && (
            <>
              {isTimerRunning ? (
                <Button
                  variant="outline"
                  onClick={onStopTimer}
                  className="gap-2"
                >
                  <TimerOff className="w-4 h-4" />
                  Stop Timer
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={onStartTimer}
                  className="gap-2"
                >
                  <Timer className="w-4 h-4" />
                  Start Timer
                </Button>
              )}
            </>
          )}

          {!isRevealed ? (
            <Button onClick={onReveal} disabled={!hasVotes} className="gap-2">
              <Eye className="w-4 h-4" />
              Reveal Votes
            </Button>
          ) : (
            <NewRoundDialog roomId={roomId} />
          )}
        </div>
      )}

      {/* Non-host message */}
      {!isHost && !currentStory && (
        <p className="text-muted-foreground text-sm">
          Waiting for the host to set a story to vote on...
        </p>
      )}
    </div>
  );
}
