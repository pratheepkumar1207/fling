import { io } from "socket.io-client";

let socket = null;

export function getSocket(userId) {
  if (socket) return socket;
  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
    query: { userId },
    autoConnect: true,
    transports: ["websocket", "polling"],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
