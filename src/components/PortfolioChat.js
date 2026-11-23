import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../utils/api";
import { notify } from "../utils/notifications";

function AssistantIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="2.5" r="1.4" fill="currentColor" />
      <rect x="4" y="7" width="16" height="13" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" />
      <path d="M9 16h6M4 11H2.5v4H4m16-4h1.5v4H20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PortfolioChat({ t }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const endOfMessages = useRef(null);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e) {
    e.preventDefault();
    const message = draft.trim();
    if (!message || loading) return;
    if (message.length > 600) {
      notify.error(t.assistantTooLong);
      return;
    }

    const history = messages.slice(-8).map(({ role, text }) => ({ role, text }));
    setMessages((current) => [...current, { role: "user", text: message }]);
    setDraft("");
    setLoading(true);

    try {
      const { reply } = await apiRequest("/assistant/chat", {
        method: "POST",
        body: { message, history },
      });
      setMessages((current) => [...current, { role: "assistant", text: reply }]);
    } catch (error) {
      notify.error(error.message);
      setMessages((current) => [...current, { role: "assistant", text: t.assistantError }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="portfolio-chat">
      {open && (
        <section className="ai-chat-panel" role="dialog" aria-label={t.assistantTitle}>
          <header className="ai-chat-header">
            <div className="ai-chat-brand">
              <span className="ai-chat-avatar"><AssistantIcon /></span>
              <div>
                <strong>{t.assistantTitle}</strong>
                <small>{t.assistantSubtitle}</small>
              </div>
            </div>
            <button type="button" className="ai-chat-close" onClick={() => setOpen(false)} aria-label={t.assistantClose}>×</button>
          </header>
          <div className="ai-chat-messages" aria-live="polite">
            {messages.length === 0 && <p className="ai-chat-bubble assistant">{t.assistantWelcome}</p>}
            {messages.map((entry, index) => (
              <p className={`ai-chat-bubble ${entry.role}`} key={`${entry.role}-${index}`}>{entry.text}</p>
            ))}
            {loading && <p className="ai-chat-bubble assistant ai-chat-thinking">{t.assistantThinking}</p>}
            <div ref={endOfMessages} />
          </div>
          <form className="ai-chat-form" onSubmit={sendMessage}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t.assistantPlaceholder}
              maxLength={600}
              aria-label={t.assistantPlaceholder}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !draft.trim()}>{t.assistantSend}</button>
          </form>
          <small className="ai-chat-note">{t.assistantPrivacy}</small>
        </section>
      )}
      <button
        type="button"
        className="ai-chat-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? t.assistantClose : t.assistantButton}
        title={t.assistantButton}
      >
        <AssistantIcon />
        <span>{t.assistantButton}</span>
      </button>
    </div>
  );
}

export default PortfolioChat;
