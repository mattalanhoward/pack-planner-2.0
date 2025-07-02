// src/components/PreviewCard.jsx
import React from "react";
import {
  FaGripVertical,
  FaUtensils,
  FaTshirt,
  FaTrash,
  FaEllipsisH,
  FaTimes,
} from "react-icons/fa";

export default function PreviewCard({ item, viewMode, isPreview }) {
  const ghostStyles = isPreview
    ? {
        transform: "scale(1.05)",
        opacity: 0.75,
        boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
      }
    : {};
  // ─────────── LIST MODE PREVIEW ───────────
  if (viewMode === "list") {
    return (
      <>
        {/* Mobile layout: two rows */}
        <div
          style={ghostStyles}
          className="bg-sand px-3 py-2 rounded shadow mb-2 flex flex-col sm:hidden"
        >
          <div className="flex items-center justify-between space-x-2">
            <div className="cursor-grab">
              <FaGripVertical />
            </div>
            <div className="font-semibold text-gray-800 truncate flex-1">
              {item.itemType || "—"}
            </div>
            <div className="truncate text-sm text-gray-700 flex-1">
              {item.brand && <span className="mr-1">{item.brand}</span>}
              {item.name}
            </div>
            {/* DELETE button: same classes as SortableItem */}
            <button
              type="button"
              className="inline-flex items-center justify-center h-6 w-6 text-ember hover:text-ember/80 focus:outline-none"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 space-x-2 text-sm">
            <span className="text-gray-600">
              {item.weight ? `${item.weight}g` : ""}
            </span>
            <FaUtensils
              className={item.consumable ? "text-green-600" : "opacity-30"}
            />
            <FaTshirt className={item.worn ? "text-blue-600" : "opacity-30"} />
            <span className="text-gray-600">
              {item.price ? `€${item.price}` : ""}
            </span>
            <span className="border rounded px-2 py-0.5 bg-sand">
              {item.quantity}
            </span>
            {/* ELLIPSIS in second row */}
            <a
              href="#"
              className="inline-flex items-center justify-center h-6 w-6 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <FaEllipsisH className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Preview Card – Desktop only */}
        <div
          style={ghostStyles}
          className="
    hidden sm:grid
    bg-sand px-3 py-2 rounded shadow mb-2
    items-center gap-x-2 text-sm
    grid-cols-[32px,96px,1fr,32px,32px,32px,32px,32px,32px,32px]
  "
        >
          {/* 1) Drag handle */}
          <div className="cursor-grab justify-self-center">
            <FaGripVertical />
          </div>

          {/* 2) Item type (150px) */}
          <div className="font-semibold text-gray-800 truncate">
            {item.itemType || "—"}
          </div>

          {/* 3) Brand / Name (fluid) */}
          <div className="truncate text-gray-700">
            {item.brand && <span className="mr-1">{item.brand}</span>}
            {item.name}
          </div>

          {/* 4) Weight (64px) */}
          <div className="text-gray-600 justify-self-end">
            {item.weight != null ? `${item.weight}g` : ""}
          </div>

          {/* 5) Consumable (32px) */}
          <div className="justify-self-center">
            <FaUtensils
              className={item.consumable ? "text-green-600" : "opacity-30"}
            />
          </div>

          {/* 6) Worn (32px) */}
          <div className="justify-self-center">
            <FaTshirt className={item.worn ? "text-blue-600" : "opacity-30"} />
          </div>

          {/* 7) Quantity (56px) */}
          <div className="justify-self-center">
            <span className="border rounded px-2 py-0.5 bg-sand">
              {item.quantity}
            </span>
          </div>

          {/* 8) Price (64px) */}
          <div className="text-gray-600 justify-self-end">
            {item.price != null && `€${item.price}`}
          </div>

          {/* 9) Ellipsis (32px) */}
          <div className="justify-self-center">
            <a
              href="#"
              title="See details"
              className="text-gray-500 hover:text-gray-700"
            >
              <FaEllipsisH />
            </a>
          </div>

          {/* 10) Delete (32px) */}
          <div className="place-self-center">
            <button
              type="button"
              className="inline-flex items-center justify-center h-6 w-6 text-ember hover:text-ember/80 focus:outline-none"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─────────── COLUMN MODE PREVIEW ───────────
  return (
    <>
      {/* Mobile fallback (optional) */}
      <div
        style={ghostStyles}
        className="bg-sand px-3 py-2 rounded shadow mb-2 flex flex-col sm:hidden"
      >
        {/* you can reuse your existing mobile layout here if you want */}
      </div>

      {/* Desktop – exactly the 3-row grid from SortableItem */}
      <div
        style={ghostStyles}
        className="hidden sm:grid bg-sand px-2 rounded shadow mb-2 grid-rows-[auto_auto_auto]"
      >
        {/* Row 1: Drag handle – Type – Delete */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center">
          <div className="cursor-grab hide-on-touch">
            <FaGripVertical />
          </div>
          <div className="text-base font-semibold text-gray-800 px-2">
            {item.itemType || "—"}
          </div>
          <button
            type="button"
            title="Delete item"
            aria-label="Delete item"
            className="inline-flex items-center justify-center h-6 w-6 text-ember hover:text-ember/80 focus:outline-none"
            onClick={() => {
              /* you may need to forward onDelete here */
            }}
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Row 2: Brand – Name */}
        <div className="grid grid-cols-[auto_1fr] items-center">
          {item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full font-medium text-sm text-gray-700 mr-1"
            >
              {item.brand}
            </a>
          ) : (
            <span className="font-medium text-sm text-gray-700 mr-1">
              {item.brand}
            </span>
          )}
          <div className="truncate text-sm text-gray-700">{item.name}</div>
        </div>

        {/* Row 3: Weight·Price (left) — Utensils·Worn·Qty·Ellipsis (right) */}
        <div className="grid grid-cols-[1fr_auto] items-center">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {item.weight != null ? `${item.weight}g` : ""}
            </span>
            {item.price != null && (
              <span className="text-sm text-gray-600">€{item.price}</span>
            )}
          </div>
          <div className="grid grid-cols-[16px_16px_auto_16px] items-center justify-end gap-x-3">
            <FaUtensils
              title="Toggle consumable"
              className={`cursor-pointer ${
                item.consumable ? "text-green-600" : "opacity-30"
              }`}
            />
            <FaTshirt
              title="Toggle worn"
              className={`cursor-pointer ${
                item.worn ? "text-blue-600" : "opacity-30"
              }`}
            />
            <span className="flex items-center justify-center border rounded px-2 py-0.5 bg-sand text-sm">
              {item.quantity}
            </span>
            <a
              href="#"
              title="See details"
              className="inline-flex items-center justify-center h-6 w-6 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <FaEllipsisH className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
