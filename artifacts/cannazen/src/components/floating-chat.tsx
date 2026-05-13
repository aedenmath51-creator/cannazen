import React from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ChatMessage = { from: "bot" | "me"; text: string };

const FALLBACK_REPLY =
  "Désolé, je rencontre une difficulté technique. Écrivez-nous à contact@cannazen.fr et un conseiller vous répondra sous 24h.";

export function FloatingChat() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { from: "bot", text: "Bonjour ! Je suis le concierge CannaZen. Comment puis-je vous aider ?" },
  ]);
  const [draft, setDraft] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { from: "me", text }];
    setMessages(nextMessages);
    setDraft("");
    setLoading(true);

    try {
      const payload = nextMessages.map((m) => ({
        role: (m.from === "me" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        setMessages((m) => [...m, { from: "bot", text: errBody.error ?? FALLBACK_REPLY }]);
      } else {
        const json = (await res.json()) as { reply: string };
        setMessages((m) => [...m, { from: "bot", text: json.reply }]);
      }
    } catch {
      setMessages((m) => [...m, { from: "bot", text: FALLBACK_REPLY }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-[60] w-[340px] max-w-[calc(100vw-2rem)] h-[440px] rounded-2xl bg-card border border-border shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
            data-testid="chat-panel"
          >
            <div className="px-5 py-4 bg-secondary text-secondary-foreground flex items-center justify-between">
              <div>
                <p className="font-serif text-lg leading-none">CannaZen</p>
                <p className="text-xs opacity-80 mt-1">Concierge en ligne</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-white/10"
                aria-label="Fermer le chat"
                data-testid="chat-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background/50"
              role="log"
              aria-live="polite"
              aria-label="Conversation avec le concierge CannaZen"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.from === "bot"
                      ? "bg-muted text-foreground rounded-bl-sm"
                      : "bg-primary text-primary-foreground ml-auto rounded-br-sm"
                  }`}
                >
                  <span className="sr-only">{m.from === "bot" ? "Concierge :" : "Vous :"} </span>
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="max-w-[85%] px-3 py-2 rounded-2xl text-sm bg-muted text-muted-foreground rounded-bl-sm flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Le concierge réfléchit…
                </div>
              )}
            </div>
            <form onSubmit={send} className="border-t border-border p-3 flex gap-2">
              <label htmlFor="cz-chat-input" className="sr-only">
                Votre message au concierge
              </label>
              <input
                id="cz-chat-input"
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Votre message..."
                aria-label="Votre message au concierge"
                disabled={loading}
                className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                data-testid="chat-input"
              />
              <button
                type="submit"
                disabled={loading || !draft.trim()}
                className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
                aria-label="Envoyer"
                data-testid="chat-send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((o) => !o)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 200, damping: 15 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full bg-secondary text-secondary-foreground shadow-xl shadow-black/30 flex items-center justify-center hover:shadow-2xl transition-shadow"
        aria-label={open ? "Fermer le chat" : "Ouvrir le chat"}
        data-testid="chat-toggle"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span key="msg" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
