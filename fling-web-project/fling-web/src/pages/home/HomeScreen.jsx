import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button, Card, CoinBadge, EmptyState } from "../../components/ui";
import BottomNav from "../../components/BottomNav";
import { getRecentRooms } from "../../lib/recentRooms";

export default function HomeScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [recent, setRecent] = useState([]);
  const welcome = params.get("welcome");

  useEffect(() => {
    setRecent(getRecentRooms());
  }, []);

  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-text-dim">
              {welcome ? "Welcome to Fling 👋" : "Welcome back"}
            </p>
            <h1 className="text-xl font-bold">{user?.name || "Hey there"}</h1>
          </div>
          <button onClick={() => navigate("/wallet")}>
            <CoinBadge amount={user?.coinBalance || 0} size="md" />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/lobby/create")}
            className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 to-plum/40 p-4 text-left transition active:scale-[0.97]"
          >
            <span className="mb-3 block text-2xl">➕</span>
            <span className="block font-semibold">Start a party</span>
            <span className="block text-xs text-text-dim">Host & pick a video</span>
          </button>
          <button
            onClick={() => navigate("/lobby/join")}
            className="rounded-2xl border border-border bg-surface p-4 text-left transition active:scale-[0.97]"
          >
            <span className="mb-3 block text-2xl">🔗</span>
            <span className="block font-semibold">Join a party</span>
            <span className="block text-xs text-text-dim">Enter a room code</span>
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-dim">Recent parties</h2>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No parties yet"
            hint="Start one, or join with a code a friend sent you."
          />
        ) : (
          <div className="space-y-2">
            {recent.map((r) => (
              <Card
                key={r.id}
                className="flex cursor-pointer items-center justify-between"
              >
                <div onClick={() => navigate(`/party/${r.id}`)} className="flex-1">
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-text-dim">
                    {r.sourceType === "drive" ? "Google Drive" : "YouTube"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="w-auto px-4 py-2 text-xs"
                  onClick={() => navigate(`/party/${r.id}`)}
                >
                  Rejoin
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
