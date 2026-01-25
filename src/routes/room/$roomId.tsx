import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useEffect, useMemo } from "react";
import { useUser } from "@clerk/tanstack-react-start";
import { VotingCardGrid } from "@/components/VotingCard";
import { ParticipantList } from "@/components/ParticipantList";
import { RoomControls } from "@/components/RoomControls";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/room/$roomId")({
  component: RoomPage,
});

function RoomPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const { user, isLoaded: userLoaded } = useUser();

  // Convex queries
  const room = useQuery(api.rooms.get, {
    roomId: roomId as Id<"rooms">,
  });
  const participants = useQuery(api.participants.listByRoom, {
    roomId: roomId as Id<"rooms">,
  });
  const votes = useQuery(api.votes.getByRoom, {
    roomId: roomId as Id<"rooms">,
  });
  const currentVote = useQuery(api.votes.getCurrentVote, {
    roomId: roomId as Id<"rooms">,
  });
  const currentParticipant = useQuery(api.participants.getCurrentParticipant, {
    roomId: roomId as Id<"rooms">,
  });

  // Convex mutations
  const joinRoom = useMutation(api.participants.join);
  const castVote = useMutation(api.votes.cast);
  const updateStory = useMutation(api.rooms.updateStory);
  const revealVotes = useMutation(api.rooms.reveal);
  const resetVotes = useMutation(api.rooms.resetVotes);

  // Auto-join room when user is loaded and not already a participant
  useEffect(() => {
    if (userLoaded && user && room && currentParticipant === null) {
      joinRoom({ roomId: roomId as Id<"rooms"> });
    }
  }, [userLoaded, user, room, currentParticipant, joinRoom, roomId]);

  // Combine participants with their votes
  const participantsWithVotes = useMemo(() => {
    if (!participants || !votes) return [];

    return participants.map((participant) => {
      const vote = votes.find((v) => v.participantId === participant._id);
      return {
        participant,
        vote: vote
          ? { value: vote.value, hasVoted: vote.hasVoted }
          : null,
      };
    });
  }, [participants, votes]);

  // Loading state
  if (!userLoaded || room === undefined) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Room not found
  if (room === null) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Room Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This room doesn't exist or may have been deleted.
            </p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="text-primary hover:underline"
            >
              Go back home
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User not signed in
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground">
              Please sign in to join this planning poker room.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isHost = room.hostId === user.id;
  const hasVotes = (votes?.length ?? 0) > 0;

  const handleVote = (value: string) => {
    castVote({
      roomId: roomId as Id<"rooms">,
      value,
    });
  };

  const handleUpdateStory = (story: string) => {
    updateStory({
      roomId: roomId as Id<"rooms">,
      story,
    });
  };

  const handleReveal = () => {
    revealVotes({ roomId: roomId as Id<"rooms"> });
  };

  const handleReset = () => {
    resetVotes({ roomId: roomId as Id<"rooms"> });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-6">
        {/* Room Controls */}
        <RoomControls
          roomName={room.name}
          currentStory={room.currentStory}
          isRevealed={room.isRevealed}
          isHost={isHost}
          hasVotes={hasVotes}
          onUpdateStory={handleUpdateStory}
          onReveal={handleReveal}
          onReset={handleReset}
        />

        {/* Main Content */}
        <div className="mt-8 grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Voting Area */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-6 text-center">
                {room.isRevealed
                  ? "Votes Revealed"
                  : currentVote
                    ? "You voted - waiting for others..."
                    : "Cast Your Vote"}
              </h2>

              <VotingCardGrid
                selectedValue={currentVote?.value ?? null}
                onSelect={handleVote}
                isDisabled={room.isRevealed}
              />

              {/* Vote Summary (when revealed) */}
              {room.isRevealed && votes && votes.length > 0 && (
                <VoteSummary votes={votes} />
              )}
            </CardContent>
          </Card>

          {/* Participants Sidebar */}
          <Card>
            <CardContent className="pt-6">
              <ParticipantList
                participants={participantsWithVotes}
                isRevealed={room.isRevealed}
                currentUserId={user.id}
                hostId={room.hostId}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface Vote {
  value: string | null;
  hasVoted: boolean;
}

function VoteSummary({ votes }: { votes: Vote[] }) {
  const numericVotes = votes
    .filter((v) => v.value && v.value !== "?")
    .map((v) => parseInt(v.value!, 10));

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

  return (
    <div className="mt-8 pt-6 border-t">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        Vote Summary
      </h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">{average.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Average</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{median}</p>
          <p className="text-xs text-muted-foreground">Median</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{questionMarks}</p>
          <p className="text-xs text-muted-foreground">Unsure (?)</p>
        </div>
      </div>
    </div>
  );
}
