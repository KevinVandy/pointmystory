import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RefreshCw, Ticket, FileText } from "lucide-react";

interface NewRoundDialogProps {
  roomId: Id<"rooms">;
}

export function NewRoundDialog({ roomId }: NewRoundDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const startNewRound = useMutation(api.rooms.startNewRound);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await startNewRound({
        roomId,
        name: name.trim() || undefined,
        ticketNumber: ticketNumber.trim() || undefined,
      });
      setOpen(false);
      setName("");
      setTicketNumber("");
    } catch (error) {
      console.error("Failed to start new round:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickStart = async () => {
    setIsLoading(true);
    try {
      await startNewRound({ roomId });
      setOpen(false);
    } catch (error) {
      console.error("Failed to start new round:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className="focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 [&_svg]:pointer-events-none [&_svg]:shrink-0">
        <RefreshCw className="w-4 h-4" />
        New Round
      </AlertDialogTrigger>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>Start New Round</AlertDialogTitle>
          <AlertDialogDescription>
            Optionally add a name or ticket number for this round. This helps
            identify rounds in the history.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticket-name" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Ticket Name
            </Label>
            <Input
              id="ticket-name"
              placeholder="e.g., User Authentication Flow"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-number" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Ticket Number
            </Label>
            <Input
              id="ticket-number"
              placeholder="e.g., PROJ-123"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button
            variant="outline"
            onClick={handleQuickStart}
            disabled={isLoading}
          >
            Quick Start
          </Button>
          <AlertDialogAction onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Starting..." : "Start Round"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
