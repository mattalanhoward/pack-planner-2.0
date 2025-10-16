//src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";
// import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
// import GearListView from "./pages/GearListView";
// import SharedView from "./pages/SharedView";
import Landing from "./pages/Landing";
import ChecklistView from "./pages/ChecklistView";
import PublicGearList from "./pages/PublicGearList";

// function PrivateRoute({ children }) {
//   const { isAuthenticated } = useAuth();
//   return isAuthenticated ? children : <Navigate to="/login" />;
// }

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    children
  ) : (
    // send state that tells Landing to open the modal
    <Navigate to="/" state={{ auth: "login", reason: "protected" }} replace />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth/register" element={<Landing />} />
      <Route path="/auth/login" element={<Landing />} />
      {/* <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} /> */}
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* “root” of all editable lists */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/:listId"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard/:listId/checklist"
        element={
          <PrivateRoute>
            <ChecklistView />
          </PrivateRoute>
        }
      />
      {/* Public, read-only shared view */}
      {/* <Route path="/share/:token" element={<SharedView />} /> */}
      <Route path="/share/:token" element={<PublicGearList />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
