// src/components/SortableItem.jsx
import React, { memo, useState, useEffect } from "react";
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

  function QuantityInline({ qty, onChange }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(qty);

    useEffect(() => setValue(qty), [qty]);

    if (editing) {
      return (
        <input
          type="number"
          className="w-12 text-center border rounded p-1 bg-sand"
          value={value}
          autoFocus
          onChange={(e) => {
            const v = e.target.value;
            setValue(v);
            const n = parseInt(v, 10);
            if (n > 0 && n !== qty) {
              onChange(n);
            }
          }}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
      );
    }

    return (
      <span
        onClick={() => setEditing(true)}
        className="cursor-pointer select-none px-1"
        title="Click to edit quantity"
      >
        {qty}
      </span>
    );
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isListMode) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-sand px-3 py-2 rounded shadow mb-2"
      >
        {/* Mobile: two rows */}
        <div className="flex flex-col sm:hidden">
          <div className="flex items-center justify-between">
            <div className="cursor-grab" {...attributes} {...listeners}>
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
            <QuantityInline
              qty={item.quantity}
              onChange={(newQty) => onQuantityChange(catId, item._id, newQty)}
            />
            <button
              onClick={() => onDelete(catId, item._id)}
              className="text-red-500 hover:text-red-700"
            >
              <FaTrash />
            </button>
          </div>
        </div>

        {/* Desktop: one-row grid */}
        <div className="hidden sm:grid sm:grid-cols-[32px_150px_minmax(0,1fr)_64px_32px_32px_64px_64px_32px] items-center gap-2">
          <div className="cursor-grab" {...attributes} {...listeners}>
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
            <QuantityInline
              qty={item.quantity}
              onChange={(newQty) => onQuantityChange(catId, item._id, newQty)}
            />
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
      </div>
    );
  }

  // ─── COLUMN MODE ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-sand px-3 py-1 rounded shadow mb-2 flex flex-col"
    >
      <div className="flex items-center mb-1">
        <div
          className="mr-2 cursor-grab text-gray-500"
          {...attributes}
          {...listeners}
        >
          <FaGripVertical />
        </div>
        <div className="text-base font-semibold text-gray-800">
          {item.itemType || "—"}
        </div>
      </div>

      <div className="text-sm text-gray-700 mb-1">
        {item.brand && <span className="mr-1">{item.brand}</span>}
        {item.name}
      </div>

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
          <QuantityInline
            qty={item.quantity}
            onChange={(newQty) => onQuantityChange(catId, item._id, newQty)}
          />
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
