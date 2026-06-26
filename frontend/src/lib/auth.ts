// Fake, frontend-only authentication for the V1 foundation.
//
// There is no real authentication yet (per PL-4): the login screen simply
// records who entered the platform in localStorage and gates the app. Swap
// these helpers for a real session/token flow when auth lands.

export interface SessionUser {
  name: string;
  email: string;
  signedInAt: string; // ISO timestamp
}

const STORAGE_KEY = "prelegal.session";

/** Read the current session, or null if signed out / on the server. */
export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

/** Persist a fake session for the given identity. */
export function setUser(name: string, email: string): SessionUser {
  const user: SessionUser = {
    name: name.trim(),
    email: email.trim(),
    signedInAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

/** Clear the session (sign out). */
export function clearUser(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
