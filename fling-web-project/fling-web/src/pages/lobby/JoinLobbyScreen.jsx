import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { Button, Input } from "../../components/ui";
import { saveRecentRoom } from "../../lib/recentRooms";

export default function JoinLobbyScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleJoin(e) {
    e.preventDefault();
    setError("");
    const roomId = code.trim();
    if (!roomId) {
      setError("Paste a room code or link");
      return;
    }
    setLoading(true);
    try {
      const { data: room } = await api.post(`/rooms/${roomId}/join`);
      saveRecentRoom(room);
      navigate(`/party/${room.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "That party couldn't be found.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col px-6 pb-10 pt-8">
      <button onClick={() => navigate(-1)} className="mb-6 self-start text-text-dim">
        ← Back
      </button>
      <h1 className="mb-1 text-2xl font-bold">Join a party</h1>
      <p className="mb-6 text-sm text-text-dim">
        Ask the host for their room code, or paste the link they shared.
      </p>

      <form onSubmit={handleJoin} className="space-y-4">
        <Input
          label="Room code"
          placeholder="e.g. 3f9a21e0-…"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Joining…" : "Join party"}
        </Button>
      </form>
    </div>
  );
}
