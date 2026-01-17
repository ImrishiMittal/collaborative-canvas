export default function CursorLayer({ cursors = {}, users = [] }) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        {Object.entries(cursors).map(([id, pos]) => {
          const user = users.find((u) => u.id === id);
          if (!user) return null;
  
          return (
            <div
              key={id}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              {/* dot */}
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 50,
                  background: user.color,
                  border: "2px solid white",
                }}
              />
  
              {/* label */}
              <div
                style={{
                  fontSize: 12,
                  background: "rgba(0,0,0,0.6)",
                  color: "white",
                  padding: "2px 6px",
                  borderRadius: 6,
                }}
              >
                {user.id.slice(0, 6)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  