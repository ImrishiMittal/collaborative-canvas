
```md
# Real-Time Collaborative Drawing Canvas 🎨

A multi-user real-time drawing application where multiple users can draw simultaneously on the same canvas with live synchronization. Built using **React (Vite)** + **Node.js + Socket.io**, using the **raw HTML Canvas API** (no drawing libraries).

---

## ✅ Features

### 🎨 Drawing Tools
- Brush tool
- Eraser tool
- Color picker
- Stroke width control

### 🌐 Real-time Collaboration
- Live drawing sync while user is drawing (`draw:move`)
- Online users list with assigned user colors
- Real-time cursor indicators for other users
- Works across multiple tabs / multiple browsers

### ♻️ Global Undo / Redo (Hard Part)
- Global Undo/Redo shared across all users
- Uses stroke-history based approach:
  - Every stroke is stored in server history
  - On undo/redo, server broadcasts `history:update`
  - Clients clear canvas + redraw all strokes in order

---

## 🧰 Tech Stack

- Frontend: **React (Vite)**
- Backend: **Node.js + Express**
- WebSockets: **Socket.io**
- Canvas: **Raw HTML Canvas API**

---

## 📁 Project Structure

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
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── Server/
│   ├── server.js
│   ├── rooms.js
│   ├── drawing-state.js
│   └── package.json
│
├── README.md
└── ARCHITECTURE.md

````

---

## ✅ Setup Instructions

### 1) Clone repository
```bash
git clone https://github.com/ImrishiMittal/collaborative-canvas.git
cd collaborative-canvas
````

### 2) Start Backend (Socket Server)

```bash
cd Server
npm install
npm run dev
```

Backend runs at:

