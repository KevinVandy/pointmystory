import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new room
export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated to create a room");
    }

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      hostId: identity.subject,
      currentStory: undefined,
      isRevealed: false,
    });

    return roomId;
  },
});

// Get a room by ID
export const get = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roomId);
  },
});

// Update the current story being voted on
export const updateStory = mutation({
  args: {
    roomId: v.id("rooms"),
    story: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated");
    }

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Only the host can update the story
    if (room.hostId !== identity.subject) {
      throw new Error("Only the host can update the story");
    }

    await ctx.db.patch(args.roomId, {
      currentStory: args.story,
    });
  },
});

// Reveal all votes
export const reveal = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated");
    }

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Only the host can reveal votes
    if (room.hostId !== identity.subject) {
      throw new Error("Only the host can reveal votes");
    }

    await ctx.db.patch(args.roomId, {
      isRevealed: true,
    });
  },
});

// Reset votes for a new round
export const resetVotes = mutation({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated");
    }

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Only the host can reset votes
    if (room.hostId !== identity.subject) {
      throw new Error("Only the host can reset votes");
    }

    // Delete all votes for this room
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    // Reset the revealed state
    await ctx.db.patch(args.roomId, {
      isRevealed: false,
      currentStory: undefined,
    });
  },
});
