import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:5000";

export default function useSocket(roomId) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.log("✅ Connected:", socket.id);

      socket.emit("join-room", { roomId });
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.log("❌ Disconnected");
    });

    return () => socket.disconnect();
  }, [roomId]);

  return { socket: socketRef.current, connected };
}
