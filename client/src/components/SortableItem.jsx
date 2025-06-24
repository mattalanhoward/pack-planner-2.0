import React, { memo, useState, useEffect } from "react";
import api from "../services/api";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FaGripVertical,
  FaUtensils,
  FaTshirt,
  FaTrash,
  FaEllipsisH,
} from "react-icons/fa";

export default function SortableItem({
  item,
  listId,
  catId,
  onToggleConsumable,
  onToggleWorn,
  onDelete,
  isListMode,
  fetchItems,
  onQuantityChange,
}) {
  const [wornLocal, setWornLocal] = useState(item.worn);
  const [consumableLocal, setConsumableLocal] = useState(item.consumable);

  const itemKey = `item-${catId}-${item._id}`;
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: itemKey,
      data: { catId, itemId: item._id },
    });

  // → handleWornClick
  const handleWornClick = () => {
    const newWorn = !wornLocal;
    setWornLocal(newWorn);

    api
      .patch(`/lists/${listId}/categories/${catId}/items/${item._id}`, {
        worn: newWorn,
      })
      .catch((err) => {
        // rollback on error
        setWornLocal(!newWorn);
        fetchItems?.(catId);
        toast.error(err.message || "Failed to toggle worn");
      });

    // notify parent with new value
    onToggleWorn?.(catId, item._id, newWorn);
  };

  // → handleConsumableClick
  const handleConsumableClick = () => {
    const newConsumable = !consumableLocal;
    setConsumableLocal(newConsumable);

    api
      .patch(`/lists/${listId}/categories/${catId}/items/${item._id}`, {
        consumable: newConsumable,
      })
      .catch((err) => {
        // rollback on error
        setConsumableLocal(!newConsumable);
        fetchItems(catId);
        toast.error(err.message || "Failed to toggle consumable");
      });

    // notify parent with new value
    onToggleConsumable?.(catId, item._id, newConsumable);
  };

  function QuantityInline({
    qty,
    onChange,
    catId,
    listId,
    itemId,
    fetchItems,
  }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(qty);
    const [localQty, setLocalQty] = useState(qty);

    // keep local in sync if item prop changes
    useEffect(() => {
      setValue(qty);
      setLocalQty(qty);
    }, [qty]);

    // → commit inside QuantityInline
    const commit = () => {
      const n = parseInt(value, 10);
      if (!isNaN(n) && n > 0 && n !== localQty) {
        const newQty = n;
        setLocalQty(newQty);

        api
          .patch(`/lists/${listId}/categories/${catId}/items/${itemId}`, {
            quantity: newQty,
          })
          .catch((err) => {
            // rollback on error
            setLocalQty(qty);
            fetchItems(catId);
            toast.error(err.message || "Failed to update quantity");
          });

        // notify parent with new quantity
        onQuantityChange?.(catId, itemId, newQty);
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
        {localQty}
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
          <div className="relative flex items-center justify-between">
            {/* Drag handle for non-touch */}
            <div
              className="cursor-grab mr-2 hide-on-touch"
              {...attributes}
              {...listeners}
            >
              <FaGripVertical />
            </div>
            {/* Ellipsis for touch */}
            <a
              href="#"
              className="show-on-touch absolute right-0 text-lg text-gray-400"
              title="See details"
            >
              <FaEllipsisH />
            </a>
            <div className="font-semibold text-gray-800 truncate sm:mx-2 flex-1">
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
              onClick={handleConsumableClick}
              className={`cursor-pointer ${
                consumableLocal ? "text-green-600" : "opacity-30"
              }`}
            />
            <FaTshirt
              title="Toggle worn"
              aria-label="Toggle worn"
              onClick={handleWornClick}
              className={`cursor-pointer ${
                wornLocal ? "text-blue-600" : "opacity-30"
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
              onChange={(n) => onQuantityChange(catId, item._id, n)}
              catId={catId}
              listId={listId}
              itemId={item._id}
              fetchItems={fetchItems}
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
            {/* Drag handle for non-touch */}
            <div
              className="cursor-grab mr-2 hide-on-touch"
              {...attributes}
              {...listeners}
            >
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
              onClick={handleConsumableClick}
              className={`cursor-pointer ${
                consumableLocal ? "text-green-600" : "opacity-30"
              }`}
            />
            <FaTshirt
              title="Toggle worn"
              aria-label="Toggle worn"
              onClick={handleWornClick}
              className={`cursor-pointer ${
                wornLocal ? "text-blue-600" : "opacity-30"
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
              onChange={(n) => onQuantityChange(catId, item._id, n)}
              catId={catId}
              listId={listId}
              itemId={item._id}
              fetchItems={fetchItems}
            />
            <button
              title="Delete item"
              aria-label="Delete item"
              onClick={() => onDelete(catId, item._id)}
              className="text-red-500 hover:text-red-700"
            >
              <FaTrash />
            </button>
            {/* Ellipsis for touch */}
            <a
              href="#"
              className="show-on-touch text-gray-500 hover:text-gray-700 mr-2"
              title="See details"
            >
              <FaEllipsisH />
            </a>
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
      <div className="relative flex items-center mb-1">
        {/* Drag handle for non-touch */}
        <div
          className="cursor-grab mr-2 hide-on-touch"
          {...attributes}
          {...listeners}
        >
          <FaGripVertical />
        </div>
        {/* Ellipsis for touch */}
        <a
          href="#"
          className="show-on-touch absolute right-0 text-gray-500 hover:text-gray-700"
          title="See details"
        >
          <FaEllipsisH />
        </a>
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
            onClick={handleConsumableClick}
            className={`cursor-pointer ${
              consumableLocal ? "text-green-600" : "opacity-30"
            }`}
          />
          <FaTshirt
            title="Toggle worn"
            aria-label="Toggle worn"
            onClick={handleWornClick}
            className={`cursor-pointer ${
              wornLocal ? "text-blue-600" : "opacity-30"
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
            onChange={(n) => onQuantityChange(catId, item._id, n)}
            catId={catId}
            listId={listId}
            itemId={item._id}
            fetchItems={fetchItems}
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
