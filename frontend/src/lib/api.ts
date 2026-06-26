import type { DocumentDef, DocumentSummary } from "@/lib/document";

// Base URL for the FastAPI backend. Override with NEXT_PUBLIC_API_BASE_URL
// (e.g. in production); defaults to the local dev server started by scripts/start.sh.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/** List the selectable agreement types. */
export async function fetchDocumentTypes(): Promise<DocumentSummary[]> {
  const res = await fetch(`${API_BASE}/api/documents`);
  if (!res.ok) throw new Error("Could not load document types.");
  return res.json();
}

/** Fetch one agreement's parsed definition (title, fields, sections). */
export async function fetchDocumentDef(id: string): Promise<DocumentDef> {
  const res = await fetch(`${API_BASE}/api/documents/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Could not load the document template.");
  return res.json();
}
