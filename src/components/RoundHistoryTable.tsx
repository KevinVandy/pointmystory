import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, ChevronRight, Edit2, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Type for round data from the API
interface Round {
  _id: Id<"rounds">;
  roomId: Id<"rooms">;
  name?: string;
  ticketNumber?: string;
  createdAt: number;
  revealedAt?: number;
  isRevealed: boolean;
  finalScore?: string;
  averageScore?: number;
  medianScore?: number;
  unsureCount?: number;
  roundNumber: number;
}

interface RoundHistoryTableProps {
  roomId: Id<"rooms">;
  isAdmin: boolean;
  currentRoundId?: Id<"rounds">;
  pointScalePreset?: string;
  pointScale?: string[];
  demoSessionId?: string;
}

// Mapping for t-shirt sizes to numeric values
const TSHIRT_SIZE_MAP: Record<string, number> = {
  XS: 1,
  S: 2,
  M: 3,
  L: 5,
  XL: 8,
};

// Reverse mapping: number to t-shirt size (for display)
const NUMBER_TO_TSHIRT: Record<number, string> = {
  1: "XS",
  2: "S",
  3: "M",
  5: "L",
  8: "XL",
};

/**
 * Convert a number back to t-shirt size (finds closest match).
 * Returns the number as string if no t-shirt size matches.
 */
function numberToTShirtSize(num: number): string {
  // Find closest t-shirt size
  const tshirtValues = Object.values(TSHIRT_SIZE_MAP).sort((a, b) => a - b);
  let closest = tshirtValues[0];
  let minDiff = Math.abs(num - closest);

  for (const val of tshirtValues) {
    const diff = Math.abs(num - val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = val;
    }
  }

  return NUMBER_TO_TSHIRT[closest] || num.toFixed(1);
}

/**
 * Round a number to the nearest value in the point scale.
 * Handles numeric values and t-shirt sizes.
 */
function roundToNearestPointScale(
  num: number | undefined | null,
  pointScale: string[] | undefined,
  pointScalePreset?: string,
): string | null {
  if (
    num === undefined ||
    num === null ||
    !pointScale ||
    pointScale.length === 0
  ) {
    return null;
  }

  const isTShirtScale = pointScalePreset === "tshirt";

  // For t-shirt sizes, convert number to nearest t-shirt size
  if (isTShirtScale) {
    return numberToTShirtSize(num);
  }

  // For numeric scales, find the closest numeric value
  const numericValues = pointScale
    .filter((v) => v !== "?")
    .map((v) => parseFloat(v))
    .filter((v) => !isNaN(v))
    .sort((a, b) => a - b);

  if (numericValues.length === 0) {
    return null;
  }

  // Find the closest numeric value
  let closest = numericValues[0];
  let minDiff = Math.abs(num - closest);

  for (const val of numericValues) {
    const diff = Math.abs(num - val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = val;
    }
  }

  // Return as string, matching the format in point scale (e.g., "8" not "8.0")
  const closestStr = closest.toString();
  return pointScale.includes(closestStr) ? closestStr : closest.toFixed(1);
}

export function RoundHistoryTable({
  roomId,
  isAdmin,
  currentRoundId,
  pointScalePreset,
  pointScale,
  demoSessionId,
}: RoundHistoryTableProps) {
  const rounds = useQuery(api.rounds.listByRoom, { roomId });

  // Filter to show all revealed rounds (completed rounds)
  // Include the current round if it's been revealed
  const completedRounds = React.useMemo(() => {
    if (!rounds) return [];
    return rounds.filter((round) => round.isRevealed);
  }, [rounds]);

  const columns = React.useMemo<ColumnDef<Round>[]>(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-8 w-8"
            onClick={() => row.toggleExpanded()}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ),
      },
      {
        accessorKey: "roundNumber",
        header: "#",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.roundNumber}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Ticket",
        cell: ({ row }) => (
          <span className="truncate max-w-[150px] block">
            {row.original.name || "-"}
          </span>
        ),
      },
      {
        accessorKey: "ticketNumber",
        header: "Ticket #",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.ticketNumber || "-"}
          </span>
        ),
      },
      {
        accessorKey: "finalScore",
        header: "Final",
        cell: ({ row }) => (
          <EditableFinalScore
            round={row.original}
            isAdmin={isAdmin}
            demoSessionId={demoSessionId}
            pointScalePreset={pointScalePreset}
            pointScale={pointScale}
          />
        ),
      },
      {
        accessorKey: "averageScore",
        header: "Avg",
        cell: ({ row }) => {
          const isTShirtScale = pointScalePreset === "tshirt";
          const value = row.original.averageScore;
          if (value === undefined || value === null) {
            return <span className="text-muted-foreground">-</span>;
          }
          const displayValue = isTShirtScale
            ? numberToTShirtSize(value)
            : value.toFixed(1);
          return <span className="text-muted-foreground">{displayValue}</span>;
        },
      },
      {
        accessorKey: "medianScore",
        header: "Med",
        cell: ({ row }) => {
          const isTShirtScale = pointScalePreset === "tshirt";
          const value = row.original.medianScore;
          if (value === undefined || value === null) {
            return <span className="text-muted-foreground">-</span>;
          }
          const displayValue = isTShirtScale
            ? numberToTShirtSize(value)
            : value.toString();
          return <span className="text-muted-foreground">{displayValue}</span>;
        },
      },
      {
        accessorKey: "unsureCount",
        header: "?",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.unsureCount ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "revealedAt",
        header: "Date",
        cell: ({ row }) => {
          if (!row.original.revealedAt) return "-";
          return (
            <span className="text-xs text-muted-foreground">
              {new Date(row.original.revealedAt).toLocaleDateString()}
            </span>
          );
        },
      },
    ],
    [isAdmin, pointScalePreset, pointScale, demoSessionId],
  );

  const table = useReactTable({
    data: completedRounds,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  if (!rounds) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        Round History ({completedRounds.length})
      </h3>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isCurrentRound = currentRoundId
                  ? row.original._id === currentRoundId
                  : false;
                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsExpanded() && "expanded"}
                      className={cn(isCurrentRound && "font-bold")}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn("py-2", isCurrentRound && "font-bold")}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="p-0">
                          <RoundVoteDetails roundId={row.original._id} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No completed rounds yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Editable final score cell component
