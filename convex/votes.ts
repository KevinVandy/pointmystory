import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, canViewRoomWithoutAuth, getEffectiveParticipantType } from "./permissions";
import { getEffectivePointScale, isValidPointValue } from "./pointScales";

// Cast or update a vote
// REQUIRES AUTHENTICATION - this is the FIRST check
export const cast = mutation({
  args: {
    roomId: v.id("rooms"),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    // Authentication is required - FIRST CHECK
    const identity = await requireAuth(ctx);

    // Check if room exists and votes aren't revealed
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    if (room.isRevealed) {
      throw new Error("Cannot vote after votes have been revealed");
    }

    // Ensure there's a current round
    if (!room.currentRoundId) {
      throw new Error("No active round in this room");
    }

    // Get the effective point scale for this room
    const pointScale = getEffectivePointScale(room.pointScale, room.pointScalePreset);

    // Validate the vote value against the room's point scale
    if (!isValidPointValue(args.value, pointScale)) {
      throw new Error(`Invalid vote value. Must be one of: ${pointScale.join(", ")}`);
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

    // Check that participant is a voter (not observer)
    const participantType = getEffectiveParticipantType(participant);
    if (participantType !== "voter") {
      throw new Error("Observers cannot vote. Switch to voter mode to cast a vote.");
    }

    // Check for existing vote in the current round
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_round", (q) => q.eq("roundId", room.currentRoundId!))
      .filter((q) => q.eq(q.field("participantId"), participant._id))
      .unique();

    if (existingVote) {
      // Update existing vote
      await ctx.db.patch(existingVote._id, {
        value: args.value,
        votedAt: Date.now(),
      });
      return existingVote._id;
    }

    // Create new vote linked to the current round
    const voteId = await ctx.db.insert("votes", {
      roomId: args.roomId,
      roundId: room.currentRoundId,
      participantId: participant._id,
      value: args.value,
      votedAt: Date.now(),
    });

    return voteId;
  },
});

// Get all votes for the current round in a room
// Works for public rooms without auth (read-only)
export const getByRoom = query({
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
      // Private rooms require authentication
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Authentication required to view this room");
      }
    }

    // If no current round, return empty
    if (!room.currentRoundId) {
      return [];
    }

    // Get votes for the current round only
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_round", (q) => q.eq("roundId", room.currentRoundId!))
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

// Get the current user's vote for the current round in a room
export const getCurrentVote = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const room = await ctx.db.get(args.roomId);
    if (!room || !room.currentRoundId) {
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

    // Get the vote for the current round
    return await ctx.db
      .query("votes")
      .withIndex("by_round", (q) => q.eq("roundId", room.currentRoundId!))
      .filter((q) => q.eq(q.field("participantId"), participant._id))
      .unique();
  },
});
