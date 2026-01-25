import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Rooms table - represents a planning poker session
  rooms: defineTable({
    name: v.string(),
    hostId: v.string(), // Clerk user ID of the room creator
    currentStory: v.optional(v.string()), // Current story/ticket being voted on
    isRevealed: v.boolean(), // Whether votes are revealed
  }).index("by_host", ["hostId"]),

  // Participants table - users who have joined a room
  participants: defineTable({
    roomId: v.id("rooms"),
    clerkUserId: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    joinedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_user", ["roomId", "clerkUserId"]),

  // Votes table - votes cast by participants
  votes: defineTable({
    roomId: v.id("rooms"),
    participantId: v.id("participants"),
    value: v.string(), // Vote value (1, 2, 3, 5, 8, 13, 21, ?)
    votedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_participant", ["participantId"]),
});
