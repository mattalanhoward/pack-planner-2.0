// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import GearListView from './GearListView';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { isAuthenticated, logout } = useAuth();
  const [currentListId, setCurrentListId]     = useState(null);
  const [refreshToggle, setRefreshToggle]     = useState(false);
  const [templateToggle, setTemplateToggle]   = useState(false);

  // Called when a new item is added to a category
  const handleItemAdded = () => {
    setRefreshToggle(t => !t);
  };

  // Called when a global template is edited
  const handleTemplateEdited = () => {
    setTemplateToggle(t => !t);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col h-screen">
      {/* TopBar spans full width */}
      <header className="w-full bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">PackPlanner</h1>
        <button onClick={logout} className="text-red-500 hover:underline">
          Logout
        </button>
      </header>

      <div className="flex flex-1">
        <Sidebar
          currentListId={currentListId}
          onSelectList={setCurrentListId}
          onItemAdded={handleItemAdded}
          onTemplateEdited={handleTemplateEdited}
        />

        <main className="flex-1 overflow-hidden">
          {currentListId ? (
            <GearListView
              listId={currentListId}
              refreshToggle={refreshToggle}
              templateToggle={templateToggle}
            />
          ) : (
            <div className="p-6 text-gray-500">
              Select a gear list to begin.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}