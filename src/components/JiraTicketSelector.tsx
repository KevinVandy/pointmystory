import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ExternalLink } from "lucide-react";
import { useDebounce } from "@/lib/useDebounce";

interface JiraResource {
  cloudId: string;
  name: string;
  url: string;
  scopes: string[];
  avatarUrl?: string;
}

interface JiraIssue {
  key: string;
  summary: string;
  status?: string;
  assignee?: string;
  project?: string;
}

interface JiraTicketSelectorProps {
  onSelect: (issue: { key: string; summary: string; cloudId: string }) => void;
  selectedIssueKey?: string;
  cloudId?: string;
}

export function JiraTicketSelector({
  onSelect,
  selectedIssueKey,
  cloudId: initialCloudId,
}: JiraTicketSelectorProps) {
  const [selectedCloudId, setSelectedCloudId] = useState<string | undefined>(
    initialCloudId,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<JiraIssue | null>(null);
  const [resources, setResources] = useState<JiraResource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [resourcesError, setResourcesError] = useState<string | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const anchorRef = useComboboxAnchor();
  const searchAnchorRef = useComboboxAnchor();
  const inputRef = useRef<HTMLInputElement>(null);

  // Get action functions
  const getAccessibleResources = useAction(api.jira.getAccessibleResources);
  const searchIssues = useAction(api.jira.searchIssues);

  // Fetch accessible resources
  useEffect(() => {
    let cancelled = false;
    setIsLoadingResources(true);
    setResourcesError(null);

    getAccessibleResources({})
      .then((result) => {
        if (cancelled) return;
        setIsLoadingResources(false);
        if (result.success) {
          setResources(result.resources || []);
          // Auto-select first resource if only one is available
          if (
            result.resources &&
            result.resources.length === 1 &&
            !selectedCloudId
          ) {
            setSelectedCloudId(result.resources[0].cloudId);
          }
        } else {
          setResourcesError(result.error || "Failed to load Jira sites");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setIsLoadingResources(false);
        setResourcesError(error.message || "Failed to load Jira sites");
      });

    return () => {
      cancelled = true;
    };
  }, [getAccessibleResources, selectedCloudId]);

  // Build JQL query from search input
  const jqlQuery = useMemo(() => {
    if (!searchQuery.trim()) return undefined;

    const trimmed = searchQuery.trim();

    // If it contains JQL operators, use it as-is
    if (
      trimmed.includes("=") ||
      trimmed.includes("AND") ||
      trimmed.includes("OR") ||
      trimmed.includes("ORDER BY")
    ) {
      return trimmed;
    }

    // Otherwise, search in summary and key
    return `(summary ~ "${trimmed}" OR key ~ "${trimmed}") ORDER BY updated DESC`;
  }, [searchQuery]);

  // Debounce search query
  const debouncedJqlQuery = useDebounce(jqlQuery, 300);

  // Fetch issues with debounced query
  useEffect(() => {
    if (!selectedCloudId || !debouncedJqlQuery) {
      setIssues([]);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchError(null);

    searchIssues({
      cloudId: selectedCloudId,
      jql: debouncedJqlQuery,
      maxResults: 50,
    })
      .then((result) => {
        if (cancelled) return;
        setIsSearching(false);
        if (result.success) {
          setIssues(result.issues || []);
          // Update selected issue if selectedIssueKey matches
          if (selectedIssueKey) {
            const issue = result.issues?.find(
              (i) => i.key === selectedIssueKey,
            );
            if (issue) {
              setSelectedIssue(issue);
            }
          }
        } else {
          setSearchError(result.error || "Failed to search issues");
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setIsSearching(false);
        setSearchError(error.message || "Failed to search issues");
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCloudId, debouncedJqlQuery, searchIssues, selectedIssueKey]);

  const handleIssueSelect = (issue: JiraIssue) => {
    if (!selectedCloudId) return;
    setSelectedIssue(issue);
    onSelect({
      key: issue.key,
      summary: issue.summary,
      cloudId: selectedCloudId,
    });
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    // Open combobox when user types
    setIsComboboxOpen(!!value.trim());
    // If search is cleared, clear selected issue
    if (!value.trim()) {
      setSelectedIssue(null);
      setIsComboboxOpen(false);
    }
    // Keep focus on input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  }, []);

  // Return null if no Atlassian account connected or if there's an error (don't show anything, let manual input be used)
  if (resourcesError || (!isLoadingResources && resources.length === 0)) {
    return null;
  }

  // Show loading state
  if (isLoadingResources) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading Jira sites...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Site selector (if multiple sites) */}
      {resources.length > 1 && (
        <div className="space-y-2">
          <Label>Jira Site</Label>
          <Combobox
            value={selectedCloudId || ""}
            onValueChange={(value) => {
              setSelectedCloudId(value || undefined);
              setSearchQuery("");
              setSelectedIssue(null);
            }}
          >
            <div ref={anchorRef} className="w-full">
              <ComboboxInput
                placeholder="Select a Jira site..."
                showClear={!!selectedCloudId}
              />
              <ComboboxContent anchor={anchorRef}>
                <ComboboxList>
                  {resources.map((resource) => (
                    <ComboboxItem
                      key={resource.cloudId}
                      value={resource.cloudId}
                    >
                      <div className="flex items-center gap-2">
                        {resource.avatarUrl && (
                          <img
                            src={resource.avatarUrl}
                            alt=""
                            className="w-4 h-4 rounded"
                          />
                        )}
                        <span>{resource.name}</span>
                        <span className="text-muted-foreground text-xs">
                          (
                          {resource.url
                            .replace("https://", "")
                            .replace(".atlassian.net", "")}
                          )
                        </span>
                      </div>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </div>
          </Combobox>
        </div>
      )}

      {/* Issue search */}
      {selectedCloudId && (
        <div className="space-y-2">
          <Label>Search Jira Issues</Label>
          <div className="space-y-2">
            <div ref={searchAnchorRef} className="w-full">
              <Input
                ref={inputRef}
                placeholder='Search by issue key (e.g., "PROJ-123") or summary...'
                value={searchQuery}
                onChange={(e) => {
                  handleSearchChange(e.target.value);
                }}
                onBlur={() => {
                  // Don't lose focus if clicking on combobox items
                  // Use a small delay to check if focus moved to combobox
                  setTimeout(() => {
                    if (
                      !document.activeElement?.closest(
                        '[data-slot="combobox-content"]',
                      )
                    ) {
                      // Focus didn't move to combobox, allow blur
                      return;
                    }
                    // Focus moved to combobox, keep input focused
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }, 0);
                }}
                autoFocus
              />
            </div>
            {searchQuery.trim() && (
              <Combobox
                value={selectedIssue?.key || ""}
                open={isComboboxOpen}
                onOpenChange={setIsComboboxOpen}
                onValueChange={(value) => {
                  const issue = issues.find((i) => i.key === value);
                  if (issue) {
                    handleIssueSelect(issue);
                    setSearchQuery(issue.key); // Update search query to show selected issue
                    setIsComboboxOpen(false); // Close after selection
                  }
                }}
              >
                <ComboboxContent anchor={searchAnchorRef}>
                  <ComboboxList>
                    {isSearching && (
                      <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Searching...</span>
                      </div>
                    )}
                    {searchError && (
                      <div className="px-3 py-2 text-sm text-destructive">
                        {searchError}
                      </div>
                    )}
                    {!isSearching && !searchError && issues.length === 0 && (
                      <ComboboxEmpty>
                        No issues found. Try a different search.
                      </ComboboxEmpty>
                    )}
                    {issues.map((issue) => (
                      <ComboboxItem key={issue.key} value={issue.key}>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-sm">
                              {issue.key}
                            </span>
                            {issue.status && (
                              <span className="text-xs text-muted-foreground">
                                {issue.status}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {issue.summary}
                          </span>
                          {issue.assignee && (
                            <span className="text-xs text-muted-foreground">
                              Assigned to: {issue.assignee}
                            </span>
                          )}
                        </div>
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            )}
            {selectedIssue && resources.length > 0 && (
              <div className="mt-2">
                <a
                  href={`${resources.find((r) => r.cloudId === selectedCloudId)?.url}/browse/${selectedIssue.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium inline-flex items-center gap-1.5"
                >
                  {selectedIssue.key}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedCloudId && resources.length > 0 && (
        <Alert>
          <AlertDescription>
            Please select a Jira site above to search for issues.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
