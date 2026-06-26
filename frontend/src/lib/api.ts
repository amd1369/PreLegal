// Base URL for the FastAPI backend. Override with NEXT_PUBLIC_API_BASE_URL
// (e.g. in production); defaults to the local dev server started by scripts/start.sh.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
