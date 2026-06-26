// Saved-draft API: a user's document history (PL-7).
//
// A draft persists the DocumentData plus the chat transcript so a session can be
// listed and fully restored. All calls go through authFetch (Bearer token).

import { authFetch } from "@/lib/auth";
import type { ChatMessage, DocumentData } from "@/lib/document";

export interface DraftSummary {
  id: number;
  template: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftDetail extends DraftSummary {
  data: DocumentData;
  messages: ChatMessage[];
}

interface DraftBody {
  template?: string;
  title: string;
  data: DocumentData;
  messages: ChatMessage[];
}

export async function listDrafts(): Promise<DraftSummary[]> {
  const res = await authFetch("/api/drafts");
  if (!res.ok) throw new Error("Could not load your documents.");
  return res.json();
}

export async function getDraft(id: number): Promise<DraftDetail> {
  const res = await authFetch(`/api/drafts/${id}`);
  if (!res.ok) throw new Error("Could not open that document.");
  return res.json();
}

export async function createDraft(body: DraftBody): Promise<DraftDetail> {
  const res = await authFetch("/api/drafts", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Could not save your document.");
  return res.json();
}

export async function updateDraft(
  id: number,
  body: DraftBody,
): Promise<DraftDetail> {
  const res = await authFetch(`/api/drafts/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Could not save your document.");
  return res.json();
}

export async function deleteDraft(id: number): Promise<void> {
  const res = await authFetch(`/api/drafts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Could not delete that document.");
}
