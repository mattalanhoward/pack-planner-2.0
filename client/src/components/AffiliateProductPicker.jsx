import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { searchAwinProducts, getAwinFacets } from "../services/affiliates";
import { FaPlus } from "react-icons/fa";

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/**
 * Props:
 * - region (required)
 * - merchantId? (optional hidden filter)
 * - onPick(product) (required)
 * - pageSize? default 10 (smaller to make paging visible)
 */
export default function AffiliateProductPicker({
  region,
  merchantId = "",
  onPick,
  pageSize = 10,
}) {
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [itemType, setItemType] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [brandOpts, setBrandOpts] = useState([]);
  const [typeOpts, setTypeOpts] = useState([]);

  const debouncedQ = useDebounced(q, 300);
  const limit = pageSize;
  const sentinelRef = useRef(null);

  // Load facets (independent of q)
  const loadFacets = useCallback(async () => {
    try {
      const res = await getAwinFacets({
        region,
        ...(merchantId && { merchantId }),
        limit: 50,
      });
      setBrandOpts(res.brands || []);
      setTypeOpts(res.itemTypes || []);
    } catch (e) {
      // Non-fatal for UI
      console.warn("facets error", e?.message || e);
    }
  }, [region, merchantId]);

  useEffect(() => {
    loadFacets();
  }, [loadFacets]);

  // Search with current q + filters (fresh page)
  const runSearch = useCallback(
    async (pageNum = 1) => {
      setBusy(true);
      setError("");
      try {
        const params = {
          q: debouncedQ || "",
          region,
          ...(merchantId && { merchantId }),
          ...(brand && { brand }),
          ...(itemType && { itemType }),
          page: pageNum,
          limit,
          sort: debouncedQ ? "relevance" : "-updated",
        };
        const res = await searchAwinProducts(params);
        if (pageNum === 1) {
          setItems(res.items);
        } else {
          setItems((prev) => [...prev, ...res.items]);
        }
        setTotal(res.total);
        setPage(res.page);
        setHasMore(res.hasMore);
      } catch (e) {
        setError(e?.response?.data?.message || e.message || "Search failed.");
      } finally {
        setBusy(false);
      }
    },
    [debouncedQ, region, merchantId, brand, itemType, limit]
  );

  // Reset to page 1 when q or filters change
  useEffect(() => {
    runSearch(1);
  }, [runSearch]);

  // Infinite scroll: observe sentinel at list bottom
  useEffect(() => {
    if (!hasMore || busy) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !busy) {
          runSearch(page + 1);
        }
      },
      { root: sentinel.parentElement, rootMargin: "200px", threshold: 0.1 }
    );

    io.observe(sentinel);
    return () => io.disconnect();
  }, [hasMore, busy, page, runSearch]);

  // UI
  return (
    <div className="space-y-3">
      {/* Search */}
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

      {/* Filters (independent of q) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-primary mb-0.5">
            Brand
          </label>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-0.5 block w-full border border-primary rounded p-2 text-primary text-sm"
          >
            <option value="">All</option>
            {brandOpts.map((b) =>
              b.value ? (
                <option key={b.value} value={b.value}>
                  {b.value} ({b.count})
                </option>
              ) : null
            )}
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-primary mb-0.5">
            Item Type
          </label>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className="mt-0.5 block w-full border border-primary rounded p-2 text-primary text-sm"
          >
            <option value="">All</option>
            {typeOpts.map((t) =>
              t.value ? (
                <option key={t.value} value={t.value}>
                  {t.value} ({t.count})
                </option>
              ) : null
            )}
          </select>
        </div>
      </div>

      {error ? <div className="text-xs text-red-600">{error}</div> : null}

      {/* Results */}
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
        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} />
      </div>

      <div className="flex justify-between items-center">
        <div className="text-xs text-primary/70">
          {busy ? "Loading…" : `Showing ${items.length}/${total}`}
        </div>
        {/* Remove the manual load-more button; infinite scroll handles it */}
      </div>
    </div>
  );
}
