// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import GearListView from './GearListView';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { isAuthenticated, logout } = useAuth();
  const [currentListId, setCurrentListId] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  // Example: load default list on mount
  useEffect(() => {
    async function initialize() {
      try {
        // Optionally fetch lists to set a default
        // const { data } = await api.get('/lists');
        // if (data.length) setCurrentListId(data[0]._id);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    initialize();
  }, []);

  // Preload categories or other data when list changes
  useEffect(() => {
    if (!currentListId) return;
    async function preload() {
      try {
        // e.g. await api.get(`/lists/${currentListId}/categories`);
      } catch (err) {
        console.error('Preload error:', err);
      }
    }
    preload();
  }, [currentListId]);

  const handleItemAdded = () => {
    setRefreshToggle(t => !t);
  };

  if (!isAuthenticated) {
    return null; // or redirect to login
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        currentListId={currentListId}
        onSelectList={setCurrentListId}
        onItemAdded={handleItemAdded}
      />
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-10 bg-white shadow p-2 flex justify-between">
          <h1 className="text-xl">Pack Planner</h1>
          <button onClick={logout} className="text-red-500">Logout</button>
        </header>
        <main className="flex-1 overflow-x-auto overflow-y-hidden">
          {currentListId ? (
            <GearListView
              key={`${currentListId}-${refreshToggle}`}
              listId={currentListId}
            />
          ) : (
            <div className="p-4 text-gray-500">Select a gear list to begin.</div>
          )}
        </main>
      </div>
    </div>
  );
}
