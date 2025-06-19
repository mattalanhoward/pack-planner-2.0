// src/pages/GearListView.jsx
import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
  DragOverlay,
} from "@dnd-kit/core";

import {
  restrictToHorizontalAxis,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";

import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import grandcanyonbg from "../assets/grand-canyon-bg.jpeg";
import sierraNevadaBg from "../assets/sierra-nevada-bg.jpeg";

import { FaGripVertical, FaTrash, FaPlus } from "react-icons/fa";
import AddGearItemModal from "../components/AddGearItemModal";
import { toast } from "react-hot-toast";
import ConfirmDialog from "../components/ConfirmDialog";
import SortableItem from "../components/SortableItem";
import PreviewCard from "../components/PreviewCard";
import PreviewColumn from "../components/PreviewColumn"; // (or wherever you placed that inline component)

export default function GearListView({
  listId,
  refreshToggle,
  templateToggle,
  viewMode, // "columns" or "list"
}) {
  const [listName, setListName] = useState("");
  const [categories, setCategories] = useState([]);
  const [itemsMap, setItemsMap] = useState({});
  const [editingCatId, setEditingCatId] = useState(null);
  const [addingNewCat, setAddingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [showAddModalCat, setShowAddModalCat] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  // State to control the “delete item” confirmation dialog:
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState({
    catId: null,
    itemId: null,
  });
  const [confirmCatOpen, setConfirmCatOpen] = useState(false);
  const [pendingDeleteCatId, setPendingDeleteCatId] = useState(null);
  // track drag-over placeholder slot
  const [dragOver, setDragOver] = useState({ catId: null, index: -1 });

  // — fetch list title —
  useEffect(() => {
    if (!listId) return;
    (async () => {
      const { data } = await api.get("/lists");
      const found = data.find((l) => l._id === listId);
      setListName(found?.title || "");
    })();
  }, [listId]);

  // — load categories —
  useEffect(() => {
    if (!listId) return;
    (async () => {
      const { data } = await api.get(`/lists/${listId}/categories`);
      setCategories(data);
    })();
  }, [listId, refreshToggle, templateToggle]);

  // — load items —
  useEffect(() => {
    categories.forEach((cat) => fetchItems(cat._id));
  }, [categories, refreshToggle, templateToggle]);

  const fetchItems = async (catId) => {
    const { data } = await api.get(
      `/lists/${listId}/categories/${catId}/items`
    );
    setItemsMap((m) => ({ ...m, [catId]: data }));
  };

  // — inline‐edit handlers for items —
  // — toggle consumable status —
  const toggleConsumable = (catId, itemId) => {
    // read old state & flip
    const old = itemsMap[catId].find((i) => i._id === itemId).consumable;
    const next = !old;

    // 1) Optimistic UI update
    setItemsMap((m) => ({
      ...m,
      [catId]: m[catId].map((i) =>
        i._id === itemId ? { ...i, consumable: next } : i
      ),
    }));

    // 2) persist in background with try/catch
    (async () => {
      try {
        await api.patch(
          `/lists/${listId}/categories/${catId}/items/${itemId}`,
          { consumable: next }
        );
      } catch (err) {
        fetchItems(catId);
        toast.error("Failed to toggle consumable");
      }
    })();
  };

  const toggleWorn = (catId, itemId) => {
    // read old state & flip
    const old = itemsMap[catId].find((i) => i._id === itemId).worn;
    const next = !old;

    // 1) Optimistic UI update
    setItemsMap((m) => ({
      ...m,
      [catId]: m[catId].map((i) =>
        i._id === itemId ? { ...i, worn: next } : i
      ),
    }));

    // 2) persist in background with try/catch
    (async () => {
      try {
        await api.patch(
          `/lists/${listId}/categories/${catId}/items/${itemId}`,
          { worn: next }
        );
      } catch {
        fetchItems(catId);
        toast.error("Failed to toggle worn");
      }
    })();
  };

  // — update item quantity inline —
  const updateQuantity = async (catId, itemId, qty) => {
    try {
      await api.patch(`/lists/${listId}/categories/${catId}/items/${itemId}`, {
        quantity: qty,
      });
      fetchItems(catId);
    } catch (err) {
      toast.error(err.message || "Failed to update quantity");
    }
  };

  const handleDeleteClick = (catId, itemId) => {
    // Open the dialog, storing which catId/itemId is about to be deleted
    setPendingDelete({ catId, itemId });
    setConfirmOpen(true);
  };

  const actuallyDeleteItem = async () => {
    const { catId, itemId } = pendingDelete;
    try {
      await api.delete(`/lists/${listId}/categories/${catId}/items/${itemId}`);
      fetchItems(catId);
      toast.success("Item deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      // Close the confirmation dialog (regardless of success/failure)
      setConfirmOpen(false);
      setPendingDelete({ catId: null, itemId: null });
    }
  };

  const cancelDelete = () => {
    setConfirmOpen(false);
    setPendingDelete({ catId: null, itemId: null });
  };

  // — add category —
  const confirmAddCat = async () => {
    const title = newCatName.trim();
    if (!title) return;

    try {
      const { data } = await api.post(`/lists/${listId}/categories`, {
        title,
        position: categories.length,
      });
      setCategories((c) => [...c, data]);
      setNewCatName("");
      setAddingNewCat(false);
      toast.success("Category Added! 🎉");
    } catch (err) {
      // show the error message from the thrown Error
      toast.error(err.message || "Failed to add category");
    }
  };

  const cancelAddCat = () => setAddingNewCat(false);

  const handleDeleteCatClick = (catId) => {
    setPendingDeleteCatId(catId);
    setConfirmCatOpen(true);
  };

  const actuallyDeleteCat = async () => {
    const catId = pendingDeleteCatId;
    try {
      await api.delete(`/lists/${listId}/categories/${catId}`);
      // Remove from local state:
      setCategories((c) => c.filter((x) => x._id !== catId));
      setItemsMap((m) => {
        const copy = { ...m };
        delete copy[catId];
        return copy;
      });
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setConfirmCatOpen(false);
      setPendingDeleteCatId(null);
    }
  };

  const cancelDeleteCat = () => {
    setConfirmCatOpen(false);
    setPendingDeleteCatId(null);
  };

  // — edit category name inline —
  const editCat = async (id, title) => {
    const newTitle = title.trim();
    if (!newTitle) {
      toast.error("Category name cannot be empty");
      return;
    }
    try {
      const { data } = await api.patch(`/lists/${listId}/categories/${id}`, {
        title: newTitle,
      });
      setCategories((cats) => cats.map((c) => (c._id === id ? data : c)));
      setEditingCatId(null);
      toast.success("Category renamed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to rename category");
    }
  };

  // — DnD sensors & handler —
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async ({ active, over }) => {
    setDragOver({ catId: null, index: -1 });

    if (!over) {
      return; // if dropped outside anywhere, do nothing
    }
    // ─── CATEGORY REORDER BRANCH ───
    if (active.id.startsWith("cat-") && over.id.startsWith("cat-")) {
      // 1) Extract old & new indices from the namespaced IDs ("cat-<catId>")
      const oldIndex = categories.findIndex(
        (c) => `cat-${c._id}` === active.id
      );
      const newIndex = categories.findIndex((c) => `cat-${c._id}` === over.id);

      // If either index is -1 or they’re equal, do nothing
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return;
      }

      // 2) Compute a brand new, in-memory array of categories, each with a new `position` field
      //    `arrayMove` shifts the element at oldIndex → newIndex; then we re‐assign positions [0..]
      const reordered = arrayMove(categories, oldIndex, newIndex).map(
        (catObj, idx) => ({
          ...catObj,
          position: idx,
        })
      );

      // 3) Update local state immediately so the UI re‐renders in the new order
      setCategories(reordered);

      // 4) Persist *all* changed positions to the server in a loop
      //    We need to compare `reordered[i]._id` vs. the original categories array to see who actually moved.
      //    The simplest way: for each `reordered[i]`, look up its old index and old position,
      //    and if `oldPosition !== newIndex`, send a PATCH for it.

      // Build a small lookup from categoryId → oldPosition
      const oldPositions = {};
      categories.forEach((catObj, idx) => {
        oldPositions[catObj._id] = catObj.position;
      });

      // Loop through every category in `reordered`
      for (let i = 0; i < reordered.length; i++) {
        const catObj = reordered[i];
        const oldPos = oldPositions[catObj._id];
        const newPos = catObj.position; // which is i

        // If the position actually changed in memory, send a PATCH
        if (oldPos !== newPos) {
          await api.patch(
            `/lists/${listId}/categories/${catObj._id}/position`,
            { position: newPos }
          );
        }
      }
      return;
    }

    // 2) ITEM DRAG:
    if (active.id.startsWith("item-") && over.id.startsWith("item-")) {
      // Parse out source catId + itemId from active.id = `item-<catId>-<itemId>`
      const [, sourceCatId, sourceItemId] = active.id.split("-");
      // Similarly, destination catId + destItemId:
      const [, destCatId, destItemId] = over.id.split("-");

      // If sourceCatId === destCatId, we're merely reordering _within_ the same category
      if (sourceCatId === destCatId) {
        const oldArray = itemsMap[sourceCatId] || [];
        const oldIndex = oldArray.findIndex((i) => i._id === sourceItemId);
        const newIndex = oldArray.findIndex((i) => i._id === destItemId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newArr = arrayMove(oldArray, oldIndex, newIndex).map(
            (itemObj, idx) => ({ ...itemObj, position: idx })
          );
          // 1) Immediately update UI:
          setItemsMap((prev) => ({
            ...prev,
            [sourceCatId]: newArr,
          }));
          // 2) Persist each changed position to server:
          for (let i = 0; i < newArr.length; i++) {
            const it = newArr[i];
            // Only PATCH if the position truly changed:
            if (
              it.position !== oldArray.find((x) => x._id === it._id).position
            ) {
              await api.patch(
                `/lists/${listId}/categories/${sourceCatId}/items/${it._id}`,
                { position: i }
              );
            }
          }
        }
      } else {
        // Cross‐category move: remove from sourceCatId, insert into destCatId at destIndex
        const sourceArr = itemsMap[sourceCatId] || [];
        const destArr = itemsMap[destCatId] || [];

        const removedIdx = sourceArr.findIndex((i) => i._id === sourceItemId);
        const insertedIdx = destArr.findIndex((i) => i._id === destItemId);

        if (removedIdx === -1 || insertedIdx === -1) return;

        // 1) Compute new arrays in memory:
        // → “take out” the moved item
        const movedItem = sourceArr[removedIdx];
        const newSourceArr = sourceArr
          .filter((i) => i._id !== sourceItemId)
          .map((it, idx) => ({ ...it, position: idx }));
        // → “insert” into destArr at insertedIdx
        const newDestArr = [
          ...destArr.slice(0, insertedIdx),
          movedItem,
          ...destArr.slice(insertedIdx),
        ].map((it, idx) => ({
          ...it,
          position: idx,
          // If this is the movedItem, its category changes to destCatId
          category: it._id === movedItem._id ? destCatId : it.category,
        }));

        // 2) Immediately update UI:
        setItemsMap((prev) => ({
          ...prev,
          [sourceCatId]: newSourceArr,
          [destCatId]: newDestArr,
        }));

        // 3) Persist to server in (multiple) PATCHes:
        //    a) Update moved item’s category AND new position in destCat
        await api.patch(
          `/lists/${listId}/categories/${sourceCatId}/items/${sourceItemId}`,
          {
            category: destCatId,
            position: newDestArr.find((i) => i._id === sourceItemId).position,
          }
        );
        //    b) Update the “position” of every other item in old category (newSourceArr)
        for (let i = 0; i < newSourceArr.length; i++) {
          const it = newSourceArr[i];
          const oldPos = sourceArr.find((x) => x._id === it._id).position;
          if (oldPos !== i) {
            await api.patch(
              `/lists/${listId}/categories/${sourceCatId}/items/${it._id}`,
              { position: i }
            );
          }
        }
        //    c) Update the “position” of every other item in new category (newDestArr),
        //       except the moved one (which we already patched above)
        for (let i = 0; i < newDestArr.length; i++) {
          const it = newDestArr[i];
          if (it._id === sourceItemId) continue;
          const oldPos = destArr.find((x) => x._id === it._id).position;
          if (oldPos !== i) {
            await api.patch(
              `/lists/${listId}/categories/${destCatId}/items/${it._id}`,
              { position: i }
            );
          }
        }
      }

      return;
    }

    // 3) ITEM DROPPED INTO AN EMPTY CATEGORY (optional):
    // If active.id startsWith('item-') but over.id is exactly equal to `cat-<someCatId>`,
    // then we know the user dropped it “into the empty space” of that category.
    // We then treat it as “insert at end of that category.”
    if (active.id.startsWith("item-") && over.id.startsWith("cat-")) {
      const [, sourceCatId, sourceItemId] = active.id.split("-");
      const destCatId = over.id.replace(/^cat-/, "");

      if (sourceCatId === destCatId) return; // nothing changed

      const sourceArr = itemsMap[sourceCatId] || [];
      const destArr = itemsMap[destCatId] || [];

      const removedIdx = sourceArr.findIndex((i) => i._id === sourceItemId);
      if (removedIdx === -1) return;

      // “move to end of destArr”
      const movedItem = sourceArr[removedIdx];
      const newSourceArr = sourceArr
        .filter((i) => i._id !== sourceItemId)
        .map((it, idx) => ({ ...it, position: idx }));
      const newDestArr = [...destArr, movedItem].map((it, idx) => ({
        ...it,
        position: idx,
        category: it._id === movedItem._id ? destCatId : it.category,
      }));

      // Update UI immediately
      setItemsMap((prev) => ({
        ...prev,
        [sourceCatId]: newSourceArr,
        [destCatId]: newDestArr,
      }));

      // Persist changes to server
      // a) moved item’s category + new position
      await api.patch(
        `/lists/${listId}/categories/${sourceCatId}/items/${sourceItemId}`,
        { category: destCatId, position: newDestArr.length - 1 }
      );
      // b) re-index source category
      for (let i = 0; i < newSourceArr.length; i++) {
        const it = newSourceArr[i];
        const oldPos = sourceArr.find((x) => x._id === it._id).position;
        if (oldPos !== i) {
          await api.patch(
            `/lists/${listId}/categories/${sourceCatId}/items/${it._id}`,
            { position: i }
          );
        }
      }

      return;
    }
  };

  const handleDragStart = ({ active }) => {
    // 1) Item‐drag preview
    if (active.id.startsWith("item-")) {
      const [, catId, itemId] = active.id.split("-");
      const itemArray = itemsMap[catId] || [];
      const found = itemArray.find((i) => i._id === itemId);
      if (found) {
        setActiveItem({ catId, item: found });
      }

      // 2) Category‐drag preview
    } else if (active.id.startsWith("cat-")) {
      const catId = active.id.replace(/^cat-/, "");
      const foundCat = categories.find((c) => c._id === catId);
      if (foundCat) {
        setActiveCategory(foundCat);
      }
    }
  };

  // ** NEW: handle drag-over to set placeholder **
  const handleDragOver = ({ active, over }) => {
    if (!active.id.startsWith("item-")) {
      setDragOver({ catId: null, index: -1 });
      return;
    }
    if (!over) {
      setDragOver({ catId: null, index: -1 });
      return;
    }
    if (over.id.startsWith("item-")) {
      const [, overCatId, overItemId] = over.id.split("-");
      const arr = itemsMap[overCatId] || [];
      const idx = arr.findIndex((i) => i._id === overItemId);
      setDragOver({ catId: overCatId, index: idx });
    } else if (over.id.startsWith("cat-")) {
      const overCatId = over.id.replace("cat-", "");
      const arr = itemsMap[overCatId] || [];
      setDragOver({ catId: overCatId, index: arr.length });
    }
  };

  const axisModifier = (args) => {
    const { active, transform } = args;

    // 1) If there's no active draggable, or if it's an item, just return the raw transform:
    if (!active || !active.id || active.id.startsWith("item-")) {
      return transform;
    }

    // 2) If we're in column mode and dragging a category, lock X:
    if (viewMode === "columns" && active.id.startsWith("cat-")) {
      return restrictToHorizontalAxis(args);
    }

    // 3) If we're in list mode and dragging a category, lock Y:
    if (viewMode === "list" && active.id.startsWith("cat-")) {
      return restrictToVerticalAxis(args);
    }

    // 4) Otherwise, no change:
    return transform;
  };

  // 1) Custom collision detector
  const collisionDetectionStrategy = (args) => {
    const { active } = args;

    // if it's a gear item, use closest-corners
    if (active && active.id?.startsWith("item-")) {
      return closestCorners(args);
    }

    // otherwise (categories) use pointerWithin (or whatever you prefer)
    return pointerWithin(args);
  };

  // ───────────── SORTABLESECTION (LIST MODE) ─────────────
  function SortableSection({
    category,
    items,
    editingCatId,
    setEditingCatId,
    onEditCat,
    onToggleConsumable,
    onToggleWorn,
    onQuantityChange,
    showAddModalCat,
    setShowAddModalCat,
    fetchItems,
    listId,
    activeId,
  }) {
    const filtered = React.useMemo(
      () => items.filter((i) => `item-${category._id}-${i._id}` !== activeId),
      [items, activeId, category._id]
    );

    const displayItems = React.useMemo(() => {
      if (dragOver.catId !== category._id) return items;
      const base = [...filtered];
      base.splice(dragOver.index, 0, {
        _id: "placeholder",
        isPlaceholder: true,
      });
      return base;
    }, [filtered, dragOver, category._id]);

    const catId = category._id;

    const [localTitle, setLocalTitle] = useState(category.title);

    const totalWeight = (items || []).reduce((sum, i) => {
      const qty = i.quantity || 1;
      // If worn, we only carry qty−1 units; otherwise all units:
      const countable = i.worn ? Math.max(0, qty - 1) : qty;
      return sum + (i.weight || 0) * countable;
    }, 0);

    // useSortable for the category header itself:
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: `cat-${catId}` });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
      <section
        ref={setNodeRef}
        style={style}
        className="bg-teal/60 rounded-lg p-4 mb-6"
      >
        <div className="flex items-center mb-3">
          <FaGripVertical
            {...attributes}
            {...listeners}
            className="mr-2 cursor-grab text-sunset"
          />

          {editingCatId === catId ? (
            // Inline <input> that saves on blur or Enter
            <input
              autoFocus
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={() => {
                setEditingCatId(null);
                onEditCat(catId, localTitle);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur(); // triggers onBlur
                }
              }}
              className="flex-1 border border-pine rounded p-1 bg-sand"
            />
          ) : (
            <>
              {/* Click the title to edit */}
              <h3
                onClick={() => {
                  setEditingCatId(catId);
                  setLocalTitle(category.title);
                }}
                className="flex-1 font-semibold text-sunset cursor-text flex items-baseline justify-between pr-4"
              >
                <span>{category.title}</span>
              </h3>
              <span className="pr-3 text-sunset">{totalWeight} g</span>

              {/* Only show delete icon now */}
              <FaTrash
                aria-label="Delete category"
                title="Delete category"
                onClick={() => handleDeleteCatClick(catId)}
                className="cursor-pointer text-ember"
              />
            </>
          )}
        </div>

        {/* ───── The NEW SortableContext wrapping this category’s items ───── */}
        <SortableContext
          items={items.map((i) => `item-${catId}-${i._id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 overflow-y-auto space-y-2 mb-2">
            {displayItems.map((item, idx) =>
              item.isPlaceholder ? (
                // MINIMAL: just a thin bar
                <div
                  key={`ph-${idx}`}
                  className="w-full h-[2px] bg-teal-400 my-1"
                />
              ) : (
                <SortableItem
                  key={item._id}
                  item={item}
                  catId={catId}
                  onToggleConsumable={onToggleConsumable}
                  onToggleWorn={onToggleWorn}
                  onQuantityChange={onQuantityChange}
                  onDelete={handleDeleteClick}
                  isListMode={viewMode === "list"}
                />
              )
            )}
          </div>
        </SortableContext>
        {/* ──────────────────────────────────────────────────────────────── */}

        <button
          onClick={() => setShowAddModalCat(catId)}
          className="mt-2 px-4 py-2 bg-sand/70 text-gray-800 hover:bg-sand/90 rounded flex items-center"
        >
          <FaPlus className="mr-2" /> Add Item
        </button>
        {showAddModalCat === catId && (
          <AddGearItemModal
            listId={listId}
            categoryId={catId}
            onClose={() => setShowAddModalCat(null)}
            onAdded={() => fetchItems(catId)}
          />
        )}
      </section>
    );
  }

  // ───────────── SORTABLECOLUMN (COLUMN MODE) ─────────────
  function SortableColumn({
    category,
    items,
    editingCatId,
    setEditingCatId,
    onEditCat,
    onToggleConsumable,
    onToggleWorn,
    onQuantityChange,
    showAddModalCat,
    setShowAddModalCat,
    fetchItems,
    listId,
  }) {
    const catId = category._id;
    const [localTitle, setLocalTitle] = useState(category.title);
    const totalWeight = (items || []).reduce((sum, i) => {
      const qty = i.quantity || 1;
      // If worn, we only carry qty−1 units; otherwise all units:
      const countable = i.worn ? Math.max(0, qty - 1) : qty;
      return sum + (i.weight || 0) * countable;
    }, 0);

    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: `cat-${catId}` });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="snap-center flex-shrink-0 my-0 mx-2 w-80 sm:w-64 bg-teal/60 rounded-lg p-3 flex flex-col self-start max-h-full"
      >
        <div className="flex items-center mb-2">
          <FaGripVertical
            {...attributes}
            {...listeners}
            className="mr-2 cursor-grab text-sunset"
          />

          {editingCatId === catId ? (
            // Inline <input> that saves on blur or Enter
            <input
              autoFocus
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={() => {
                setEditingCatId(null);
                onEditCat(catId, localTitle);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur(); // triggers onBlur
                }
              }}
              className="flex-1 border border-pine rounded p-1 bg-sand"
            />
          ) : (
            <>
              {/* Click the title to edit */}
              <h3
                onClick={() => {
                  setEditingCatId(catId);
                  setLocalTitle(category.title);
                }}
                className="flex-1 font-semibold text-sunset cursor-text flex items-baseline justify-between pr-4"
              >
                <span>{category.title}</span>
              </h3>
              <span className="pr-3 text-sunset">{totalWeight} g</span>

              {/* Only show delete icon now */}
              <FaTrash
                aria-label="Delete category"
                title="Delete category"
                onClick={() => handleDeleteCatClick(catId)}
                className="cursor-pointer text-ember"
              />
            </>
          )}
        </div>

        {/* ───── The NEW SortableContext wrapping this column’s items ───── */}
        <SortableContext
          items={items.map((i) => `item-${catId}-${i._id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="overflow-y-auto space-y-2 mb-2">
            {items.map((item) => (
              <SortableItem
                key={item._id}
                item={item}
                catId={catId}
                onToggleConsumable={onToggleConsumable}
                onToggleWorn={onToggleWorn}
                onQuantityChange={onQuantityChange}
                onDelete={handleDeleteClick}
                isListMode={false}
              />
            ))}
          </div>
        </SortableContext>
        {/* ──────────────────────────────────────────────────────────────── */}

        <button
          onClick={() => setShowAddModalCat(catId)}
          className="h-12 p-3 w-full border border-teal rounded flex items-center justify-center space-x-2 bg-sand/70 text-gray-800 hover:bg-sand/90"
        >
          <FaPlus />
          <span className="text-xs">Add Item</span>
        </button>
        {showAddModalCat === catId && (
          <AddGearItemModal
            listId={listId}
            categoryId={catId}
            onClose={() => setShowAddModalCat(null)}
            onAdded={() => fetchItems(catId)}
          />
        )}
      </div>
    );
  }

  const bgstyle = {
    // transform: CSS.Transform.toString(transform),
    // transition,
    backgroundImage: `url(${sierraNevadaBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div style={bgstyle} className="flex flex-col h-full overflow-hidden">
      <h2
        className={
          `pl-10 pt-4 text-2xl font-bold text-sunset ` +
          (viewMode === "list" ? "sm:w-4/5 sm:mx-auto" : "")
        }
      >
        {listName}
      </h2>{" "}
      {/* ───── Wrap everything in one DndContext ───── */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        modifiers={[axisModifier]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={(event) => {
          // 1) Do all the reordering & PATCH calls…
          handleDragEnd(event);

          // 2) Then after the dropAnimation runs, clear the preview
          setTimeout(() => {
            setActiveItem(null);
            setActiveCategory(null);
          }, 300); // <— match this to your dropAnimation.duration
        }}
      >
        {viewMode === "list" ? (
          // ──── LIST MODE ────
          <SortableContext
            // Category‐level SortableContext, items = [ 'cat-<cat1Id>', 'cat-<cat2Id>', … ]
            items={categories.map((c) => `cat-${c._id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex-1 overflow-y-auto px-4 py-2 sm:w-4/5 sm:mx-auto">
              {categories.map((cat) => (
                <SortableSection
                  key={cat._id}
                  category={cat}
                  items={itemsMap[cat._id] || []}
                  editingCatId={editingCatId}
                  setEditingCatId={setEditingCatId}
                  onEditCat={editCat}
                  onDeleteCat={() => handleDeleteCatClick(cat._id)}
                  onToggleConsumable={toggleConsumable}
                  onToggleWorn={toggleWorn}
                  onQuantityChange={updateQuantity}
                  onDeleteItem={handleDeleteClick}
                  showAddModalCat={showAddModalCat}
                  setShowAddModalCat={setShowAddModalCat}
                  fetchItems={fetchItems}
                  listId={listId}
                />
              ))}

              {/* Add New Category button */}
              <div className="px-4 mt-4">
                {addingNewCat ? (
                  <div className="flex items-center bg-sand p-3 rounded-lg space-x-2">
                    <input
                      autoFocus
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Category name"
                      className="flex-1 border border-pine rounded p-2 bg-sand text-pine"
                    />
                    <button onClick={cancelAddCat} className="text-ember">
                      ×
                    </button>
                    <button onClick={confirmAddCat} className="text-teal">
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingNewCat(true)}
                    className="mt-2 px-4 py-2 bg-sand/70 text-gray-800 hover:bg-sand/90 rounded flex items-center"
                  >
                    <FaPlus className="mr-2" /> Add New Category
                  </button>
                )}
              </div>
            </div>
          </SortableContext>
        ) : (
          // ──── COLUMN MODE ────
          <SortableContext
            // Category‐level SortableContext for columns
            items={categories.map((c) => `cat-${c._id}`)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex-1 flex flex-nowrap items-start overflow-x-auto px-4 py-2 snap-x snap-mandatory sm:snap-none">
              {categories.map((cat) => (
                <SortableColumn
                  key={cat._id}
                  category={cat}
                  items={itemsMap[cat._id] || []}
                  editingCatId={editingCatId}
                  setEditingCatId={setEditingCatId}
                  onEditCat={editCat}
                  onDeleteCat={() => handleDeleteCatClick(cat._id)}
                  onToggleConsumable={toggleConsumable}
                  onToggleWorn={toggleWorn}
                  onQuantityChange={updateQuantity}
                  onDeleteItem={handleDeleteClick}
                  showAddModalCat={showAddModalCat}
                  setShowAddModalCat={setShowAddModalCat}
                  fetchItems={fetchItems}
                  listId={listId}
                />
              ))}
              {/* Add New Category column (unchanged) */}
              <div className="snap-center flex-shrink-0 mt-0 mb-0 w-80 sm:w-64 flex flex-col h-full">
                {addingNewCat ? (
                  <div className="bg-sand/20 rounded-lg p-3 flex items-center space-x-2">
                    <input
                      autoFocus
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Category name"
                      className="flex-1 border border-pine rounded p-2 bg-sand text-pine"
                    />
                    <button onClick={cancelAddCat} className="text-ember p-1">
                      ×
                    </button>
                    <button onClick={confirmAddCat} className="text-teal p-1">
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingNewCat(true)}
                    className="mx-2 h-12 p-3 w-full border border-teal rounded flex items-center justify-center space-x-2 bg-sand/70 text-gray-800 hover:bg-sand/90h-12 p-3 w-full border border-pine rounded flex items-center justify-center space-x-2 text-pine hover:bg-sand/20"
                  >
                    <FaPlus />
                    <span className="text-xs">New Category</span>
                  </button>
                )}
              </div>
            </div>
          </SortableContext>
        )}

        {/* ───── DragOverlay for the active item ───── */}
        <DragOverlay
          style={{ pointerEvents: "none", zIndex: 1000 }}
          dropAnimation={{
            duration: 300,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}
        >
          {activeItem ? (
            <PreviewCard item={activeItem.item} viewMode={viewMode} isPreview />
          ) : activeCategory ? (
            <PreviewColumn
              category={activeCategory}
              // pass the array of items currently in that category
              items={itemsMap[activeCategory._id] || []}
            />
          ) : null}
        </DragOverlay>
        <ConfirmDialog
          isOpen={confirmOpen}
          title="Delete this item?"
          message="This action cannot be undone."
          confirmText="Yes, delete"
          cancelText="Cancel"
          onConfirm={actuallyDeleteItem}
          onCancel={cancelDelete}
        />
        <ConfirmDialog
          isOpen={confirmCatOpen}
          title="Delete this category?"
          message="Deleting a category will remove all its items. Proceed?"
          confirmText="Yes, delete"
          cancelText="Cancel"
          onConfirm={actuallyDeleteCat}
          onCancel={cancelDeleteCat}
        />
      </DndContext>
    </div>
  );
}
