// src/components/SortableItem.jsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaGripVertical, FaUtensils, FaTshirt, FaTrash } from "react-icons/fa";

/**
 * Props:
 *   - item: the gearItem object from itemsMap[catId]
 *   - catId: the category _id this item currently lives in
 *   - onToggleConsumable, onToggleWorn, onQuantityChange, onDelete: callbacks
 *   - isListMode: boolean (true when viewMode === 'list'; false otherwise)
 */
export default function SortableItem({
  item,
  catId,
  onToggleConsumable,
  onToggleWorn,
  onQuantityChange,
  onDelete,
  isListMode, // ← new prop
}) {
  // Unique sortable ID (must match what GearListView uses)
  const itemKey = `item-${catId}-${item._id}`;

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: itemKey,
      data: { catId, itemId: item._id },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white p-3 rounded shadow mb-2
        flex flex-col
        ${isListMode ? "md:flex-row md:items-center md:justify-between" : ""}
      `}
    >
      {/** ───── Row 1: Grip icon + itemType ───── */}
      <div
        className={`flex items-center mb-1 ${
          isListMode ? "md:mb-0 md:mr-4" : ""
        }`}
      >
        <FaGripVertical
          {...attributes}
          {...listeners}
          className="mr-2 cursor-grab text-gray-500"
          title="Drag to reorder"
        />
        <div className="text-lg font-semibold text-gray-800">
          {item.itemType || "—"}
        </div>
      </div>

      {/** ───── Row 2: Brand + Name (with optional link) ───── */}
      <div className={`text-sm mb-1 ${isListMode ? "md:flex-1" : ""}`}>
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="!text-teal-600 hover:!text-teal-800 hover:underline transition-colors duration-200"
            title={`View ${item.brand} ${item.name}`}
          >
            {item.brand && <span className="mr-1">{item.brand}</span>}
            {item.name}
          </a>
        ) : (
          <span className="text-gray-700">
            {item.brand && <span className="mr-1">{item.brand}</span>}
            {item.name}
          </span>
        )}
      </div>

      {/** ───── Row 3: Weight + toggles + price + qty + delete ───── */}
      <div
        className={`
          flex items-center justify-between text-sm mt-3
          ${isListMode ? "md:mt-0 md:ml-auto" : ""}
        `}
      >
        {/* Weight */}
        <span
          className={`${
            isListMode ? "md:mr-4 text-gray-600" : "text-gray-600"
          }`}
        >
          {item.weight != null ? `${item.weight}g` : ""}
        </span>

        <div className="flex items-center space-x-3">
          {/* Consumable toggle */}
          <FaUtensils
            onClick={() => onToggleConsumable(catId, item._id)}
            className={`cursor-pointer ${
              item.consumable ? "text-green-600" : "opacity-30"
            }`}
            title="Toggle consumable"
            aria-label="Toggle Consumable"
          />

          {/* Worn toggle */}
          <FaTshirt
            onClick={() => onToggleWorn(catId, item._id)}
            className={`cursor-pointer ${
              item.worn ? "text-blue-600" : "opacity-30"
            }`}
            title="Toggle worn"
            aria-label="Toggle Worn"
          />

          {/* Price (with buy-link styling) */}
          {item.price != null &&
            (item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 hover:text-teal-800 hover:underline transition-colors duration-200"
                title={`View ${item.brand} ${item.name}`}
              >
                €{item.price}
              </a>
            ) : (
              <span className="text-gray-600">€{item.price}</span>
            ))}

          {/* Quantity selector */}
          <select
            value={item.quantity}
            onChange={(e) =>
              onQuantityChange(catId, item._id, Number(e.target.value))
            }
            className="border rounded p-1"
          >
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onDelete(catId, item._id)}
            className="hover:text-red-700 text-red-500"
            title="Delete item"
            aria-label="Delete item"
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </div>
  );
}
