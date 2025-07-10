// src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { useParams, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import GearListView from "./GearListView";
import { toast } from "react-hot-toast";
import { useUserSettings } from "../contexts/UserSettings";

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const { listId } = useParams(); // from /lists/:listId
  const navigate = useNavigate();

  // ─── Single‐source‐of‐truth for our `/full` payload ───
  const [fullData, setFullData] = useState({
    list: null,
    categories: [],
    items: [],
  });

  // ─── Lists state & fetchLists fn ───
  const [lists, setLists] = useState([]);
  const fetchLists = useCallback(async () => {
    try {
      const { data } = await api.get("/lists");
      setLists(data);
    } catch (err) {
      console.error("Failed to fetch lists", err);
      toast.error("Could not load your gear lists");
    }
  }, []);

  // if we’re not logged in, bounce straight back to /login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // load lists on mount
  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // ─── Redirect logic ───
  useEffect(() => {
    if (listId) return;
    // if there are no lists at all, stay on the "root" path (no listId)
    if (lists.length === 0) return;

    const ids = lists.map((l) => l._id);

    // 2) try lastListId from localStorage
    const stored = localStorage.getItem("lastListId");
    if (stored && ids.includes(stored)) {
      navigate(`/lists/${stored}`, { replace: true });
      return;
    }

    // 3) fallback to first list
    navigate(`/lists/${ids[0]}`, { replace: true });
  }, [lists, listId, navigate]);

  // ─── viewMode persistence ───
  // NEW: pull from server-backed Context
  const { viewMode, setViewMode } = useUserSettings();

  // fetch /api/lists/:listId/full
  const fetchFullData = useCallback(async () => {
    if (!listId) return;
    try {
      const { data } = await api.get(`/lists/${listId}/full`);
      setFullData({
        list: data.list,
        categories: data.categories,
        items: data.items,
      });
    } catch (err) {
      console.error("Failed to fetch full data", err);
      toast.error("Could not load this gear list");
    }
  }, [listId]);

  // — New: Optimistic reorder + persist for categories
  const onReorderCategories = useCallback(
    async (oldCats, reorderedCats) => {
      // 1) Immediately update UI
      setFullData((f) => ({ ...f, categories: reorderedCats }));

      // 2) Persist only changed positions
      const oldPosMap = Object.fromEntries(
        oldCats.map((c) => [c._id, c.position])
      );

      for (let i = 0; i < reorderedCats.length; i++) {
        const { _id, position } = reorderedCats[i];
        if (oldPosMap[_id] !== position) {
          await api.patch(`/lists/${listId}/categories/${_id}/position`, {
            position,
          });
        }
      }
    },
    [listId]
  );

  // load on mount—and whenever listId changes
  useEffect(() => {
    fetchFullData();
  }, [fetchFullData, listId]);

  // ─── If auth, lists or fullData not loaded yet ───
  if (!isAuthenticated || (listId && fullData.list === null)) {
    return null;
  }
  return (
    <div className="flex flex-col h-d-screen overflow-hidden bg-neutral/50 text-primary">
      <TopBar
        title="PackPlanner"
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          lists={lists} // up-to-date list array
          fetchLists={fetchLists} // allows Sidebar to re-load after mutating
          currentListId={listId}
          categories={fullData?.categories || []}
          onSelectList={(id) => {
            if (id) {
              localStorage.setItem("lastListId", id);
            } else {
              localStorage.removeItem("lastListId");
            }
            navigate(`/lists/${id}`);
          }}
          onRefresh={fetchFullData}
        />

        <main className="flex-1 overflow-hidden">
          {listId ? (
            <GearListView
              listId={listId}
              viewMode={viewMode}
              categories={fullData.categories}
              onRefresh={fetchFullData}
              onReorderCategories={onReorderCategories}
              list={fullData.list}
              items={fullData.items}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-primary text-lg">
              Create a gear list to begin.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
