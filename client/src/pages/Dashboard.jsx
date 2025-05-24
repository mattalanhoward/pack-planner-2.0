// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import GearListView from './GearListView';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png'; // ← put the generated logo here

export default function Dashboard() {
  const { isAuthenticated, logout } = useAuth();
  const [currentListId, setCurrentListId]   = useState(null);
  const [refreshToggle, setRefreshToggle]   = useState(false);
  const [templateToggle, setTemplateToggle] = useState(false);

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
    <div className="flex flex-col h-screen overflow-hidden bg-sand">
      {/* TopBar */}
      <header className="flex items-center justify-between flex-none h-16 bg-pine px-6 shadow-lg">
        <div className="flex items-center space-x-4">
          <img src={logo} alt="PackPlanner logo" className="h-10 w-auto" />
          <h1 className="text-3xl font-serif text-sand">PackPlanner</h1>
        </div>
        <button
          onClick={logout}
          className="px-4 py-1 border border-sand text-sand hover:bg-sand hover:text-pine rounded"
        >
          Logout
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
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
            <div className="h-full flex items-center justify-center text-pine text-lg">
              Select a gear list to begin.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
