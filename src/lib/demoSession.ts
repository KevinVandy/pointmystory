/**
 * Utility functions for managing demo room session IDs in localStorage
 */

const DEMO_SESSION_PREFIX = "demoSessionId_";

/**
 * Store demo session ID for a room
 */
export function setDemoSessionId(roomId: string, demoSessionId: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(`${DEMO_SESSION_PREFIX}${roomId}`, demoSessionId);
  }
}

/**
 * Get demo session ID for a room
 */
export function getDemoSessionId(roomId: string): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(`${DEMO_SESSION_PREFIX}${roomId}`);
  }
  return null;
}

/**
 * Remove demo session ID for a room
 */
export function removeDemoSessionId(roomId: string): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(`${DEMO_SESSION_PREFIX}${roomId}`);
  }
}
