// src/components/ViewToggle.jsx
import React from "react";
import { FaToggleOn, FaToggleOff } from "react-icons/fa";

export default function ViewToggle({ viewMode, setViewMode }) {
  return (
    <button
      onClick={() =>
        setViewMode((vm) => (vm === "columns" ? "list" : "columns"))
      }
      className="flex items-center space-x-1"
    >
      {viewMode === "columns" ? (
        <FaToggleOn className="text-2xl transition-colors" />
      ) : (
        <FaToggleOff className="text-2xl text-gray-400 hover:text-gray-600 transition-colors" />
      )}
      {/* <span className="text-sm font-medium text-gray-700">
        {viewMode === 'columns' ? 'List View' : 'Kanban View'}
      </span> */}
    </button>
  );
}
