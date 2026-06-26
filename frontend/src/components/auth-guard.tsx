"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getToken } from "@/lib/auth";

/**
 * Client-side gate for authenticated pages. Renders its children only when a
 * session token exists; otherwise redirects to /login. While the token is being
 * read on the client it renders nothing to avoid a flash of protected content.
 * (Requests themselves are still validated server-side; authFetch handles 401s.)
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return <>{children}</>;
}
