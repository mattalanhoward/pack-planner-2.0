// src/components/PreviewCard.jsx
import React from "react";
import { FaGripVertical, FaUtensils, FaTshirt, FaTrash } from "react-icons/fa";

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
          <div className="flex items-center justify-between mt-2 space-x-2 text-sm">
            <span className="text-gray-600">
              {item.weight != null ? `${item.weight}g` : ""}
            </span>
            <FaUtensils
              className={`${item.consumable ? "text-green-600" : "opacity-30"}`}
            />
            <FaTshirt
              className={`${item.worn ? "text-blue-600" : "opacity-30"}`}
            />
            <span className="text-gray-600">
              {item.price != null ? `€${item.price}` : ""}
            </span>
            <span className="border rounded p-1 bg-sand">{item.quantity}</span>
            <FaTrash className="text-red-500 hover:text-red-700" />
          </div>
        </div>

        {/* Desktop layout: one-row grid */}
        <div
          style={ghostStyles}
          className="bg-sand px-3 py-2 rounded shadow mb-2 hidden sm:grid items-center gap-2
                     grid-cols-[32px_150px_minmax(0,1fr)_64px_32px_32px_64px_64px_32px]"
        >
          <div className="cursor-grab">
            <FaGripVertical />
          </div>
          <div className="font-semibold text-gray-800 truncate">
            {item.itemType || "—"}
          </div>
          <div className="truncate text-sm text-gray-700">
            {item.brand && <span className="mr-1">{item.brand}</span>}
            {item.name}
          </div>
          <div className="text-center text-sm text-gray-600">
            {item.weight != null ? `${item.weight}g` : ""}
          </div>
          <div className="text-center">
            <FaUtensils
              className={`${item.consumable ? "text-green-600" : "opacity-30"}`}
            />
          </div>
          <div className="text-center">
            <FaTshirt
              className={`${item.worn ? "text-blue-600" : "opacity-30"}`}
            />
          </div>
          <div className="text-center text-sm text-gray-600">
            {item.price != null ? `€${item.price}` : ""}
          </div>
          <div className="text-center">
            <span className="border rounded p-1 bg-sand">{item.quantity}</span>
          </div>
          <div className="text-center">
            <FaTrash className="text-red-500 hover:text-red-700" />
          </div>
        </div>
      </>
    );
  }

  // ─────────── COLUMN MODE PREVIEW ───────────
  return (
    <div
      style={ghostStyles}
      className="bg-sand px-3 py-1 rounded shadow mb-2 flex flex-col"
    >
      <div className="flex items-center mb-1">
        <FaGripVertical className="mr-2 cursor-grab text-gray-500" />
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
            className={`${item.consumable ? "text-green-600" : "opacity-30"}`}
          />
          <FaTshirt
            className={`${item.worn ? "text-blue-600" : "opacity-30"}`}
          />
          {item.price != null && (
            <span className="text-gray-600">€{item.price}</span>
          )}
          <span className="border rounded p-1 bg-sand">{item.quantity}</span>
          <FaTrash className="hover:text-red-700 text-red-500" />
        </div>
      </div>
    </div>
  );
}
