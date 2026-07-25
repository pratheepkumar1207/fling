import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui";
import { loadRazorpay } from "../../lib/razorpay";

const PACKS = [
  { rupees: 99, coins: 198 },
  { rupees: 299, coins: 598 },
  { rupees: 499, coins: 998 },
  { rupees: 999, coins: 1998 },
];

export default function BuyCoinsScreen() {
  const [selected, setSelected] = useState(PACKS[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { user, refreshBalance } = useAuth();
  const navigate = useNavigate();

  async function handleBuy() {
    setError("");
    setLoading(true);
    try {
      await loadRazorpay();
      const { data: order } = await api.post("/wallet/buy/order", { rupees: selected.rupees });

      const rzp = new window.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Fling",
        description: `${selected.coins} coins`,
        prefill: { name: user.name, contact: user.phone },
        theme: { color: "#FF5673" },
        handler: async (response) => {
          try {
            await api.post("/wallet/buy/verify", {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            await refreshBalance();
            setSuccess(true);
          } catch {
            setError("Payment succeeded but verification failed — contact support.");
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.on("payment.failed", () => setError("Payment failed. Try again."));
      rzp.open();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (err.message.includes("Razorpay")
            ? "Payments aren't configured yet — add your Razorpay keys to enable checkout."
            : "Something went wrong. Try again.")
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-4xl">🎉</span>
        <h1 className="text-xl font-bold">Coins added!</h1>
        <p className="text-sm text-text-dim">Your balance is now {Math.round(user.coinBalance)}</p>
        <Button onClick={() => navigate("/wallet")} className="mt-4 max-w-[220px]">
          Back to wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col px-6 pb-10 pt-8">
      <button onClick={() => navigate(-1)} className="mb-6 self-start text-text-dim">
        ← Back
      </button>
      <h1 className="mb-1 text-2xl font-bold">Buy coins</h1>
      <p className="mb-6 text-sm text-text-dim">Secure checkout via Razorpay (UPI, cards, netbanking).</p>

      <div className="mb-6 grid grid-cols-2 gap-3">
        {PACKS.map((p) => (
          <button
            key={p.rupees}
            onClick={() => setSelected(p)}
            className={`rounded-2xl border p-4 text-left ${
              selected.rupees === p.rupees
                ? "border-primary bg-primary/10"
                : "border-border bg-surface"
            }`}
          >
            <p className="mono text-lg font-bold text-gold">{p.coins}</p>
            <p className="text-xs text-text-dim">coins</p>
            <p className="mt-2 text-sm font-semibold">₹{p.rupees}</p>
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      <Button onClick={handleBuy} disabled={loading}>
        {loading ? "Opening checkout…" : `Pay ₹${selected.rupees}`}
      </Button>
    </div>
  );
}
