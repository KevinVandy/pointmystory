import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { requireAuth, canViewRoomWithoutAuth, getEffectiveParticipantType } from "./permissions";
import { getEffectivePointScale, isValidPointValue } from "./pointScales";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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

    // Check if room is closed
    const roomStatus = room.status ?? "open";
    if (roomStatus === "closed") {
      throw new Error("Cannot vote in a closed room");
    }

    // Ensure there's a current round
    if (!room.currentRoundId) {
      throw new Error("No active round in this room");
    }

    // Check if the current round is revealed
    const currentRound = await ctx.db.get(room.currentRoundId);
    if (!currentRound) {
      throw new Error("Current round not found");
    }

    if (currentRound.isRevealed) {
      throw new Error("Cannot vote after votes have been revealed");
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

      // Check for auto-reveal after updating vote
      await checkAndAutoReveal(ctx, args.roomId, room, room.currentRoundId!);

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

    // Check for auto-reveal after casting vote
    await checkAndAutoReveal(ctx, args.roomId, room, room.currentRoundId!);

    return voteId;
  },
});

// Helper function to check if all voters have voted and auto-reveal if enabled
async function checkAndAutoReveal(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  room: { autoRevealVotes?: boolean | null },
  roundId: Id<"rounds">
) {
  // Check if auto-reveal is enabled (default to true)
  const autoRevealEnabled = room.autoRevealVotes ?? true;
  if (!autoRevealEnabled) {
    return;
  }

  // Get all participants who are voters (not observers)
  const allParticipants = await ctx.db
    .query("participants")
    .withIndex("by_room", (q) => q.eq("roomId", roomId))
    .collect();

  // Filter to only voters
  const voters = allParticipants.filter((p) => {
    const participantType = p.participantType ?? "voter";
    return participantType === "voter";
  });

  // If no voters, nothing to reveal
  if (voters.length === 0) {
    return;
  }

  // Get all votes for the current round
  const votes = await ctx.db
    .query("votes")
    .withIndex("by_round", (q) => q.eq("roundId", roundId))
    .collect();

  // Check if all voters have voted
  const votedParticipantIds = new Set(votes.map((v) => v.participantId));

  const allVotersHaveVoted = voters.every((voter) => votedParticipantIds.has(voter._id));

  if (allVotersHaveVoted) {
    // Call internal reveal mutation (scheduled to run immediately after this mutation completes)
    await ctx.scheduler.runAfter(0, internal.rooms.internalReveal, {
      roomId,
    });
  }
}

// Get all votes for the current round in a room
// Works for public rooms without auth (read-only)
// Returns status to distinguish between "not found" and "access denied"
export const getByRoom = query({
  args: {
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return { status: "not_found" as const, votes: [] };
    }

    // Check if user can view this room
    if (!canViewRoomWithoutAuth(room)) {
      // Private rooms require authentication
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { status: "access_denied" as const, votes: [] };
      }
    }

    // If no current round, return empty
    if (!room.currentRoundId) {
      return { status: "ok" as const, votes: [] };
    }

    // Get the current round to check if votes are revealed
    const currentRound = await ctx.db.get(room.currentRoundId);
    const isRevealed = currentRound?.isRevealed ?? false;

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

    const processedVotes = !isRevealed
      ? votes.map((vote) => ({
        ...vote,
        // Only show the value to the person who cast the vote
        value:
          currentParticipant && vote.participantId === currentParticipant._id
            ? vote.value
            : null,
        hasVoted: true,
      }))
      : votes.map((vote) => ({
        ...vote,
        hasVoted: true,
      }));

    return { status: "ok" as const, votes: processedVotes };
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
