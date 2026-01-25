import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, RefreshCw, Copy, Check } from "lucide-react";
import { useState } from "react";

interface RoomControlsProps {
  roomName: string;
  currentStory: string | undefined;
  isRevealed: boolean;
  isHost: boolean;
  hasVotes: boolean;
  onUpdateStory: (story: string) => void;
  onReveal: () => void;
  onReset: () => void;
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

  return (
    <div className="space-y-4">
      {/* Room Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{roomName}</h1>
          {currentStory && (
            <p className="text-muted-foreground mt-1">
              Voting on: <span className="font-medium">{currentStory}</span>
            </p>
          )}
        </div>
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
            <Button type="submit" variant="secondary" disabled={!storyInput.trim()}>
              Set Story
            </Button>
          </form>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isRevealed ? (
              <Button
                onClick={onReveal}
                disabled={!hasVotes}
                className="gap-2"
              >
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
