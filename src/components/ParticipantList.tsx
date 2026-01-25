import { cn } from "@/lib/utils";
import { Check, User } from "lucide-react";

// Participant type matching Convex schema
interface Participant {
  _id: string;
  roomId: string;
  clerkUserId: string;
  name: string;
  avatarUrl?: string;
  joinedAt: number;
}

interface ParticipantWithVote {
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
}

export function ParticipantList({
  participants,
  isRevealed,
  currentUserId,
  hostId,
}: ParticipantListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Participants ({participants.length})
      </h3>
      <div className="space-y-2">
        {participants.map(({ participant, vote }) => (
          <ParticipantRow
            key={participant._id}
            participant={participant}
            vote={vote}
            isRevealed={isRevealed}
            isCurrentUser={participant.clerkUserId === currentUserId}
            isHost={participant.clerkUserId === hostId}
          />
        ))}
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
}

function ParticipantRow({
  participant,
  vote,
  isRevealed,
  isCurrentUser,
  isHost,
}: ParticipantRowProps) {
  const hasVoted = vote?.hasVoted ?? false;
  const voteValue = vote?.value;
  const showValue = isRevealed || (isCurrentUser && voteValue);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg transition-colors",
        isCurrentUser && "bg-primary/5"
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

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {participant.name}
          {isCurrentUser && (
            <span className="text-muted-foreground ml-1">(you)</span>
          )}
        </p>
      </div>

      {/* Vote Status */}
      <div className="shrink-0">
        {hasVoted ? (
          showValue ? (
            <div
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold",
                "bg-primary text-primary-foreground"
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
