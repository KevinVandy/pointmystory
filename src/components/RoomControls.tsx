import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, RefreshCw, Copy, Check, Timer, TimerOff } from "lucide-react";
import { useState } from "react";
import { VotingTimer } from "./VotingTimer";

interface RoomControlsProps {
  roomName: string;
  currentStory: string | undefined;
  isRevealed: boolean;
  isHost: boolean;
  hasVotes: boolean;
  onUpdateStory: (story: string) => void;
  onReveal: () => void;
  onReset: () => void;
  timerEndsAt?: number | null;
  timerStartedAt?: number | null;
  onStartTimer?: () => void;
  onStopTimer?: () => void;
}

export function RoomControls({
  roomName,
  currentStory,
  isRevealed,
  isHost,
  hasVotes,
  onUpdateStory,
  onReveal,
  onReset,
  timerEndsAt,
  timerStartedAt,
  onStartTimer,
  onStopTimer,
}: RoomControlsProps) {
  const [storyInput, setStoryInput] = useState(currentStory || "");
  const [copied, setCopied] = useState(false);

  const handleStorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (storyInput.trim()) {
      onUpdateStory(storyInput.trim());
    }
  };

  const copyRoomLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTimerRunning = timerEndsAt && timerStartedAt;

  return (
    <div className="space-y-4">
      {/* Room Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{roomName}</h1>
          {currentStory && (
            <p className="text-muted-foreground mt-1">
              Voting on: <span className="font-medium">{currentStory}</span>
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

        <Button
          variant="outline"
          size="sm"
          onClick={copyRoomLink}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Link
            </>
          )}
        </Button>
      </div>

      {/* Host Controls */}
      {isHost && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Story Input */}
          <form onSubmit={handleStorySubmit} className="flex-1 flex gap-2">
            <Input
              value={storyInput}
              onChange={(e) => setStoryInput(e.target.value)}
              placeholder="Enter story/ticket to vote on..."
              className="flex-1"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={!storyInput.trim()}
            >
              Set Story
            </Button>
          </form>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
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
              <Button onClick={onReset} variant="secondary" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                New Round
              </Button>
            )}
          </div>
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
