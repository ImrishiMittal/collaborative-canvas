
# ARCHITECTURE.md — Real-Time Collaborative Drawing Canvas

This document explains the system architecture, real-time communication protocol, undo/redo strategy, performance optimizations, and conflict handling for the collaborative canvas application.

---

## 1) System Overview

The application is a real-time collaborative drawing system where multiple users can draw on the same canvas simultaneously.

### Core Components
- **Frontend (React + Vite)**
  - Renders UI (Toolbar, CanvasBoard, UsersPanel)
  - Draws using raw HTML Canvas API
  - Streams drawing events in real-time using Socket.io client
  - Displays online users and cursor indicators
  - Rebuilds canvas from stroke history (for undo/redo consistency)

- **Backend (Node.js + Express + Socket.io)**
  - Manages rooms and connected users
  - Assigns each user a color
  - Relays real-time events (drawing + cursor movement)
  - Maintains stroke history per room
  - Handles global undo/redo operations

---

## 2) Folder Structure

```

collaborative-canvas/
├── Client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CanvasBoard.jsx
│   │   │   ├── CursorLayer.jsx
│   │   │   ├── Toolbar.jsx
│   │   │   └── UsersPanel.jsx
│   │   ├── hooks/
│   │   │   └── useSocket.js
│   │   ├── pages/
│   │   │   └── Room.jsx
│   │   └── App.jsx, main.jsx
│
├── Server/
│   ├── server.js
│   ├── rooms.js
│   ├── drawing-state.js
│   └── package.json
│
├── README.md
└── ARCHITECTURE.md

```

---

## 3) Architecture Flow

### A) Room + Users
1. Client connects to socket server.
2. Client emits `join-room`.
3. Server:
   - Adds socket to a room
   - Assigns a user color
   - Emits `user:me` to that client
   - Broadcasts `room:users` list to the room

### B) Live Drawing
While drawing, the client streams segments:
- `draw:move` events contain:
  - `from` point
  - `to` point
  - settings: tool/color/width

Server broadcasts these segments to other users in the room.

### C) Stroke History
On mouse up, the full stroke is finalized:
- Client emits `stroke:end` with the stroke:
  - points[]
  - settings

Server stores it in stroke history and broadcasts:
- `history:update` (full history array)

All clients redraw the canvas from stroke history.

### D) Global Undo/Redo
Undo/Redo is global and affects all users:
- Undo removes the latest stroke in room history.
- Redo restores previously undone strokes.

Server broadcasts updated history to everyone.

---

## 4) Data Flow Diagrams (Text)

### Live drawing stream
```

Client A (draw) -> draw:move -> Server -> broadcast -> Client B (draw segment)

```

### Stroke final commit
```

Client A -> stroke:end -> Server stores stroke -> history:update -> All clients redraw

```

### Global Undo
```

Any Client -> history:undo -> Server modifies history -> history:update -> All clients redraw

```

### Global Redo
```

Any Client -> history:redo -> Server modifies history -> history:update -> All clients redraw

````

---

## 5) WebSocket Protocol (Socket.io Events)

### Client → Server

#### Room
- `join-room`
  ```json
  { "roomId": "demo" }
````

#### Cursor

* `cursor:move`

  ```json
  { "roomId": "demo", "cursor": { "x": 120, "y": 240 } }
  ```

#### Live drawing segment

* `draw:move`

  ```json
  {
    "roomId": "demo",
    "from": { "x": 10, "y": 20 },
    "to": { "x": 11, "y": 25 },
    "settings": { "tool": "brush", "color": "#1e90ff", "width": 6 }
  }
  ```

#### Final stroke commit

* `stroke:end`

  ```json
  { "roomId": "demo", "stroke": { "id": "...", "points": [...], "settings": {...} } }
  ```

#### Global operations

* `history:undo`

  ```json
  { "roomId": "demo" }
  ```
* `history:redo`

  ```json
  { "roomId": "demo" }
  ```

---

### Server → Client

#### User Identity

* `user:me`

  ```json
  { "id": "socketId", "color": "#ff1744" }
  ```

#### Users list

* `room:users`

  ```json
  [ { "id": "...", "color": "..." }, ... ]
  ```

#### Cursor update

* `cursor:move`

  ```json
  { "socketId": "...", "cursor": { "x": 120, "y": 240 } }
  ```

#### Cursor cleanup

* `cursor:remove`

  ```json
  { "socketId": "..." }
  ```

#### History sync

* `history:update`

  ```json
  [ stroke1, stroke2, ... ]
  ```

---

## 6) Global Undo/Redo Strategy (Key Part)

### Why not pixel-based undo?

In collaborative drawing, direct pixel undo is extremely complex because:

* many users draw simultaneously
* strokes overlap
* canvas becomes non-trivial to revert

### Stroke-based solution

We store every operation as a stroke:

```js
stroke = {
  id: "uuid",
  points: [{x,y}, {x,y}, ...],
  settings: { tool, color, width }
}
```

### Server maintains:

* `strokes[]` (main history)
* `redoStack[]`

#### On `stroke:end`

* strokes.push(stroke)
* redoStack cleared

#### On `history:undo`

* pop from strokes → push to redoStack

#### On `history:redo`

* pop from redoStack → push back to strokes

#### Sync

After every change, server emits:

* `history:update(strokes)`

Clients then:

1. clear canvas
2. redraw strokes in order

✅ This guarantees consistency across all clients.

---

## 7) Conflict Resolution

### Overlapping drawings

No locking is done.
Users can draw anywhere, anytime.

Final output is consistent because:

* stroke history is shared
* all clients redraw from same order

### Undo conflict case

If user A undoes while user B draws:

* server undo modifies shared state
* server broadcasts latest history
* all clients rebuild canvas from official history

This resolves conflicts deterministically.

---

## 8) Performance Decisions

### Cursor throttling

Cursor updates are high-frequency.
Solution:

* cursor emits are throttled (~30ms)

### Streaming segments

To ensure smooth real-time drawing:

* stream only line segments via `draw:move`

### Full redraw only when needed

Canvas redraw from history happens only when:

* user joins
* stroke ends
* undo/redo happens

This keeps drawing smooth under load.

---

## 9) Scaling Notes (Interview Discussion)

To scale this system to 1000+ concurrent users:

* store history in Redis instead of memory
* distribute rooms across multiple socket servers
* batch points / compress messages (binary encoding)
* persist strokes in DB for session restore
* add server-side rate limiting for cursor/draw events

---

## 10) Summary

This project uses:

* raw Canvas API
* socket.io realtime streaming
* room-based collaboration
* cursor + online users indicators
* global undo/redo using stroke history replay

It focuses on correctness, real-time UX, and maintainable architecture.

````

---

# ✅ Push ARCHITECTURE.md to GitHub
Run in root folder:

```powershell
git add ARCHITECTURE.md
git commit -m "Add architecture documentation"
git push
````
