"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getUser, type SessionUser } from "@/lib/auth";

/**
 * Client-side gate for the fake login. Renders its children only when a session
 * exists; otherwise redirects to /login. While the session is being read on the
 * client it renders nothing to avoid a flash of protected content.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUserState] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const current = getUser();
    if (!current) {
      router.replace("/login");
      return;
    }
    setUserState(current);
    setChecked(true);
  }, [router]);

  if (!checked || !user) return null;

  return <>{children}</>;
}
