"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileTextIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { type DraftSummary, deleteDraft, listDrafts } from "@/lib/drafts";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/auth-guard";
import { AppHeader } from "@/components/app-header";
import { Button, buttonVariants } from "@/components/ui/button";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Documents() {
  const [drafts, setDrafts] = useState<DraftSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    listDrafts()
      .then(setDrafts)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load."));
  }, []);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteDraft(id);
      setDrafts((current) => (current ?? []).filter((d) => d.id !== id));
    } catch {
      setError("Could not delete that document.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-full">
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My documents</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Every agreement you&apos;ve drafted. Open one to keep editing or download it.
            </p>
          </div>
          <Link href="/" className={cn(buttonVariants())}>
            <PlusIcon className="size-4" />
            New document
          </Link>
        </div>

        {error && (
          <p className="mt-6 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="mt-8">
          {drafts === null ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2Icon className="size-5 animate-spin" />
            </div>
          ) : drafts.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-3">
              {drafts.map((draft) => (
                <li
                  key={draft.id}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
                >
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"
                  >
                    <FileTextIcon className="size-5" />
                  </span>
                  <Link
                    href={`/?draft=${draft.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate font-medium text-foreground">
                      {draft.title || "Untitled document"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Updated {formatWhen(draft.updatedAt)}
                    </p>
                  </Link>
                  <Link
                    href={`/?draft=${draft.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Open
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete document"
                    disabled={deletingId === draft.id}
                    onClick={() => handleDelete(draft.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {deletingId === draft.id ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      <Trash2Icon className="size-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span
        aria-hidden
        className="mx-auto grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground"
      >
        <FileTextIcon className="size-6" />
      </span>
      <h2 className="mt-4 text-lg font-medium">No documents yet</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Start a conversation with the assistant and your draft will be saved here
        automatically.
      </p>
      <Link href="/" className={cn(buttonVariants(), "mt-6")}>
        <PlusIcon className="size-4" />
        Create your first document
      </Link>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <AuthGuard>
      <Documents />
    </AuthGuard>
  );
}
