import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, LogOut, Calendar } from "lucide-react";
import { useUser } from "@clerk/tanstack-react-start";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

export function RoomMembershipTable() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  // Get user's rooms
  const userRooms = useQuery(
    api.rooms.listByUser,
    isLoaded && user ? {} : "skip"
  );

  const leaveRoom = useMutation(api.participants.leave);

  // Filter to only open rooms
  const openRooms = userRooms?.filter(
    (room) => (room.status ?? "open") === "open"
  ) ?? [];

  // Don't show if no open rooms
  if (openRooms.length === 0) {
    return null;
  }

  const handleRejoin = (roomId: Id<"rooms">) => {
    navigate({ to: `/room/${roomId}` });
  };

  const handleLeave = async (roomId: Id<"rooms">, roomName: string) => {
    try {
      await leaveRoom({ roomId });
      toast.success(`Left room "${roomName}"`);
    } catch (error: any) {
      toast.error(error.message || "Failed to leave room");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Your Active Rooms</CardTitle>
        <CardDescription>
          Rooms you can rejoin. Admins cannot leave rooms but can close them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {openRooms.map((room) => {
              const isAdmin =
                room.participantRole === "admin" || room.hostId === user?.id;

              return (
                <TableRow key={room._id}>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Open
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Calendar className="w-3 h-3" />
                      {formatDate(room.joinedAt)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejoin(room._id)}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Rejoin
                      </Button>
                      {!isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLeave(room._id, room.name)}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Leave
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
