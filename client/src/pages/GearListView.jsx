// src/pages/GearListView.jsx
import React, { useState, useEffect } from "react";
import api from "../services/api";
import { DragOverlay, closestCorners, pointerWithin } from "@dnd-kit/core";
import {
  restrictToHorizontalAxis,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
  SortableContext,
} from "@dnd-kit/sortable";
import { DndContextWrapper } from "../components/DndContextWrapper";

import { CSS } from "@dnd-kit/utilities";
import grandcanyonbg from "../assets/grand-canyon-bg.jpeg";
import sierraNevadaBg from "../assets/sierra-nevada-bg.jpeg";

import { FaGripVertical, FaTrash, FaPlus, FaEllipsisH } from "react-icons/fa";
import AddGearItemModal from "../components/AddGearItemModal";
import { toast } from "react-hot-toast";
import ConfirmDialog from "../components/ConfirmDialog";
import SortableItem from "../components/SortableItem";
import PreviewCard from "../components/PreviewCard";
import PreviewColumn from "../components/PreviewColumn"; // (or wherever you placed that inline component)
import PackStats from "../components/StatWithDetails";

export default function GearListView({
  listId,
  refreshToggle,
  templateToggle,
  renameToggle,
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
  // — fetch list title —
  useEffect(() => {
    if (!listId) return;
    (async () => {
      const { data } = await api.get("/lists");
      const found = data.find((l) => l._id === listId);
      setListName(found?.title || "");
    })();
  }, [listId, renameToggle]);

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

  // - Calculate total weights -
  // This is done after all items are loaded, so we can calculate totals correctly.
  // flatten into one array (or empty array if nothing’s loaded yet)
  const all = Object.values(itemsMap).flat();

  // sum up “worn” items
  const wornWeight = all
    .filter((i) => i.worn)
    .reduce((sum, i) => {
      const qty = i.quantity || 1;
      const w = i.weight || 0;
      return sum + w * qty;
    }, 0);

  // sum up “consumable” items
  const consumableWeight = all
    .filter((i) => i.consumable)
    .reduce((sum, i) => {
      const qty = i.quantity || 1;
      const w = i.weight || 0;
      return sum + w * qty;
    }, 0);

  // sum up “base” (neither worn nor consumable)
  const baseWeight = all
    .filter((i) => !i.worn && !i.consumable)
    .reduce((sum, i) => {
      const qty = i.quantity || 1;
      const w = i.weight || 0;
      return sum + w * qty;
    }, 0);

  // grand total
  const totalWeight = wornWeight + consumableWeight + baseWeight;

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

  const handleDragEnd = async ({ active, over }) => {
    // if dropped outside any valid drop target, do nothing
    if (!over) return;

    // ─── CATEGORY REORDER ───
    if (active.id.startsWith("cat-") && over.id.startsWith("cat-")) {
      const oldIndex = categories.findIndex(
        (c) => `cat-${c._id}` === active.id
      );
      const newIndex = categories.findIndex((c) => `cat-${c._id}` === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(categories, oldIndex, newIndex).map(
          (catObj, idx) => ({ ...catObj, position: idx })
        );
        // update UI immediately
        setCategories(reordered);

        // persist positions
        const oldPositions = Object.fromEntries(
          categories.map((c) => [c._id, c.position])
        );
        for (let i = 0; i < reordered.length; i++) {
          const { _id, position } = reordered[i];
          if (oldPositions[_id] !== position) {
            await api.patch(`/lists/${listId}/categories/${_id}/position`, {
              position,
            });
          }
        }
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
          setItemsMap((m) => ({
            ...m,
            [sourceCatId]: reordered,
          }));

          // persist item positions
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

    // const displayItems = React.useMemo(() => {
    //   if (dragOver.catId !== category._id) return items;
    //   const base = [...filtered];
    //   base.splice(dragOver.index, 0, {
    //     _id: "placeholder",
    //     isPlaceholder: true,
    //   });
    //   return base;
    // }, [filtered, dragOver, category._id]);

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
            className="hide-on-touch mr-2 cursor-grab text-sunset"
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
                className="flex-1 text-sunset cursor-text flex items-baseline justify-between pr-4"
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
            {items.map((item) => (
              <SortableItem
                fetchItems={fetchItems}
                listId={listId}
                key={item._id}
                item={item}
                catId={catId}
                onDelete={handleDeleteClick}
                isListMode={viewMode === "list"}
              />
            ))}
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
        <div className="flex items-center mb-2 ">
          <FaGripVertical
            {...attributes}
            {...listeners}
            className="hide-on-touch mr-2 cursor-grab text-sunset"
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
                className="flex-1 text-sunset cursor-text flex items-baseline justify-between pr-4"
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
                fetchItems={fetchItems}
                listId={listId}
                key={item._id}
                item={item}
                catId={catId}
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
      <div
        className={
          `flex justify-between items-center px-6 py-4 ` +
          (viewMode === "list" ? "sm:w-4/5 sm:mx-auto" : "")
        }
      >
        <div className="flex items-center space-x-4">
          <h2 className="hide-on-touch text-xl text-sunset">{listName}</h2>
          <PackStats
            base={baseWeight}
            worn={wornWeight}
            consumable={consumableWeight}
            total={totalWeight}
            breakdowns={breakdowns}
          />
        </div>
        {/* make the link a flex container too */}
        <a
          href="#"
          className="inline-flex items-center justify-center text-l text-sunset hover:text-sunset-dark leading-none"
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
                editingCatId={editingCatId}
                setEditingCatId={setEditingCatId}
                onEditCat={editCat}
                onDeleteCat={() => handleDeleteCatClick(cat._id)}
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
        ) : (
          <div className="flex-1 flex flex-nowrap items-start overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:snap-none">
            {categories.map((cat) => (
              <SortableColumn
                key={cat._id}
                category={cat}
                items={itemsMap[cat._id] || []}
                editingCatId={editingCatId}
                setEditingCatId={setEditingCatId}
                onEditCat={editCat}
                onDeleteCat={() => handleDeleteCatClick(cat._id)}
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
        )}
      </DndContextWrapper>
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
    </div>
  );
}
