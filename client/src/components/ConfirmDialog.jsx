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
      <div className="bg-sand rounded-lg shadow-lg max-w-sm w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg text-center font-semibold text-teal">
            {title}
          </h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-center text-teal">{message}</p>
        </div>

        {/* Footer */}
        <div className="rounded-lg px-6 py-4 bg-sand flex justify-center space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-sand text-pine rounded hover:bg-sand/90 focus:outline-none focus:ring-2 focus:ring-sand"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-ember text-sand font-semibold rounded shadow hover:bg-ember/80 focus:outline-none focus:ring-2 focus:ring-ember"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
