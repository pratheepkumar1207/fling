import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { Button, Input } from "../../components/ui";
import { saveRecentRoom } from "../../lib/recentRooms";

export default function CreateLobbyScreen() {
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState("youtube");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !videoUrl.trim()) {
      setError("Give your party a name and a video link");
      return;
    }
    setLoading(true);
    try {
      const { data: room } = await api.post("/rooms", { title, sourceType, videoUrl });
      saveRecentRoom(room);
      navigate(`/party/${room.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't create the party. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col px-6 pb-10 pt-8">
      <button onClick={() => navigate(-1)} className="mb-6 self-start text-text-dim">
        ← Back
      </button>
      <h1 className="mb-1 text-2xl font-bold">Start a party</h1>
      <p className="mb-6 text-sm text-text-dim">
        Pick a video source — everyone who joins watches it in sync.
      </p>

      <form onSubmit={handleCreate} className="space-y-4">
        <Input
          label="Party name"
          placeholder="Friday night movie 🍿"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <span className="mb-1.5 block text-xs font-medium text-text-dim">Video source</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSourceType("youtube")}
              className={`rounded-xl border py-3 text-sm font-medium ${
                sourceType === "youtube"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface-2 text-text-dim"
              }`}
            >
              ▶ YouTube
            </button>
            <button
              type="button"
              onClick={() => setSourceType("drive")}
              className={`rounded-xl border py-3 text-sm font-medium ${
                sourceType === "drive"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface-2 text-text-dim"
              }`}
            >
              📁 Google Drive
            </button>
          </div>
        </div>

        <Input
          label={sourceType === "youtube" ? "YouTube link" : "Google Drive file ID or link"}
          placeholder={
            sourceType === "youtube"
              ? "https://youtube.com/watch?v=..."
              : "https://drive.google.com/file/d/.../view"
          }
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />

        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create & enter party"}
        </Button>
      </form>
    </div>
  );
}
