const KEY = "fling_recent_rooms";

export function getRecentRooms() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRecentRoom(room) {
  const list = getRecentRooms().filter((r) => r.id !== room.id);
  list.unshift({
    id: room.id,
    title: room.title,
    sourceType: room.sourceType,
    ts: Date.now(),
  });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 10)));
}
