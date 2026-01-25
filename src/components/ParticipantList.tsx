import { cn } from "@/lib/utils";
import { Check, User, Shield, Eye } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

// Participant type matching Convex schema with new fields
interface Participant {
  _id: string;
  roomId: string;
  clerkUserId: string;
  name: string;
  avatarUrl?: string;
  joinedAt: number;
  role?: "admin" | "team";
  participantType?: "voter" | "observer";
}

interface ParticipantWithVote {
  participant: Participant;
  vote: {
    value: string | null;
    hasVoted: boolean;
  } | null;
}

interface Vote {
  value: string | null;
  hasVoted: boolean;
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
}: ParticipantListProps) {
  // Separate voters and observers
  const voters = participants.filter(
    ({ participant }) => (participant.participantType ?? "voter") === "voter",
  );
  const observers = participants.filter(
    ({ participant }) =>
      (participant.participantType ?? "voter") === "observer",
  );

  return (
    <div className="space-y-4">
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
        <VoteSummary votes={votes} pointScalePreset={pointScalePreset} />
      )}
    </div>
  );
}

// Mapping for t-shirt sizes to numeric values
const TSHIRT_SIZE_MAP: Record<string, number> = {
  XS: 1,
  S: 2,
  M: 3,
  L: 5,
  XL: 8,
};

// Reverse mapping: number to t-shirt size (for display)
const NUMBER_TO_TSHIRT: Record<number, string> = {
  1: "XS",
  2: "S",
  3: "M",
  5: "L",
  8: "XL",
};

/**
 * Convert a vote value to a number for calculations.
 * Handles numeric strings, t-shirt sizes, and "?" (unsure).
 */
function voteValueToNumber(value: string | null): number | null {
  if (!value || value === "?") {
    return null;
  }
  
  // Check if it's a t-shirt size
  const upperValue = value.toUpperCase();
  if (TSHIRT_SIZE_MAP[upperValue] !== undefined) {
    return TSHIRT_SIZE_MAP[upperValue];
  }
  
  // Try parsing as a number
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/**
 * Convert a number back to t-shirt size (finds closest match).
 * Returns the number as string if no t-shirt size matches.
 */
function numberToTShirtSize(num: number): string {
  // Find closest t-shirt size
  const tshirtValues = Object.values(TSHIRT_SIZE_MAP).sort((a, b) => a - b);
  let closest = tshirtValues[0];
  let minDiff = Math.abs(num - closest);
  
  for (const val of tshirtValues) {
    const diff = Math.abs(num - val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = val;
    }
  }
  
  return NUMBER_TO_TSHIRT[closest] || num.toFixed(1);
}

function VoteSummary({
  votes,
  pointScalePreset,
}: {
  votes: Vote[];
  pointScalePreset?: string;
}) {
  const numericVotes = votes
    .map((v) => voteValueToNumber(v.value))
    .filter((v): v is number => v !== null);

  if (numericVotes.length === 0) {
    return null;
  }

  const average = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
  const sortedVotes = [...numericVotes].sort((a, b) => a - b);
  const median =
    sortedVotes.length % 2 === 0
      ? (sortedVotes[sortedVotes.length / 2 - 1] +
          sortedVotes[sortedVotes.length / 2]) /
        2
      : sortedVotes[Math.floor(sortedVotes.length / 2)];

  const questionMarks = votes.filter((v) => v.value === "?").length;

  // Check if we should display as t-shirt sizes
  const isTShirtScale = pointScalePreset === "tshirt";
  const displayAverage = isTShirtScale
    ? numberToTShirtSize(average)
    : average.toFixed(1);
  const displayMedian = isTShirtScale
    ? numberToTShirtSize(median)
    : median.toString();

  return (
    <div className="pt-4 border-t">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Vote Summary
      </h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-lg font-bold">{displayAverage}</p>
          <p className="text-[10px] text-muted-foreground">Average</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-lg font-bold">{displayMedian}</p>
          <p className="text-[10px] text-muted-foreground">Median</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-lg font-bold">{questionMarks}</p>
          <p className="text-[10px] text-muted-foreground">Unsure</p>
        </div>
      </div>
    </div>
  );
}

interface ParticipantRowProps {
  participant: Participant;
  vote: {
    value: string | null;
    hasVoted: boolean;
  } | null;
  isRevealed: boolean;
  isCurrentUser: boolean;
  isHost: boolean;
  roomId: Id<"rooms">;
  isCurrentUserAdmin: boolean;
}

function ParticipantRow({
  participant,
  vote,
  isRevealed,
  isCurrentUser,
  isHost,
  roomId,
  isCurrentUserAdmin,
}: ParticipantRowProps) {
  const promoteToAdmin = useMutation(api.participants.promoteToAdmin);

  const hasVoted = vote?.hasVoted ?? false;
  const voteValue = vote?.value;
  const showValue = isRevealed || (isCurrentUser && voteValue);
  const role = participant.role ?? "team";
  const isAdmin = role === "admin";
  const isObserver = (participant.participantType ?? "voter") === "observer";

  // Show promote button if current user is admin and viewing a non-admin team member
  const canPromote = isCurrentUserAdmin && !isAdmin && !isCurrentUser;

  const handlePromote = async () => {
    try {
      await promoteToAdmin({
        roomId,
        participantId: participant._id as Id<"participants">,
      });
    } catch (error) {
      console.error("Failed to promote participant:", error);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg transition-colors",
        isCurrentUser && "bg-primary/5",
      )}
    >
      {/* Avatar */}
      <div className="relative">
        {participant.avatarUrl ? (
          <img
            src={participant.avatarUrl}
            alt={participant.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        {isHost && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-[10px]">👑</span>
          </div>
        )}
      </div>

      {/* Name and Badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-medium truncate">
            {participant.name}
            {isCurrentUser && (
              <span className="text-muted-foreground ml-1">(you)</span>
            )}
          </p>
          {isAdmin && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              <Shield className="size-2.5 mr-0.5" />
              Admin
            </Badge>
          )}
        </div>
        {canPromote && (
          <Button
            variant="ghost"
            size="xs"
            onClick={handlePromote}
            className="text-xs text-muted-foreground hover:text-foreground mt-0.5 h-5 px-1"
          >
            Promote to Admin
          </Button>
        )}
      </div>

      {/* Vote Status - Only show for voters */}
      <div className="shrink-0">
        {isObserver ? (
          <div
            className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center"
            title="Observer"
          >
            <Eye className="w-4 h-4 text-muted-foreground" />
          </div>
        ) : hasVoted ? (
          showValue ? (
            <div
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold",
                "bg-primary text-primary-foreground",
              )}
            >
              {voteValue}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          )
        ) : (
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs">—</span>
          </div>
        )}
      </div>
    </div>
  );
}
