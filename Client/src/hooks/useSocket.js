import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

export default function useSocket(roomId) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // create socket only once
    if (!socketRef.current) {
      socketRef.current = io(SERVER_URL, {
        transports: ["websocket"],
      });

      socketRef.current.on("connect", () => setConnected(true));
      socketRef.current.on("disconnect", () => setConnected(false));
    }

    const socket = socketRef.current;

    // if roomId exists, join room
    if (roomId) {
      socket.emit("join-room", { roomId });
    }

    return () => {
      // don't fully disconnect (optional), just cleanup listeners
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [roomId]);

  return { socket: socketRef.current, connected };
}
