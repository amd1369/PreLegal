"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getUser, setUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // If already signed in, skip the login screen.
  useEffect(() => {
    if (getUser()) router.replace("/");
  }, [router]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setUser(name, email);
    router.replace("/");
  }

  return (
    <main className="flex min-h-full items-center justify-center bg-neutral-100 px-6 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">PreLegal</CardTitle>
          <CardDescription>
            Sign in to draft your legal agreements. No password required — this
            is a preview environment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                autoComplete="email"
              />
            </div>
            <Button type="submit" size="lg" className="mt-2">
              Enter platform
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
