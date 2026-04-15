import { useState, useRef, useEffect } from 'react';

const GOAL_LABELS = {
  weight_loss: 'Weight Loss 🔥',
  muscle_gain: 'Muscle Gain 💪',
  maintenance: 'Maintenance ⚖️',
  general_health: 'General Health 🌿',
};

const SUGGESTIONS = [
  'Build me a full 7-day meal prep plan',
  'Give me a high-protein breakfast idea',
  'Show me a budget-friendly shopping list',
  'What snacks fit my goal?',
];

export default function ChatWindow({ profile, onReset }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm your personal meal prep coach. Based on your profile, I'm ready to build a plan tailored for **${GOAL_LABELS[profile.goal]}** with a **$${profile.budget}/week** budget.\n\nWhat would you like to start with?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    const userText = text ?? input.trim();
    if (!userText || loading) return;

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const assistantMessage = { role: 'assistant', content: '' };
    setMessages([...newMessages, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(({ role, content }) => ({ role, content })),
          profile,
        }),
      });

      if (!response.ok) throw new Error('Server error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.content) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + parsed.content,
                };
                return updated;
              });
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please check your API key and try again.',
        };
        return updated;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="sidebar-logo">
          <span>🥗</span>
          <span>Meal Planner AI</span>
        </div>

        <div className="profile-card">
          <h3>Your Profile</h3>
          <div className="profile-item">
            <span className="profile-label">Age</span>
            <span>{profile.age} yrs</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Height</span>
            <span>{profile.height}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Weight</span>
            <span>{profile.weight}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Goal</span>
            <span>{GOAL_LABELS[profile.goal]}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Budget</span>
            <span>${profile.budget}/week</span>
          </div>
        </div>

        <div className="sidebar-suggestions">
          <h4>Quick questions</h4>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              className="suggestion-btn"
              onClick={() => sendMessage(s)}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>

        <button className="btn-reset" onClick={onReset}>
          ← Start Over
        </button>
      </div>

      <div className="chat-main">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="avatar">🥗</div>
              )}
              <div className="bubble">
                <MessageContent content={msg.content} />
                {loading && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '' && (
                  <span className="typing-dots">
                    <span /><span /><span />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-row">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your meal plan, recipes, shopping list…"
            rows={1}
            disabled={loading}
          />
          <button
            className="btn-send"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            {loading ? <LoadingSpinner /> : '↑'}
          </button>
        </div>
        <p className="chat-hint">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

function MessageContent({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let listBuffer = [];

  function flushList() {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={elements.length}>
          {listBuffer.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      );
      listBuffer = [];
    }
  }

  lines.forEach((line, i) => {
    const trimmed = line.trimStart();
    if (/^#{1,3}\s/.test(trimmed)) {
      flushList();
      const level = trimmed.match(/^(#+)/)[1].length;
      const text = trimmed.replace(/^#+\s/, '');
      elements.push(
        <strong key={i} className={`md-h${level}`}>
          {text}
        </strong>
      );
    } else if (/^[-*]\s/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^[-*]\s/, ''));
    } else if (/^\d+\.\s/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^\d+\.\s/, ''));
    } else {
      flushList();
      if (trimmed === '') {
        elements.push(<br key={i} />);
      } else {
        elements.push(
          <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
        );
      }
    }
  });
  flushList();
  return <div className="message-body">{elements}</div>;
}

function formatInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function LoadingSpinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
