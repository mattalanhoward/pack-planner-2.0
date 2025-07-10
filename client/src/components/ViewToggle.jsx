// src/components/ViewToggle.jsx
import React from "react";
import { FaToggleOn, FaToggleOff } from "react-icons/fa";

export default function ViewToggle({ viewMode, setViewMode }) {
  return (
    <button
      onClick={() => setViewMode((vm) => (vm === "column" ? "list" : "column"))}
      className="flex items-center space-x-1"
    >
      {viewMode === "column" ? (
        <FaToggleOn className="text-2xl transition-colors" />
      ) : (
        <FaToggleOff className="text-2xl text-gray-400 hover:text-gray-600 transition-colors" />
      )}
    </button>
  );
}
