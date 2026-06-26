"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckIcon, Loader2Icon } from "lucide-react";

import {
  type ChatMessage,
  type DocumentData,
  type DocumentDef,
  draftTitle,
  emptyDocument,
} from "@/lib/document";
import { fetchDocumentDef } from "@/lib/api";
import { createDraft, getDraft, updateDraft } from "@/lib/drafts";
import { DocumentChat, GREETING } from "@/components/document-chat";
import { DocumentPreview } from "@/components/document-preview";
import { DocumentDownloadButton } from "@/components/document-download-button";
import { AuthGuard } from "@/components/auth-guard";
import { AppHeader } from "@/components/app-header";
import { DraftDisclaimer } from "@/components/draft-disclaimer";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaverState {
  draftId: number | null;
  inFlight: boolean;
  dirty: boolean;
}
type Snapshot =
  | { data: DocumentData; messages: ChatMessage[]; def: DocumentDef | null }
  | null;

/**
 * Single-flight, trailing-write persistence. Coalesces rapid changes into one
 * in-flight request, never double-creates, and always writes the latest state.
 */
async function persistDraft(
  saver: { current: SaverState },
  latest: { current: Snapshot },
  setStatus: (s: SaveStatus) => void,
): Promise<void> {
  const s = saver.current;
  if (s.inFlight || !s.dirty || !latest.current) return;
  s.inFlight = true;
  s.dirty = false;
  setStatus("saving");
  const snapshot = latest.current;
  const payload = {
    template: snapshot.data.documentType,
    title: draftTitle(snapshot.def, snapshot.data),
    data: snapshot.data,
    messages: snapshot.messages,
  };
  try {
    if (s.draftId == null) {
      const created = await createDraft(payload);
      s.draftId = created.id;
    } else {
      await updateDraft(s.draftId, payload);
    }
    setStatus(s.dirty ? "saving" : "saved");
  } catch {
    setStatus("error");
  } finally {
    s.inFlight = false;
    if (s.dirty) void persistDraft(saver, latest, setStatus);
  }
}

function Editor() {
  const searchParams = useSearchParams();
  const draftParam = searchParams.get("draft");

  const [data, setData] = useState<DocumentData>(emptyDocument);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [def, setDef] = useState<DocumentDef | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Persistence state lives in refs so the single-flight saver never races or
  // double-creates, regardless of how often data/messages change.
  const hydratingRef = useRef(false);
  const saver = useRef<SaverState>({ draftId: null, inFlight: false, dirty: false });
  const latest = useRef<Snapshot>(null);

  // Load the chosen agreement's definition whenever the document type changes.
  useEffect(() => {
    if (!data.documentType) {
      setDef(null);
      return;
    }
    if (def?.id === data.documentType) return;
    let active = true;
    fetchDocumentDef(data.documentType)
      .then((loaded) => active && setDef(loaded))
      .catch(() => active && setDef(null));
    return () => {
      active = false;
    };
  }, [data.documentType, def?.id]);

  // Hydrate from ?draft=ID (reopen), or reset to a fresh session when absent.
  useEffect(() => {
    if (!draftParam) {
      saver.current = { draftId: null, inFlight: false, dirty: false };
      setData(emptyDocument());
      setMessages([GREETING]);
      setDef(null);
      setSaveStatus("idle");
      return;
    }
    const id = Number(draftParam);
    if (!Number.isFinite(id) || id === saver.current.draftId) return;

    let active = true;
    hydratingRef.current = true;
    getDraft(id)
      .then((draft) => {
        if (!active) return;
        saver.current = { draftId: draft.id, inFlight: false, dirty: false };
        setData(draft.data);
        setMessages(draft.messages.length ? draft.messages : [GREETING]);
        setSaveStatus("saved");
      })
      .catch(() => active && setSaveStatus("error"))
      .finally(() => {
        // Release after state settles so the auto-save effect doesn't re-save.
        if (active) requestAnimationFrame(() => (hydratingRef.current = false));
      });
    return () => {
      active = false;
    };
  }, [draftParam]);

  // Auto-save (debounced) after each change, once a document type is chosen.
  useEffect(() => {
    if (hydratingRef.current || !data.documentType) return;
    latest.current = { data, messages, def };
    saver.current.dirty = true;
    const timer = setTimeout(
      () => void persistDraft(saver, latest, setSaveStatus),
      600,
    );
    return () => clearTimeout(timer);
  }, [data, messages, def]);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        actions={
          <>
            <SaveIndicator status={saveStatus} />
            <DocumentDownloadButton def={def} data={data} />
          </>
        }
      />
      <DraftDisclaimer />

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <section aria-label="Agreement chat" className="min-h-0">
          <DocumentChat
            data={data}
            onChange={setData}
            messages={messages}
            onMessagesChange={setMessages}
          />
        </section>

        <section
          aria-label="Document preview"
          className="rounded-xl bg-muted/50 p-3 ring-1 ring-border sm:p-5 lg:sticky lg:top-20 lg:h-[calc(100vh-7.5rem)] lg:overflow-y-auto"
        >
          <DocumentPreview def={def} data={data} />
        </section>
      </main>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const config = {
    saving: { icon: <Loader2Icon className="size-3.5 animate-spin" />, text: "Saving…" },
    saved: { icon: <CheckIcon className="size-3.5" />, text: "Saved" },
    error: { icon: null, text: "Not saved" },
  }[status];
  return (
    <span
      className={`hidden items-center gap-1.5 text-xs sm:inline-flex ${
        status === "error" ? "text-destructive" : "text-muted-foreground"
      }`}
    >
      {config.icon}
      {config.text}
    </span>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <Editor />
      </Suspense>
    </AuthGuard>
  );
}
