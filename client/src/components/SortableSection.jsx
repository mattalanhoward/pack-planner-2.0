import React, { useState, useMemo } from "react";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaGripVertical, FaTrash, FaPlus } from "react-icons/fa";
import SortableItem from "../components/SortableItem";
import AddGearItemModal from "../components/AddGearItemModal";

// ───────────── SORTABLESECTION (LIST MODE) ─────────────
export default function SortableSection({
  category,
  items,
  activeId,
  editingCatId,
  setEditingCatId,
  onEditCat,
  onDeleteCategory,
  showAddModalCat,
  setShowAddModalCat,
  fetchItems,
  listId,
  viewMode,
  onDeleteItem,
  onToggleWorn,
  onToggleConsumable,
  onQuantityChange,
}) {
  const filtered = useMemo(
    () => items.filter((i) => `item-${category._id}-${i._id}` !== activeId),
    [items, activeId, category._id]
  );

  const catId = category._id;

  const [localTitle, setLocalTitle] = useState(category.title);

  const totalWeight = items.reduce((sum, i) => {
    const qty = i.quantity || 1;
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
              onEditCat(localTitle);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
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
              <span>{category.title}</span>
            </h3>
            <span className="pr-3 text-sunset">{totalWeight} g</span>
            <FaTrash
              aria-label="Delete category"
              title="Delete category"
              onClick={() => onDeleteCategory(catId)}
              className="cursor-pointer text-ember"
            />
          </>
        )}
      </div>
      <SortableContext
        items={filtered.map((i) => `item-${catId}-${i._id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div>
          {filtered.map((item) => (
            <SortableItem
              key={`cat-${catId}-item-${item._id}`}
              item={item}
              fetchItems={fetchItems}
              listId={listId}
              catId={catId}
              isListMode={viewMode === "list"}
              onDelete={onDeleteItem}
              onToggleWorn={onToggleWorn}
              onToggleConsumable={onToggleConsumable}
              onQuantityChange={onQuantityChange}
            />
          ))}
        </div>
      </SortableContext>
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
