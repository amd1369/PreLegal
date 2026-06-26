import { InfoIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { DISCLAIMER_SHORT, DISCLAIMER_TEXT } from "@/lib/disclaimer";

/**
 * A subtle disclaimer banner. `variant="bar"` is a full-width strip for the app
 * header area; `variant="inline"` is a rounded callout for forms and previews.
 */
export function DraftDisclaimer({
  variant = "bar",
  className,
}: {
  variant?: "bar" | "inline";
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900",
          className,
        )}
      >
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
        <span>{DISCLAIMER_TEXT}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-900",
        className,
      )}
    >
      <InfoIcon className="size-3.5 shrink-0" />
      <span>{DISCLAIMER_SHORT}</span>
    </div>
  );
}
