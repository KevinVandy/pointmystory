import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireAuth, requireRoomAdmin, canViewRoom } from "./permissions";
import { getPointScaleForPreset, DEFAULT_PRESET, getEffectivePointScale } from "./pointScales";
import { calculateVoteStats, roundToNearestPointScale } from "./rounds";
import { internal } from "./_generated/api";

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
    organizationId: v.optional(v.string()), // Optional organization ID
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    // Use provided organizationId, or undefined for personal rooms
    // If organizationId is explicitly null/undefined from args, that means personal room
    // The organizationId should be passed from the client based on user's selection
    const organizationId = args.organizationId || undefined;

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
      organizationId: organizationId,
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
// Private organization rooms require organization membership
export const get = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return { status: "not_found" as const, room: null };
    }

    // Check if user can view the room (handles public, private personal, and private org rooms)
    const canView = await canViewRoom(ctx, room);
    if (!canView) {
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
    autoStartTimer: v.optional(v.boolean()),
    demoSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId, args.demoSessionId);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const updates: Partial<{
      visibility: "public" | "private";
      pointScalePreset: string;
      pointScale: string[];
      timerDurationSeconds: number;
      autoStartTimer: boolean;
    }> = {};

    if (args.visibility !== undefined) {
      updates.visibility = args.visibility;
    }

    if (args.timerDurationSeconds !== undefined) {
      updates.timerDurationSeconds = args.timerDurationSeconds;
    }

    if (args.autoStartTimer !== undefined) {
      updates.autoStartTimer = args.autoStartTimer;
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
    demoSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId, args.demoSessionId);

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
    demoSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId, args.demoSessionId);

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

        // Calculate default final score by rounding average/median to nearest point scale value
        const pointScale = getEffectivePointScale(room.pointScale, room.pointScalePreset);
        const scoreToUse = stats.averageScore ?? stats.medianScore;
        const defaultFinalScore = roundToNearestPointScale(
          scoreToUse,
          pointScale,
          room.pointScalePreset
        );

        // Update round with reveal time, stats, story name, and default final score
        await ctx.db.patch(room.currentRoundId, {
          isRevealed: true,
          revealedAt: Date.now(),
          name: round.name || room.currentStory || undefined,
          ...stats,
          // Only set finalScore if it's not already set and we have a default value
          ...(round.finalScore === undefined && defaultFinalScore !== null && {
            finalScore: defaultFinalScore,
          }),
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
    demoSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId, args.demoSessionId);

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

    // Check if auto-start timer is enabled
    const autoStartTimer = room.autoStartTimer ?? false;
    const timerDuration = room.timerDurationSeconds ?? DEFAULT_TIMER_DURATION;
    
    let timerStartedAt: number | undefined = undefined;
    let timerEndsAt: number | undefined = undefined;
    
    if (autoStartTimer) {
      const now = Date.now();
      timerStartedAt = now;
      timerEndsAt = now + timerDuration * 1000;
    }

    // Update room to point to the new round and reset state
    await ctx.db.patch(args.roomId, {
      currentRoundId: roundId,
      currentStory: args.name || args.ticketNumber || undefined,
      timerStartedAt,
      timerEndsAt,
    });

    return roundId;
  },
});

// Legacy alias for backward compatibility
export const resetVotes = mutation({
  args: {
    roomId: v.id("rooms"),
    demoSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId, args.demoSessionId);

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
    demoSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId, args.demoSessionId);

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
    demoSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId, args.demoSessionId);

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
    demoSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId, args.demoSessionId);

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
// Demo rooms cannot be reopened by non-signed-in users
export const reopenRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    demoSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Prevent reopening demo rooms by non-signed-in users
    if (room.isDemo) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Demo rooms cannot be reopened. Please sign in to create a permanent room.");
      }
    }

    await requireRoomAdmin(ctx, args.roomId, args.demoSessionId);

    await ctx.db.patch(args.roomId, {
      status: "open",
    });
  },
});

// Create a demo room (no authentication required)
export const createDemo = mutation({
  args: {},
  handler: async (ctx) => {
    // Generate a unique demo session ID
    // Using timestamp + random number for uniqueness
    const demoSessionId = `demo_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Calculate auto-close time (5 minutes from now)
    const autoCloseAt = Date.now() + 5 * 60 * 1000; // 5 minutes in milliseconds

    // Determine the point scale to use (default to fibonacci)
    const preset = DEFAULT_PRESET;
    const pointScale = getPointScaleForPreset(preset);

    // Create demo room with special hostId for demo rooms
    const roomId = await ctx.db.insert("rooms", {
      name: "Demo Room",
      hostId: `demo_${demoSessionId}`, // Special hostId format for demo rooms
      currentStory: undefined,
      visibility: "public", // Demo rooms must be public
      pointScalePreset: preset,
      pointScale: pointScale,
      timerDurationSeconds: DEFAULT_TIMER_DURATION,
      status: "open",
      isDemo: true,
      autoCloseAt: autoCloseAt,
      demoSessionId: demoSessionId,
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

    // Schedule auto-close after 5 minutes
    await ctx.scheduler.runAfter(5 * 60 * 1000, internal.rooms.autoCloseDemoRoom, {
      roomId,
    });

    return { roomId, demoSessionId };
  },
});

// Auto-close demo room (scheduled function)
export const autoCloseDemoRoom = internalMutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return; // Room doesn't exist, nothing to do
    }

    // Only close if it's a demo room and not already closed
    if (room.isDemo && room.status !== "closed") {
      await ctx.db.patch(args.roomId, {
        status: "closed",
      });
    }
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
