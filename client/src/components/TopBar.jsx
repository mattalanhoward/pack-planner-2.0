// src/components/TopBar.jsx
import React from 'react';
import { FaStar } from 'react-icons/fa';
import useAuth from '../hooks/useAuth';

export default function TopBar({ title }) {
  const { logout } = useAuth();
  return (
    <header className="flex justify-between items-center p-4 bg-white shadow">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-bold">{title}</h1>
        <FaStar className="cursor-pointer text-yellow-500" />
      </div>
      <button
        onClick={logout}
        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Log Out
      </button>
    </header>
  );
}