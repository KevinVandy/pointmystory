import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Join a room (upsert - creates or updates participant)
export const join = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated to join a room");
    }

    // Check if room exists
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Check if participant already exists
    const existingParticipant = await ctx.db
      .query("participants")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("clerkUserId", identity.subject)
      )
      .unique();

    if (existingParticipant) {
      // Update existing participant info (in case name/avatar changed)
      await ctx.db.patch(existingParticipant._id, {
        name: identity.name || identity.email || "Anonymous",
        avatarUrl: identity.pictureUrl,
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated");
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

// List all participants in a room
export const listByRoom = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
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
