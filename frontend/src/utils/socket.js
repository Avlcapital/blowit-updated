import { io } from "socket.io-client";
import { BASE_URL } from "./config";

// Convert API base to WS origin if needed (e.g., http://localhost:5000)
const SOCKET_URL = BASE_URL.replace(/\/api\/?$/, "");

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
      // auth or query if you later secure sockets:
      // query: { token: localStorage.getItem("token") }
    });
  }
  return socket;
}
