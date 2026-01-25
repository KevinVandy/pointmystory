import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, LogIn, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { SignInButton } from "@clerk/tanstack-react-start";
import { NewRoundDialog } from "./NewRoundDialog";
import { VotingCardGrid } from "./VotingChoiceButton";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface VotingCardProps {
  roomId: Id<"rooms">;
  currentStory?: string;
  currentRoundName?: string;
  currentTicketNumber?: string;
  jiraCloudId?: string;
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

interface JiraIssueDetails {
  key: string;
  summary: string;
  description?: string | { content?: any[]; type?: string; version?: number };
  status?: string;
  assignee?: string;
  project?: string;
}

// Helper function to extract text from Jira ADF (Atlassian Document Format)
function extractTextFromADF(adf: any): string {
  if (typeof adf === "string") {
    return adf;
  }
  if (!adf || typeof adf !== "object") {
    return "";
  }
  
  // If it's an ADF document, extract text from content
  if (adf.content && Array.isArray(adf.content)) {
    return adf.content
      .map((node: any) => {
        if (node.type === "text" && node.text) {
          return node.text;
        }
        if (node.content && Array.isArray(node.content)) {
          return extractTextFromADF(node);
        }
        return "";
      })
      .join("")
      .trim();
  }
  
  return "";
}

function JiraIssueDescription({
  ticketNumber,
  cloudId,
}: {
  ticketNumber: string;
  cloudId: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [issueDetails, setIssueDetails] = useState<JiraIssueDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getIssue = useAction(api.jira.getIssue);

  useEffect(() => {
    if (isExpanded && !issueDetails && !isLoading && !error) {
      setIsLoading(true);
      getIssue({
        cloudId,
        issueKey: ticketNumber,
      })
        .then((result) => {
          if (result.success && result.issue) {
            setIssueDetails(result.issue);
          } else {
            setError(result.error || "Failed to load issue details");
          }
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Failed to load issue details");
          setIsLoading(false);
        });
    }
  }, [isExpanded, cloudId, ticketNumber, getIssue, issueDetails, isLoading, error]);

  if (!ticketNumber || !cloudId) return null;

  return (
    <div className="mt-3 border-t pt-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between text-sm"
      >
        <span className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {isExpanded ? "Hide" : "Show"} Jira Description
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading issue details...</span>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
          {issueDetails && (
            <div className="space-y-3 text-sm">
              {issueDetails.description && (
                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <div className="text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
                    {extractTextFromADF(issueDetails.description) || "No description available"}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {issueDetails.status && (
                  <span>
                    <strong>Status:</strong> {issueDetails.status}
                  </span>
                )}
                {issueDetails.assignee && (
                  <span>
                    <strong>Assignee:</strong> {issueDetails.assignee}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function VotingCard({
  roomId,
  currentStory,
  currentRoundName,
  currentTicketNumber,
  jiraCloudId,
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
  const displayTicketNumber = currentTicketNumber;

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header section with story info and Set Story button */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          {/* Story/Ticket Info */}
          {displayStory && (
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Voting on</p>
                  <h3 className="text-lg font-semibold break-words">
                    {displayStory}
                  </h3>
                  {displayTicketNumber &&
                    displayTicketNumber !== displayStory && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {displayTicketNumber}
                        </span>
                        {jiraCloudId && (
                          <a
                            href={`https://api.atlassian.com/ex/jira/${jiraCloudId}/browse/${displayTicketNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View in Jira
                          </a>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Set Story Button */}
          {isAdmin && !isClosed && !isRevealed && (
            <div className="shrink-0">
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
          )}
        </div>

        {/* Jira Description (if ticket number and cloudId are available) */}
        {displayTicketNumber && jiraCloudId && (
          <JiraIssueDescription
            ticketNumber={displayTicketNumber}
            cloudId={jiraCloudId}
          />
        )}

        {/* Voting Status Heading */}
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
