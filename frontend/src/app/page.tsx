"use client";

import { useState } from "react";

import { defaultNdaData } from "@/lib/nda";
import { NdaForm } from "@/components/nda-form";
import { NdaPreview } from "@/components/nda-preview";
import { NdaDownloadButton } from "@/components/nda-download-button";

export default function Home() {
  const [data, setData] = useState(defaultNdaData);

  return (
    <div className="min-h-full">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">PreLegal · Mutual NDA Creator</h1>
            <p className="text-sm text-muted-foreground">
              Fill in the details, preview your agreement, and download a PDF.
            </p>
          </div>
          <NdaDownloadButton data={data} />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <section aria-label="Agreement form">
          <NdaForm data={data} onChange={setData} />
        </section>

        <section
          aria-label="Document preview"
          className="rounded-lg bg-neutral-100 p-4 lg:sticky lg:top-8 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto lg:p-6"
        >
          <NdaPreview data={data} />
        </section>
      </main>
    </div>
  );
}
