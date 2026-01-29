import { useState } from "react";
import { useThrottledCallback } from "@tanstack/react-pacer";
import { cn } from "@/lib/utils";

interface VotingChoiceButtonProps {
  value: string;
  index: number; // Position in the array
  isSelected: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

// Emoji pools for different score tiers
const VERY_LOW_EMOJIS = ["😇", "🤩", "🤣", "😜"]; // Very happy - easy task
const LOW_EMOJIS = ["😊", "😉", "😃", "😁"]; // Very happy - easy task
const MIDDLE_LOW_EMOJIS = ["😊", "😌", "🙂", "🤗"]; // Happy - straightforward
const MIDDLE_EMOJIS = ["😅", "🤔", "😐", "🫤", "😶"]; // Neutral/thinking - moderate complexity
const MIDDLE_HIGH_EMOJIS = ["😬", "🥱", "🤔", "🧐", "🥴"]; // Slight concern - getting complex
const HIGH_EMOJIS = ["😕", "😟", "😲", "😮‍💨", "🥺"]; // Concerned - high complexity
const VERY_HIGH_EMOJIS = ["😢", "😰", "😨", "🥸", "😫"]; // Worried - very high complexity
const CONCERNINGLY_HIGH_EMOJIS = ["😭", "🤯", "😱", "😵‍💫", "🫣"]; // Panic - extremely high complexity
const QUESTION_EMOJIS = ["🤷", "🤷‍♂️", "🤷‍♀️", "🙈"]; // Shrug - uncertain

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Function to get emoji array based on array position
function getEmojiArrayForIndex(index: number, value: string): string[] {
  // Handle "?" case - Question tier (regardless of position)
  if (value === "?") {
    return QUESTION_EMOJIS;
  }

  // First 2 items (index 0, 1) = Low
  if (index < 2) {
    return VERY_LOW_EMOJIS;
  }

  // Index 2 = Middle Low
  if (index === 2) {
    return LOW_EMOJIS;
  }

  // Index 3 = Middle Low
  if (index === 3) {
    return MIDDLE_LOW_EMOJIS;
  }

  // Index 4 = Middle
  if (index === 4) {
    return MIDDLE_EMOJIS;
  }

  // Index 5 = Middle High
  if (index === 5) {
    return MIDDLE_HIGH_EMOJIS;
  }

  // Index 6 = High
  if (index === 6) {
    return HIGH_EMOJIS;
  }

  // Index 7 = Very High
  if (index === 7) {
    return VERY_HIGH_EMOJIS;
  }

  // Index 7+ (if it's a number) = Concerningly High
  // Check if value is a number (not "?")
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    return CONCERNINGLY_HIGH_EMOJIS;
  }

  // Fallback
  return MIDDLE_EMOJIS;
}

export function VotingChoiceButton({
  value,
  index,
  isSelected,
  isDisabled,
  onClick,
}: VotingChoiceButtonProps) {
  const [emojis, setEmojis] = useState<Array<{ id: number; emoji: string }>>(
    [],
  );

  const handleClick = useThrottledCallback(
    () => {
      if (isDisabled) return;

      // Get the emoji array for this tier, shuffle it, and take first 4
      const emojiArray = getEmojiArrayForIndex(index, value);
      const shuffled = shuffleArray(emojiArray);
      const selectedEmojis = shuffled.slice(0, 4).filter((emoji) => emoji); // Filter out empty strings

      const newEmojis = selectedEmojis.map((emoji, i) => ({
        id: Date.now() + i,
        emoji,
      }));
      setEmojis((prev) => [...prev, ...newEmojis]);

      // Remove emojis after animation completes
      setTimeout(() => {
        setEmojis((prev) =>
          prev.filter((e) => !newEmojis.some((ne) => ne.id === e.id)),
        );
      }, 2000);

      onClick();
    },
    { wait: 500 }, // Half a second throttle
  );

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        "relative flex items-center justify-center w-16 h-20 rounded-xl border-2 text-xl font-bold transition-all duration-200 cursor-pointer overflow-visible",
        "hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isSelected
          ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
          : "border-border bg-card text-card-foreground hover:border-primary/50",
        isDisabled && "opacity-50 cursor-not-allowed hover:scale-100",
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
      {/* Animated emojis */}
      {emojis.map((emojiData) => {
        const randomOffset = (Math.random() - 0.5) * 100; // -50px to +50px (much wider spread)
        const randomDelay = Math.random() * 0.2; // 0 to 0.2s delay
        const horizontalSpread = (Math.random() - 0.5) * 120; // Much wider horizontal spread for animation
        return (
          <span
            key={emojiData.id}
            className="absolute pointer-events-none text-2xl animate-emoji-pop"
            style={
              {
                left: `calc(50% + ${randomOffset}px)`,
                bottom: "100%",
                animationDelay: `${randomDelay}s`,
                "--emoji-x-offset": `${horizontalSpread}px`, // Much wider horizontal spread as they float
              } as React.CSSProperties & { "--emoji-x-offset": string }
            }
          >
            {emojiData.emoji}
          </span>
        );
      })}
    </button>
  );
}

interface VotingCardGridProps {
  selectedValue: string | null;
  onSelect: (value: string) => void;
  isDisabled?: boolean;
  isObserver?: boolean;
  pointScale?: string[];
}

export function VotingCardGrid({
  selectedValue,
  onSelect,
  isDisabled,
  isObserver = false,
  pointScale,
}: VotingCardGridProps) {
  // Observers cannot vote
  const canVote = !isObserver && !isDisabled;

  // If observer, only show the message, not the voting cards
  if (isObserver) {
    return (
      <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg py-3 px-4">
        You are observing. Switch to voter mode to cast a vote.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {pointScale?.map((value, index) => (
        <VotingChoiceButton
          key={value}
          value={value}
          index={index}
          isSelected={selectedValue === value}
          isDisabled={!canVote}
          onClick={() => canVote && onSelect(value)}
        />
      ))}
    </div>
  );
}
