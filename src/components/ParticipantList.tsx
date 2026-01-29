import { Eye, TimerOff, Timer, Clock, RotateCcw } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { NewRoundDialog } from "./NewRoundDialog";
import { VotingTimer } from "./VotingTimer";
import { ParticipantRow, type Participant } from "./ParticipantRow";
import { VoteSummary, type Vote } from "./VoteSummary";
import { EditableFinalNumber } from "./EditableFinalNumber";

export interface ParticipantWithVote {
  participant: Participant;
  vote: {
    value: string | null;
    hasVoted: boolean;
  } | null;
}

interface ParticipantListProps {
  participants: ParticipantWithVote[];
  isRevealed: boolean;
  currentUserId?: string;
  hostId: string;
  roomId: Id<"rooms">;
  isCurrentUserAdmin: boolean;
  votes?: Vote[];
  pointScalePreset?: string;
  pointScale?: string[];
  isHost?: boolean;
  isClosed?: boolean;
  hasVotes?: boolean;
  onReveal?: () => void;
  demoSessionId?: string;
  timerEndsAt?: number | null;
  timerStartedAt?: number | null;
  onStopTimer?: () => void;
  onStartTimer?: () => void;
  onRevote?: () => void;
  currentRoundId?: Id<"rounds"> | null;
  currentRoundAverageScore?: number | null;
  currentRoundMedianScore?: number | null;
  currentRoundFinalScore?: string | null;
}

export function ParticipantList({
  participants,
  isRevealed,
  currentUserId,
  hostId,
  roomId,
  isCurrentUserAdmin,
  votes,
  pointScalePreset,
  pointScale,
  isHost = false,
  isClosed = false,
  hasVotes = false,
  onReveal,
  demoSessionId,
  timerEndsAt,
  timerStartedAt,
  onStopTimer,
  onStartTimer,
  onRevote,
  currentRoundId,
  currentRoundAverageScore,
  currentRoundMedianScore,
  currentRoundFinalScore,
}: ParticipantListProps) {
  // Separate voters and observers
  const voters = participants.filter(
    ({ participant }) => (participant.participantType ?? "voter") === "voter",
  );
  const observers = participants.filter(
    ({ participant }) =>
      (participant.participantType ?? "voter") === "observer",
  );

  const isTimerRunning = timerEndsAt && timerStartedAt;

  return (
    <div className="space-y-4 -mt-6">
      {/* Timer and Stop Timer Button - always rendered to prevent layout shift */}
      <div className="flex flex-col gap-2 pb-3 border-b min-h-[48px]">
        {isTimerRunning ? (
          <VotingTimer
            timerEndsAt={timerEndsAt ?? undefined}
            timerStartedAt={timerStartedAt ?? undefined}
          />
        ) : (
          <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold bg-muted/30 text-muted-foreground opacity-50">
            <Clock className="size-5" />
            <span>--:--</span>
          </div>
        )}
        {/* Timer Control Button - Start or Stop based on timer state */}
        {isHost && (
          <>
            {isTimerRunning ? (
              <Button
                variant="outline"
                onClick={onStopTimer}
                disabled={!onStopTimer || isClosed || isRevealed}
                className="gap-2 w-full"
              >
                <TimerOff className="w-4 h-4" />
                Stop Timer
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={onStartTimer}
                disabled={!onStartTimer || isClosed || isRevealed}
                className="gap-2 w-full"
              >
                <Timer className="w-4 h-4" />
                Start Timer
              </Button>
            )}
          </>
        )}
      </div>

      {/* Host Controls - New Round and Reveal Votes buttons */}
      {isHost && !isClosed && (
        <div className="flex gap-2 flex-wrap justify-center pb-3 border-b">
          {!isRevealed ? (
            <Button
              onClick={onReveal}
              disabled={!hasVotes}
              className="gap-2 w-full sm:w-auto"
            >
              <Eye className="w-4 h-4" />
              Reveal Votes
            </Button>
          ) : (
            <div className="w-full sm:w-auto flex justify-center">
              <NewRoundDialog roomId={roomId} demoSessionId={demoSessionId} />
            </div>
          )}
        </div>
      )}
      {/* Voters Section */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Voters ({voters.length})
        </h3>
        <div className="space-y-2">
          {voters.map(({ participant, vote }) => (
            <ParticipantRow
              key={participant._id}
              participant={participant}
              vote={vote}
              isRevealed={isRevealed}
              isCurrentUser={participant.clerkUserId === currentUserId}
              isHost={participant.clerkUserId === hostId}
              roomId={roomId}
              isCurrentUserAdmin={isCurrentUserAdmin}
            />
          ))}
          {voters.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              No voters yet
            </p>
          )}
        </div>
      </div>

      {/* Observers Section */}
      {observers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Eye className="size-3" />
            Observers ({observers.length})
          </h3>
          <div className="space-y-2">
            {observers.map(({ participant, vote }) => (
              <ParticipantRow
                key={participant._id}
                participant={participant}
                vote={vote}
                isRevealed={isRevealed}
                isCurrentUser={participant.clerkUserId === currentUserId}
                isHost={participant.clerkUserId === hostId}
                roomId={roomId}
                isCurrentUserAdmin={isCurrentUserAdmin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Vote Summary - shown when votes are revealed */}
      {isRevealed && votes && votes.length > 0 && (
        <>
          <VoteSummary votes={votes} pointScalePreset={pointScalePreset} />
          {/* Final Number - large editable display */}
          {currentRoundId && (
            <EditableFinalNumber
              roundId={currentRoundId}
              averageScore={currentRoundAverageScore}
              medianScore={currentRoundMedianScore}
              finalScore={currentRoundFinalScore}
              pointScale={pointScale}
              pointScalePreset={pointScalePreset}
              isAdmin={isCurrentUserAdmin}
              demoSessionId={demoSessionId}
            />
          )}
          {/* Revote Button - shown when votes are revealed and user is admin */}
          {isCurrentUserAdmin && onRevote && (
            <div className="pt-4 border-t">
              <Button
                onClick={onRevote}
                variant="outline"
                className="w-full gap-2"
                disabled={isClosed}
              >
                <RotateCcw className="w-4 h-4" />
                Revote
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
