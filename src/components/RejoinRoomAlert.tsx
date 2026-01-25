import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate, useLocation } from "@tanstack/react-router";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AlertAction,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, LogIn, Info } from "lucide-react";
import { useState } from "react";
import { useUser } from "@clerk/tanstack-react-start";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

export function RejoinRoomAlert() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissedRooms, setDismissedRooms] = useState<Set<string>>(new Set());

  // Get user's rooms - must call hooks before any conditional returns
  const userRooms = useQuery(
    api.rooms.listByUser,
    isLoaded && user ? {} : "skip",
  );

  const leaveRoom = useMutation(api.participants.leave);

  // Don't show on room pages
  const isOnRoomPage = location.pathname.startsWith("/room/");
  if (isOnRoomPage) {
    return null;
  }

  // Extract room ID from pathname for filtering (though we shouldn't be here if on room page)
  const currentRoomId = undefined;

  // Filter to only open rooms that aren't the current room and haven't been dismissed
  const activeRooms = userRooms?.filter(
    (room) =>
      (room.status ?? "open") === "open" &&
      room._id !== currentRoomId &&
      !dismissedRooms.has(room._id),
  );

  // Don't show if no active rooms
  if (!activeRooms || activeRooms.length === 0) {
    return null;
  }

  // Show the first active room (or could show multiple)
  const roomToRejoin = activeRooms[0];
  const isAdmin =
    roomToRejoin.participantRole === "admin" ||
    roomToRejoin.hostId === user?.id;

  const handleRejoin = () => {
    navigate({ to: `/room/${roomToRejoin._id}` });
  };

  const handleLeave = async () => {
    try {
      await leaveRoom({ roomId: roomToRejoin._id });
      setDismissedRooms((prev) => new Set(prev).add(roomToRejoin._id));
      toast.success(`Left room "${roomToRejoin.name}"`);
    } catch (error: any) {
      toast.error(error.message || "Failed to leave room");
    }
  };

  const handleDismiss = () => {
    setDismissedRooms((prev) => new Set(prev).add(roomToRejoin._id));
  };

  return (
    <div className="sticky top-16 z-40 w-full">
      <div className="container mx-auto px-4 pt-4">
        <Alert variant="warning" className="mb-4">
          <Info className="w-4 h-4" />
          <AlertTitle>Rejoin Room</AlertTitle>
          <AlertDescription>
            You have an active room: <strong>{roomToRejoin.name}</strong>
          </AlertDescription>
          <AlertAction>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleRejoin}>
                <LogIn className="w-4 h-4 mr-2" />
                Rejoin
              </Button>
              {!isAdmin && (
                <Button size="sm" variant="outline" onClick={handleLeave}>
                  Leave Room
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </AlertAction>
        </Alert>
      </div>
    </div>
  );
}
