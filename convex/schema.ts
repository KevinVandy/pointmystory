import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Rooms table - represents a planning poker session
  rooms: defineTable({
    name: v.string(),
    hostId: v.string(), // Clerk user ID of the room creator
    currentStory: v.optional(v.string()), // Current story/ticket being voted on
    isRevealed: v.boolean(), // Whether votes are revealed
    // Fields for visibility and point scales
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))), // Default: "private"
    pointScalePreset: v.optional(v.string()), // "fibonacci", "tshirt", "powers", "linear", "custom"
    pointScale: v.optional(v.array(v.string())), // Array of point values
    // Timer fields
    timerDurationSeconds: v.optional(v.number()), // Default timer duration (180 = 3 min)
    timerStartedAt: v.optional(v.number()), // Timestamp when timer started (null = not running)
    timerEndsAt: v.optional(v.number()), // Timestamp when timer expires
  }).index("by_host", ["hostId"]),

  // Participants table - users who have joined a room
  participants: defineTable({
    roomId: v.id("rooms"),
    clerkUserId: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    joinedAt: v.number(),
    // New fields for roles and participant type
    role: v.optional(v.union(v.literal("admin"), v.literal("team"))), // Default: "team", creator gets "admin"
    participantType: v.optional(v.union(v.literal("voter"), v.literal("observer"))), // Default: "voter"
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_user", ["roomId", "clerkUserId"]),

  // Votes table - votes cast by participants
  votes: defineTable({
    roomId: v.id("rooms"),
    participantId: v.id("participants"),
    value: v.string(), // Vote value (depends on room's pointScale)
    votedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_participant", ["participantId"]),
});
