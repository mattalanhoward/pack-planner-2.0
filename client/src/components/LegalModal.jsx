// src/components/LegalModal.jsx
import React, { useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function LegalModal({ open, onClose }) {
  const navigate = useNavigate();
  const firstRef = useRef(null);

  // ESC to close (align with AccountModal) — hooks must always run; guard body by `open`
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus the first actionable item when opening
  useEffect(() => {
    if (!open) return;
    // ensure element is mounted
    requestAnimationFrame(() => firstRef.current?.focus());
  }, [open]);

  const go = (path) => {
    onClose();
    navigate(path);
  };

  // now safe to short-circuit without changing hook order
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-primary bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="bg-base-100 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] p-6 flex flex-col overflow-hidden">
        {/* Header (match AccountModal) */}
        <div className="flex justify-between items-center mb-4">
          <h2
            id="legal-modal-title"
            className="text-lg sm:text-xl font-semibold text-primary"
          >
            Legal & Policies
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-error hover:text-error/80"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content (scroll area, same spacing style) */}
        <div className="flex-1 overflow-y-auto">
          <ul className="flex flex-col space-y-2">
            <li>
              <button
                type="button"
                ref={firstRef}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
                onClick={() => go("/legal/affiliate-disclosure")}
              >
                Affiliate Disclosure
              </button>
            </li>
            <li>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
                onClick={() => go("/legal/privacy")}
              >
                Privacy
              </button>
            </li>
            <li>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
                onClick={() => go("/legal/cookies")}
              >
                Cookie Policy
              </button>
            </li>
            <li>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
                onClick={() => {
                  if (window.openCookieSettings) {
                    onClose();
                    window.openCookieSettings();
                  } else {
                    go("/legal/cookies");
                  }
                }}
              >
                Cookie settings
              </button>
            </li>
            <li>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
                onClick={() => go("/legal/terms")}
              >
                Terms
              </button>
            </li>
            <li>
              <button
                type="button"
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
                onClick={() => go("/legal/imprint")}
              >
                Imprint / Contact
              </button>
            </li>
          </ul>

          {/* Inline imprint line for quick reference */}
          <div className="mt-4 text-xs text-gray-500">
            © {new Date().getFullYear()} TrekList •{" "}
            <strong>Tall Joe Hikes</strong> — KvK 98785419 •{" "}
            <a className="underline" href="mailto:support@treklist.co">
              support@treklist.co
            </a>
          </div>
        </div>

        {/* Actions (match AccountModal buttons) */}
        <div className="mt-auto flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-base-100 text-primary rounded hover:bg-base-100/80"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
