// src/components/TopBar.jsx
import React, { useState } from "react";
import useAuth from "../hooks/useAuth";
import { FaStar, FaSignOutAlt, FaToggleOff, FaToggleOn } from "react-icons/fa";
import logo from "../assets/logo.png";

export default function TopBar({ title, viewMode, setViewMode }) {
  const { logout } = useAuth();

  function ViewToggle({ viewMode, setViewMode }) {
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

  return (
    <header className="bg-sand/50 flex-shrink-0 sticky top-0 z-20 flex items-center justify-between px-6 py-4 shadow">
      {/* Left side: logo, title, star */}
      <div className="flex items-center space-x-2">
        <img src={logo} alt="PackPlanner" className="h-8 w-auto" />
        <h1 className="text-xl font-bold">{title}</h1>
        <FaStar className="text-yellow-500" />
      </div>
      <div className="flex items-center space-x-4">
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        <button
          onClick={logout}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          <FaSignOutAlt className="inline mr-1" />
        </button>
      </div>
    </header>
  );
}
