"use client";

import { useEffect, useState } from "react";

import { type DocumentDef, emptyDocument } from "@/lib/document";
import { fetchDocumentDef } from "@/lib/api";
import { DocumentChat } from "@/components/document-chat";
import { DocumentPreview } from "@/components/document-preview";
import { DocumentDownloadButton } from "@/components/document-download-button";
import { AuthGuard } from "@/components/auth-guard";
import { AccountMenu } from "@/components/account-menu";

export default function Home() {
  const [data, setData] = useState(emptyDocument);
  const [def, setDef] = useState<DocumentDef | null>(null);

  // Load the chosen agreement's definition (fields, sections) whenever the
  // assistant settles on a document type. The preview and PDF draw from it.
  useEffect(() => {
    if (!data.documentType) {
      setDef(null);
      return;
    }
    if (def?.id === data.documentType) return;

    let active = true;
    fetchDocumentDef(data.documentType)
      .then((loaded) => {
        if (active) setDef(loaded);
      })
      .catch(() => {
        if (active) setDef(null);
      });
    return () => {
      active = false;
    };
  }, [data.documentType, def?.id]);

  return (
    <AuthGuard>
      <div className="min-h-full">
        <header className="border-b bg-card">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold">PreLegal · Agreement Creator</h1>
              <p className="text-sm text-muted-foreground">
                Chat to draft your agreement, preview it, and download a PDF.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <DocumentDownloadButton def={def} data={data} />
              <AccountMenu />
            </div>
          </div>
        </header>

        <main className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,420px)_1fr]">
          <section aria-label="Agreement chat">
            <DocumentChat data={data} onChange={setData} />
          </section>

          <section
            aria-label="Document preview"
            className="rounded-lg bg-neutral-100 p-4 lg:sticky lg:top-8 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto lg:p-6"
          >
            <DocumentPreview def={def} data={data} />
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}
