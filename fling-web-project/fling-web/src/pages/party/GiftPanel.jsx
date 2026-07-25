import { useState } from "react";
import api from "../../lib/api";
import { Avatar, Button, CoinBadge } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

const PRESETS = [10, 50, 100, 500];

export default function GiftPanel({ roomId, members, onClose, onSent }) {
  const { user, refreshBalance } = useAuth();
  const [target, setTarget] = useState(null);
  const [amount, setAmount] = useState(50);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const others = members.filter((m) => m.userId !== user.id);

  async function send() {
    if (!target) return;
    setError("");
    setSending(true);
    try {
      await api.post("/wallet/gift", { roomId, toUserId: target.userId, coins: amount });
      await refreshBalance();
      onSent?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't send the gift.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="slide-up w-full max-w-[480px] rounded-t-3xl border-t border-border bg-surface p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Send a gift 🎁</h3>
          <CoinBadge amount={user.coinBalance} />
        </div>

        {others.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-dim">
            No one else has joined yet — invite a friend first!
          </p>
        ) : (
          <>
            <div className="mb-4 flex gap-3 overflow-x-auto pb-1">
              {others.map((m) => (
                <button
                  key={m.userId}
                  onClick={() => setTarget(m)}
                  className="flex shrink-0 flex-col items-center gap-1.5"
                >
                  <div
                    className={`rounded-full p-0.5 ${target?.userId === m.userId ? "ring-2 ring-primary" : ""}`}
                  >
                    <Avatar name={m.name} size={48} />
                  </div>
                  <span className="max-w-[56px] truncate text-xs text-text-dim">{m.name}</span>
                </button>
              ))}
            </div>

            <div className="mb-4 grid grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(p)}
                  className={`rounded-xl border py-2.5 text-sm font-semibold ${
                    amount === p
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border bg-surface-2 text-text-dim"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {error && <p className="mb-3 text-sm text-danger">{error}</p>}
            <Button variant="gold" disabled={!target || sending} onClick={send}>
              {sending ? "Sending…" : `Send ${amount} coins`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
