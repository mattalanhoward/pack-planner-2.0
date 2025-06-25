import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // THIS IS CRUCIAL!
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import { SettingsProvider } from "./contexts/UserSettings";

import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SettingsProvider>
          <App />
          <Toaster position="top-right" />
        </SettingsProvider>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
