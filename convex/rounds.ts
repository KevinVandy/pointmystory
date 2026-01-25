import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRoomAdmin, canViewRoomWithoutAuth } from "./permissions";

// Create a new round for a room
export const create = mutation({
  args: {
    roomId: v.id("rooms"),
    name: v.optional(v.string()),
    ticketNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Create the new round
    const roundId = await ctx.db.insert("rounds", {
      roomId: args.roomId,
      name: args.name,
      ticketNumber: args.ticketNumber,
      createdAt: Date.now(),
      isRevealed: false,
    });

    // Update room to point to this new round and reset state
    await ctx.db.patch(args.roomId, {
      currentRoundId: roundId,
      currentStory: args.name || args.ticketNumber || undefined,
      timerStartedAt: undefined,
      timerEndsAt: undefined,
    });

    return roundId;
  },
});

// List all rounds for a room (for history table)
export const listByRoom = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return [];
    }

    // Check if user can view this room
    if (!canViewRoomWithoutAuth(room)) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Authentication required to view this room");
      }
    }

    // Get all rounds for this room, sorted by createdAt descending
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Sort by createdAt descending (newest first) and add round numbers
    const sortedRounds = rounds.sort((a, b) => b.createdAt - a.createdAt);
    
    // Calculate round numbers (oldest = 1)
    const roundsWithNumbers = sortedRounds.map((round, index) => ({
      ...round,
      roundNumber: rounds.length - index,
    }));

    return roundsWithNumbers;
  },
});

// Get a round with its vote details (for expanded view)
export const getWithVotes = query({
  args: {
    roundId: v.id("rounds"),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) {
      return null;
    }

    const room = await ctx.db.get(round.roomId);
    if (!room) {
      return null;
    }

    // Check if user can view this room
    if (!canViewRoomWithoutAuth(room)) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        // Return null instead of throwing - allows UI to handle gracefully
        return null;
      }
    }

    // Get all votes for this round
    // Try with index first, fallback to filter if needed
    let votes = await ctx.db
      .query("votes")
      .withIndex("by_round", (q) => q.eq("roundId", args.roundId))
      .collect();
    
    // Fallback: if no votes found with index, try filtering by roomId and roundId
    // This handles cases where index might not be populated yet
    if (votes.length === 0) {
      const allRoomVotes = await ctx.db
        .query("votes")
        .withIndex("by_room", (q) => q.eq("roomId", round.roomId))
        .collect();
      votes = allRoomVotes.filter((vote) => vote.roundId === args.roundId);
    }

    // Get participant details for each vote
    const votesWithParticipants = await Promise.all(
      votes.map(async (vote) => {
        const participant = await ctx.db.get(vote.participantId);
        return {
          ...vote,
          participantName: participant?.name ?? "Unknown",
          participantAvatar: participant?.avatarUrl,
        };
      })
    );

    return {
      ...round,
      votes: votesWithParticipants,
    };
  },
});

// Set or update the final score for a round (admin only)
export const setFinalScore = mutation({
  args: {
    roundId: v.id("rounds"),
    finalScore: v.string(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) {
      throw new Error("Round not found");
    }

    await requireRoomAdmin(ctx, round.roomId);

    await ctx.db.patch(args.roundId, {
      finalScore: args.finalScore,
    });
  },
});

// Get the current round for a room
export const getCurrentRound = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || !room.currentRoundId) {
      return null;
    }

    return await ctx.db.get(room.currentRoundId);
  },
});

// Mapping for t-shirt sizes to numeric values
const TSHIRT_SIZE_MAP: Record<string, number> = {
  XS: 1,
  S: 2,
  M: 3,
  L: 5,
  XL: 8,
};

/**
 * Convert a vote value to a number for calculations.
 * Handles numeric strings, t-shirt sizes, and "?" (unsure).
 */
function voteValueToNumber(value: string): number | null {
  if (!value || value === "?") {
    return null;
  }
  
  // Check if it's a t-shirt size
  const upperValue = value.toUpperCase();
  if (TSHIRT_SIZE_MAP[upperValue] !== undefined) {
    return TSHIRT_SIZE_MAP[upperValue];
  }
  
  // Try parsing as a number
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

// Helper function to calculate vote statistics
export function calculateVoteStats(votes: { value: string }[]): {
  averageScore: number | undefined;
  medianScore: number | undefined;
  unsureCount: number;
} {
  const numericVotes = votes
    .map((v) => voteValueToNumber(v.value))
    .filter((v): v is number => v !== null);

  const unsureCount = votes.filter((v) => v.value === "?").length;

  if (numericVotes.length === 0) {
    return {
      averageScore: undefined,
      medianScore: undefined,
      unsureCount,
    };
  }

  const average = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
  const sortedVotes = [...numericVotes].sort((a, b) => a - b);
  const median =
    sortedVotes.length % 2 === 0
      ? (sortedVotes[sortedVotes.length / 2 - 1] +
          sortedVotes[sortedVotes.length / 2]) /
        2
      : sortedVotes[Math.floor(sortedVotes.length / 2)];

  return {
    averageScore: Math.round(average * 10) / 10, // Round to 1 decimal
    medianScore: median,
    unsureCount,
  };
}
