import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import GearListView from './GearListView';

export default function Dashboard() {
  const [currentList, setCurrentList] = useState({ _id: null, title: '' });
  const [refreshToggle, setRefreshToggle] = useState(false);

  // Called by Sidebar whenever it adds an item
  const handleItemAdded = () => {
    setRefreshToggle(prev => !prev);
  };

  // Called by Sidebar when user selects or creates a list
  const handleSelectList = list => {
    setCurrentList(list);
  };

  return (
    <div className="h-screen flex">
      <Sidebar
        currentListId={currentList._id}
        onSelectList={handleSelectList}
        onItemAdded={handleItemAdded}
      />

      <div className="flex-1 flex flex-col">
        <TopBar title={currentList.title || 'Select a list'} />

        <div className="flex-1 overflow-auto bg-gray-50">
          {currentList._id ? (
            <GearListView
              listId={currentList._id}
              refreshToggle={refreshToggle}
            />
          ) : (
            <div className="p-6 text-gray-500">
              Select or create a gear list
            </div>
          )}
        </div>
      </div>
    </div>
  );
}