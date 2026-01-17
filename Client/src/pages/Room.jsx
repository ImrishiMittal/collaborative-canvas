import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import useSocket from "../hooks/useSocket";

import Toolbar from "../components/Toolbar";
import CanvasBoard from "../components/CanvasBoard";
import UsersPanel from "../components/UsersPanel";

export default function Room() {
  const { roomId } = useParams();
  const { socket, connected } = useSocket(roomId);

  // tool states
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#1e90ff");
  const [width, setWidth] = useState(6);

  // users
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);

  // ✅ Listen for users list + my identity
  useEffect(() => {
    if (!socket) return;

    socket.on("room:users", (list) => setUsers(list));
    socket.on("user:me", (u) => setMe(u));

    return () => {
      socket.off("room:users");
      socket.off("user:me");
    };
  }, [socket]);

  const handleUndo = () => socket?.emit("history:undo", { roomId });
  const handleRedo = () => socket?.emit("history:redo", { roomId });
  

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Toolbar
        roomId={roomId}
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        width={width}
        setWidth={setWidth}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 14,
          padding: 14,
          background: "#0b1220",
        }}
      >
        <div style={{ position: "relative" }}>
          <CanvasBoard socket={socket} roomId={roomId} users={users} tool={tool} color={color} width={width} />


          <p style={{ marginTop: 10, color: "white" }}>
            Status: {connected ? "✅ Connected" : "❌ Not Connected"}
          </p>
        </div>

        <UsersPanel users={users} me={me} />
      </div>
    </div>
  );
}
