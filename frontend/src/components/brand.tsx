import { cn } from "@/lib/utils";

/** The PreLegal wordmark with a small document/checkmark mark. */
export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2.5h7.5L19 8v13.5H6z" />
          <path d="M13 2.5V8h6" />
          <path d="M9 13.5l2 2 4-4" />
        </svg>
      </span>
      {showText && (
        <span className="text-base font-semibold tracking-tight text-foreground">
          Pre<span className="text-primary">Legal</span>
        </span>
      )}
    </span>
  );
}
