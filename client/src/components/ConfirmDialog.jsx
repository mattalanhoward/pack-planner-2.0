// src/components/ConfirmDialog.jsx
import React from "react";

export default function ConfirmDialog({
  isOpen,
  title = "Are you sure?",
  message = "",
  confirmText = "Yes",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {/* Dialog box */}
      <div className="bg-neutralAlt rounded-lg shadow-lg max-w-sm w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg text-center font-semibold text-secondary">
            {title}
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-center text-secondary">{message}</p>
        </div>

        {/* Footer */}
        <div className="rounded-lg px-6 py-4 bg-neutralAlt flex justify-center space-x-2">
          <button
            onClick={onCancel}
            className="px-2 py-1 bg-neutralAlt text-primary rounded hover:bg-neutralAlt/90 focus:outline-none focus:ring-2 focus:ring-neutral"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-2 py-1 bg-error text-neutral font-semibold rounded shadow hover:bg-error/80 focus:outline-none focus:ring-2 focus:ring-error"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
