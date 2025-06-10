// src/components/SortableItem.jsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaGripVertical, FaUtensils, FaTshirt, FaTrash } from "react-icons/fa";

export default function SortableItem({
  item,
  catId,
  onToggleConsumable,
  onToggleWorn,
  onQuantityChange,
  onDelete,
  isListMode,
}) {
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

  // ─── List Mode: responsive two-row on mobile, one-row grid on desktop ───
  if (isListMode) {
    return (
      <>
        {/* Mobile layout: two rows */}
        <div
          ref={setNodeRef}
          style={style}
          className="bg-sand px-3 py-2 rounded shadow mb-2 flex flex-col sm:hidden"
          {...attributes}
          {...listeners}
        >
          {/* Row 1: handle, type, name */}
          <div className="flex items-center justify-between">
            <div className="cursor-grab">
              <FaGripVertical />
            </div>
            <div className="font-semibold text-gray-800 truncate mx-2 flex-1">
              {item.itemType || "—"}
            </div>
            <div className="truncate text-sm text-gray-700 flex-1">
              {item.brand && <span className="mr-1">{item.brand}</span>}
              {item.name}
            </div>
          </div>
          {/* Row 2: weight, toggles, price, qty, delete */}
          <div className="flex items-center justify-between mt-2 space-x-2 text-sm">
            <span className="text-gray-600">
              {item.weight != null ? `${item.weight}g` : ""}
            </span>
            <FaUtensils
              onClick={() => onToggleConsumable(catId, item._id)}
              className={`cursor-pointer ${
                item.consumable ? "text-green-600" : "opacity-30"
              }`}
            />
            <FaTshirt
              onClick={() => onToggleWorn(catId, item._id)}
              className={`cursor-pointer ${
                item.worn ? "text-blue-600" : "opacity-30"
              }`}
            />
            <span className="text-gray-600">
              {item.price != null ? `€${item.price}` : ""}
            </span>
            <select
              value={item.quantity}
              onChange={(e) =>
                onQuantityChange(catId, item._id, Number(e.target.value))
              }
              className="border rounded p-1 bg-sand"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <button
              onClick={() => onDelete(catId, item._id)}
              className="text-red-500 hover:text-red-700"
            >
              <FaTrash />
            </button>
          </div>
        </div>
        {/* Desktop layout: one-row grid */}
        <div
          ref={setNodeRef}
          style={style}
          className={`bg-sand px-3 py-2 rounded shadow mb-2
             hidden sm:grid items-center gap-2
             grid-cols-[32px_150px_minmax(0,1fr)_64px_32px_32px_64px_64px_32px]`}
          {...attributes}
          {...listeners}
        >
          <div className="cursor-grab">
            <FaGripVertical />
          </div>
          <div className="font-semibold text-gray-800 truncate">
            {item.itemType || "—"}
          </div>
          <div className="truncate text-sm text-gray-700">
            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {item.brand && <span className="mr-1">{item.brand}</span>}
                {item.name}
              </a>
            ) : (
              <>
                {item.brand && <span className="mr-1">{item.brand}</span>}
                {item.name}
              </>
            )}
          </div>
          <div className="text-center text-sm text-gray-600">
            {item.weight != null ? `${item.weight}g` : ""}
          </div>
          <div className="text-center">
            <FaUtensils
              onClick={() => onToggleConsumable(catId, item._id)}
              className={`cursor-pointer ${
                item.consumable ? "text-green-600" : "opacity-30"
              }`}
            />
          </div>
          <div className="text-center">
            <FaTshirt
              onClick={() => onToggleWorn(catId, item._id)}
              className={`cursor-pointer ${
                item.worn ? "text-blue-600" : "opacity-30"
              }`}
            />
          </div>
          <div className="text-center text-sm text-gray-600">
            {item.price != null ? `€${item.price}` : ""}
          </div>
          <div className="text-center">
            <select
              value={item.quantity}
              onChange={(e) =>
                onQuantityChange(catId, item._id, Number(e.target.value))
              }
              className="border rounded p-1 bg-sand"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="text-center">
            <button
              onClick={() => onDelete(catId, item._id)}
              className="text-red-500 hover:text-red-700"
            >
              <FaTrash />
            </button>
          </div>
        </div>
      </>
    );
  }

  // Column Mode: unchanged two-row layout
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-sand px-3 py-1 rounded shadow mb-2 flex flex-col"
    >
      {/* Row 1: Grip + itemType */}
      <div className="flex items-center mb-1">
        <FaGripVertical
          {...attributes}
          {...listeners}
          className="mr-2 cursor-grab text-gray-500"
        />
        <div className="text-base font-semibold text-gray-800">
          {item.itemType || "—"}
        </div>
      </div>

      {/* Row 2: Brand + Name */}
      <div className="text-sm">
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

      {/* Row 3: Weight + toggles + price + qty + delete */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {item.weight != null ? `${item.weight}g` : ""}
        </span>
        <div className="flex items-center space-x-3">
          <FaUtensils
            onClick={() => onToggleConsumable(catId, item._id)}
            className={`cursor-pointer ${
              item.consumable ? "text-green-600" : "opacity-30"
            }`}
          />
          <FaTshirt
            onClick={() => onToggleWorn(catId, item._id)}
            className={`cursor-pointer ${
              item.worn ? "text-blue-600" : "opacity-30"
            }`}
          />
          {item.price != null && (
            <span className="text-gray-600">€{item.price}</span>
          )}
          <select
            value={item.quantity}
            onChange={(e) =>
              onQuantityChange(catId, item._id, Number(e.target.value))
            }
            className="border rounded p-1 bg-sand"
          >
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <button
            onClick={() => onDelete(catId, item._id)}
            className="hover:text-red-700 text-red-500"
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </div>
  );
}
