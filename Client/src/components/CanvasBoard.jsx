import { useEffect, useRef, useState } from "react";
import CursorLayer from "./CursorLayer";

export default function CanvasBoard({ socket, roomId, users, tool, color, width }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef(null);

  // ✅ throttle cursor updates
  const lastCursorSentRef = useRef(0);

  const [cursors, setCursors] = useState({});

  // ===== Canvas resize =====
  useEffect(() => {
    const canvas = canvasRef.current;

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      ctxRef.current = canvas.getContext("2d");
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const applySettings = (ctx, settings) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = settings.width;

    if (settings.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = settings.color;
    }
  };

  const drawLine = (from, to, settings) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    applySettings(ctx, settings);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const redrawFromHistory = (strokes) => {
    clearCanvas();
    for (const stroke of strokes) {
      const pts = stroke.points || [];
      for (let i = 1; i < pts.length; i++) {
        drawLine(pts[i - 1], pts[i], stroke.settings);
      }
    }
  };

  // ===== SOCKET LISTENERS =====

  // ✅ other users realtime drawing (segments)
  useEffect(() => {
    if (!socket) return;

    socket.on("draw:move", ({ from, to, settings }) => {
      drawLine(from, to, settings);
    });

    return () => socket.off("draw:move");
  }, [socket]);

  // ✅ cursor move + cursor remove
  useEffect(() => {
    if (!socket) return;

    socket.on("cursor:move", ({ socketId, cursor }) => {
      setCursors((prev) => ({ ...prev, [socketId]: cursor }));
    });

    socket.on("cursor:remove", ({ socketId }) => {
      setCursors((prev) => {
        const copy = { ...prev };
        delete copy[socketId];
        return copy;
      });
    });

    return () => {
      socket.off("cursor:move");
      socket.off("cursor:remove");
    };
  }, [socket]);

  // ✅ history update (full redraw)
  useEffect(() => {
    if (!socket) return;

    socket.on("history:update", (strokes) => {
      redrawFromHistory(strokes);
    });

    return () => socket.off("history:update");
  }, [socket]);

  // ===== LOCAL DRAWING =====
  const onMouseDown = (e) => {
    const start = getPos(e);
    isDrawingRef.current = true;

    // create stroke
    currentStrokeRef.current = {
      id: crypto.randomUUID(),
      points: [start],
      settings: { tool, color, width },
    };
  };

  const onMouseMove = (e) => {
    const curr = getPos(e);

    // ✅ Throttled cursor emit (always)
    const now = Date.now();
    if (now - lastCursorSentRef.current > 30) {
      socket?.emit("cursor:move", {
        roomId,
        cursor: { x: curr.x, y: curr.y },
      });
      lastCursorSentRef.current = now;
    }

    // if not drawing, stop here
    if (!isDrawingRef.current) return;

    const stroke = currentStrokeRef.current;
    if (!stroke) return;

    const pts = stroke.points;
    const prev = pts[pts.length - 1];

    // draw locally
    drawLine(prev, curr, stroke.settings);

    // store point
    stroke.points.push(curr);

    // ✅ realtime broadcast to other users
    socket?.emit("draw:move", {
      roomId,
      from: prev,
      to: curr,
      settings: stroke.settings,
    });
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;

    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;

    // send final stroke to server history
    if (stroke && stroke.points.length > 1) {
      socket?.emit("stroke:end", { roomId, stroke });
    }
  };

  return (
    <div
      style={{
        height: "100%",
        background: "white",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.1)",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      <CursorLayer cursors={cursors} users={users} />
    </div>
  );
}
