"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { clearUser, getUser, type SessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

/** Shows the signed-in identity and a sign-out action in the app header. */
export function AccountMenu() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  function handleSignOut() {
    clearUser();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {user.name}
      </span>
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}