function EditableFinalScore({
  round,
  isAdmin,
  demoSessionId,
  pointScalePreset,
  pointScale,
}: {
  round: Round;
  isAdmin: boolean;
  demoSessionId?: string;
  pointScalePreset?: string;
  pointScale?: string[];
}) {
  const [open, setOpen] = useState(false);
  const setFinalScore = useMutation(api.rounds.setFinalScore);

  // Calculate default value from average or median score
  const defaultScore = React.useMemo(() => {
    if (!pointScale || pointScale.length === 0) return null;
    const scoreToUse = round.averageScore ?? round.medianScore;
    return roundToNearestPointScale(scoreToUse, pointScale, pointScalePreset);
  }, [round.averageScore, round.medianScore, pointScale, pointScalePreset]);

  // Use finalScore if set, otherwise use default
  const displayValue = round.finalScore || defaultScore || "-";
  const [value, setValue] = useState((round.finalScore || defaultScore || "").toString());

  // Update local value when round changes
  React.useEffect(() => {
    setValue((round.finalScore || defaultScore || "").toString());
  }, [round.finalScore, defaultScore]);

  const handleSave = async (scoreValue?: string) => {
    // Use provided value, trimmed value, or default
    const finalValue = (scoreValue || value.trim() || (defaultScore || "").toString()).toString();
    if (finalValue) {
      try {
        await setFinalScore({
          roundId: round._id,
          finalScore: finalValue,
          demoSessionId,
        });
        setOpen(false);
      } catch (error) {
        console.error("Failed to set final score:", error);
      }
    } else {
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setValue((round.finalScore || defaultScore || "").toString());
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1 group">
      <span
        className={cn(
          "font-bold",
          round.finalScore ? "text-primary" : "text-muted-foreground",
        )}
      >
        {displayValue}
      </span>
      {isAdmin && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger className="focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0">
            <Edit2 className="h-3 w-3" />
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium">Final Score</label>
                <div className="flex flex-wrap gap-2">
                  {pointScale && pointScale.length > 0 ? (
                    pointScale.map((scaleValue) => (
                      <Button
                        key={scaleValue}
                        variant={value === scaleValue ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setValue(scaleValue);
                          handleSave(scaleValue);
                        }}
                        className="min-w-12"
                      >
                        {scaleValue}
                      </Button>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No point scale available
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

// Expanded row showing vote details
function RoundVoteDetails({ roundId }: { roundId: Id<"rounds"> }) {
  const roundWithVotes = useQuery(api.rounds.getWithVotes, { roundId });

  // undefined means still loading
  if (roundWithVotes === undefined) {
    return (
      <div className="p-4 bg-muted/30 text-center text-sm text-muted-foreground">
        Loading votes...
      </div>
    );
  }

  // null means round not found or access denied
  if (roundWithVotes === null) {
    return (
      <div className="p-4 bg-muted/30 text-center text-sm text-muted-foreground">
        Unable to load votes for this round.
      </div>
    );
  }

  if (!roundWithVotes.votes || roundWithVotes.votes.length === 0) {
    return (
      <div className="p-4 bg-muted/30 text-center text-sm text-muted-foreground">
        No votes recorded for this round.
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/30">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {roundWithVotes.votes.map((vote) => (
          <div
            key={vote._id}
            className="flex items-center gap-2 bg-background rounded-lg p-2 border"
          >
            {vote.participantAvatar ? (
              <img
                src={vote.participantAvatar}
                alt={vote.participantName}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <User className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
            <span className="text-xs truncate flex-1">
              {vote.participantName}
            </span>
            <span className="font-bold text-sm">{vote.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
