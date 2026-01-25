import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Valid Fibonacci point values
const VALID_VALUES = ["1", "2", "3", "5", "8", "13", "21", "?"];

// Cast or update a vote
export const cast = mutation({
  args: {
    roomId: v.id("rooms"),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated to vote");
    }

    // Validate the vote value
    if (!VALID_VALUES.includes(args.value)) {
      throw new Error(`Invalid vote value. Must be one of: ${VALID_VALUES.join(", ")}`);
    }

    // Check if room exists and votes aren't revealed
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    if (room.isRevealed) {
      throw new Error("Cannot vote after votes have been revealed");
    }

    // Get the participant record
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("clerkUserId", identity.subject)
      )
      .unique();

    if (!participant) {
      throw new Error("Must join the room before voting");
    }

    // Check for existing vote
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_participant", (q) => q.eq("participantId", participant._id))
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .unique();

    if (existingVote) {
      // Update existing vote
      await ctx.db.patch(existingVote._id, {
        value: args.value,
        votedAt: Date.now(),
      });
      return existingVote._id;
    }

    // Create new vote
    const voteId = await ctx.db.insert("votes", {
      roomId: args.roomId,
      participantId: participant._id,
      value: args.value,
      votedAt: Date.now(),
    });

    return voteId;
  },
});

// Get all votes for a room
export const getByRoom = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return [];
    }

    const votes = await ctx.db
      .query("votes")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // If votes aren't revealed, only return vote existence (not values)
    // unless the viewer is the vote owner
    const identity = await ctx.auth.getUserIdentity();
    const currentParticipant = identity
      ? await ctx.db
          .query("participants")
          .withIndex("by_room_and_user", (q) =>
            q.eq("roomId", args.roomId).eq("clerkUserId", identity.subject)
          )
          .unique()
      : null;

    if (!room.isRevealed) {
      return votes.map((vote) => ({
        ...vote,
        // Only show the value to the person who cast the vote
        value:
          currentParticipant && vote.participantId === currentParticipant._id
            ? vote.value
            : null,
        hasVoted: true,
      }));
    }

    return votes.map((vote) => ({
      ...vote,
      hasVoted: true,
    }));
  },
});

// Get the current user's vote for a room
export const getCurrentVote = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const participant = await ctx.db
      .query("participants")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("clerkUserId", identity.subject)
      )
      .unique();

    if (!participant) {
      return null;
    }

    return await ctx.db
      .query("votes")
      .withIndex("by_participant", (q) => q.eq("participantId", participant._id))
      .filter((q) => q.eq(q.field("roomId"), args.roomId))
      .unique();
  },
});
