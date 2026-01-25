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
 * Public organization rooms can be viewed by anyone.
 */
export function canViewRoomWithoutAuth(
  room: { visibility?: "public" | "private" | null; organizationId?: string | null }
): boolean {
  // Public rooms can be viewed by anyone, regardless of organization
  return getEffectiveVisibility(room) === "public";
}

/**
 * Check if the current user is a member of the room's organization.
 * Returns false if room has no organization or user is not authenticated.
 */
export async function isOrganizationMember(
  ctx: Context,
  room: { organizationId?: string | null }
): Promise<boolean> {
  // If room has no organization, return false (not an org room)
  if (!room.organizationId) {
    return false;
  }

  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return false;
  }

  // Check if user's organization matches room's organization
  // The organization ID comes from the JWT token claims
  // The JWT template must be configured in Clerk Dashboard to include org_id claim
  // Go to Clerk Dashboard → JWT Templates → convex template → Map additional claims
  // Add: org_id = {{org.id}}
  const identityAny = identity as any;
  
  // Try multiple possible field names for organization ID
  const userOrgId = identityAny.org_id || identityAny.orgId || identityAny.organization_id || identityAny.organizationId;
  
  // Log for debugging - check Convex dashboard logs
  console.log("[Organization Check]", {
    roomOrgId: room.organizationId,
    userOrgId,
    hasOrgId: !!userOrgId,
    identityKeys: Object.keys(identityAny).filter(k => k.toLowerCase().includes('org')),
    allIdentityKeys: Object.keys(identityAny),
  });
  
  if (!userOrgId) {
    console.warn("[Organization Check] No organization ID found in token. Make sure JWT template includes org_id claim.");
    return false;
  }
  
  return userOrgId === room.organizationId;
}

/**
 * Check if a demoSessionId matches the room's demoSessionId.
 * Used for demo room admin verification.
 */
export function isDemoRoomAdmin(
  room: { isDemo?: boolean | null; demoSessionId?: string | null },
  demoSessionId: string | null | undefined
): boolean {
  if (!room.isDemo || !demoSessionId) {
    return false;
  }
  return room.demoSessionId === demoSessionId;
}

/**
 * Check if the current user is an admin of the room.
 * Returns false if not authenticated or not a participant.
 * Also checks demo room admin status if demoSessionId is provided.
 */
export async function isRoomAdmin(
  ctx: Context,
  roomId: Id<"rooms">,
  demoSessionId?: string | null
): Promise<boolean> {
  const room = await ctx.db.get(roomId);
  if (!room) {
    return false;
  }

  // Check demo room admin status first (doesn't require auth)
  if (room.isDemo && demoSessionId) {
    if (isDemoRoomAdmin(room, demoSessionId)) {
      return true;
    }
  }

  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return false;
  }

  // Check if user is the host (original creator)
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
 * Also checks demo room admin status if demoSessionId is provided.
 */
export async function requireRoomAdmin(
  ctx: Context,
  roomId: Id<"rooms">,
  demoSessionId?: string | null
): Promise<void> {
  const room = await ctx.db.get(roomId);
  if (!room) {
    throw new Error("Room not found");
  }

  // Check demo room admin status first (doesn't require auth)
  if (room.isDemo && demoSessionId) {
    if (isDemoRoomAdmin(room, demoSessionId)) {
      return; // Demo room admin is valid
    }
  }

  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required");
  }

  const isAdmin = await isRoomAdmin(ctx, roomId, demoSessionId);
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
 * - Public rooms (personal or org): Anyone can view
 * - Private personal rooms: Any authenticated user can view
 * - Private organization rooms: Only organization members can view
 */
export async function canViewRoom(
  ctx: Context,
  room: { visibility?: "public" | "private" | null; organizationId?: string | null }
): Promise<boolean> {
  // Public rooms can be viewed by anyone
  if (canViewRoomWithoutAuth(room)) {
    return true;
  }

  // Private rooms require authentication
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return false;
  }

  // If it's a private organization room, check membership
  if (room.organizationId) {
    return await isOrganizationMember(ctx, room);
  }

  // Private personal room - any authenticated user can view
  return true;
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
