const roomHistory = {}; 
// roomHistory[roomId] = { strokes: [], redoStack: [] }

function init(roomId) {
  if (!roomHistory[roomId]) {
    roomHistory[roomId] = { strokes: [], redoStack: [] };
  }
}

function addStroke(roomId, stroke) {
  init(roomId);
  roomHistory[roomId].strokes.push(stroke);
  roomHistory[roomId].redoStack = []; // clear redo when new stroke added
}

function undo(roomId) {
  init(roomId);
  const last = roomHistory[roomId].strokes.pop();
  if (last) roomHistory[roomId].redoStack.push(last);
}

function redo(roomId) {
  init(roomId);
  const last = roomHistory[roomId].redoStack.pop();
  if (last) roomHistory[roomId].strokes.push(last);
}

function getState(roomId) {
  init(roomId);
  return roomHistory[roomId].strokes;
}

module.exports = { addStroke, undo, redo, getState };
