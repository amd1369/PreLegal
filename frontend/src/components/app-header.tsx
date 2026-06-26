"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2Icon, FilesIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand";
import { AccountMenu } from "@/components/account-menu";

const NAV = [
  { href: "/", label: "New document", icon: FilePlus2Icon },
  { href: "/documents", label: "My documents", icon: FilesIcon },
];

/** The persistent top bar: brand, primary nav, and account menu. */
export function AppHeader({ actions }: { actions?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="PreLegal home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {actions}
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
