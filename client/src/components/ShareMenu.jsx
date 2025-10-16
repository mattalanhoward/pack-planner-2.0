// client/src/components/ShareMenu.jsx
import React from "react";
import { FaLink, FaCode, FaFileCsv, FaBan } from "react-icons/fa";
import { toast } from "react-hot-toast";
import api, { refreshAccessToken } from "../services/api";

/**
 * Share menu
 * - On 401 (stale access token or missing refresh cookie on mobile), try a silent refresh once.
 * - If refresh fails, redirect to Landing with login modal and a `next` that returns to the same list.
 */
export default function ShareMenu({ listId }) {
  const [busy, setBusy] = React.useState(false);

  // helper: try POST, on 401 do a silent refresh once, then retry
  const postWithAuthRetry = async (url, data = null) => {
    try {
      return await api.post(url, data, { __noGlobal401: true });
    } catch (e) {
      if (e?.response?.status === 401) {
        try {
          await refreshAccessToken(); // may set a new access token if refresh cookie is valid
          return await api.post(url, data, { __noGlobal401: true });
        } catch {
          // kick to login with intent to reopen/share when back
          const next = encodeURIComponent(`/dashboard/${listId}?openShare=1`);
          window.location.href = `/?auth=login&next=${next}`;
          // throw to stop local flow
          throw e;
        }
      }
      throw e;
    }
  };

  async function handleCopyUrl() {
    try {
      setBusy(true);
      const { data } = await postWithAuthRetry(`/dashboard/${listId}/share`);
      const url = `${window.location.origin}/share/${data.token}`;

      // copy to clipboard with fallback
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success("Shareable URL copied");
    } catch (e) {
      // if we redirected to login above, we won’t reach this; otherwise show error
      console.error(e);
      toast.error(e?.response?.data?.message || "Could not create share link");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke() {
    try {
      setBusy(true);
      await postWithAuthRetry(`/dashboard/${listId}/share/revoke`);
      toast("Share link revoked");
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Could not revoke link");
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
