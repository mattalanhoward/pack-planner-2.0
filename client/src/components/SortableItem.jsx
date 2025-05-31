// src/components/SortableItem.jsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaGripVertical, FaUtensils, FaTshirt, FaTrash } from 'react-icons/fa';

/**
 * Props:
 *   - item: the gearItem object from itemsMap[catId]
 *   - catId: the category _id this item currently lives in
 *   - onToggleConsumable, onToggleWorn, onQuantityChange, onDelete: callbacks (exactly as before)
 */
export default function SortableItem({
  item,
  catId,
  onToggleConsumable,
  onToggleWorn,
  onQuantityChange,
  onDelete
}) {
  // We namespace the id as `item-<catId>-<itemId>`.
  // This id must be unique across all categories/items.
  const itemKey = `item-${catId}-${item._id}`;

  // Pass data: { catId, itemId } so we can tell where this item came from.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({
    id: itemKey,
    data: { catId, itemId: item._id }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-3 rounded shadow flex flex-col mb-2"
    >
      {/* Row 1: Grip icon + itemType */}
      <div className="flex items-center mb-1">
        <FaGripVertical
          {...attributes}
          {...listeners}
          className="mr-2 cursor-grab text-gray-500"
          title="Drag to reorder"
        />
        <div className="text-lg font-semibold text-gray-800">
          {item.itemType || '—'}
        </div>
      </div>

      {/* Row 2: Brand + Name */}
      <div className="text-sm text-gray-700">
        {item.brand && <span className="mr-1">{item.brand}</span>}
        {item.name}
      </div>

      {/* Row 3: Weight + toggles + price + qty + delete */}
      <div className="flex items-center justify-between text-sm text-gray-600 mt-3">
        {/* Weight */}
        <span>{item.weight != null ? `${item.weight}g` : ''}</span>

        <div className="flex items-center space-x-3">
          {/* Consumable toggle */}
          <FaUtensils
            onClick={() => onToggleConsumable(catId, item._id)}
            className={`cursor-pointer ${
              item.consumable ? 'text-green-600' : 'opacity-30'
            }`}
            title="Toggle consumable"
          />

          {/* Worn toggle */}
          <FaTshirt
            onClick={() => onToggleWorn(catId, item._id)}
            className={`cursor-pointer ${
              item.worn ? 'text-blue-600' : 'opacity-30'
            }`}
            title="Toggle worn"
          />

          {/* Price (link or plain) */}
          {item.price != null &&
            (item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal hover:underline"
              >
                ${item.price}
              </a>
            ) : (
              <span>${item.price}</span>
            ))}

          {/* Quantity selector */}
          <select
            value={item.quantity}
            onChange={e =>
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

          {/* Delete icon */}
          <button
            onClick={() => onDelete(catId, item._id)}
            className="hover:text-red-700 text-red-500"
            title="Delete item"
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </div>
  );
}
