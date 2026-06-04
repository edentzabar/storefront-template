"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { chatbotReply } from "@/lib/ai/chatbot-actions";

/**
 * Floating chat bubble that opens a panel for AI-assisted store
 * questions. Rendered in the storefront layout — but only when the
 * merchant enables it in /admin/settings → chatbot.
 *
 * History lives in sessionStorage so it survives navigations within
 * the same tab; clears on tab close. No PII is sent to any server
 * other than the merchant's chosen AI provider.
 */

type Message = { role: "user" | "assistant"; content: string };

type Props = {
  welcomeMessage: string;
  position: "bottom-right" | "bottom-left";
};

const STORAGE_KEY = "chatbot:messages:v1";

export function ChatbotWidget({ welcomeMessage, position }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hydrate from sessionStorage so navigation doesn't clear the chat
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {
      // ignore — storage unavailable in some contexts (incognito + restrictive)
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, busy, open]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const newUser: Message = { role: "user", content: text };
    setHistory((h) => [...h, newUser]);
    setInput("");
    setBusy(true);

    try {
      const result = await chatbotReply({
        history,
        message: text,
      });
      if (result.ok) {
        setHistory((h) => [...h, { role: "assistant", content: result.text }]);
      } else {
        setHistory((h) => [
          ...h,
          {
            role: "assistant",
            content: result.message || "סליחה, יש לי בעיה כרגע, נסי שוב עוד רגע.",
          },
        ]);
      }
    } catch {
      setHistory((h) => [
        ...h,
        { role: "assistant", content: "סליחה, יש לי בעיה כרגע, נסי שוב עוד רגע." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const cornerClass =
    position === "bottom-left" ? "bottom-4 left-4" : "bottom-4 right-4";

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          type="button"
          aria-label="פתח צ'אט"
          onClick={() => setOpen(true)}
          className={`fixed ${cornerClass} z-[60] size-14 rounded-full bg-brand-accent text-white shadow-[0_10px_30px_-8px_rgba(207,152,52,0.6)] hover:bg-brand-accent-dark active:scale-95 transition-all grid place-items-center cursor-pointer`}
        >
          <MessageCircle className="size-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={`fixed ${cornerClass} z-[60] w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-6rem))] bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] border border-brand-border flex flex-col overflow-hidden`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-brand-primary text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-400" aria-hidden />
              <span className="text-sm font-medium">עוזר חנות</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגור"
              className="size-7 grid place-items-center rounded-md hover:bg-white/15 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-brand-bg-soft/40"
          >
            <Bubble role="assistant">{welcomeMessage}</Bubble>
            {history.map((m, i) => (
              <Bubble key={i} role={m.role}>
                {m.content}
              </Bubble>
            ))}
            {busy && (
              <Bubble role="assistant">
                <span className="inline-flex items-center gap-1.5 text-brand-text-soft">
                  <span className="size-1.5 rounded-full bg-brand-text-soft animate-pulse" />
                  <span className="size-1.5 rounded-full bg-brand-text-soft animate-pulse [animation-delay:0.15s]" />
                  <span className="size-1.5 rounded-full bg-brand-text-soft animate-pulse [animation-delay:0.3s]" />
                </span>
              </Bubble>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={send}
            className="border-t border-brand-border bg-white px-3 py-2.5 flex items-center gap-2 shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="כתבי שאלה…"
              className="flex-1 min-w-0 px-3 py-2 bg-brand-bg-soft border border-brand-border rounded-lg text-sm outline-none focus:border-brand-accent"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="shrink-0 size-9 rounded-lg bg-brand-accent text-white grid place-items-center hover:bg-brand-accent-dark disabled:opacity-50 cursor-pointer"
              aria-label="שלח"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[0.92rem] leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-brand-accent text-white rounded-br-sm"
            : "bg-white border border-brand-border text-brand-text rounded-bl-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
