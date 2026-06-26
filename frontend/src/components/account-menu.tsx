"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";

import { clearSession, getUser, type SessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

/** Shows the signed-in identity and a sign-out action in the app header. */
export function AccountMenu() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  function handleSignOut() {
    clearSession();
    router.replace("/login");
  }

  if (!user) return null;

  const label = user.name || user.email;
  const initial = (label[0] ?? "?").toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
      >
        {initial}
      </span>
      <span className="hidden text-sm font-medium text-foreground sm:inline">
        {label}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        aria-label="Sign out"
        className="text-muted-foreground"
      >
        <LogOutIcon className="size-4" />
        <span className="hidden md:inline">Sign out</span>
      </Button>
    </div>
  );
}
