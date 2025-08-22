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
          className="bg-neutral px-3 py-2 rounded shadow mb-2 flex flex-col sm:hidden"
        >
          <div className="flex items-center justify-between space-x-2">
            <div className="cursor-grab">
              <FaGripVertical />
            </div>
            <div className="font-semibold text-secondary truncate flex-1">
              {item.itemType || "—"}
            </div>
            <div className="truncate text-sm text-secondary flex-1">
              {item.brand && <span className="mr-1">{item.brand}</span>}
              {item.name}
            </div>
            {/* DELETE button: same classes as SortableItem */}
            <button
              type="button"
              className="inline-flex items-center justify-center h-6 w-6 text-secondary hover:text-secondary focus:outline-none"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 space-x-2 text-sm">
            <span className="text-secondary">
              {item.weight ? `${item.weight}g` : ""}
            </span>
            <FaUtensils
              className={item.consumable ? "text-green-600" : "opacity-30"}
            />
            <FaTshirt className={item.worn ? "text-blue-600" : "opacity-30"} />
            <span className="text-secondary">
              {item.price ? `€${item.price}` : ""}
            </span>
            <span className="border rounded px-2 py-0.5 bg-neutral">
              {item.quantity}
            </span>
            {/* ELLIPSIS in second row */}
            <a
              href="#"
              className="inline-flex items-center justify-center h-6 w-6 text-secondary hover:text-secondary/50 focus:outline-none"
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
    bg-neutral px-3 py-2 rounded shadow mb-2
    items-center gap-x-2 text-sm
    grid-cols-[32px,96px,1fr,32px,32px,32px,32px,32px,32px,32px]
  "
        >
          {/* 1) Drag handle */}
          <div className="cursor-grab justify-self-center text-secondary">
            <FaGripVertical />
          </div>

          {/* 2) Item type (150px) */}
          <div className="font-semibold text-secondary truncate">
            {item.itemType || "—"}
          </div>

          {/* 3) Brand / Name (fluid) */}
          <div className="truncate text-secondary">
            {item.brand && <span className="mr-1">{item.brand}</span>}
            {item.name}
          </div>

          {/* 4) Weight (64px) */}
          <div className="text-secondary justify-self-end">
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
          <div className="justify-self-center text-secondary">
            <span className="border rounded px-2 py-0.5 bg-neutral">
              {item.quantity}
            </span>
          </div>

          {/* 8) Price (64px) */}
          <div className="text-secondary justify-self-end">
            {item.price != null && `€${item.price}`}
          </div>

          {/* 9) Ellipsis (32px) */}
          <div className="justify-self-center">
            <a
              href="#"
              title="See details"
              className="text-secondary hover:text-secondary/50"
            >
              <FaEllipsisH />
            </a>
          </div>

          {/* 10) Delete (32px) */}
          <div className="place-self-center">
            <button
              type="button"
              className="inline-flex items-center justify-center h-6 w-6 text-secondary hover:text-secondary/50 focus:outline-none"
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
        className="bg-neutral px-3 py-2 rounded shadow mb-2 flex flex-col sm:hidden"
      >
        {/* you can reuse your existing mobile layout here if you want */}
      </div>

      {/* Desktop – exactly the 3-row grid from SortableItem */}
      <div
        style={ghostStyles}
        className="hidden sm:grid bg-neutral px-2 rounded shadow mb-2 grid-rows-[auto_auto_auto]"
      >
        {/* Row 1: Drag handle – Type – Delete */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center">
          <div className="cursor-grab hide-on-touch text-secondary">
            <FaGripVertical />
          </div>
          <div className="text-secondary font-semibold px-2">
            {item.itemType || "—"}
          </div>
          <button
            type="button"
            title="Delete item"
            aria-label="Delete item"
            className="inline-flex items-center justify-center h-6 w-6 text-secondary hover:text-secondary focus:outline-none"
            onClick={() => {
              /* you may need to forward onDelete here */
            }}
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Row 2: Brand – Name */}
        <div className="grid grid-cols-[auto_1fr] items-center">
          <span className="font-medium text-sm text-secondary mr-1">
            {item.brand}ddd
          </span>
          <div className="truncate text-sm text-secondary">{item.name}</div>
        </div>

        {/* Row 3: Weight·Price (left) — Utensils·Worn·Qty·Ellipsis (right) */}
        <div className="grid grid-cols-[1fr_auto] items-center">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-secondary">
              {item.weight != null ? `${item.weight}g` : ""}
            </span>
            {item.price != null && (
              <span className="text-sm text-secondary">€{item.price}</span>
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
            <span className="flex items-center justify-center border rounded px-2 py-0.5 bg-neutral text-sm text-secondary">
              {item.quantity}
            </span>
            <a
              href="#"
              title="See details"
              className="inline-flex items-center justify-center h-6 w-6 text-secondary hover:text-secondary/50 focus:outline-none"
            >
              <FaEllipsisH className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
