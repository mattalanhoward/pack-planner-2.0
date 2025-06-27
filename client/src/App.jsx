//src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import GearListView from "./pages/GearListView";
import useAuth from "./hooks/useAuth";
import SharedView from "./pages/SharedView";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* “root” of all editable lists */}
      <Route
        path="/lists"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/lists/:listId"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      {/* Public, read-only shared view */}
      <Route path="/share/:token" element={<SharedView />} />
      <Route path="*" element={<Navigate to="/lists" replace />} />
    </Routes>
  );
}
