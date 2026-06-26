import { CheckIcon } from "lucide-react";

import { Logo } from "@/components/brand";

const HIGHLIGHTS = [
  "Draft any common business agreement by chatting in plain language",
  "Live document preview with instant PDF export",
  "Your drafts are saved so you can pick up right where you left off",
];

/**
 * The two-pane auth layout: a brand/marketing panel on the left and the form on
 * the right. Used by both sign in and sign up for a cohesive SaaS feel.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-full lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-black/10 blur-2xl"
        />
        <Logo className="relative [&_span]:text-primary-foreground" />

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Professional legal agreements, drafted in minutes.
          </h2>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-primary-foreground/90">
                <CheckIcon className="mt-0.5 size-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/70">
          AI-generated drafts are not legal advice. Have documents reviewed by a
          qualified attorney before use.
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
