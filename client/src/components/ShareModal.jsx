// src/components/ShareModal.jsx
import React from "react";
import { FaTimes, FaCopy, FaBan, FaCode, FaFileCsv } from "react-icons/fa";
import { toast } from "react-hot-toast";
import api from "../services/api";

export default function ShareModal({ listId, isOpen, onClose }) {
  const [busy, setBusy] = React.useState(false);
  const [token, setToken] = React.useState("");
  const inputRef = React.useRef(null);

  const shareUrl = token ? `${window.location.origin}/share/${token}` : "";

  // Create/ensure token when modal opens
  React.useEffect(() => {
    let cancelled = false;
    async function ensureToken() {
      if (!isOpen || !listId) return;
      try {
        setBusy(true);
        const { data } = await api.post(`/dashboard/${listId}/share`);
        if (!cancelled) setToken(data.token);
      } catch (e) {
        console.error(e);
        if (!cancelled) toast.error("Could not create share link");
        // stay open; user may try again
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    ensureToken();
    return () => {
      cancelled = true;
    };
  }, [isOpen, listId]);

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success("Copied!");
        return true;
      }
    } catch {
      /* fall through */
    }
    // Fallback for iOS Safari & older browsers
    try {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.select();
        // Some iOS need setSelectionRange
        el.setSelectionRange(0, text.length);
        const ok = document.execCommand("copy");
        if (ok) {
          toast.success("Copied!");
          return true;
        }
      }
    } catch {
      /* ignore */
    }
    toast.error("Copy not supported on this device.");
    return false;
  }

  async function onCopyUrl() {
    if (!shareUrl) return;
    await copyToClipboard(shareUrl);
  }

  async function onRevoke() {
    if (!listId) return;
    try {
      setBusy(true);
      await api.post(`/dashboard/${listId}/share/revoke`);
      setToken("");
      toast("Share link revoked");
    } catch (e) {
      console.error(e);
      toast.error("Could not revoke link");
    } finally {
      setBusy(false);
    }
  }

  // Keep Escape key closing the modal
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      role="modal"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onMouseDown={(e) => {
        // close on backdrop click (but not when clicking content)
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 rounded-lg shadow-xl bg-base-100 ring-1 ring-black/10">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2
            id="share-modal-title"
            className="text-lg font-semibold text-primary"
          >
            Share this gear list
          </h2>
          <button
            className="p-2 rounded hover:bg-base-200"
            aria-label="Close"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Share URL */}
          <div>
            <label className="block text-sm text-secondary mb-1">
              Shareable URL
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                readOnly
                className="flex-1 input input-bordered"
                value={shareUrl}
                placeholder={busy ? "Generating…" : "No active link"}
              />
              <button
                className="btn btn-primary flex items-center gap-2"
                onClick={onCopyUrl}
                disabled={busy || !token}
                title="Copy link"
              >
                <FaCopy /> Copy
              </button>
            </div>
            <p className="mt-1 text-xs text-secondary">
              Anyone with this link can view a read-only version of your list.
            </p>
          </div>

          {/* (Future) Embed snippet */}
          <div>
            <label className="block text-sm text-secondary mb-1">
              Embeddable snippet (coming soon)
            </label>
            <div className="flex gap-2">
              <textarea
                className="flex-1 textarea textarea-bordered"
                rows={2}
                readOnly
                value={
                  token
                    ? `<iframe src="${window.location.origin}/share/${token}" style="width:100%;height:600px;border:0;" loading="lazy"></iframe>`
                    : ""
                }
                placeholder="Not available yet"
              />
              <button
                className="btn btn-ghost flex items-center gap-2"
                disabled
              >
                <FaCode /> Copy
              </button>
            </div>
          </div>

          {/* (Future) CSV */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-secondary">
              Export CSV (coming soon)
            </div>
            <button className="btn btn-ghost flex items-center gap-2" disabled>
              <FaFileCsv /> Download
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-between">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-error flex items-center gap-2"
            onClick={onRevoke}
            disabled={busy || !token}
            title="Revoke link"
          >
            <FaBan /> Revoke link
          </button>
        </div>
      </div>
    </div>
  );
}
