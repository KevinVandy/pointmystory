import { useState, useEffect } from "react";
import * as React from "react";
import { useMutation, useAction } from "convex/react";
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
import { JiraTicketSelector } from "./JiraTicketSelector";

interface NewRoundDialogProps {
  roomId: Id<"rooms">;
  mode?: "newRound" | "setStory";
  initialName?: string;
  initialTicketNumber?: string;
  trigger?: React.ReactElement;
  onStoryUpdated?: () => void;
  demoSessionId?: string;
}

export function NewRoundDialog({
  roomId,
  mode = "newRound",
  initialName,
  initialTicketNumber,
  trigger,
  onStoryUpdated,
  demoSessionId,
}: NewRoundDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCloudId, setSelectedCloudId] = useState<string | undefined>();

  const startNewRound = useMutation(api.rooms.startNewRound);
  const updateStory = useMutation(api.rooms.updateStory);

  // Pre-fill form when dialog opens or initial values change
  useEffect(() => {
    if (open) {
      setName(initialName || "");
      setTicketNumber(initialTicketNumber || "");
    }
  }, [open, initialName, initialTicketNumber]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (mode === "setStory") {
        // For setStory mode, use name as story (or ticketNumber if name is empty)
        const storyText = name.trim() || ticketNumber.trim() || "";

        if (storyText) {
          await updateStory({
            roomId,
            story: storyText,
            ticketNumber: ticketNumber.trim() || undefined,
            jiraCloudId: selectedCloudId,
            demoSessionId,
          });
          onStoryUpdated?.();
        }
      } else {
        // For newRound mode, start a new round
        await startNewRound({
          roomId,
          name: name.trim() || undefined,
          ticketNumber: ticketNumber.trim() || undefined,
          jiraCloudId: selectedCloudId,
          demoSessionId,
        });
      }
      setOpen(false);
      setName("");
      setTicketNumber("");
    } catch (error) {
      console.error(
        mode === "setStory"
          ? "Failed to update story:"
          : "Failed to start new round:",
        error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isSetStoryMode = mode === "setStory";

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <AlertDialogTrigger
          render={(props) => {
            // Extract props from the trigger Button and merge with AlertDialogTrigger props
            // This avoids nested buttons by rendering a single Button with merged props
            const triggerProps = trigger.props as React.ComponentProps<
              typeof Button
            >;
            return (
              <Button {...triggerProps} {...props}>
                {triggerProps.children}
              </Button>
            );
          }}
        />
      ) : (
        <AlertDialogTrigger className="cursor-pointer focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 bg-amber-500 text-white hover:bg-amber-600 h-9 px-4 [&_svg]:pointer-events-none [&_svg]:shrink-0">
          <RefreshCw className="w-4 h-4" />
          New Round
        </AlertDialogTrigger>
      )}
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSetStoryMode ? "Set Story" : "Start New Round"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isSetStoryMode
              ? "Set the story or ticket name for the current voting round."
              : "Select a Jira issue or enter details manually for this round."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-4 space-y-4">
          {/* Jira Ticket Selector - always shown, handles its own loading/error states */}
          <JiraTicketSelector
            onSelect={(issue) => {
              setName(issue.summary);
              setTicketNumber(issue.key);
              setSelectedCloudId(issue.cloudId);
            }}
            selectedIssueKey={ticketNumber || undefined}
            cloudId={selectedCloudId}
          />

          {/* Always show ticket fields */}
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
              <Label
                htmlFor="ticket-number"
                className="flex items-center gap-2"
              >
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
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? isSetStoryMode
                ? "Setting..."
                : "Starting..."
              : isSetStoryMode
                ? "Set Story"
                : "Start Round"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
