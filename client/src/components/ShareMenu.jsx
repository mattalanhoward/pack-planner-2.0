// client/src/components/ShareMenu.jsx
import React from "react";
import { FaLink, FaCode, FaFileCsv, FaBan } from "react-icons/fa";
import { toast } from "react-hot-toast";
import api from "../services/api";

export default function ShareMenu({ listId }) {
  const [busy, setBusy] = React.useState(false);

  async function handleCopyUrl() {
    try {
      setBusy(true);
      const { data } = await api.post(`/dashboard/${listId}/share`);
      const url = `${window.location.origin}/share/${data.token}`;
      await navigator.clipboard.writeText(url);
      toast.success("Shareable URL copied");
    } catch (e) {
      console.error(e);
      toast.error("Could not create share link");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke() {
    try {
      setBusy(true);
      await api.post(`/dashboard/${listId}/share/revoke`);
      toast("Share link revoked");
    } catch (e) {
      console.error(e);
      toast.error("Could not revoke link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-2 py-1">
      <div className="text-xs font-semibold text-primary uppercase mb-2">
        Share
      </div>

      <button
        className="flex items-center gap-2 w-full text-left py-1 disabled:opacity-50"
        onClick={handleCopyUrl}
        disabled={busy}
      >
        <FaLink /> Shareable URL
      </button>

      <button
        className="flex items-center gap-2 w-full text-left py-1 opacity-50 cursor-not-allowed"
        disabled
      >
        <FaCode /> Embeddable (soon)
      </button>

      <button
        className="flex items-center gap-2 w-full text-left py-1 opacity-50 cursor-not-allowed"
        disabled
      >
        <FaFileCsv /> CSV download (soon)
      </button>

      <div className="h-px bg-gray-200 my-2" />

      <button
        className="flex items-center gap-2 w-full text-left py-1 text-red-600 disabled:opacity-50"
        onClick={handleRevoke}
        disabled={busy}
      >
        <FaBan /> Revoke link
      </button>
    </div>
  );
}
