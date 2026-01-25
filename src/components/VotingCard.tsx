import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, LogIn } from "lucide-react";
import { SignInButton } from "@clerk/tanstack-react-start";
import { NewRoundDialog } from "./NewRoundDialog";
import { VotingCardGrid } from "./VotingChoiceButton";
import type { Id } from "../../convex/_generated/dataModel";

interface VotingCardProps {
  roomId: Id<"rooms">;
  currentStory?: string;
  currentRoundName?: string;
  currentTicketNumber?: string;
  isRevealed: boolean;
  isAdmin: boolean;
  isClosed: boolean;
  isAuthenticated: boolean;
  isReadOnlyViewer: boolean;
  isObserver: boolean;
  currentVote: { value: string } | null;
  pointScale: string[];
  onVote: (value: string) => void;
  demoSessionId?: string;
}

export function VotingCard({
  roomId,
  currentStory,
  currentRoundName,
  currentTicketNumber,
  isRevealed,
  isAdmin,
  isClosed,
  isAuthenticated: _isAuthenticated,
  isReadOnlyViewer,
  isObserver,
  currentVote,
  pointScale,
  onVote,
  demoSessionId,
}: VotingCardProps) {
  const displayStory = currentRoundName || currentStory || currentTicketNumber;

  return (
    <Card>
      <CardContent className="pt-4 relative">
        {/* Voting On heading - top left on desktop, above content on mobile */}
        {displayStory && (
          <>
            {/* Mobile: above participant toggle */}
            <div className="mb-4 lg:hidden text-center">
              <p className="text-sm text-muted-foreground">
                Voting on: <span className="font-medium">{displayStory}</span>
                {currentTicketNumber &&
                  currentTicketNumber !== displayStory && (
                    <span className="ml-2 font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      {currentTicketNumber}
                    </span>
                  )}
              </p>
            </div>
            {/* Desktop: absolute positioned top left */}
            <div className="hidden lg:block absolute top-4 left-6">
              <p className="text-sm text-muted-foreground">
                Voting on: <span className="font-medium">{displayStory}</span>
                {currentTicketNumber &&
                  currentTicketNumber !== displayStory && (
                    <span className="ml-2 font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      {currentTicketNumber}
                    </span>
                  )}
              </p>
            </div>
          </>
        )}

        {/* Set Story Button - top right for hosts on desktop, above toggle on mobile */}
        {isAdmin && !isClosed && !isRevealed && (
          <>
            {/* Mobile: above mode toggle */}
            <div className="flex justify-center mb-4 lg:hidden">
              <NewRoundDialog
                roomId={roomId}
                mode="setStory"
                initialName={currentRoundName || currentStory}
                initialTicketNumber={currentTicketNumber}
                trigger={
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Set Story
                  </Button>
                }
                onStoryUpdated={() => {
                  // Story will be updated via the mutation, no need for callback
                }}
                demoSessionId={demoSessionId}
              />
            </div>
            {/* Desktop: absolute positioned top right */}
            <div className="hidden lg:block absolute top-4 right-6">
              <NewRoundDialog
                roomId={roomId}
                mode="setStory"
                initialName={currentRoundName || currentStory}
                initialTicketNumber={currentTicketNumber}
                trigger={
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Set Story
                  </Button>
                }
                onStoryUpdated={() => {
                  // Story will be updated via the mutation, no need for callback
                }}
                demoSessionId={demoSessionId}
              />
            </div>
          </>
        )}

        <h2 className="text-lg font-semibold mb-6 text-center">
          {isReadOnlyViewer
            ? "Viewing Session"
            : isObserver
              ? "Observing"
              : isRevealed
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
          onSelect={onVote}
          isDisabled={isRevealed || isReadOnlyViewer || isClosed}
          isObserver={isObserver}
          pointScale={pointScale}
        />
      </CardContent>
    </Card>
  );
}
