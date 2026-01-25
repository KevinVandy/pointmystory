import { cn } from "@/lib/utils";

interface VotingCardProps {
  value: string;
  isSelected: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

export function VotingCard({
  value,
  isSelected,
  isDisabled,
  onClick,
}: VotingCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "relative flex items-center justify-center w-20 h-28 rounded-xl border-2 text-2xl font-bold transition-all duration-200",
        "hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isSelected
          ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
          : "border-border bg-card text-card-foreground hover:border-primary/50",
        isDisabled && "opacity-50 cursor-not-allowed hover:scale-100"
      )}
    >
      <span className="select-none">{value}</span>
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background flex items-center justify-center">
          <svg
            className="w-2.5 h-2.5 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </button>
  );
}

// Fibonacci point values
export const POINT_VALUES = ["1", "2", "3", "5", "8", "13", "21", "?"] as const;

interface VotingCardGridProps {
  selectedValue: string | null;
  onSelect: (value: string) => void;
  isDisabled?: boolean;
}

export function VotingCardGrid({
  selectedValue,
  onSelect,
  isDisabled,
}: VotingCardGridProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {POINT_VALUES.map((value) => (
        <VotingCard
          key={value}
          value={value}
          isSelected={selectedValue === value}
          isDisabled={isDisabled}
          onClick={() => onSelect(value)}
        />
      ))}
    </div>
  );
}