* [http://localhost:5000](http://localhost:5000)

### 3) Start Frontend (React App)

Open a new terminal:

```bash
cd Client
npm install
npm run dev
```

Frontend runs at:

* [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing With Multiple Users

1. Open:

   * [http://localhost:5173/room/demo](http://localhost:5173/room/demo)
2. Open same URL in:

   * Incognito tab OR another browser
3. Draw in one tab → should sync in the other in real-time.
4. Undo/Redo in one tab → should affect both globally.

---

## 🚀 Real-time Events Summary

* Drawing Sync: `draw:move`
* Stroke commit: `stroke:end`
* Global Undo: `history:undo`
* Global Redo: `history:redo`
* Cursor Updates: `cursor:move`
* Cursor cleanup: `cursor:remove`
* Online users sync: `room:users`

---

## ⚠️ Known Limitations

* Canvas data is stored in-memory (server restart clears history).
* No authentication (not required).
* No persistent database saving (optional bonus).
* Touch/mobile support not implemented (optional bonus).

---

## ⏳ Time Spent

~3 days (development + debugging + documentation)

---

## ✅ Notes

* No drawing libraries used.
* Canvas operations implemented directly using HTML5 Canvas API.
* Uses efficient real-time streaming + history replay strategy for consistency.

````

---

# ✅ ARCHITECTURE.md (copy-paste)

```md
# ARCHITECTURE.md — Real-Time Collaborative Drawing Canvas

This document describes the architecture, WebSocket protocol, global undo/redo strategy, performance decisions, and conflict handling.

---

## 1) High-Level Architecture

### Frontend (React - Vite)
Responsibilities:
- UI rendering (toolbar + users panel)
- Canvas drawing (raw Canvas API)
- Real-time communication via socket.io-client
- Cursor layer overlay rendering
- Rebuild canvas from stroke history

### Backend (Node.js + Express + Socket.io)
Responsibilities:
- Room management & online user tracking
- Assign color to each user
- Broadcast real-time drawing segments
- Maintain stroke history per room (for undo/redo + consistency)
- Broadcast history changes to all clients

---

## 2) Data Flow

### Live drawing stream
While user draws, the client emits segments:
````

Client A: draw:move ---> Server ---> broadcast to room ---> Client B draws segment immediately

```

### Final stroke commit (history)
On mouse up, stroke is finalized:
```

Client A: stroke:end ---> Server stores stroke ---> history:update ---> all clients redraw

```

### Global Undo / Redo
Undo:
```

Client: history:undo ---> Server modifies history ---> history:update ---> all clients redraw

```

Redo:
```

Client: history:redo ---> Server modifies history ---> history:update ---> all clients redraw

````

---

## 3) WebSocket Protocol (Socket.io Events)

### Client → Server

#### Room and identity
- `join-room { roomId }`

#### Cursor events
- `cursor:move { roomId, cursor:{x, y} }`

#### Live drawing stream (segments)
- `draw:move { roomId, from:{x,y}, to:{x,y}, settings:{tool,color,width} }`

#### Stroke finalize (history-based)
- `stroke:end { roomId, stroke }`

#### Global undo/redo
- `history:undo { roomId }`
- `history:redo { roomId }`

---

### Server → Client

#### Identity + room users
- `user:me { id, color }`
- `room:users [ { id, color }, ... ]`

#### Cursor
- `cursor:move { socketId, cursor:{x, y} }`
- `cursor:remove { socketId }`

#### Drawing
- `draw:move { from, to, settings }`

#### Canvas state sync
- `history:update [ strokes ]`

---

## 4) Global Undo/Redo Strategy (Core Requirement)

### Why pixels are not undone directly
Undoing pixels is complex and inconsistent in collaborative environments, especially with overlapping strokes from multiple users.

### Stroke History Model
Each drawing is recorded as a stroke:
```js
stroke = {
  id: "uuid",
  points: [{x,y}, {x,y}, ...],
  settings: { tool, color, width }
}
````

### Algorithm

#### Add stroke

* Server stores stroke in `strokes[]`
* Clears redo stack
* Broadcast full updated strokes list (`history:update`)

#### Undo

* Pop last stroke from `strokes[]`
* Push into `redoStack[]`
* Broadcast `history:update`

#### Redo

* Pop stroke from `redoStack[]`
* Push into `strokes[]`
* Broadcast `history:update`

### Client Render Strategy

* Clear canvas
* Replay all strokes in order
  This ensures **full consistency** across all clients.

---

## 5) Conflict Resolution

### Simultaneous drawing

* Multiple users stream `draw:move` events concurrently
* Canvas naturally interleaves strokes in time order

### Overlapping areas

* No locking is used; drawing is additive
* Final consistent output is derived from shared stroke history

### Global Undo on shared canvas

* Undo removes the most recent stroke globally (not per-user)
* This matches “global undo/redo” requirement and keeps state consistent.

---

## 6) Performance Decisions

### Cursor throttling

Cursor events can create high-frequency traffic.
Solution:

* Cursor emits are throttled (~30ms) to reduce spam.

### Streaming only segments

During drawing:

* Only line segments are sent (`draw:move`) to keep UI smooth.

### Full redraw only on history updates

Full canvas redraw happens only on:

* user join
* stroke commit
* undo/redo

This avoids unnecessary re-rendering and improves performance.

---

## 7) Scalability Notes

### Current limits

* In-memory history (no DB)
* Best suited for low/medium concurrency rooms

### Scaling to 1000+ users

Suggested improvements:

* Redis-based shared state for rooms
* Persist stroke history in database
* Segment batching and binary encoding
* Separate rooms across multiple socket servers
* Use WebRTC for P2P in small groups

---

## 8) Summary of Key Design Choices

* Raw Canvas API (no libraries)
* Real-time draw streaming + history replay model
* Global undo/redo implemented using stroke stacks
* Throttled cursor movement
* Clean room-based synchronization

````

---

# ✅ After adding docs: Push to GitHub

From root folder:

```powershell
git add README.md ARCHITECTURE.md
git commit -m "Add documentation (README + ARCHITECTURE)"
git push
````

---
