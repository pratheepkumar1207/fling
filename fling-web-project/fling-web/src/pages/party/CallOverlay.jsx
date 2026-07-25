import { useEffect, useRef, useState } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import api from "../../lib/api";
import { Avatar } from "../../components/ui";

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID;

export default function CallOverlay({ roomId, onClose }) {
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [error, setError] = useState("");
  const clientRef = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null });
  const localVideoElRef = useRef(null);

  useEffect(() => {
    if (!AGORA_APP_ID) {
      setError("Agora App ID isn't configured yet — add VITE_AGORA_APP_ID to .env to enable calls.");
      return;
    }

    let cancelled = false;
    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    clientRef.current = client;
    const uid = Math.floor(Math.random() * 1_000_000);

    async function join() {
      const { data } = await api.post("/calls/token", { channelName: roomId, uid });
      if (cancelled) return;
      await client.join(AGORA_APP_ID, roomId, data.token, uid);

      client.on("user-published", async (remoteUser, mediaType) => {
        await client.subscribe(remoteUser, mediaType);
        if (mediaType === "video") {
          setRemoteUsers((prev) => {
            const exists = prev.find((u) => u.uid === remoteUser.uid);
            return exists ? prev : [...prev, remoteUser];
          });
          setTimeout(() => {
            remoteUser.videoTrack?.play(`remote-${remoteUser.uid}`);
          }, 50);
        }
        if (mediaType === "audio") remoteUser.audioTrack?.play();
      });

      client.on("user-unpublished", (remoteUser) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== remoteUser.uid));
      });

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localTracksRef.current = { audio: audioTrack, video: videoTrack };
      videoTrack.play(localVideoElRef.current);
      await client.publish([audioTrack, videoTrack]);
      setJoined(true);
    }

    join().catch((e) => setError(e.message || "Couldn't start the call."));

    return () => {
      cancelled = true;
      localTracksRef.current.audio?.close();
      localTracksRef.current.video?.close();
      clientRef.current?.leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  function toggleMic() {
    const track = localTracksRef.current.audio;
    if (!track) return;
    track.setEnabled(!micOn);
    setMicOn(!micOn);
  }

  function toggleCam() {
    const track = localTracksRef.current.video;
    if (!track) return;
    track.setEnabled(!camOn);
    setCamOn(!camOn);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-4">
        <span className="text-sm font-medium text-white/80">
          {joined ? "On call" : "Connecting…"}
        </span>
        <button onClick={onClose} className="text-sm font-semibold text-primary">
          Close
        </button>
      </div>

      {error ? (
        <div className="flex flex-1 items-center justify-center px-8 text-center text-sm text-text-dim">
          {error}
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-1 p-1">
          <div className="relative overflow-hidden rounded-xl bg-surface-2">
            <div ref={localVideoElRef} className="h-full w-full" />
            <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
              You
            </span>
          </div>
          {remoteUsers.map((u) => (
            <div key={u.uid} className="relative overflow-hidden rounded-xl bg-surface-2">
              <div id={`remote-${u.uid}`} className="h-full w-full" />
            </div>
          ))}
          {remoteUsers.length === 0 && (
            <div className="flex items-center justify-center rounded-xl bg-surface-2">
              <div className="flex flex-col items-center gap-2 text-text-faint">
                <Avatar name="?" size={40} />
                <span className="text-xs">Waiting for others…</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-4 p-6">
        <button
          onClick={toggleMic}
          className={`flex h-14 w-14 items-center justify-center rounded-full text-xl ${
            micOn ? "bg-surface-2" : "bg-danger"
          }`}
        >
          {micOn ? "🎤" : "🔇"}
        </button>
        <button
          onClick={onClose}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-danger text-xl"
        >
          📵
        </button>
        <button
          onClick={toggleCam}
          className={`flex h-14 w-14 items-center justify-center rounded-full text-xl ${
            camOn ? "bg-surface-2" : "bg-danger"
          }`}
        >
          {camOn ? "📹" : "🚫"}
        </button>
      </div>
    </div>
  );
}
