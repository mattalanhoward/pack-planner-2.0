import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import GearListView from "./GearListView";
import useAuth from "../hooks/useAuth";
import TopBar from "../components/TopBar";

export default function Dashboard() {
  const { isAuthenticated, logout } = useAuth();
  const [currentListId, setCurrentListId] = useState(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [templateToggle, setTemplateToggle] = useState(false);
  const [viewMode, setViewMode] = useState("columns");
  const [currentListTitle, setCurrentListTitle] = useState("");
  const [renameToggle, setRenameToggle] = useState(false);
  const handleItemAdded = () => setRefreshToggle((t) => !t);
  const handleTemplateEdited = () => setTemplateToggle((t) => !t);

  if (!isAuthenticated) return null;

  const handleListRenamed = () => {
    setRenameToggle((t) => !t);
  };

  return (
    <div className="flex flex-col h-d-screen overflow-hidden">
      {/* TopBar */}
      <TopBar
        title="PackPlanner"
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onListRenamed={handleListRenamed}
          currentListId={currentListId}
          onSelectList={(id) => {
            setCurrentListId(id);
          }}
          onItemAdded={handleItemAdded}
          onTemplateEdited={handleTemplateEdited}
        />

        <main className="flex-1 overflow-hidden">
          {currentListId ? (
            <GearListView
              listId={currentListId}
              renameToggle={renameToggle}
              refreshToggle={refreshToggle}
              templateToggle={templateToggle}
              viewMode={viewMode} // ← pass it down
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
