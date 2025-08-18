// src/components/AffiliateProductPicker.jsx
import { useCallback, useEffect, useState } from "react";
import { searchAwinProducts } from "../services/affiliates";
import { FaPlus } from "react-icons/fa";

function useDebouncedValue(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/**
 * Props:
 * - region: ISO country code like "GB" (required; passed from parent)
 * - merchantId?: string (optional hidden filter)
 * - onPick(product): function (required)
 */
export default function AffiliateProductPicker({
  region,
  merchantId = "",
  onPick,
}) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");

  const debouncedQ = useDebouncedValue(q, 300);
  const limit = 24;

  const doSearch = useCallback(
    async (opts = {}) => {
      setBusy(true);
      setError("");
      try {
        const params = {
          q: debouncedQ || "",
          region,
          ...(merchantId && { merchantId }),
          page: opts.page || 1,
          limit,
          sort: debouncedQ ? "relevance" : "-updated",
        };
        const res = await searchAwinProducts(params);
        setItems(res.items);
        setTotal(res.total);
        setPage(res.page);
        setHasMore(res.hasMore);
      } catch (e) {
        setError(e?.response?.data?.message || e.message || "Search failed.");
      } finally {
        setBusy(false);
      }
    },
    [debouncedQ, region, merchantId]
  );

  useEffect(() => {
    setPage(1);
    doSearch({ page: 1 });
  }, [debouncedQ, region, merchantId, doSearch]);

  const nextPage = async () => {
    if (!hasMore || busy) return;
    setBusy(true);
    try {
      const res = await searchAwinProducts({
        q: debouncedQ || "",
        region,
        ...(merchantId && { merchantId }),
        page: page + 1,
        limit,
        sort: debouncedQ ? "relevance" : "-updated",
      });
      setItems((prev) => [...prev, ...res.items]);
      setPage(res.page);
      setHasMore(res.hasMore);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Search failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search only */}
      <div>
        <label className="block text-xs sm:text-sm font-medium text-primary mb-0.5">
          Search
        </label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Brand or product (e.g., Osprey pack)"
          className="mt-0.5 block w-full border border-primary rounded p-2 text-primary text-sm"
        />
      </div>

      {error ? <div className="text-xs text-red-600">{error}</div> : null}

      <div className="grid grid-cols-1 gap-2 h-56 sm:h-64 overflow-auto border border-primary/30 rounded-md p-2">
        {items.map((p) => (
          <div
            key={p._id}
            className="flex gap-3 items-center border border-primary/20 rounded-md p-2"
          >
            {p.imageUrl ? (
              <img
                src={p.imageUrl}
                alt={p.name}
                className="w-14 h-14 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded bg-primary/10" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-primary line-clamp-2">
                {p.name}
              </div>
              <div className="text-xs text-primary/80 truncate">
                {p.brand || p.merchantName} • {p.price ?? "—"}{" "}
                {p.currency || ""}
              </div>
            </div>
            <button
              type="button"
              className="p-2 rounded bg-secondary text-white hover:bg-secondary-700"
              aria-label="Use this product"
              title="Use this product"
              onClick={() => onPick(p)}
            >
              <FaPlus />
            </button>
          </div>
        ))}
        {!busy && items.length === 0 ? (
          <div className="text-sm text-primary/70 px-1">No results.</div>
        ) : null}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-xs text-primary/70">
          Page {page}, {items.length}/{total}
        </div>
        <button
          type="button"
          className="px-3 py-1 rounded border text-sm disabled:opacity-50"
          onClick={nextPage}
          disabled={!hasMore || busy}
        >
          {busy ? "Loading…" : hasMore ? "Load more" : "No more"}
        </button>
      </div>
    </div>
  );
}
