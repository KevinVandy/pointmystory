import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useEffect, useMemo } from "react";
import { useUser, SignInButton } from "@clerk/tanstack-react-start";
import { VotingCardGrid, DEFAULT_POINT_VALUES } from "@/components/VotingCard";
import { ParticipantList } from "@/components/ParticipantList";
import { RoomControls } from "@/components/RoomControls";
import { RoomSettings } from "@/components/RoomSettings";
import { ParticipantTypeToggle } from "@/components/ParticipantTypeToggle";
import { VotingTimer } from "@/components/VotingTimer";
import { RoundHistoryTable } from "@/components/RoundHistoryTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, Lock, LogIn, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/room/$roomId")({
  component: RoomPage,
});

function RoomPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const { user, isLoaded: userLoaded } = useUser();

  // Convex queries
  const roomResult = useQuery(api.rooms.get, {
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
  const currentRound = useQuery(api.rounds.getCurrentRound, {
    roomId: roomId as Id<"rooms">,
  });

  // Convex mutations
  const joinRoom = useMutation(api.participants.join);
  const castVote = useMutation(api.votes.cast);
  const updateStory = useMutation(api.rooms.updateStory);
  const revealVotes = useMutation(api.rooms.reveal);
  const startTimerMutation = useMutation(api.rooms.startTimer);
  const stopTimerMutation = useMutation(api.rooms.stopTimer);

  // Extract room from result
  const room = roomResult?.status === "ok" ? roomResult.room : null;

  // Derived values
  const isPublicRoom = (room?.visibility ?? "private") === "public";
  const isAuthenticated = !!user;
  const isParticipant = currentParticipant !== null;

  // Role and type - default for new/missing fields
  const participantRole = currentParticipant?.role ?? "team";
  const participantType = currentParticipant?.participantType ?? "voter";
  const isAdmin = participantRole === "admin" || room?.hostId === user?.id;
  const isObserver = participantType === "observer";
  const roomStatus = (room?.status ?? "open") as "open" | "closed";
  const isClosed = roomStatus === "closed";

  // Point scale from room or default
  const pointScale =
    room?.pointScale && room.pointScale.length > 0
      ? room.pointScale
      : [...DEFAULT_POINT_VALUES];

  // Auto-join room when user is authenticated and not already a participant
  // (only for authenticated users viewing any room)
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
        vote: vote ? { value: vote.value, hasVoted: vote.hasVoted } : null,
      };
    });
  }, [participants, votes]);

  // Loading state
  if (!userLoaded || roomResult === undefined) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Room not found
  if (roomResult.status === "not_found") {
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

  // Access denied - private room and user not signed in
  if (roomResult.status === "access_denied") {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Private Room</h2>
            <p className="text-muted-foreground mb-4">
              This room is private. Please sign in to access it.
            </p>
            <SignInButton mode="modal">
              <Button>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In to Access
              </Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  // At this point, room is guaranteed to exist (status === "ok")
  if (!room) {
    return null; // Should never happen, but TypeScript needs this
  }

  const hasVotes = (votes?.length ?? 0) > 0;

  const handleVote = (value: string) => {
    if (!isAuthenticated) return;
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

  const handleStartTimer = () => {
    startTimerMutation({ roomId: roomId as Id<"rooms"> });
  };

  const handleStopTimer = () => {
    stopTimerMutation({ roomId: roomId as Id<"rooms"> });
  };

  // Unauthenticated user viewing public room (read-only)
  const isReadOnlyViewer = !isAuthenticated && isPublicRoom;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-6">
        {/* Public room indicator */}
        {isPublicRoom && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
            <Globe className="w-4 h-4" />
            <span>Public Room</span>
          </div>
        )}

        {/* Closed Room Alert */}
        {isClosed && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Room Closed</AlertTitle>
            <AlertDescription>
              This room has been closed by the administrator. You can still view
              the room but cannot vote or start new rounds.
            </AlertDescription>
          </Alert>
        )}

        {/* Room Controls - only for admins when authenticated */}
        {isAuthenticated && (
          <RoomControls
            roomId={roomId as Id<"rooms">}
            roomName={room.name}
            currentStory={room.currentStory}
            currentRoundName={currentRound?.name}
            currentTicketNumber={currentRound?.ticketNumber}
            isRevealed={currentRound?.isRevealed ?? false}
            isHost={isAdmin}
            hasVotes={hasVotes}
            onUpdateStory={handleUpdateStory}
            onReveal={handleReveal}
            timerEndsAt={room.timerEndsAt}
            timerStartedAt={room.timerStartedAt}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            roomStatus={roomStatus}
            isAdmin={isAdmin}
          />
        )}

        {/* Read-only header for unauthenticated users */}
        {isReadOnlyViewer && (
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">{room.name}</h1>
            {room.currentStory && (
              <p className="text-muted-foreground mt-2">{room.currentStory}</p>
            )}
            {/* Show timer for read-only viewers if active */}
            {room.timerEndsAt && room.timerStartedAt && (
              <div className="mt-4 flex justify-center">
                <VotingTimer
                  timerEndsAt={room.timerEndsAt}
                  timerStartedAt={room.timerStartedAt}
                />
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="mt-8 grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Voting Area */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                {/* Participant type toggle for authenticated users */}
                {isAuthenticated && isParticipant && (
                  <div className="flex justify-center mb-6">
                    <ParticipantTypeToggle
                      roomId={roomId as Id<"rooms">}
                      currentType={participantType}
                    />
                  </div>
                )}

                <h2 className="text-lg font-semibold mb-6 text-center">
                  {isReadOnlyViewer
                    ? "Viewing Session"
                    : isObserver
                      ? "Observing"
                      : (currentRound?.isRevealed ?? false)
                        ? "Votes Revealed"
                        : currentVote
                          ? "You voted - waiting for others..."
                          : "Cast Your Vote"}
                </h2>

                {/* Sign in prompt for unauthenticated users */}
                {isReadOnlyViewer && (
                  <div className="text-center mb-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground mb-3">
                      Sign in to participate in voting
                    </p>
                    <SignInButton mode="modal">
                      <Button size="sm">
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In to Vote
                      </Button>
                    </SignInButton>
                  </div>
                )}

                <VotingCardGrid
                  selectedValue={currentVote?.value ?? null}
                  onSelect={handleVote}
                  isDisabled={(currentRound?.isRevealed ?? false) || isReadOnlyViewer || isClosed}
                  isObserver={isObserver}
                  pointScale={pointScale}
                />
              </CardContent>
            </Card>

            {/* Round History Table */}
            <RoundHistoryTable
              roomId={roomId as Id<"rooms">}
              isAdmin={isAdmin}
              currentRoundId={room.currentRoundId}
            />

            {/* Admin Settings Panel - at the bottom */}
            {isAuthenticated && isAdmin && (
              <RoomSettings
                roomId={roomId as Id<"rooms">}
                currentVisibility={room.visibility ?? "private"}
                currentPreset={room.pointScalePreset ?? "fibonacci"}
                currentPointScale={pointScale}
                currentTimerDuration={room.timerDurationSeconds ?? 180}
                isAdmin={isAdmin}
              />
            )}
          </div>

          {/* Participants Sidebar */}
          <Card>
            <CardContent className="pt-6">
              <ParticipantList
                participants={participantsWithVotes}
                isRevealed={currentRound?.isRevealed ?? false}
                currentUserId={user?.id}
                hostId={room.hostId}
                roomId={roomId as Id<"rooms">}
                isCurrentUserAdmin={isAdmin}
                votes={votes?.map((v) => ({
                  value: v.value,
                  hasVoted: v.hasVoted,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
