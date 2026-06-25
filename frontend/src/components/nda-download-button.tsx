"use client";

import { useState } from "react";
import { DownloadIcon, Loader2Icon } from "lucide-react";

import type { NdaData } from "@/lib/nda";
import { Button } from "@/components/ui/button";

interface NdaDownloadButtonProps {
  data: NdaData;
}

function fileName(data: NdaData): string {
  const parts = [data.party1.company, data.party2.company]
    .map((c) => c.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, ""))
    .filter(Boolean);
  const base = parts.length ? parts.join("-and-") : "Mutual-NDA";
  return `${base}-Mutual-NDA.pdf`;
}

export function NdaDownloadButton({ data }: NdaDownloadButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      // Lazily import the renderer so it never runs during server rendering.
      const [{ pdf }, { NdaDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/nda-document"),
      ]);

      const blob = await pdf(<NdaDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName(data);
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={generating}>
      {generating ? (
        <Loader2Icon className="animate-spin" />
      ) : (
        <DownloadIcon />
      )}
      {generating ? "Generating…" : "Download PDF"}
    </Button>
  );
}
