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

    useEffect(() => {
      setValue(qty);
    }, [qty]);

    const commit = () => {
      const n = parseInt(value, 10);
      if (!isNaN(n) && n > 0 && n !== qty) {
        onChange(n);
      }
      setEditing(false);
    };

    if (editing) {
      return (
        <input
          type="number"
          min="1"
          className="w-12 text-center border rounded p-1 bg-sand"
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
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
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full"
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
          </div>
          <div className="flex items-center justify-between mt-2 space-x-2 text-sm">
            <span className="text-gray-600">
              {item.weight != null ? `${item.weight}g` : ""}
            </span>
            <FaUtensils
              title="Toggle consumable"
              aria-label="Toggle consumable"
              onClick={() => onToggleConsumable(catId, item._id)}
              className={`cursor-pointer ${
                item.consumable ? "text-green-600" : "opacity-30"
              }`}
            />
            <FaTshirt
              title="Toggle worn"
              aria-label="Toggle worn"
              onClick={() => onToggleWorn(catId, item._id)}
              className={`cursor-pointer ${
                item.worn ? "text-blue-600" : "opacity-30"
              }`}
            />
            {item.price != null &&
              (item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600"
                >
                  €{item.price}
                </a>
              ) : (
                <span className="text-gray-600">€{item.price}</span>
              ))}
            <QuantityInline
              qty={item.quantity}
              onChange={(newQty) => onQuantityChange(catId, item._id, newQty)}
            />
            <button
              title="Delete item"
              aria-label="Delete item"
              onClick={() => onDelete(catId, item._id)}
              className="text-red-500 hover:text-red-700"
            >
              <FaTrash />
            </button>
          </div>
        </div>

        {/* Desktop: one row */}
        <div className="hidden sm:flex items-center justify-between text-sm">
          <div className="flex items-center">
            <div className="cursor-grab mr-2" {...attributes} {...listeners}>
              <FaGripVertical />
            </div>
            <div className="font-semibold text-gray-800 truncate mr-4">
              {item.itemType || "—"}
            </div>
            <div className="truncate text-sm text-gray-700 flex-1">
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full"
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
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              {item.weight != null ? `${item.weight}g` : ""}
            </span>
            <FaUtensils
              title="Toggle consumable"
              aria-label="Toggle consumable"
              onClick={() => onToggleConsumable(catId, item._id)}
              className={`cursor-pointer ${
                item.consumable ? "text-green-600" : "opacity-30"
              }`}
            />
            <FaTshirt
              title="Toggle worn"
              aria-label="Toggle worn"
              onClick={() => onToggleWorn(catId, item._id)}
              className={`cursor-pointer ${
                item.worn ? "text-blue-600" : "opacity-30"
              }`}
            />
            {item.price != null &&
              (item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600"
                >
                  €{item.price}
                </a>
              ) : (
                <span className="text-gray-600">€{item.price}</span>
              ))}
            <QuantityInline
              qty={item.quantity}
              onChange={(newQty) => onQuantityChange(catId, item._id, newQty)}
            />
            <button
              title="Delete item"
              aria-label="Delete item"
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

  // COLUMN MODE
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

      <div className="truncate text-sm text-gray-700 flex-1">
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full"
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

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {item.weight != null ? `${item.weight}g` : ""}
        </span>
        <div className="flex items-center space-x-3">
          <FaUtensils
            title="Toggle consumable"
            aria-label="Toggle consumable"
            onClick={() => onToggleConsumable(catId, item._id)}
            className={`cursor-pointer ${
              item.consumable ? "text-green-600" : "opacity-30"
            }`}
          />
          <FaTshirt
            title="Toggle worn"
            aria-label="Toggle worn"
            onClick={() => onToggleWorn(catId, item._id)}
            className={`cursor-pointer ${
              item.worn ? "text-blue-600" : "opacity-30"
            }`}
          />
          {item.price != null &&
            (item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600"
              >
                €{item.price}
              </a>
            ) : (
              <span className="text-gray-600">€{item.price}</span>
            ))}
          <QuantityInline
            qty={item.quantity}
            onChange={(newQty) => onQuantityChange(catId, item._id, newQty)}
          />
          <button
            title="Delete item"
            aria-label="Delete item"
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
