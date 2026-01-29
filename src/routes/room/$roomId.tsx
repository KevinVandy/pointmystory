import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";
import { useUser, SignInButton } from "@clerk/tanstack-react-start";
import { ParticipantList } from "@/components/ParticipantList";
import { RoomControls } from "@/components/RoomControls";
import { RoomSettings } from "@/components/RoomSettings";
import { RoundHistoryTable } from "@/components/RoundHistoryTable";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, Lock, LogIn, AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip } from "@/components/ui/tooltip";
import { getDemoSessionId } from "@/lib/demoSession";
import { VotingCard } from "@/components/VotingCard";
import { RoomPageSkeleton } from "@/components/RoomPageSkeleton";

export const Route = createFileRoute("/room/$roomId")({
  component: RoomPage,
  ssr: false,
  pendingComponent: RoomPageSkeleton,
});

function RoomPage() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const { user, isLoaded: userLoaded } = useUser();

  // Get demo session ID from localStorage
  const [demoSessionId] = useState<string | null>(() =>
    getDemoSessionId(roomId),
  );

  // Convex queries
  const roomResult = useQuery(api.rooms.get, {
    roomId: roomId as Id<"rooms">,
  });
  const participantsResult = useQuery(api.participants.listByRoom, {
    roomId: roomId as Id<"rooms">,
  });
  const votesResult = useQuery(api.votes.getByRoom, {
    roomId: roomId as Id<"rooms">,
  });

  // Extract data from result objects
  const participants =
    participantsResult?.status === "ok" ? participantsResult.participants : [];
  const votes = votesResult?.status === "ok" ? votesResult.votes : [];
  const currentVoteQuery = useQuery(api.votes.getCurrentVote, {
    roomId: roomId as Id<"rooms">,
  });
  const currentVote = currentVoteQuery
    ? { value: currentVoteQuery.value }
    : null;
  const currentParticipant = useQuery(api.participants.getCurrentParticipant, {
    roomId: roomId as Id<"rooms">,
  });
  const currentRound = useQuery(api.rounds.getCurrentRound, {
    roomId: roomId as Id<"rooms">,
  });

  // Convex mutations
  const joinRoom = useMutation(api.participants.join);
  const castVote = useMutation(api.votes.cast);
  const revealVotes = useMutation(api.rooms.reveal);
  const startTimerMutation = useMutation(api.rooms.startTimer);
  const stopTimerMutation = useMutation(api.rooms.stopTimer);
  const revoteRound = useMutation(api.rooms.revoteRound);

  // Extract room from result
  const room = roomResult?.status === "ok" ? roomResult.room : null;

  // Derived values
  const isPublicRoom = (room?.visibility ?? "private") === "public";
  const isAuthenticated = !!user;
  const isParticipant = currentParticipant !== null;
  const isDemoRoom = room?.isDemo ?? false;

  // Check if user is demo room admin (has valid demoSessionId)
  const isDemoRoomAdmin = isDemoRoom && demoSessionId === room?.demoSessionId;

  // Role and type - default for new/missing fields
  const participantRole = currentParticipant?.role ?? "team";
  const participantType = currentParticipant?.participantType ?? "voter";
  // Admin status: regular admin OR demo room admin
  const isAdmin =
    participantRole === "admin" || room?.hostId === user?.id || isDemoRoomAdmin;
  const isObserver = participantType === "observer";
  const roomStatus = (room?.status ?? "open") as "open" | "closed";
  const isClosed = roomStatus === "closed";

  // Calculate time until auto-close for demo rooms
  const [timeUntilClose, setTimeUntilClose] = useState<number | null>(null);
  useEffect(() => {
    if (isDemoRoom && room?.autoCloseAt) {
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, room.autoCloseAt! - now);
        setTimeUntilClose(remaining);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [isDemoRoom, room?.autoCloseAt]);

  // Point scale from room
  const pointScale = room?.pointScale;

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
  // Check both roomResult and other queries for access denied
  const hasAccessDenied =
    roomResult?.status === "access_denied" ||
    participantsResult?.status === "access_denied" ||
    votesResult?.status === "access_denied";

  if (hasAccessDenied) {
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

  const handleReveal = () => {
    revealVotes({
      roomId: roomId as Id<"rooms">,
      demoSessionId: isDemoRoom ? (demoSessionId ?? undefined) : undefined,
    });
  };

  const handleStartTimer = () => {
    startTimerMutation({
      roomId: roomId as Id<"rooms">,
      demoSessionId: isDemoRoom ? (demoSessionId ?? undefined) : undefined,
    });
  };

  const handleStopTimer = () => {
    stopTimerMutation({
      roomId: roomId as Id<"rooms">,
      demoSessionId: isDemoRoom ? (demoSessionId ?? undefined) : undefined,
    });
  };

  const handleRevote = () => {
    revoteRound({
      roomId: roomId as Id<"rooms">,
      demoSessionId: isDemoRoom ? (demoSessionId ?? undefined) : undefined,
    });
  };

  // Unauthenticated user viewing public room (read-only)
  // Exception: demo room admins can perform admin actions
  const isReadOnlyViewer = !isAuthenticated && isPublicRoom && !isDemoRoomAdmin;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 pt-8 pb-100">
        {/* Demo room indicator */}
        {isDemoRoom && (
          <Alert className="mb-4">
            <Clock className="w-4 h-4" />
            <AlertTitle>Demo Room</AlertTitle>
            <AlertDescription>
              This is a demo room that will automatically close in{" "}
              {timeUntilClose !== null
                ? `${Math.floor(timeUntilClose / 60000)}:${Math.floor(
                    (timeUntilClose % 60000) / 1000,
                  )
                    .toString()
                    .padStart(2, "0")}`
                : "5:00"}
              . Demo rooms cannot be reopened.
            </AlertDescription>
          </Alert>
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

        {/* Room Controls - for admins (authenticated or demo room admin) */}
        {(isAuthenticated || isDemoRoomAdmin) && (
          <RoomControls
            roomId={roomId as Id<"rooms">}
            roomName={room.name}
            currentStory={room.currentStory}
            currentRoundName={currentRound?.name}
            currentTicketNumber={currentRound?.ticketNumber}
            isRevealed={currentRound?.isRevealed ?? false}
            isHost={isAdmin}
            roomStatus={roomStatus}
            isAdmin={isAdmin}
            isDemoRoom={isDemoRoom}
            isAuthenticated={isAuthenticated}
            demoSessionId={demoSessionId ?? undefined}
            isParticipant={isParticipant}
            participantType={participantType}
            visibility={room.visibility ?? "private"}
          />
        )}

        {/* Read-only header for unauthenticated users */}
        {isReadOnlyViewer && (
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-bold">
                {room.name ? (
                  room.name
                ) : (
                  <span className="italic text-muted-foreground">
                    Untitled Room
                  </span>
                )}
              </h2>
              {isPublicRoom ? (
                <Tooltip content="Public Room" side="bottom">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                </Tooltip>
              ) : (
                <Tooltip content="Private Room" side="bottom">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </Tooltip>
              )}
            </div>
            {room.currentStory && (
              <p className="text-muted-foreground mt-2">{room.currentStory}</p>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="mt-8 flex flex-col lg:flex-row gap-8">
          {/* Left Column - Voting Card and Round History (stacked on desktop) */}
          <div className="flex-1 flex flex-col gap-6 order-1 lg:order-1">
            <VotingCard
              roomId={roomId as Id<"rooms">}
              currentStory={room.currentStory}
              currentRoundName={currentRound?.name}
              currentTicketNumber={currentRound?.ticketNumber}
              jiraCloudId={currentRound?.jiraCloudId}
              isRevealed={currentRound?.isRevealed ?? false}
              isAdmin={isAdmin}
              isClosed={isClosed}
              isAuthenticated={isAuthenticated}
              isReadOnlyViewer={isReadOnlyViewer}
              isObserver={isObserver}
              currentVote={currentVote}
              pointScale={pointScale ?? []}
              onVote={handleVote}
              demoSessionId={
                isDemoRoom ? (demoSessionId ?? undefined) : undefined
              }
            />

            {/* Round History Table - hidden on mobile (shown below participants via order-3) */}
            <div className="hidden lg:block">
              <RoundHistoryTable
                roomId={roomId as Id<"rooms">}
                isAdmin={isAdmin}
                currentRoundId={room.currentRoundId}
                pointScalePreset={room.pointScalePreset}
                pointScale={pointScale}
                demoSessionId={
                  isDemoRoom ? (demoSessionId ?? undefined) : undefined
                }
              />
            </div>

            {/* Admin Settings Panel - in left column on desktop */}
            {(isAuthenticated || isDemoRoomAdmin) && isAdmin && (
              <div className="hidden lg:block">
                <RoomSettings
                  roomId={roomId as Id<"rooms">}
                  currentRoomName={room.name || ""}
                  currentVisibility={room.visibility ?? "private"}
                  currentPreset={room.pointScalePreset ?? "fibonacci"}
                  currentPointScale={pointScale ?? []}
                  currentTimerDuration={room.timerDurationSeconds ?? 180}
                  currentAutoStartTimer={room.autoStartTimer ?? false}
                  currentAutoRevealVotes={room.autoRevealVotes ?? true}
                  isAdmin={isAdmin}
                  demoSessionId={
                    isDemoRoom ? (demoSessionId ?? undefined) : undefined
                  }
                  isDemoRoom={isDemoRoom}
                  organizationId={room.organizationId ?? undefined}
                />
              </div>
            )}
          </div>

          {/* Participants Sidebar */}
          <Card className="order-2 lg:order-2 lg:w-[360px] lg:shrink-0">
            <CardContent className="pt-6">
              <ParticipantList
                participants={participantsWithVotes}
                isRevealed={currentRound?.isRevealed ?? false}
                currentUserId={user?.id}
                hostId={room.hostId}
                roomId={roomId as Id<"rooms">}
                isCurrentUserAdmin={isAdmin}
                votes={votes.map((v) => ({
                  value: v.value,
                  hasVoted: v.hasVoted,
                }))}
                pointScalePreset={room.pointScalePreset}
                pointScale={pointScale}
                isHost={isAdmin}
                isClosed={isClosed}
                hasVotes={hasVotes}
                onReveal={handleReveal}
                demoSessionId={
                  isDemoRoom ? (demoSessionId ?? undefined) : undefined
                }
                timerEndsAt={room.timerEndsAt}
                timerStartedAt={room.timerStartedAt}
                onStartTimer={handleStartTimer}
                onStopTimer={handleStopTimer}
                onRevote={handleRevote}
                currentRoundId={currentRound?._id}
                currentRoundAverageScore={currentRound?.averageScore}
                currentRoundMedianScore={currentRound?.medianScore}
                currentRoundFinalScore={currentRound?.finalScore}
              />
            </CardContent>
          </Card>

          {/* Round History Table - below participants on mobile */}
          <div className="order-3 lg:hidden">
            <RoundHistoryTable
              roomId={roomId as Id<"rooms">}
              isAdmin={isAdmin}
              currentRoundId={room.currentRoundId}
              pointScalePreset={room.pointScalePreset}
              pointScale={pointScale}
              demoSessionId={
                isDemoRoom ? (demoSessionId ?? undefined) : undefined
              }
            />
          </div>

          {/* Admin Settings Panel - at the bottom on mobile */}
          {(isAuthenticated || isDemoRoomAdmin) && isAdmin && (
            <div className="order-4 lg:hidden">
              <RoomSettings
                roomId={roomId as Id<"rooms">}
                currentRoomName={room.name || ""}
                currentVisibility={room.visibility ?? "private"}
                currentPreset={room.pointScalePreset ?? "fibonacci"}
                currentPointScale={pointScale ?? []}
                currentTimerDuration={room.timerDurationSeconds ?? 180}
                currentAutoStartTimer={room.autoStartTimer ?? false}
                currentAutoRevealVotes={room.autoRevealVotes ?? true}
                isAdmin={isAdmin}
                demoSessionId={
                  isDemoRoom ? (demoSessionId ?? undefined) : undefined
                }
                isDemoRoom={isDemoRoom}
                organizationId={room.organizationId ?? undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
