export default function Toolbar({
  roomId,
  tool,
  setTool,
  color,
  setColor,
  width,
  setWidth,
  onUndo,
  onRedo
}) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 16px",
      background: "#111827",
      color: "white",
      borderBottom: "1px solid rgba(255,255,255,0.08)"
    }}>
      <div>
        <h3 style={{ margin: 0 }}>Collaborative Canvas</h3>
        <small style={{ opacity: 0.8 }}>Room: {roomId}</small>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Tools */}
        <button
          onClick={() => setTool("brush")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: 0,
            cursor: "pointer",
            background: tool === "brush" ? "#fff" : "#1f2937"
          }}
        >
          Brush
        </button>

        <button
          onClick={() => setTool("eraser")}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: 0,
            cursor: "pointer",
            background: tool === "eraser" ? "#fff" : "#1f2937"
          }}
        >
          Eraser
        </button>

        {/* Color */}
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Color
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </label>

        {/* Width */}
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          Width
          <input
            type="range"
            min={1}
            max={40}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
          <span style={{ fontFamily: "monospace" }}>{width}px</span>
        </label>

        {/* Undo/Redo */}
        <button
          onClick={onUndo}
          style={{ padding: "8px 12px", borderRadius: 8, border: 0, cursor: "pointer" }}
        >
          Undo
        </button>

        <button
          onClick={onRedo}
          style={{ padding: "8px 12px", borderRadius: 8, border: 0, cursor: "pointer" }}
        >
          Redo
        </button>
      </div>
    </div>
  );
}
