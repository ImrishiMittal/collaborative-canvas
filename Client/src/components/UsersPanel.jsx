export default function UsersPanel({ users = [], me }) {
  return (
    <div
      style={{
        background: "#111827",
        borderRadius: 16,
        padding: 14,
        color: "white",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Online Users ({users.length})</h3>

      {users.length === 0 ? (
        <p style={{ opacity: 0.8 }}>No users online</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {users.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255,255,255,0.06)",
                padding: "10px 12px",
                borderRadius: 12,
              }}
            >
              {/* Color Dot */}
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 100,
                  background: u.color,
                }}
              />

              {/* Name */}
              <span style={{ fontSize: 14 }}>
                {u.id === me?.id ? "You" : u.id.slice(0, 6)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
