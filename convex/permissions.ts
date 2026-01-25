import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

type Context = QueryCtx | MutationCtx;

/**
 * Get the effective visibility of a room, defaulting to "private".
 */
export function getEffectiveVisibility(
  room: { visibility?: "public" | "private" | null }
): "public" | "private" {
  return room.visibility ?? "private";
}

/**
 * Get the effective role of a participant, defaulting to "team".
 */
export function getEffectiveRole(
  participant: { role?: "admin" | "team" | null } | null
): "admin" | "team" {
  return participant?.role ?? "team";
}

/**
 * Get the effective participant type, defaulting to "voter".
 */
export function getEffectiveParticipantType(
  participant: { participantType?: "voter" | "observer" | null } | null
): "voter" | "observer" {
  return participant?.participantType ?? "voter";
}

/**
 * Check if a room can be viewed without authentication.
 * Only public rooms can be viewed without auth.
 */
export function canViewRoomWithoutAuth(
  room: { visibility?: "public" | "private" | null }
): boolean {
  return getEffectiveVisibility(room) === "public";
}

/**
 * Check if the current user is an admin of the room.
 * Returns false if not authenticated or not a participant.
 */
export async function isRoomAdmin(
  ctx: Context,
  roomId: Id<"rooms">
): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return false;
  }

  // Check if user is the host (original creator)
  const room = await ctx.db.get(roomId);
  if (!room) {
    return false;
  }

  if (room.hostId === identity.subject) {
    return true;
  }

  // Check if user is a participant with admin role
  const participant = await ctx.db
    .query("participants")
    .withIndex("by_room_and_user", (q) =>
      q.eq("roomId", roomId).eq("clerkUserId", identity.subject)
    )
    .unique();

  return getEffectiveRole(participant) === "admin";
}

/**
 * Require that the current user is an admin of the room.
 * Throws an error if not authenticated or not an admin.
 */
export async function requireRoomAdmin(
  ctx: Context,
  roomId: Id<"rooms">
): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }

  const isAdmin = await isRoomAdmin(ctx, roomId);
  if (!isAdmin) {
    throw new Error("Admin permission required");
  }
}

/**
 * Require that the current user is authenticated.
 * Returns the identity if authenticated, throws if not.
 */
export async function requireAuth(ctx: Context) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }
  return identity;
}

/**
 * Check if the current user can view a room.
 * Public rooms can be viewed by anyone, private rooms require authentication.
 */
export async function canViewRoom(
  ctx: Context,
  room: { visibility?: "public" | "private" | null }
): Promise<boolean> {
  // Public rooms can be viewed by anyone
  if (canViewRoomWithoutAuth(room)) {
    return true;
  }

  // Private rooms require authentication
  const identity = await ctx.auth.getUserIdentity();
  return identity !== null;
}

/**
 * Get the current user's participant record for a room, if it exists.
 */
export async function getCurrentParticipant(
  ctx: Context,
  roomId: Id<"rooms">
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return await ctx.db
    .query("participants")
    .withIndex("by_room_and_user", (q) =>
      q.eq("roomId", roomId).eq("clerkUserId", identity.subject)
    )
    .unique();
}
