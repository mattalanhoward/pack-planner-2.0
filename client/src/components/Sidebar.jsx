// src/components/Sidebar.jsx
import React, { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import {
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import GlobalItemModal from "./GlobalItemModal";
import GlobalItemEditModal from "./GlobalItemEditModal";
import { toast } from "react-hot-toast";
import ConfirmDialog from "./ConfirmDialog";

export default function Sidebar({
  lists,
  fetchLists,
  currentListId,
  categories, // ← now coming in as a prop
  onSelectList,
  onRefresh,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  // global catalog items & search
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGlobalItem, setEditingGlobalItem] = useState(null);

  // delete list dialog
  const [confirmListOpen, setConfirmListOpen] = useState(false);
  const [pendingDeleteListId, setPendingDeleteListId] = useState(null);

  // delete catalog‐item dialog
  const [confirmGlobalOpen, setConfirmGlobalOpen] = useState(false);
  const [pendingDeleteGlobalId, setPendingDeleteGlobalId] = useState(null);

  // ─── fetch catalog items ───
  const fetchGlobalItems = async () => {
    try {
      const { data } = await api.get("/global/items", {
        params: { search: searchQuery },
      });
      setItems(data);
    } catch (err) {
      console.error("Error fetching catalog items:", err);
    }
  };

  useEffect(() => {
    fetchGlobalItems();
  }, [searchQuery]);

  // ─── Auto‐select first list if none is selected ───
  useEffect(() => {
    if (!currentListId && lists.length > 0) {
      onSelectList(lists[0]._id);
    }
  }, [lists, currentListId, onSelectList]);

  // === Gear‐list CRUD ===

  const createList = async () => {
    const title = newListTitle.trim();
    if (!title) return toast.error("List name cannot be empty.");

    try {
      const { data } = await api.post("/lists", { title });
      setNewListTitle("");
      await fetchLists();
      localStorage.setItem("lastListId", data.list._id);
      onSelectList(data.list._id);
      toast.success("List created!");
    } catch (err) {
      console.error("Error creating list:", err);
      toast.error(err.response?.data?.message || "Could not create list.");
    }
  };

  const startEditList = (id, title) => {
    setEditingId(id);
    setEditingTitle(title);
  };

  const saveEditList = async (id) => {
    const title = editingTitle.trim();
    if (!title) return toast.error("List name cannot be empty.");

    try {
      await api.patch(`/lists/${id}`, { title });
      setEditingId(null);
      setEditingTitle("");
      await fetchLists();
      if (currentListId === id) {
        // ✅ re‐select the renamed list
        localStorage.setItem("lastListId", id);
        onSelectList(id);
        // then refresh its detail pane:
        onRefresh();
      }
      toast.success("List renamed!");
    } catch (err) {
      console.error("Error renaming list:", err);
      toast.error(err.response?.data?.message || "Could not update list.");
    }
  };

  const cancelEditList = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  // ─── Delete list flow ───
  const handleDeleteListClick = (id) => {
    setPendingDeleteListId(id);
    setConfirmListOpen(true);
  };

  const actuallyDeleteList = async () => {
    const id = pendingDeleteListId;
    try {
      await api.delete(`/lists/${id}`);
      setConfirmListOpen(false);
      setPendingDeleteListId(null);
      await fetchLists();
      if (currentListId === id) onSelectList(null);
      toast.success("List deleted");
    } catch (err) {
      console.error("Error deleting list:", err);
      toast.error(err.response?.data?.message || "Could not delete list.");
    }
  };

  const cancelDeleteList = () => {
    setConfirmListOpen(false);
    setPendingDeleteListId(null);
  };

  // === Catalog actions ===

  const addToList = async (item) => {
    if (!currentListId || categories.length === 0) {
      return toast.error(
        "Pick or create a list with at least one category first."
      );
    }
    const cat = categories[0];
    try {
      await api.post(`/lists/${currentListId}/categories/${cat._id}/items`, {
        globalItem: item._id,
        brand: item.brand,
        itemType: item.itemType,
        name: item.name,
        description: item.description,
        weight: item.weight,
        price: item.price,
        link: item.link,
        worn: item.worn,
        consumable: item.consumable,
        quantity: item.quantity,
        position: 0,
      });
      onRefresh();
    } catch (err) {
      console.error("Error adding item to list:", err);
      toast.error("Failed to add item into your list.");
    }
  };

  const handleDeleteGlobalClick = (id) => {
    setPendingDeleteGlobalId(id);
    setConfirmGlobalOpen(true);
  };

  const actuallyDeleteGlobalItem = async () => {
    const id = pendingDeleteGlobalId;
    try {
      await api.delete(`/global/items/${id}`);
      fetchGlobalItems();
      onRefresh();
      toast.success("Catalog item deleted");
    } catch (err) {
      console.error("Error deleting catalog item:", err);
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setConfirmGlobalOpen(false);
      setPendingDeleteGlobalId(null);
    }
  };

  const cancelDeleteGlobal = () => {
    setConfirmGlobalOpen(false);
    setPendingDeleteGlobalId(null);
  };

  // === UI rendering helpers ===

  const sortedLists = useMemo(
    () =>
      [...lists].sort((a, b) =>
        a.title.toLowerCase().localeCompare(b.title.toLowerCase())
      ),
    [lists]
  );

  const filteredAndSortedItems = useMemo(() => {
    const lower = searchQuery.trim().toLowerCase();
    const filtered =
      lower === ""
        ? items
        : items.filter((item) =>
            `${item.itemType} ${item.name}`.toLowerCase().includes(lower)
          );
    return [...filtered].sort((a, b) =>
      `${a.itemType} ${a.name}`
        .toLowerCase()
        .localeCompare(`${b.itemType} ${b.name}`.toLowerCase())
    );
  }, [items, searchQuery]);

  const widthClass = collapsed ? "w-5" : "w-full sm:w-80";
  const overlay = !collapsed
    ? // on mobile: take it out of the flow and cover
      "fixed top-16 left-0 right-0 bottom-0 z-50 \
      sm:static sm:inset-auto sm:z-auto"
    : // when collapsed (or on desktop) nothing special
      "";

  return (
    <div className={`h-full flex overflow-visible ${overlay}`}>
      <div
        className={`
          relative
          bg-teal text-sand
          ${widthClass}
          /* never shrink smaller than w-5 (1.25rem) */
          min-w-[1.25rem]
          transition-[width] duration-300 ease-in-out
        `}
      >
        {/* collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={
            `absolute top-4 bg-ember text-pine rounded-full p-1 shadow-lg transform ` +
            (collapsed ? "right-0 translate-x-1/2" : "right-4")
          }
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        {!collapsed && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Gear Lists section */}
            <section className="flex flex-col flex-none h-1/3 p-4 border-b border-sand overflow-hidden">
              <h2 className="font-bold mb-2 text-sunset truncate">
                Gear Lists
              </h2>
              <div className="flex mb-3">
                <input
                  className="flex-1 rounded-lg p-2 bg-sand text-pine border-pine"
                  placeholder="New list"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                />
                <button
                  onClick={createList}
                  disabled={!newListTitle.trim()}
                  className="ml-2 p-1 text-sunset hover:text-sunset/80"
                >
                  <FaPlus />
                </button>
              </div>

              <ul className="overflow-y-auto flex-1 space-y-1">
                {sortedLists.map((l) => (
                  <li key={l._id} className="flex items-center">
                    {editingId === l._id ? (
                      <input
                        className="flex-1 rounded-lg p-2 text-pine border border-pine"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => saveEditList(l._id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditList(l._id);
                          if (e.key === "Escape") cancelEditList();
                        }}
                        autoFocus
                      />
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            // 1) Select the new list
                            onSelectList(l._id);
                            // 2) Persist or clear storage
                            if (l._id) {
                              localStorage.setItem("lastListId", l._id);
                            } else {
                              localStorage.removeItem("lastListId");
                            }
                          }}
                          className={`flex-1 text-left p-2 rounded-lg whitespace-nowrap overflow-hidden truncate ${
                            l._id === currentListId
                              ? "bg-sunset text-sand"
                              : "hover:bg-sunset hover:text-pine"
                          }`}
                        >
                          {l.title}
                        </button>
                        <FaEdit
                          onClick={() => startEditList(l._id, l.title)}
                          className="ml-2 cursor-pointer text-sunset"
                        />
                        <FaTrash
                          onClick={() => handleDeleteListClick(l._id)}
                          className="ml-2 cursor-pointer text-ember"
                        />
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Catalog / Global Items */}
            <section className="flex flex-col flex-1 p-4 overflow-hidden">
              <div className="flex justify-between items-center mb-2 text-sunset">
                <h2 className="font-bold truncate">Catalog</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-1"
                  disabled={!currentListId || categories.length === 0}
                >
                  <FaPlus />
                </button>
              </div>
              <input
                className="w-full rounded-lg p-2 bg-sand text-pine border border-pine mb-3"
                placeholder="Search catalog"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <ul className="overflow-y-auto flex-1 space-y-2">
                {filteredAndSortedItems.map((item) => (
                  <li
                    key={item._id}
                    className="flex items-center p-2 bg-sand/10 rounded-lg hover:bg-sand/20"
                  >
                    <span className="flex-1 truncate text-sand">
                      {item.itemType} – {item.name}
                    </span>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setEditingGlobalItem(item)}
                        title="Edit global template"
                        className="hover:text-sand/80 text-sand rounded-lg"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteGlobalClick(item._id)}
                        title="Delete global template"
                        className="text-ember hover:text-ember/80"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </li>
                ))}
                {filteredAndSortedItems.length === 0 && (
                  <li className="text-pine/70 p-2">No catalog items</li>
                )}
              </ul>

              {showCreateModal && (
                <GlobalItemModal
                  categories={categories}
                  onClose={() => {
                    setShowCreateModal(false);
                    fetchGlobalItems();
                  }}
                  onCreated={() => {
                    setShowCreateModal(false);
                    fetchGlobalItems();
                    onRefresh();
                  }}
                />
              )}

              {editingGlobalItem && (
                <GlobalItemEditModal
                  item={editingGlobalItem}
                  onClose={() => setEditingGlobalItem(null)}
                  onSaved={() => {
                    fetchGlobalItems();
                    setEditingGlobalItem(null);
                    onRefresh();
                  }}
                />
              )}
            </section>
          </div>
        )}
      </div>

      {/* Delete List Confirm */}
      <ConfirmDialog
        isOpen={confirmListOpen}
        title={
          pendingDeleteListId
            ? `Delete “${
                lists.find((l) => l._id === pendingDeleteListId)?.title || ""
              }” Gear List?`
            : "Delete this list?"
        }
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={actuallyDeleteList}
        onCancel={cancelDeleteList}
      />

      {/* Delete Global‐item Confirm */}
      <ConfirmDialog
        isOpen={confirmGlobalOpen}
        title={
          pendingDeleteGlobalId
            ? `Delete ${
                items.find((i) => i._id === pendingDeleteGlobalId)?.brand || ""
              } ${
                items.find((i) => i._id === pendingDeleteGlobalId)?.name || ""
              }?`
            : "Delete this catalog item?"
        }
        message="This will remove the item from your master catalog."
        confirmText="Delete Item"
        cancelText="Cancel"
        onConfirm={actuallyDeleteGlobalItem}
        onCancel={cancelDeleteGlobal}
      />
    </div>
  );
}
