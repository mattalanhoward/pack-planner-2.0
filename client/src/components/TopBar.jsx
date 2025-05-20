// src/components/TopBar.jsx
import React from 'react';
import useAuth from '../hooks/useAuth';
import { FaStar } from 'react-icons/fa';

export default function TopBar({ title }) {
  const { logout } = useAuth();
  return (
    <header className="flex-shrink-0 sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white shadow">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-bold">{title}</h1>
        <FaStar className="text-yellow-500" />
      </div>
      <button
        onClick={logout}
        className="text-sm text-gray-600 hover:text-gray-800"
      >
        Logout
      </button>
    </header>
  );
}
