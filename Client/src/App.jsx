import { Routes, Route, Navigate } from "react-router-dom";
import Room from "./pages/Room";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/room/demo" />} />
      <Route path="/room/:roomId" element={<Room />} />
    </Routes>
  );
}
