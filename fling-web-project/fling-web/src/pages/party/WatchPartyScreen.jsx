import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { Avatar, Spinner } from "../../components/ui";
import VideoPlayerWidget from "./VideoPlayerWidget";
import ChatPanel from "./ChatPanel";
import GiftPanel from "./GiftPanel";
import CallOverlay from "./CallOverlay";
import { saveRecentRoom } from "../../lib/recentRooms";

export default function WatchPartyScreen() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [showGift, setShowGift] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const socket = getSocket(user.id);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/rooms/${roomId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setRoom(data);
        saveRecentRoom(data);
      })
      .catch(() => setError("This party couldn't be found, or has ended."));
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    socket.emit("room:join", { roomId, name: user.name });
    function onRoster(list) {
      setMembers(list);
    }
    socket.on("presence:roster", onRoster);
    return () => {
      socket.emit("room:leave", { roomId });
      socket.off("presence:roster", onRoster);
    };
  }, [socket, roomId, user.name]);

  const copyCode = useCallback(() => {
    navigator.clipboard?.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [roomId]);

  if (error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-text-dim">{error}</p>
        <button onClick={() => navigate("/home")} className="text-primary underline">
          Back to home
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-svh items-center justify-center text-primary">
        <Spinner size={28} />
      </div>
    );
  }

  const isHost = room.hostId === user.id;

  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-semibold">{room.title}</h1>
            {isHost && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                HOST
              </span>
            )}
          </div>
          <button onClick={copyCode} className="text-xs text-text-dim">
            {copied ? "Copied!" : `Code: ${roomId.slice(0, 8)}… · tap to copy`}
          </button>
        </div>
        <button onClick={() => navigate("/home")} className="text-sm text-text-dim">
          Leave
        </button>
      </div>

      <VideoPlayerWidget room={room} socket={socket} roomId={roomId} />

      <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
        <div className="flex -space-x-2">
          {members.slice(0, 5).map((m) => (
            <div key={m.userId} className="ring-2 ring-bg rounded-full">
              <Avatar name={m.name} size={28} />
            </div>
          ))}
        </div>
        <span className="text-xs text-text-dim">
          {members.length} {members.length === 1 ? "person" : "people"} watching
        </span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowCall(true)}
            className="rounded-full bg-surface-2 px-3.5 py-1.5 text-xs font-medium"
          >
            📞 Call
          </button>
          <button
            onClick={() => setShowGift(true)}
            className="rounded-full bg-gold/15 px-3.5 py-1.5 text-xs font-medium text-gold"
          >
            🎁 Gift
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ChatPanel socket={socket} roomId={roomId} user={user} />
      </div>

      {showGift && (
        <GiftPanel roomId={roomId} members={members} onClose={() => setShowGift(false)} />
      )}
      {showCall && (
        <CallOverlay roomId={roomId} user={user} onClose={() => setShowCall(false)} />
      )}
    </div>
  );
}
