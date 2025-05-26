import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import GearListView from './GearListView';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png'; // ← your generated logo

export default function Dashboard() {
  const { isAuthenticated, logout } = useAuth();
  const [currentListId, setCurrentListId]   = useState(null);
  const [refreshToggle, setRefreshToggle]   = useState(false);
  const [templateToggle, setTemplateToggle] = useState(false);
  const [viewMode, setViewMode]             = useState('columns'); // ← new state

  const handleItemAdded = () => setRefreshToggle(t => !t);
  const handleTemplateEdited = () => setTemplateToggle(t => !t);

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-sand">
      {/* TopBar */}
      <header className="flex items-center justify-between flex-none h-16 bg-teal px-6 shadow-lg">
        <div className="flex items-center space-x-4">
          <img src={logo} alt="PackPlanner logo" className="h-10 w-auto" />
          <h1 className="text-3xl font-serif text-sand">PackPlanner</h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* ← view toggle button */}
          <button
            onClick={() => setViewMode(vm => (vm === 'columns' ? 'list' : 'columns'))}
            className="px-3 py-1 border border-sand text-sand hover:bg-sand hover:text-pine rounded"
          >
            {viewMode === 'columns' ? 'List View' : 'Kanban View'}
          </button>
          <button
            onClick={logout}
            className="px-4 py-1 border border-sand text-sand hover:bg-sand hover:text-pine rounded"
          >
            Logout
          </button>
        </div>
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
              viewMode={viewMode}           // ← pass it down
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
