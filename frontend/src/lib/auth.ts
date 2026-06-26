// Real authentication backed by the API (PL-7).
//
// On sign up / sign in the backend returns a JWT and the user; we keep both in
// localStorage and send the token as a Bearer header on authenticated requests.
// `authFetch` transparently attaches the token and, on a 401, clears the session
// and bounces to /login.

import { API_BASE } from "@/lib/api";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
}

interface Session {
  token: string;
  user: SessionUser;
}

const STORAGE_KEY = "prelegal.session";

/** Read the current session, or null if signed out / on the server. */
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function getUser(): SessionUser | null {
  return getSession()?.user ?? null;
}

function setSession(session: Session): SessionUser {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session.user;
}

/** Clear the session (sign out). */
export function clearSession(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}

async function readError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  // Pydantic validation errors come back as an array of {msg, loc}.
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<SessionUser> {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) throw new Error(await readError(res, "Could not create your account."));
  const data = (await res.json()) as Session;
  return setSession(data);
}

export async function signIn(
  email: string,
  password: string,
): Promise<SessionUser> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readError(res, "Could not sign you in."));
  const data = (await res.json()) as Session;
  return setSession(data);
}

/**
 * fetch() against the API with the Bearer token attached. On a 401 it clears
 * the session and redirects to /login, then rethrows so callers can stop.
 */
export async function authFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("Your session has expired. Please sign in again.");
  }
  return res;
}
