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
      visibility: args.visibility ?? "private",
      pointScalePreset: preset,
      pointScale: pointScale,
      timerDurationSeconds: args.timerDurationSeconds ?? DEFAULT_TIMER_DURATION,
      status: "open",
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
    ticketNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Update room's currentStory
    await ctx.db.patch(args.roomId, {
      currentStory: args.story,
    });

    // If ticketNumber is provided and there's a current round, update the round
    if (args.ticketNumber !== undefined && room.currentRoundId) {
      const currentRound = await ctx.db.get(room.currentRoundId);
      if (currentRound) {
        await ctx.db.patch(room.currentRoundId, {
          ticketNumber: args.ticketNumber || undefined,
        });
      }
    }
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

    // Check if room is closed
    const roomStatus = room.status ?? "open";
    if (roomStatus === "closed") {
      throw new Error("Cannot reveal votes in a closed room");
    }

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

    // Check if room is closed
    const roomStatus = room.status ?? "open";
    if (roomStatus === "closed") {
      throw new Error("Cannot start a new round in a closed room");
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

    // Check if room is closed
    const roomStatus = room.status ?? "open";
    if (roomStatus === "closed") {
      throw new Error("Cannot start timer in a closed room");
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

// Close a room (admin only)
export const closeRoom = mutation({
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
      status: "closed",
    });
  },
});

// Reopen a room (admin only)
export const reopenRoom = mutation({
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
      status: "open",
    });
  },
});

// List all rooms the current user is a participant in
export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get all participants for this user
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .collect();

    // Get all rooms for these participants
    const rooms = await Promise.all(
      participants.map(async (participant) => {
        const room = await ctx.db.get(participant.roomId);
        if (!room) {
          return null;
        }
        
        // Get all participants for this room (for avatars)
        const roomParticipants = await ctx.db
          .query("participants")
          .withIndex("by_room", (q) => q.eq("roomId", participant.roomId))
          .collect();
        
        return {
          ...room,
          participantRole: participant.role ?? "team",
          joinedAt: participant.joinedAt,
          participants: roomParticipants.map((p) => ({
            avatarUrl: p.avatarUrl,
            name: p.name,
          })),
        };
      })
    );

    // Filter out nulls and sort by joinedAt (most recent first)
    return rooms
      .filter((room): room is NonNullable<typeof room> => room !== null)
      .sort((a, b) => b.joinedAt - a.joinedAt);
  },
});
