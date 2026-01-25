import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireRoomAdmin, canViewRoomWithoutAuth, getEffectiveRole } from "./permissions";

// Join a room (upsert - creates or updates participant)
// Requires authentication - unauthenticated users cannot join
export const join = mutation({
  args: {
    roomId: v.id("rooms"),
    participantType: v.optional(v.union(v.literal("voter"), v.literal("observer"))),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    // Check if room exists
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Determine the role - admin if room creator, team otherwise
    const isCreator = room.hostId === identity.subject;
    const role = isCreator ? "admin" : "team";
    const participantType = args.participantType ?? "voter";

    // Check if participant already exists
    const existingParticipant = await ctx.db
      .query("participants")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("clerkUserId", identity.subject)
      )
      .unique();

    if (existingParticipant) {
      // Update existing participant info (in case name/avatar changed)
      // Don't downgrade role if already admin
      const newRole = getEffectiveRole(existingParticipant) === "admin" ? "admin" : role;
      
      await ctx.db.patch(existingParticipant._id, {
        name: identity.name || identity.email || "Anonymous",
        avatarUrl: identity.pictureUrl,
        role: newRole,
        // Only update participantType if explicitly provided
        ...(args.participantType !== undefined && { participantType: args.participantType }),
      });
      return existingParticipant._id;
    }

    // Create new participant
    const participantId = await ctx.db.insert("participants", {
      roomId: args.roomId,
      clerkUserId: identity.subject,
      name: identity.name || identity.email || "Anonymous",
      avatarUrl: identity.pictureUrl,
      joinedAt: Date.now(),
      role,
      participantType,
    });

    return participantId;
  },
});

// Leave a room
export const leave = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    // Check if room exists
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Find the participant
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("clerkUserId", identity.subject)
      )
      .unique();

    if (!participant) {
      return; // Already not in the room
    }

    // Prevent admins from leaving - they must close the room instead
    const role = getEffectiveRole(participant);
    if (role === "admin") {
      throw new Error("Admins cannot leave a room. Please close the room instead.");
    }

    // Delete their votes first
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_participant", (q) => q.eq("participantId", participant._id))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Delete the participant
    await ctx.db.delete(participant._id);
  },
});

// Promote a participant to admin (admin only)
export const promoteToAdmin = mutation({
  args: {
    roomId: v.id("rooms"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    await requireRoomAdmin(ctx, args.roomId);

    const participant = await ctx.db.get(args.participantId);
    if (!participant) {
      throw new Error("Participant not found");
    }

    if (participant.roomId !== args.roomId) {
      throw new Error("Participant is not in this room");
    }

    await ctx.db.patch(args.participantId, {
      role: "admin",
    });
  },
});

// Update participant type (voter/observer) - self only
export const updateParticipantType = mutation({
  args: {
    roomId: v.id("rooms"),
    participantType: v.union(v.literal("voter"), v.literal("observer")),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);

    const participant = await ctx.db
      .query("participants")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("clerkUserId", identity.subject)
      )
      .unique();

    if (!participant) {
      throw new Error("You are not a participant in this room");
    }

    await ctx.db.patch(participant._id, {
      participantType: args.participantType,
    });

    // If switching to observer, delete their current vote
    if (args.participantType === "observer") {
      const votes = await ctx.db
        .query("votes")
        .withIndex("by_participant", (q) => q.eq("participantId", participant._id))
        .collect();

      for (const vote of votes) {
        await ctx.db.delete(vote._id);
      }
    }
  },
});

// List all participants in a room
// Works without auth for public rooms (read-only)
export const listByRoom = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return [];
    }

    // Public rooms can be viewed by anyone
    if (!canViewRoomWithoutAuth(room)) {
      // Private rooms require authentication
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Authentication required to view this room");
      }
    }

    return await ctx.db
      .query("participants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
  },
});

// Get the current user's participant record for a room
export const getCurrentParticipant = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("participants")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("clerkUserId", identity.subject)
      )
      .unique();
  },
});
