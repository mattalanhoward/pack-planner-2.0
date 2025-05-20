// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import GearListView from './GearListView';

export default function Dashboard() {
  const [currentList, setCurrentList]     = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  const handleItemAdded = () => {
    setRefreshToggle(prev => !prev);
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentListId={currentList?._id}
        onSelectList={list => setCurrentList(list)}
        onItemAdded={handleItemAdded}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar title={currentList?.title || 'Select a list'} />

        {/* Board: horizontal scroll only */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50">
          <GearListView
            listId={currentList?._id}
            refreshToggle={refreshToggle}
          />
        </div>
      </div>
    </div>
  );
}
