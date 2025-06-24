import React, { useState } from "react";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaGripVertical, FaTrash, FaPlus } from "react-icons/fa";
import SortableItem from "../components/SortableItem";
import AddGearItemModal from "../components/AddGearItemModal";
import { useScrollPreserver } from "../hooks/useScrollPreserver";

// Rename the impl function so we can memoize it
function SortableColumnImpl({
  category,
  items,
  editingCatId,
  setEditingCatId,
  onEditCat,
  handleDeleteCatClick,
  showAddModalCat,
  setShowAddModalCat,
  fetchItems,
  listId,
  viewMode,
  handleDeleteClick,
  handleToggleWorn,
  handleToggleConsumable,
  handleQuantityChange,
}) {
  const scrollRef = useScrollPreserver(items);
  const catId = category._id;
  const [localTitle, setLocalTitle] = useState(category.title);

  const totalWeight = items.reduce((sum, i) => {
    const qty = i.quantity || 1;
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
          className="hide-on-touch mr-2 cursor-grab text-sunset"
        />
        {editingCatId === catId ? (
          <input
            autoFocus
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={() => {
              setEditingCatId(null);
              onEditCat(catId, localTitle);
            }}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="flex-1 border border-pine rounded p-1 bg-sand"
          />
        ) : (
          <>
            <h3
              onClick={() => {
                setEditingCatId(catId);
                setLocalTitle(category.title);
              }}
              className="flex-1 text-sunset cursor-text flex items-baseline justify-between pr-4"
            >
              {category.title}
            </h3>
            <span className="pr-3 text-sunset">{totalWeight} g</span>
            <FaTrash
              onClick={() => handleDeleteCatClick(catId)}
              className="cursor-pointer text-ember"
            />
          </>
        )}
      </div>

      <SortableContext
        items={items.map((i) => `item-${catId}-${i._id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={scrollRef} className="overflow-y-auto mb-2 space-y-2">
          {items.map((item) => (
            <SortableItem
              key={item._id}
              fetchItems={fetchItems}
              listId={listId}
              item={item}
              catId={catId}
              onDelete={handleDeleteClick}
              isListMode={viewMode === "list"}
              onToggleWorn={handleToggleWorn}
              onToggleConsumable={handleToggleConsumable}
              onQuantityChange={handleQuantityChange}
            />
          ))}
        </div>
      </SortableContext>

      <button
        onClick={() => setShowAddModalCat(catId)}
        className="h-12 p-3 w-full border border-teal rounded flex items-center justify-center space-x-2 bg-sand/70 text-gray-800 hover:bg-sand/90h-12 p-3 w-full border rounded flex items-center justify-center"
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

// 2) Module-level comparator
function columnPropsAreEqual(prev, next) {
  // category or length changed?
  if (prev.category._id !== next.category._id) return false;
  if (prev.items.length !== next.items.length) return false;

  for (let i = 0; i < prev.items.length; i++) {
    const a = prev.items[i];
    const b = next.items[i];
    // also compare quantity now!
    if (a._id !== b._id || a.quantity !== b.quantity) return false;
  }

  // and still re-render if the “add item” modal toggles
  const wasOpen = prev.showAddModalCat === prev.category._id;
  const willOpen = next.showAddModalCat === next.category._id;
  if (wasOpen !== willOpen) return false;

  return true; // everything else equal → skip render
}

// 3) Export the memoized version
export const SortableColumn = React.memo(
  SortableColumnImpl,
  columnPropsAreEqual
);
