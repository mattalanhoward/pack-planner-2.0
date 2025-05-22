// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import GearListView from './GearListView';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { isAuthenticated, logout } = useAuth();
  const [currentListId, setCurrentListId] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  // (your existing effects for auth & default list selection...)

  const handleItemAdded = () => {
    setRefreshToggle(t => !t);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col h-screen">
      {/* TopBar spans full width */}
      <header className="w-full bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">PackPlanner</h1>
        <button onClick={logout} className="text-red-500">Logout</button>
      </header>

      <div className="flex flex-1">
        <Sidebar
          currentListId={currentListId}
          onSelectList={setCurrentListId}
          onItemAdded={handleItemAdded}
        />
        <main className="flex-1 overflow-hidden">
          {currentListId ? (
            <GearListView
              key={`${currentListId}-${refreshToggle}`}
              listId={currentListId}
            />
          ) : (
            <div className="p-4 text-gray-500">
              Select a gear list to begin.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}