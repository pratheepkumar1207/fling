export function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  // Fallback: maybe they just pasted the raw 11-char ID
  if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

export function extractDriveFileId(urlOrId) {
  if (!urlOrId) return null;
  const m = urlOrId.match(/\/file\/d\/([\w-]+)/) || urlOrId.match(/[?&]id=([\w-]+)/);
  if (m) return m[1];
  if (/^[\w-]{10,}$/.test(urlOrId.trim())) return urlOrId.trim();
  return null;
}

let ytApiPromise = null;
export function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}
