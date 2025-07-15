// ─────────── PreviewColumn.jsx (define inside this file) ───────────
import React from "react";
import { FaGripVertical, FaEdit, FaTimes, FaPlus } from "react-icons/fa";

// We only need a visual skeleton: title + icons + blank items placeholder
export default function PreviewColumn({ category, items }) {
  return (
    <div
      className="
        snap-center flex-shrink-0 m-2 w-90 sm:w-64
        bg-neutral/20 rounded-lg p-3 flex flex-col h-full
        opacity-75
      "
      style={{ pointerEvents: "none" }}
    >
      {/* Header row: grip icon + title */}
      <div className="flex items-center mb-2">
        <FaGripVertical className="mr-2 text-primary" />
        <h3 className="flex-1 font-semibold text-primary">{category.title}</h3>
        <FaEdit className="opacity-0" /> {/* invisible placeholders */}
        <FaTimes className="opacity-0" />
      </div>

      {/* “Ghost” list of items (just blanks) */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-3 rounded shadow flex flex-col opacity-50"
          >
            <div className="h-4 bg-gray-200 rounded mb-1 w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>

      {/* bottom: “Add Item” button placeholder */}
      <button
        className="h-12 w-full border border-primary rounded flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
        disabled
      >
        <FaPlus />
        <span className="text-xs">Add Item</span>
      </button>
    </div>
  );
}
