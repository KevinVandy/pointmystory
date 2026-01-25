import { voteValueToNumber, numberToTShirtSize } from "./participantUtils";

export interface Vote {
  value: string | null;
  hasVoted: boolean;
}

interface VoteSummaryProps {
  votes: Vote[];
  pointScalePreset?: string;
}

export function VoteSummary({
  votes,
  pointScalePreset,
}: VoteSummaryProps) {
  const numericVotes = votes
    .map((v) => voteValueToNumber(v.value))
    .filter((v): v is number => v !== null);

  if (numericVotes.length === 0) {
    return null;
  }

  const average = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
  const sortedVotes = [...numericVotes].sort((a, b) => a - b);
  const median =
    sortedVotes.length % 2 === 0
      ? (sortedVotes[sortedVotes.length / 2 - 1] +
          sortedVotes[sortedVotes.length / 2]) /
        2
      : sortedVotes[Math.floor(sortedVotes.length / 2)];

  const questionMarks = votes.filter((v) => v.value === "?").length;

  // Check if we should display as t-shirt sizes
  const isTShirtScale = pointScalePreset === "tshirt";
  const displayAverage = isTShirtScale
    ? numberToTShirtSize(average)
    : average.toFixed(1);
  const displayMedian = isTShirtScale
    ? numberToTShirtSize(median)
    : median.toString();

  return (
    <div className="pt-4 border-t">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Vote Summary
      </h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-lg font-bold">{displayAverage}</p>
          <p className="text-[10px] text-muted-foreground">Average</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-lg font-bold">{displayMedian}</p>
          <p className="text-[10px] text-muted-foreground">Median</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2">
          <p className="text-lg font-bold">{questionMarks}</p>
          <p className="text-[10px] text-muted-foreground">Unsure</p>
        </div>
      </div>
    </div>
  );
}
