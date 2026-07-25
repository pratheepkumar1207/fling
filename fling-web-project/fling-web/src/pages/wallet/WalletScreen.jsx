import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/ui";
import BottomNav from "../../components/BottomNav";

export default function WalletScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex-1 px-5 pb-6 pt-8">
        <h1 className="mb-6 text-xl font-bold">Wallet</h1>

        <div className="mb-6 rounded-3xl bg-gradient-to-br from-primary to-plum p-5">
          <p className="mb-1 text-xs text-white/70">Coin balance</p>
          <p className="mono text-3xl font-bold text-white">
            {Math.round(user?.coinBalance || 0).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/wallet/buy")}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface p-4 text-left"
          >
            <span>
              <span className="block font-medium">Buy coins</span>
              <span className="block text-xs text-text-dim">Top up with UPI / card</span>
            </span>
            <span className="text-xl">💳</span>
          </button>

          <button
            onClick={() => navigate("/wallet/cashout")}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface p-4 text-left"
          >
            <span>
              <span className="block font-medium">Cash out</span>
              <span className="block text-xs text-text-dim">Redeem coins for rupees</span>
            </span>
            <span className="text-xl">🏦</span>
          </button>

          <button
            onClick={() => navigate("/wallet/kyc")}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface p-4 text-left"
          >
            <span>
              <span className="block font-medium">KYC verification</span>
              <span className="block text-xs text-text-dim">Required before cashing out</span>
            </span>
            <span className="text-xl">🪪</span>
          </button>
        </div>

        <Card className="mt-6 bg-surface-2/50">
          <p className="text-xs leading-relaxed text-text-dim">
            Gifting moves coins between users instantly. Cashing out converts coins to real
            rupees and requires identity verification — payouts are reviewed before funds are
            sent.
          </p>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
