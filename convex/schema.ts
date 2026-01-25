import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Rooms table - represents a planning poker session
  rooms: defineTable({
    name: v.string(),
    hostId: v.string(), // Clerk user ID of the room creator
    currentStory: v.optional(v.string()), // Current story/ticket being voted on
    // Fields for visibility and point scales
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))), // Default: "private"
    pointScalePreset: v.optional(v.string()), // "fibonacci", "tshirt", "powers", "hybrid", "linear", "custom"
    pointScale: v.optional(v.array(v.string())), // Array of point values
    // Timer fields
    timerDurationSeconds: v.optional(v.number()), // Default timer duration (180 = 3 min)
    timerStartedAt: v.optional(v.number()), // Timestamp when timer started (null = not running)
    timerEndsAt: v.optional(v.number()), // Timestamp when timer expires
    autoStartTimer: v.optional(v.boolean()), // Auto-start timer when new round starts (default: false)
    // Current active round
    currentRoundId: v.optional(v.id("rounds")), // Active round being voted on
    // Room status
    status: v.optional(v.union(v.literal("open"), v.literal("closed"))), // Default: "open"
    // Demo room fields
    isDemo: v.optional(v.boolean()), // Whether this is a demo room
    autoCloseAt: v.optional(v.number()), // Timestamp when demo room should auto-close
    demoSessionId: v.optional(v.string()), // Unique session identifier for demo room admin
  }).index("by_host", ["hostId"]),

  // Rounds table - tracks each voting round within a room
  rounds: defineTable({
    roomId: v.id("rooms"),
    name: v.optional(v.string()), // Optional round name (e.g., "User Authentication")
    ticketNumber: v.optional(v.string()), // Optional ticket ID (e.g., "PROJ-123")
    createdAt: v.number(), // When round started
    revealedAt: v.optional(v.number()), // When votes were revealed
    isRevealed: v.boolean(), // Whether votes have been revealed
    finalScore: v.optional(v.string()), // Admin-set final score (can differ from consensus)
    // Computed/cached summary (populated on reveal)
    averageScore: v.optional(v.number()),
    medianScore: v.optional(v.number()),
    unsureCount: v.optional(v.number()),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_created", ["roomId", "createdAt"]),

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
    .index("by_room_and_user", ["roomId", "clerkUserId"])
    .index("by_user", ["clerkUserId"]),

  // Votes table - votes cast by participants
  votes: defineTable({
    roomId: v.id("rooms"),
    roundId: v.id("rounds"), // Link to specific round
    participantId: v.id("participants"),
    value: v.string(), // Vote value (depends on room's pointScale)
    votedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_round", ["roundId"])
    .index("by_participant", ["participantId"]),
});
