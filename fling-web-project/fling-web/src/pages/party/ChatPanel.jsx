import { useEffect, useRef, useState } from "react";
import { Avatar } from "../../components/ui";

export default function ChatPanel({ socket, roomId, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    function onMessage(msg) {
      setMessages((m) => [...m, msg]);
    }
    function onGift({ fromName, coins }) {
      setMessages((m) => [
        ...m,
        { system: true, text: `${fromName} sent ${coins} coins 🎁`, ts: Date.now() },
      ]);
    }
    socket.on("chat:message", onMessage);
    socket.on("gift:received", onGift);
    return () => {
      socket.off("chat:message", onMessage);
      socket.off("gift:received", onGift);
    };
  }, [socket]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function send(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    socket.emit("chat:message", { roomId, senderId: user.id, text: trimmed });
    setText("");
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="pt-8 text-center text-sm text-text-faint">
            Say hi to get the party started 👋
          </p>
        )}
        {messages.map((m, i) =>
          m.system ? (
            <p key={i} className="text-center text-xs text-gold">
              {m.text}
            </p>
          ) : (
            <div
              key={i}
              className={`flex items-end gap-2 ${m.senderId === user.id ? "flex-row-reverse" : ""}`}
            >
              <Avatar name={m.senderId === user.id ? user.name : "?"} size={26} />
              <div
                className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                  m.senderId === user.id
                    ? "rounded-br-sm bg-primary text-white"
                    : "rounded-bl-sm bg-surface-2 text-text"
                }`}
              >
                {m.text}
              </div>
            </div>
          )
        )}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message"
          className="flex-1 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-40"
          disabled={!text.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
