import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle } from "lucide-react";

interface VotingTimerProps {
  timerEndsAt: number | null | undefined;
  timerStartedAt: number | null | undefined;
  className?: string;
}

export function VotingTimer({
  timerEndsAt,
  timerStartedAt,
  className,
}: VotingTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!timerEndsAt || !timerStartedAt) {
      setTimeRemaining(null);
      setIsExpired(false);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((timerEndsAt - now) / 1000));
      setTimeRemaining(remaining);
      setIsExpired(remaining === 0);
    };

    // Initial update
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [timerEndsAt, timerStartedAt]);

  if (timeRemaining === null) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const isLowTime = timeRemaining > 0 && timeRemaining <= 30;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold transition-colors",
        isExpired
          ? "bg-destructive/10 text-destructive animate-pulse"
          : isLowTime
            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
            : "bg-primary/10 text-primary",
        className,
      )}
    >
      {isExpired ? (
        <>
          <AlertTriangle className="size-5" />
          <span>Time's up!</span>
        </>
      ) : (
        <>
          <Clock className={cn("size-5", isLowTime && "animate-pulse")} />
          <span>{formattedTime}</span>
        </>
      )}
    </div>
  );
}

// Compact version for the header
export function VotingTimerCompact({
  timerEndsAt,
  timerStartedAt,
}: VotingTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!timerEndsAt || !timerStartedAt) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((timerEndsAt - now) / 1000));
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [timerEndsAt, timerStartedAt]);

  if (timeRemaining === null) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const isExpired = timeRemaining === 0;
  const isLowTime = timeRemaining > 0 && timeRemaining <= 30;

  return (
    <span
      className={cn(
        "font-mono font-bold",
        isExpired
          ? "text-destructive"
          : isLowTime
            ? "text-orange-600 dark:text-orange-400"
            : "text-primary",
      )}
    >
      {isExpired ? "0:00" : formattedTime}
    </span>
  );
}
