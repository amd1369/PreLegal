"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2Icon, SendIcon } from "lucide-react";

import type { DocumentData } from "@/lib/document";
import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DocumentChatProps {
  data: DocumentData;
  onChange: (data: DocumentData) => void;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help you draft a legal agreement — NDAs, service and license " +
    "agreements, partnership and pilot agreements, and more. What kind of " +
    "agreement would you like to create?",
};

export function DocumentChat({ data, onChange }: DocumentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    // The conversation starts with a display-only greeting; only send from the
    // first real user message so the API history begins with a user turn.
    const firstUser = next.findIndex((m) => m.role === "user");
    const history = next.slice(firstUser);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, data }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? "The assistant could not respond.");
      }
      const json: { reply: string; data: DocumentData } = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", content: json.reply || "(no response)" },
      ]);
      onChange(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col rounded-lg border bg-card lg:sticky lg:top-8 lg:h-[calc(100vh-7rem)] h-[70vh]">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Chat with the drafting assistant</h2>
        <p className="text-xs text-muted-foreground">
          Describe your agreement in plain language — the preview fills in as you go.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {m.content}
          </Bubble>
        ))}
        {loading && (
          <Bubble role="assistant">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2Icon className="size-3.5 animate-spin" />
              Thinking…
            </span>
          </Bubble>
        )}
      </div>

      {error && (
        <p className="px-4 pb-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer…"
            rows={2}
            className="min-h-0 resize-none"
            disabled={loading}
          />
          <Button
            type="button"
            size="icon"
            onClick={send}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}
