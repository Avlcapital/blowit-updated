// socket.js
import { Server } from "socket.io";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      //origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      //credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Optional: simple auth via token in query (?token=...)
    // const { token } = socket.handshake.query;

    // Put admins in an "admin" room (optional)
    // socket.join("admins");

    socket.on("disconnect", () => {});
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
