import { useEffect, useRef, useCallback } from "react";
import { extractYouTubeId, extractDriveFileId, loadYouTubeApi } from "../../lib/video";

const SYNC_TOLERANCE = 1.5; // seconds of drift we tolerate before force-seeking

export default function VideoPlayerWidget({ room, socket, roomId }) {
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const videoRef = useRef(null);
  const suppressEmit = useRef(false);

  const isDrive = room.sourceType === "drive";

  // ---- Emit local playback actions to the room (skip if the change came from a remote event) ----
  const emit = useCallback(
    (event, position) => {
      if (suppressEmit.current) return;
      socket.emit(event, { roomId, position });
    },
    [socket, roomId]
  );

  // ---- YouTube setup ----
  useEffect(() => {
    if (isDrive) return;
    let cancelled = false;
    const videoId = extractYouTubeId(room.videoUrl);
    if (!videoId) return;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !ytContainerRef.current) return;
      ytPlayerRef.current = new YT.Player(ytContainerRef.current, {
        videoId,
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              emit("playback:play", ytPlayerRef.current.getCurrentTime());
            } else if (e.data === YT.PlayerState.PAUSED) {
              emit("playback:pause", ytPlayerRef.current.getCurrentTime());
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      ytPlayerRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.videoUrl, isDrive]);

  // ---- Drive (HTML5 video) setup ----
  useEffect(() => {
    if (!isDrive || !videoRef.current) return;
    const el = videoRef.current;
    const onPlay = () => emit("playback:play", el.currentTime);
    const onPause = () => emit("playback:pause", el.currentTime);
    const onSeeked = () => emit("playback:seek", el.currentTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("seeked", onSeeked);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("seeked", onSeeked);
    };
  }, [isDrive, emit]);

  // ---- Listen for remote sync events ----
  useEffect(() => {
    function applyRemote(fn) {
      suppressEmit.current = true;
      fn();
      setTimeout(() => (suppressEmit.current = false), 250);
    }

    function onPlay({ position }) {
      applyRemote(() => {
        if (isDrive && videoRef.current) {
          if (Math.abs(videoRef.current.currentTime - position) > SYNC_TOLERANCE) {
            videoRef.current.currentTime = position;
          }
          videoRef.current.play().catch(() => {});
        } else if (ytPlayerRef.current) {
          if (Math.abs(ytPlayerRef.current.getCurrentTime() - position) > SYNC_TOLERANCE) {
            ytPlayerRef.current.seekTo(position, true);
          }
          ytPlayerRef.current.playVideo();
        }
      });
    }
    function onPause() {
      applyRemote(() => {
        if (isDrive && videoRef.current) videoRef.current.pause();
        else ytPlayerRef.current?.pauseVideo();
      });
    }
    function onSeek({ position }) {
      applyRemote(() => {
        if (isDrive && videoRef.current) videoRef.current.currentTime = position;
        else ytPlayerRef.current?.seekTo(position, true);
      });
    }

    socket.on("playback:play", onPlay);
    socket.on("playback:pause", onPause);
    socket.on("playback:seek", onSeek);
    return () => {
      socket.off("playback:play", onPlay);
      socket.off("playback:pause", onPause);
      socket.off("playback:seek", onSeek);
    };
  }, [socket, isDrive]);

  if (isDrive) {
    const fileId = extractDriveFileId(room.videoUrl);
    const token = localStorage.getItem("fling_jwt");
    const src = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/drive/stream/${fileId}?token=${token}`;
    return (
      <video
        ref={videoRef}
        src={src}
        controls
        className="aspect-video w-full bg-black"
        playsInline
      />
    );
  }

  return (
    <div className="aspect-video w-full bg-black">
      <div ref={ytContainerRef} className="h-full w-full" />
    </div>
  );
}
