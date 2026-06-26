"use client";

import { useState } from "react";
import { DownloadIcon, Loader2Icon } from "lucide-react";

import {
  type DocumentData,
  type DocumentDef,
  documentFileName,
} from "@/lib/document";
import { Button } from "@/components/ui/button";

interface DocumentDownloadButtonProps {
  def: DocumentDef | null;
  data: DocumentData;
}

export function DocumentDownloadButton({
  def,
  data,
}: DocumentDownloadButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (!def) return;
    setGenerating(true);
    try {
      // Lazily import the renderer so it never runs during server rendering.
      const [{ pdf }, { DocumentPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/document-pdf"),
      ]);

      const blob = await pdf(<DocumentPdf def={def} data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = documentFileName(def, data);
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={generating || !def}>
      {generating ? (
        <Loader2Icon className="animate-spin" />
      ) : (
        <DownloadIcon />
      )}
      {generating ? "Generating…" : "Download PDF"}
    </Button>
  );
}
