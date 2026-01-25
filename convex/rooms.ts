import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireRoomAdmin, canViewRoomWithoutAuth } from "./permissions";
import { getPointScaleForPreset, DEFAULT_PRESET } from "./pointScales";
import { calculateVoteStats } from "./rounds";

// Default timer duration in seconds (3 minutes)
const DEFAULT_TIMER_DURATION = 180;

// Create a new room
export const create = mutation({
  args: {
    name: v.string(),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    pointScalePreset: v.optional(v.string()),
    pointScale: v.optional(v.array(v.string())),
    timerDurationSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    // Determine the point scale to use
    const preset = args.pointScalePreset ?? DEFAULT_PRESET;
    let pointScale: string[];
    
    if (preset === "custom" && args.pointScale && args.pointScale.length > 0) {
      pointScale = args.pointScale;
    } else {
      pointScale = getPointScaleForPreset(preset);
    }

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      hostId: identity.subject,
      currentStory: undefined,
      isRevealed: false,
      visibility: args.visibility ?? "private",
      pointScalePreset: preset,
      pointScale: pointScale,
      timerDurationSeconds: args.timerDurationSeconds ?? DEFAULT_TIMER_DURATION,
    });

    // Create the initial round for this room
    const roundId = await ctx.db.insert("rounds", {
      roomId,
      createdAt: Date.now(),
      isRevealed: false,
    });

    // Update room with the current round
    await ctx.db.patch(roomId, {
      currentRoundId: roundId,
    });

    // Auto-add the creator as a participant with admin role
    await ctx.db.insert("participants", {
      roomId,
      clerkUserId: identity.subject,
      name: identity.name || identity.email || "Anonymous",
      avatarUrl: identity.pictureUrl,
      joinedAt: Date.now(),
      role: "admin",
      participantType: "voter",
    });

    return roomId;
  },
});

// Get a room by ID
// Returns status to distinguish between "not found" and "access denied"
// Public rooms can be viewed by anyone, private rooms require authentication
export const get = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return { status: "not_found" as const, room: null };
    }

    // Public rooms can be viewed by anyone
    if (canViewRoomWithoutAuth(room)) {
      return { status: "ok" as const, room };
    }

    // Private rooms require authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { status: "access_denied" as const, room: null };
    }

    return { status: "ok" as const, room };
  },
});

// Update room settings (admin only)
export const updateSettings = mutation({
  args: {
    roomId: v.id("rooms"),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    pointScalePreset: v.optional(v.string()),
    pointScale: v.optional(v.array(v.string())),
    timerDurationSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const updates: Partial<{
      visibility: "public" | "private";
      pointScalePreset: string;
      pointScale: string[];
      timerDurationSeconds: number;
    }> = {};

    if (args.visibility !== undefined) {
      updates.visibility = args.visibility;
    }

    if (args.timerDurationSeconds !== undefined) {
      updates.timerDurationSeconds = args.timerDurationSeconds;
    }

    if (args.pointScalePreset !== undefined) {
      updates.pointScalePreset = args.pointScalePreset;
      
      // Update the point scale based on the preset
      if (args.pointScalePreset === "custom" && args.pointScale && args.pointScale.length > 0) {
        updates.pointScale = args.pointScale;
      } else {
        updates.pointScale = getPointScaleForPreset(args.pointScalePreset);
      }
    } else if (args.pointScale !== undefined) {
      // Custom scale provided without changing preset
      updates.pointScale = args.pointScale;
      updates.pointScalePreset = "custom";
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.roomId, updates);
    }
  },
});

// Update the current story being voted on (admin only)
export const updateStory = mutation({
  args: {
    roomId: v.id("rooms"),
    story: v.string(),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    await ctx.db.patch(args.roomId, {
      currentStory: args.story,
    });
  },
});

// Reveal all votes (admin only)
export const reveal = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Update room revealed state
    await ctx.db.patch(args.roomId, {
      isRevealed: true,
    });

    // Update the current round with reveal info and stats
    if (room.currentRoundId) {
      const round = await ctx.db.get(room.currentRoundId);
      if (round) {
        // Get all votes for this round
        const votes = await ctx.db
          .query("votes")
          .withIndex("by_round", (q) => q.eq("roundId", room.currentRoundId!))
          .collect();

        // Calculate stats
        const stats = calculateVoteStats(votes);

        // Update round with reveal time, stats, and story name
        await ctx.db.patch(room.currentRoundId, {
          isRevealed: true,
          revealedAt: Date.now(),
          name: round.name || room.currentStory || undefined,
          ...stats,
        });
      }
    }
  },
});

// Start a new round (admin only) - replaces resetVotes
export const startNewRound = mutation({
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

    // Create a new round
    const roundId = await ctx.db.insert("rounds", {
      roomId: args.roomId,
      name: args.name,
      ticketNumber: args.ticketNumber,
      createdAt: Date.now(),
      isRevealed: false,
    });

    // Update room to point to the new round and reset state
    await ctx.db.patch(args.roomId, {
      currentRoundId: roundId,
      isRevealed: false,
      currentStory: args.name || args.ticketNumber || undefined,
      timerStartedAt: undefined,
      timerEndsAt: undefined,
    });

    return roundId;
  },
});

// Legacy alias for backward compatibility
export const resetVotes = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Create a new round (without name/ticket)
    const roundId = await ctx.db.insert("rounds", {
      roomId: args.roomId,
      createdAt: Date.now(),
      isRevealed: false,
    });

    // Update room to point to the new round and reset state
    await ctx.db.patch(args.roomId, {
      currentRoundId: roundId,
      isRevealed: false,
      currentStory: undefined,
      timerStartedAt: undefined,
      timerEndsAt: undefined,
    });

    return roundId;
  },
});

// Start the timer (admin only)
export const startTimer = mutation({
  args: {
    roomId: v.id("rooms"),
    durationSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const duration = args.durationSeconds ?? room.timerDurationSeconds ?? DEFAULT_TIMER_DURATION;
    const now = Date.now();
    const endsAt = now + duration * 1000;

    await ctx.db.patch(args.roomId, {
      timerStartedAt: now,
      timerEndsAt: endsAt,
    });
  },
});

// Stop the timer (admin only)
export const stopTimer = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    await ctx.db.patch(args.roomId, {
      timerStartedAt: undefined,
      timerEndsAt: undefined,
    });
  },
});
