import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Button, Input } from "../../components/ui";

const MIN_COINS = 500;
const CASHOUT_RATE = 0.3333 / 2; // matches backend defaults: (coins / COINS_PER_RUPEE) * CASHOUT_FRACTION

export default function CashoutScreen() {
  const { user, refreshBalance } = useAuth();
  const navigate = useNavigate();
  const [coins, setCoins] = useState(String(MIN_COINS));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);

  useEffect(() => {
    api.get("/kyc/status").then(({ data }) => setKycStatus(data.status)).catch(() => {});
  }, []);

  const coinsNum = parseFloat(coins) || 0;
  const estRupees = (coinsNum * CASHOUT_RATE).toFixed(2);

  async function handleCashout() {
    setError("");
    if (coinsNum < MIN_COINS) {
      setError(`Minimum cash-out is ${MIN_COINS} coins`);
      return;
    }
    if (coinsNum > (user.coinBalance || 0)) {
      setError("You don't have that many coins");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/wallet/cashout", { coins: coinsNum });
      await refreshBalance();
      setDone(data.rupeesQueued);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't process the cash-out.");
    } finally {
      setLoading(false);
    }
  }

  if (done !== null) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="text-4xl">✅</span>
        <h1 className="text-xl font-bold">Cash-out requested</h1>
        <p className="text-sm text-text-dim">
          ₹{Number(done).toFixed(2)} is queued for payout to your verified bank account. This is
          reviewed manually before funds are sent.
        </p>
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
      <h1 className="mb-1 text-2xl font-bold">Cash out</h1>
      <p className="mb-6 text-sm text-text-dim">
        Balance: <span className="mono text-gold">{Math.round(user.coinBalance || 0)}</span> coins
      </p>

      <div className="space-y-4">
        <Input
          label="Coins to cash out"
          type="number"
          min={MIN_COINS}
          value={coins}
          onChange={(e) => setCoins(e.target.value)}
        />
        <p className="text-sm text-text-dim">
          You'll receive approximately{" "}
          <span className="font-semibold text-text">₹{estRupees}</span>
        </p>
        {kycStatus !== "verified" && (
          <div className="rounded-xl border border-gold/30 bg-gold/5 p-3 text-xs text-gold">
            KYC verification is required before your first cash-out.{" "}
            <button onClick={() => navigate("/wallet/kyc")} className="underline">
              Verify now
            </button>
          </div>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button onClick={handleCashout} disabled={loading}>
          {loading ? "Processing…" : "Request cash-out"}
        </Button>
      </div>
    </div>
  );
}
