// src/pages/GearListView.jsx
import React, { useState, useEffect, useCallback } from "react";
import { FaPlus, FaEllipsisH } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { DragOverlay, closestCorners, pointerWithin } from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DndContextWrapper } from "../components/DndContextWrapper";
import grandcanyonbg from "../assets/grand-canyon-bg.jpeg";
import sierraNevadaBg from "../assets/sierra-nevada-bg.jpeg";
import api from "../services/api";
import ConfirmDialog from "../components/ConfirmDialog";
import PreviewCard from "../components/PreviewCard";
import PreviewColumn from "../components/PreviewColumn";
import PackStats from "../components/PackStats";
import SortableColumn from "../components/SortableColumn";
import SortableSection from "../components/SortableSection";

export default function GearListView({
  listId,
  viewMode,
  list, // the GearList object from Dashboard
  categories, // array of Category
  items, // array of all items
  onRefresh,
  onReorderCategories,
}) {
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
  const [itemsMap, setItemsMap] = useState({});

  // NEW: auto-group every time `items` changes
  useEffect(() => {
    const map = {};
    items.forEach((it) => {
      map[it.category] = map[it.category] || [];
      map[it.category].push(it);
    });
    setItemsMap(map);
  }, [items]);

  const fetchItems = async (catId) => {
    const { data } = await api.get(
      `/lists/${listId}/categories/${catId}/items`
    );
    setItemsMap((m) => ({ ...m, [catId]: data }));
  };

  const stats = React.useMemo(() => computeStats(itemsMap), [itemsMap]);

  // flatten ALL items into one array
  const allItems = Object.values(itemsMap).flat();

  // split them into the four buckets
  const baseItems = allItems.filter((i) => !i.worn && !i.consumable);
  const wornItems = allItems.filter((i) => i.worn);
  const consumableItems = allItems.filter((i) => i.consumable);
  // “total” is just everything
  const totalItems = allItems;

  // build the breakdowns object
  const breakdowns = {
    base: baseItems,
    worn: wornItems,
    consumable: consumableItems,
    total: totalItems,
  };

  function computeStats(itemsMap) {
    const all = Object.values(itemsMap).flat();
    const wornWeight = all
      .filter((i) => i.worn)
      .reduce((sum, i) => sum + (i.weight || 0) * (i.quantity || 1), 0);
    const consumableWeight = all
      .filter((i) => i.consumable)
      .reduce((sum, i) => sum + (i.weight || 0) * (i.quantity || 1), 0);
    const baseWeight = all
      .filter((i) => !i.worn && !i.consumable)
      .reduce((sum, i) => sum + (i.weight || 0) * (i.quantity || 1), 0);
    return {
      baseWeight,
      wornWeight,
      consumableWeight,
      totalWeight: baseWeight + wornWeight + consumableWeight,
    };
  }

  // Lifted‐up handlers for SortableItem
  const handleToggleWorn = useCallback((catId, itemId, newWorn) => {
    setItemsMap((m) => ({
      ...m,
      [catId]: m[catId].map((i) =>
        i._id === itemId ? { ...i, worn: newWorn } : i
      ),
    }));
  }, []);

  const handleToggleConsumable = useCallback((catId, itemId, newConsumable) => {
    setItemsMap((m) => ({
      ...m,
      [catId]: m[catId].map((i) =>
        i._id === itemId ? { ...i, consumable: newConsumable } : i
      ),
    }));
  }, []);

  const handleQuantityChange = useCallback(
    async (catId, itemId, newQty) => {
      // 1) Optimistic update
      setItemsMap((m) => ({
        ...m,
        [catId]: m[catId].map((i) =>
          i._id === itemId ? { ...i, quantity: newQty } : i
        ),
      }));

      try {
        // 2) Patch the server
        await api.patch(
          `/lists/${listId}/categories/${catId}/items/${itemId}`,
          {
            quantity: newQty,
          }
        );

        // 3) Re-fetch the full list so totalWeight (and any other derived data) is correct
        await fetchItems(catId);
      } catch (err) {
        // 4) Rollback on error
        toast.error(err.message || "Failed to update quantity");
        fetchItems(catId);
      }
    },
    [fetchItems, listId]
  );

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
      await api.post(`/lists/${listId}/categories`, {
        title,
        position: categories.length,
      });
      // pull it down again
      await onRefresh();
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

      // re-sync our entire `fullData` (including categories & items)
      await onRefresh();

      toast.success("Category deleted");
    } catch (err) {
      console.error(err);
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
      await api.patch(`/lists/${listId}/categories/${id}`, { title: newTitle });
      // re-pull the entire payload (list, cats, items)
      await onRefresh();
      setEditingCatId(null);
      toast.success("Category renamed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to rename category");
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;

    // ─── CATEGORY REORDER ───
    if (active.id.startsWith("cat-") && over.id.startsWith("cat-")) {
      const oldIndex = categories.findIndex(
        (c) => `cat-${c._id}` === active.id
      );
      const newIndex = categories.findIndex((c) => `cat-${c._id}` === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // Build the new ordered array
        const reordered = arrayMove(categories, oldIndex, newIndex).map(
          (catObj, idx) => ({ ...catObj, position: idx })
        );

        // Delegate to Dashboard: optimistic UI + persist
        await onReorderCategories(categories, reordered);
      }
      return;
    }

    // ─── ITEM REORDER WITHIN SAME CATEGORY ───
    if (active.id.startsWith("item-") && over.id.startsWith("item-")) {
      const [, sourceCatId, sourceItemId] = active.id.split("-");
      const [, destCatId, destItemId] = over.id.split("-");

      // same-category reorder
      if (sourceCatId === destCatId) {
        const oldArray = itemsMap[sourceCatId] || [];
        const oldIndex = oldArray.findIndex((i) => i._id === sourceItemId);
        const newIndex = oldArray.findIndex((i) => i._id === destItemId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(oldArray, oldIndex, newIndex).map(
            (it, idx) => ({ ...it, position: idx })
          );

          // update UI immediately
          setItemsMap((m) => ({ ...m, [sourceCatId]: reordered }));

          // persist each item’s new position
          for (let i = 0; i < reordered.length; i++) {
            const it = reordered[i];
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
        return;
      }

      // ─── ITEM MOVED TO A DIFFERENT CATEGORY ───
      const sourceArr = itemsMap[sourceCatId] || [];
      const destArr = itemsMap[destCatId] || [];
      const removedIdx = sourceArr.findIndex((i) => i._id === sourceItemId);
      const insertedIdx = destArr.findIndex((i) => i._id === destItemId);

      if (removedIdx !== -1 && insertedIdx !== -1) {
        const movedItem = sourceArr[removedIdx];
        const newSource = sourceArr
          .filter((i) => i._id !== sourceItemId)
          .map((it, idx) => ({ ...it, position: idx }));
        const newDest = [
          ...destArr.slice(0, insertedIdx),
          movedItem,
          ...destArr.slice(insertedIdx),
        ].map((it, idx) => ({
          ...it,
          position: idx,
          category: it._id === movedItem._id ? destCatId : it.category,
        }));
        setItemsMap((m) => ({
          ...m,
          [sourceCatId]: newSource,
          [destCatId]: newDest,
        }));

        // 1) update moved item's category + position
        await api.patch(
          `/lists/${listId}/categories/${sourceCatId}/items/${sourceItemId}`,
          {
            category: destCatId,
            position: newDest.find((i) => i._id === sourceItemId).position,
          }
        );
        // 2) reindex source siblings
        for (let i = 0; i < newSource.length; i++) {
          const it = newSource[i];
          if (
            it.position !== sourceArr.find((x) => x._id === it._id).position
          ) {
            await api.patch(
              `/lists/${listId}/categories/${sourceCatId}/items/${it._id}`,
              { position: i }
            );
          }
        }
        // 3) reindex dest siblings
        for (let i = 0; i < newDest.length; i++) {
          const it = newDest[i];
          if (
            it._id !== sourceItemId &&
            it.position !== destArr.find((x) => x._id === it._id).position
          ) {
            await api.patch(
              `/lists/${listId}/categories/${destCatId}/items/${it._id}`,
              { position: i }
            );
          }
        }
      }
      return;
    }

    // ─── DROP INTO EMPTY CATEGORY ───
    if (active.id.startsWith("item-") && over.id.startsWith("cat-")) {
      const [, sourceCatId, sourceItemId] = active.id.split("-");
      const destCatId = over.id.replace("cat-", "");
      if (sourceCatId === destCatId) return;

      const sourceArr = itemsMap[sourceCatId] || [];
      const destArr = itemsMap[destCatId] || [];
      const removedIdx = sourceArr.findIndex((i) => i._id === sourceItemId);
      if (removedIdx === -1) return;

      const movedItem = sourceArr[removedIdx];
      const newSource = sourceArr
        .filter((i) => i._id !== sourceItemId)
        .map((it, idx) => ({ ...it, position: idx }));
      const newDest = [...destArr, movedItem].map((it, idx) => ({
        ...it,
        position: idx,
        category: it._id === movedItem._id ? destCatId : it.category,
      }));
      setItemsMap((m) => ({
        ...m,
        [sourceCatId]: newSource,
        [destCatId]: newDest,
      }));

      // persist
      await api.patch(
        `/lists/${listId}/categories/${sourceCatId}/items/${sourceItemId}`,
        {
          category: destCatId,
          position: newDest.length - 1,
        }
      );
      for (let i = 0; i < newSource.length; i++) {
        const it = newSource[i];
        if (it.position !== sourceArr.find((x) => x._id === it._id).position) {
          await api.patch(
            `/lists/${listId}/categories/${sourceCatId}/items/${it._id}`,
            { position: i }
          );
        }
      }
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

  const axisModifier = (args) => {
    const { active, transform } = args;

    // 1) If there's no active draggable, or if it's an item, just return the raw transform:
    if (!active || !active.id || active.id.startsWith("item-")) {
      return transform;
    }

    // 2) If we're in column mode and dragging a category, lock X:
    if (viewMode === "column" && active.id.startsWith("cat-")) {
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

  const bgstyle = {
    backgroundImage: `url(${sierraNevadaBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div style={bgstyle} className="flex flex-col h-full overflow-hidden">
      <div
        className={
          `flex justify-between items-center px-6 py-4 ` +
          (viewMode === "list" ? "sm:w-4/5 sm:mx-auto" : "")
        }
      >
        <div className="flex items-center space-x-4">
          <h2 className="hide-on-touch text-xl text-primaryAlt">
            {list.title}
          </h2>
          <PackStats
            base={stats.baseWeight}
            worn={stats.wornWeight}
            consumable={stats.consumableWeight}
            total={stats.totalWeight}
            breakdowns={breakdowns}
          />
        </div>
        {/* make the link a flex container too */}
        <a
          href="#"
          className="inline-flex items-center justify-center text-l text-accent hover:text-accent-dark leading-none"
          aria-label="More options"
        >
          <FaEllipsisH />
        </a>
      </div>

      {/* ───── Wrap everything in one DndContextWrapper ───── */}
      <DndContextWrapper
        items={categories.map((c) => `cat-${c._id}`)}
        strategy={
          viewMode === "list"
            ? verticalListSortingStrategy
            : horizontalListSortingStrategy
        }
        onDragStart={handleDragStart}
        onDragEnd={(event) => {
          handleDragEnd(event);
          // clear previews after dropAnimation
          setTimeout(() => {
            setActiveItem(null);
            setActiveCategory(null);
          }, 300);
        }}
        collisionDetection={collisionDetectionStrategy}
        modifiers={[axisModifier]}
        renderDragOverlay={() => (
          <DragOverlay
            style={{ pointerEvents: "none", zIndex: 1000 }}
            dropAnimation={{
              duration: 300,
              easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
            }}
          >
            {activeItem ? (
              <PreviewCard
                item={activeItem.item}
                viewMode={viewMode}
                isPreview
              />
            ) : activeCategory ? (
              <PreviewColumn
                category={activeCategory}
                items={itemsMap[activeCategory._id] || []}
              />
            ) : null}
          </DragOverlay>
        )}
      >
        {viewMode === "list" ? (
          <div className="flex-1 overflow-y-auto px-4 pb-2 sm:w-4/5 sm:mx-auto">
            {categories.map((cat) => (
              <SortableSection
                key={cat._id}
                category={cat}
                items={itemsMap[cat._id] || []}
                /* editing a category */
                editingCatId={editingCatId}
                setEditingCatId={setEditingCatId}
                onEditCat={(newTitle) => editCat(cat._id, newTitle)}
                /* delete a category */
                onDeleteCategory={handleDeleteCatClick}
                /* “Add Item” modal */
                showAddModalCat={showAddModalCat}
                setShowAddModalCat={setShowAddModalCat}
                /* re-loading an individual category */
                fetchItems={fetchItems}
                listId={listId}
                /* item-level actions */
                onDeleteItem={handleDeleteClick}
                onToggleWorn={handleToggleWorn}
                onToggleConsumable={handleToggleConsumable}
                onQuantityChange={handleQuantityChange}
                /* layout */
                viewMode={viewMode}
              />
            ))}
            {/* Add New Category button */}
            <div className="px-4 mt-4">
              {addingNewCat ? (
                <input
                  autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New category (Enter to save, Escape to cancel)"
                  className="w-full p-2 border-b-2 border-accent focus:outline-none bg-neutral text-primary rounded"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmAddCat();
                    if (e.key === "Escape") cancelAddCat();
                  }}
                  onBlur={() => {
                    if (newCatName.trim()) confirmAddCat();
                    else cancelAddCat();
                  }}
                />
              ) : (
                <button
                  onClick={() => setAddingNewCat(true)}
                  className="h-12 p-3 w-full border border-secondary rounded flex items-center justify-center space-x-2 bg-base-100 text-primary hover:bg-base-100/80"
                >
                  <FaPlus />
                  <span className="text-xs">New Category</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-nowrap items-start overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:snap-none">
            {categories.map((cat) => (
              <SortableColumn
                key={cat._id}
                category={cat}
                items={itemsMap[cat._id] || []}
                /* editing a category */
                editingCatId={editingCatId}
                setEditingCatId={setEditingCatId}
                onEditCat={(newTitle) => editCat(cat._id, newTitle)}
                /* delete a category */
                onDeleteCategory={handleDeleteCatClick}
                /* “Add Item” modal */
                showAddModalCat={showAddModalCat}
                setShowAddModalCat={setShowAddModalCat}
                /* re-loading an individual category */
                fetchItems={fetchItems}
                listId={listId}
                /* item-level actions */
                onDeleteItem={handleDeleteClick}
                onToggleWorn={handleToggleWorn}
                onToggleConsumable={handleToggleConsumable}
                onQuantityChange={handleQuantityChange}
                /* layout */
                viewMode={viewMode}
              />
            ))}
            {/* Add New Category column */}
            <div className="snap-center flex-shrink-0 mt-0 mb-0 w-80 sm:w-64 flex flex-col h-full px-4">
              {addingNewCat ? (
                <div className="py-3">
                  <input
                    autoFocus
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="New category (Enter to save, Escape to cancel)"
                    className="w-full p-2 border-b-2 border-accent focus:outline-none bg-neutral text-primary rounded"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmAddCat();
                      if (e.key === "Escape") cancelAddCat();
                    }}
                    onBlur={() => {
                      if (newCatName.trim()) confirmAddCat();
                      else cancelAddCat();
                    }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setAddingNewCat(true)}
                  className="h-12 p-3 w-full border border-secondary rounded flex items-center justify-center space-x-2 bg-base-100 text-primary hover:bg-base-100/80"
                >
                  <FaPlus />
                  <span className="text-xs">New Category</span>
                </button>
              )}
            </div>
          </div>
        )}
      </DndContextWrapper>
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Remove this item?"
        confirmText="Yes, remove"
        cancelText="Cancel"
        onConfirm={actuallyDeleteItem}
        onCancel={cancelDelete}
      />
      <ConfirmDialog
        isOpen={confirmCatOpen}
        title="Delete this category?"
        message="Deleting a category will remove all its items."
        confirmText="Yes, delete"
        cancelText="Cancel"
        onConfirm={actuallyDeleteCat}
        onCancel={cancelDeleteCat}
      />
    </div>
  );
}
