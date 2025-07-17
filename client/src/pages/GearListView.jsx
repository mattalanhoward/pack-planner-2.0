// src/pages/GearListView.jsx
import React, { useState, useEffect, useCallback } from "react";
import { FaPlus, FaEllipsisH, FaCheck, FaSpinner } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
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
import api from "../services/api";
import DropdownMenu from "../components/DropdownMenu";
import ConfirmDialog from "../components/ConfirmDialog";
import GearListDetailsModal from "../components/GearListDetailsModal";
import PreviewCard from "../components/PreviewCard";
import PreviewColumn from "../components/PreviewColumn";
import PackStats from "../components/PackStats";
import SortableColumn from "../components/SortableColumn";
import SortableSection from "../components/SortableSection";
import { GEARLIST_SWATCHES as swatches } from "../config/colors";
import { defaultBackgrounds } from "../config/defaultBackgrounds";

export default function GearListView({
  listId,
  viewMode,
  list, // the GearList object from Dashboard
  categories, // array of Category
  items, // array of all items
  onRefresh,
  onReorderCategories,
  fetchLists,
  collapsed,
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
  // For inline‐title editing:
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(list.title);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // ⚡️ Optimistic UI for background color
  const [bgColor, setBgColor] = useState(list.backgroundColor);
  const [bgImage, setBgImage] = useState(list.backgroundImageUrl);

  useEffect(() => {
    setBgImage(list.backgroundImageUrl);
  }, [list.backgroundImageUrl]);

  useEffect(() => {
    setBgColor(list.backgroundColor);
  }, [list.backgroundColor]);

  useEffect(() => setTitleText(list.title), [list.title]);

  // For delete‐list confirmation:
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
  const navigate = useNavigate();

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
      `/dashboard/${listId}/categories/${catId}/items`
    );
    setItemsMap((m) => ({ ...m, [catId]: data }));
  };

  const stats = React.useMemo(() => computeStats(itemsMap), [itemsMap]);

  // flatten ALL items into one array
  const allItems = Object.values(itemsMap).flat();

  // count & cost
  const itemsCount = allItems.length;
  const totalCost = allItems.reduce(
    (sum, i) => sum + (parseFloat(i.price) || 0) * (i.quantity || 1),
    0
  );

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
    let baseWeight = 0;
    let wornWeight = 0;
    let consumableWeight = 0;

    Object.values(itemsMap)
      .flat()
      .forEach((item) => {
        const w = item.weight || 0;
        const qty = item.quantity || 1;

        if (item.consumable) {
          // all of these go into consumableWeight
          consumableWeight += w * qty;
        } else if (item.worn) {
          // exactly one counts as “worn”
          wornWeight += w;
          // extras go back into base
          if (qty > 1) {
            baseWeight += w * (qty - 1);
          }
        } else {
          // pure base items
          baseWeight += w * qty;
        }
      });

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
          `/dashboard/${listId}/categories/${catId}/items/${itemId}`,
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
      await api.delete(
        `/dashboard/${listId}/categories/${catId}/items/${itemId}`
      );
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

  const cancelDeleteItem = () => {
    setConfirmOpen(false);
    setPendingDelete({ catId: null, itemId: null });
  };

  // — add category —
  const confirmAddCat = async () => {
    const title = newCatName.trim();
    if (!title) return;

    try {
      await api.post(`/dashboard/${listId}/categories`, {
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
      await api.delete(`/dashboard/${listId}/categories/${catId}`);

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
      await api.patch(`/dashboard/${listId}/categories/${id}`, {
        title: newTitle,
      });
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
                `/dashboard/${listId}/categories/${sourceCatId}/items/${it._id}`,
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
          `/dashboard/${listId}/categories/${sourceCatId}/items/${sourceItemId}`,
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
              `/dashboard/${listId}/categories/${sourceCatId}/items/${it._id}`,
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
              `/dashboard/${listId}/categories/${destCatId}/items/${it._id}`,
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
        `/dashboard/${listId}/categories/${sourceCatId}/items/${sourceItemId}`,
        {
          category: destCatId,
          position: newDest.length - 1,
        }
      );
      for (let i = 0; i < newSource.length; i++) {
        const it = newSource[i];
        if (it.position !== sourceArr.find((x) => x._id === it._id).position) {
          await api.patch(
            `/dashboard/${listId}/categories/${sourceCatId}/items/${it._id}`,
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

  // Rename list
  const handleTitleSubmit = async () => {
    const trimmed = titleText.trim();
    if (!trimmed) {
      setTitleText(list.title);
      return setIsEditingTitle(false);
    }
    try {
      await api.patch(`/dashboard/${listId}`, { title: trimmed });
      toast.success("List renamed");
      onRefresh();
      fetchLists();
    } catch (err) {
      toast.error(err.message || "Rename failed");
      setTitleText(list.title);
    } finally {
      setIsEditingTitle(false);
    }
  };

  const handleImageUpload = async (e) => {
    e.stopPropagation();
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFileName(file.name);

    if (file.size > MAX_SIZE) {
      toast.error("Please select an image under 5 MB.");
      return;
    }
    const fd = new FormData();
    fd.append("image", file);

    setIsUploading(true);
    try {
      await api.post(`/dashboard/${listId}/preferences/image`, fd);
      toast.success("Background image updated");
      await onRefresh();
    } catch (err) {
      if (err.response?.status === 413) {
        toast.error("Image is too large. Please pick one under 5 MB.");
      } else {
        toast.error(err.message || "Upload failed");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleColorSelect = async (color) => {
    // 1️⃣ stash old value
    const previous = bgColor;

    // 2️⃣ flip it immediately
    setBgColor(color);

    try {
      // 3️⃣ send to server
      await api.patch(`/dashboard/${listId}/preferences`, {
        backgroundColor: color,
      });
      // toast.success("Background updated");
      // 4️⃣ optional full re‑sync
      onRefresh();
    } catch (err) {
      // 5️⃣ revert on failure
      setBgColor(previous);
      toast.error(err.message || "Update failed");
    }
  };

  // user picks one of the default background images
  const handleDefaultBackgroundSelect = async (url) => {
    // 1️⃣ Keep the old value so we can roll back on failure
    const previousImage = bgImage;

    // 2️⃣ Optimistically update the UI
    setBgImage(url);

    try {
      // 3️⃣ Send the change to the server
      await api.patch(`/dashboard/${listId}/preferences`, {
        backgroundImageUrl: url,
      });
      // toast.success("Background updated");
      // 4️⃣ (Optional) re‑fetch any other updated data
      onRefresh();
    } catch (error) {
      // 5️⃣ Roll back if something goes wrong
      setBgImage(previousImage);
      toast.error(error.message || "Update failed");
    }
  };

  // Copy list
  const handleCopyList = async () => {
    try {
      const { data } = await api.post(`/dashboard/${listId}/copy`);
      toast.success("List copied");
      fetchLists(); // refresh sidebar (you’ll need to pass fetchLists in as a prop)
      localStorage.setItem("lastListId", data.list._id);
      navigate(`/dashboard/${data.list._id}`);
    } catch (err) {
      toast.error(err.message || "Copy failed");
    }
  };

  // Share list (placeholder)
  const handleShareList = () => {
    toast("Share feature coming soon");
  };

  // Checklist (placeholder)
  const handleCheckList = () => {
    toast("Checklist feature coming soon");
  };

  // Delete list
  const openDeleteListConfirm = () => setConfirmDeleteOpen(true);
  const cancelDeleteList = () => setConfirmDeleteOpen(false);
  const actuallyDeleteList = async () => {
    try {
      await api.delete(`/dashboard/${listId}`);
      toast.success("List deleted");
      fetchLists();
      cancelDeleteList();
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  // Gradient overlay definition
  const overlay = "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3))";

  // Dynamic style based on list prefs, with gradient on top of color
  const bgstyle =
    bgImage || list.backgroundImageUrl
      ? {
          // no overlay when using an image
          backgroundImage: `url(${bgImage || list.backgroundImageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : bgColor
      ? {
          // when using only a color, you can keep your overlay if you like:
          backgroundColor: bgColor,
          backgroundImage: overlay,
        }
      : {};

  const headerPadding =
    viewMode === "list"
      ? "pl-6 sm:w-4/5 sm:mx-auto"
      : collapsed
      ? "pl-0 sm:pl-15"
      : "pl-0 sm:pl-6";

  return (
    <div style={bgstyle} className="flex flex-col h-full overflow-hidden">
      {/* 1) full-page spinner overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <FaSpinner className="animate-spin text-white text-4xl" />
        </div>
      )}
      <div className="w-full bg-black bg-opacity-25">
        <div
          className={[
            "flex justify-between items-center pr-6 py-2",
            headerPadding,
          ].join(" ")}
        >
          {/* Title + stats, inline-editable */}
          <div
            className="flex-1 flex items-center justify-center space-x-4
+                          sm:flex-none sm:justify-start"
          >
            {" "}
            {isEditingTitle ? (
              <input
                type="text"
                value={titleText}
                autoFocus
                onChange={(e) => setTitleText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSubmit();
                  if (e.key === "Escape") {
                    setTitleText(list.title);
                    setIsEditingTitle(false);
                  }
                }}
                onBlur={handleTitleSubmit}
                className="hide-on-touch text-xl text-accent bg-transparent border-b border-accent focus:outline-none"
              />
            ) : (
              <>
                <h2
                  onClick={() => setIsEditingTitle(true)}
                  className="hide-on-touch text-xl text-accent"
                >
                  {list.title}
                </h2>
                <PackStats
                  base={stats.baseWeight}
                  worn={stats.wornWeight}
                  consumable={stats.consumableWeight}
                  total={stats.totalWeight}
                  breakdowns={breakdowns}
                />{" "}
              </>
            )}
          </div>
          {/* Ellipsis menu */}
          <DropdownMenu
            trigger={
              <button
                className="inline-flex items-center justify-center text-l text-accent hover:text-accent-dark leading-none"
                aria-label="List options"
              >
                <FaEllipsisH />
              </button>
            }
            menuWidth="w-56"
            items={[
              {
                key: "header-prefs",
                render: () => (
                  <div className="text-xs font-semibold text-primary uppercase">
                    Gear List Preferences
                  </div>
                ),
              },

              {
                key: "bg-presets",
                render: () => (
                  <div onClick={(e) => e.stopPropagation()}>
                    <div className="block text-sm text-primary mb-1">
                      Background
                    </div>
                    <div className="block text-sm text-secondary mb-1">
                      Images
                      <div className="grid grid-cols-4 gap-2 mt-2 mx-auto w-full max-w-xs">
                        {defaultBackgrounds.map(({ key, url }) => (
                          <button
                            key={key}
                            onClick={() => handleDefaultBackgroundSelect(url)}
                            className={
                              `w-10 h-10 bg-cover bg-center rounded ` +
                              (bgImage === url
                                ? "ring-2 ring-secondary"
                                : "ring-1 ring-transparent hover:ring-gray-300")
                            }
                            style={{ backgroundImage: `url(${url})` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: "file-upload",
                render: () => (
                  <div onClick={(e) => e.stopPropagation()}>
                    <label className="inline-flex items-center px-3 py-1 bg-base-100 border rounded cursor-pointer text-sm">
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                    {!bgImage && (
                      <p className="text-xs text-secondary mt-2">
                        {selectedFileName || "No file chosen"}
                      </p>
                    )}
                  </div>
                ),
              },
              {
                key: "color-swatches",
                render: () => (
                  <div onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="block text-sm text-secondary mb-1">
                      Colors
                    </div>
                    {/* Swatches Grid */}
                    <div className="grid grid-cols-4 gap-2 place-items-center mt-2">
                      {swatches.map(({ key, value, class: cls }) => (
                        <div key={key} className="relative group">
                          <button
                            onClick={() => handleColorSelect(value)}
                            className={`${cls} w-6 h-6 rounded-full flex items-center justify-center p-0`}
                          >
                            {bgColor === value && (
                              <FaCheck className="text-white text-xs" />
                            )}
                          </button>
                          {/* tooltip */}
                          <span
                            className="
         absolute 
         bottom-full 
         left-1/2 
         transform -translate-x-1/2 
         mb-1 
         px-2 py-0.5 
         text-xs 
         text-white 
         bg-black bg-opacity-75 
         rounded 
         opacity-0 
         pointer-events-none 
         group-hover:opacity-100 
         transition-opacity
       "
                          >
                            {key}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                key: "sep-1",
                render: () => <div className="border-t border-gray-200 my-2" />,
              },
              {
                key: "details",
                label: "View / Edit details",
                onClick: () => setShowDetailsModal(true),
              },
              {
                key: "checklist",
                label: "View as Checklist",
                onClick: handleCheckList,
              },
              { key: "copy", label: "Copy gear list", onClick: handleCopyList },
              {
                key: "share",
                label: "Share gear list",
                onClick: handleShareList,
              },
              {
                key: "delete",
                label: "Delete gear list",
                onClick: openDeleteListConfirm,
                className: "text-error",
              },
            ]}
          />
        </div>
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
          <div className="flex-1 overflow-y-auto px-2 py-2 sm:w-4/5 sm:mx-auto">
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
          <div className="flex-1 flex flex-nowrap items-start overflow-x-auto px-2 py-2 snap-x snap-mandatory sm:snap-none">
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
            <div className="snap-center flex-shrink-0 mt-0 mb-0 w-90 sm:w-64 flex flex-col h-full px-2">
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
      <GearListDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        list={list}
        breakdowns={breakdowns}
        itemsCount={itemsCount}
        totalCost={totalCost}
        onRefresh={onRefresh}
        onRefreshSidebar={fetchLists}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Remove this item?"
        confirmText="Yes, remove"
        cancelText="Cancel"
        onConfirm={actuallyDeleteItem}
        onCancel={cancelDeleteItem}
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

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title={`Delete the ${list.title} gear list?`}
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={actuallyDeleteList}
        onCancel={cancelDeleteList}
      />
    </div>
  );
}
