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
  const listRef = useRef(null); // scroll container for IO root
  const reqSeq = useRef(0); // guards against out-of-order responses

  // Load BRAND facet options constrained by current itemType (symmetry)
  const loadBrandFacets = useCallback(
    async (currentItemType = "") => {
      try {
        const res = await getAwinFacets({
          region,
          ...(merchantId && { merchantId }),
          ...(currentItemType && { itemType: currentItemType }),
          limit: 50,
        });
        const next = (res.brands || []).filter((b) => b?.value && b?.count > 0);
        setBrandOpts(next);
      } catch (e) {
        console.warn("brand facets error", e?.message || e);
      }
    },
    [region, merchantId]
  );

  // Load ITEM TYPE facet options constrained by current brand (symmetry)
  const loadTypeFacets = useCallback(
    async (currentBrand = "") => {
      try {
        const res = await getAwinFacets({
          region,
          ...(merchantId && { merchantId }),
          ...(currentBrand && { brand: currentBrand }),
          limit: 50,
        });
        const next = (res.itemTypes || []).filter(
          (t) => t?.value && t?.count > 0
        );
        setTypeOpts(next);
      } catch (e) {
        console.warn("type facets error", e?.message || e);
      }
    },
    [region, merchantId]
  );

  // normalize strings for tolerant comparisons (pads vs pad, case, symbols)
  const norm = useCallback((s = "") => {
    return String(s)
      .toLowerCase()
      .replace(/\s*&\s*/g, " and ")
      .replace(/[^a-z0-9]+/gi, " ")
      .trim()
      .replace(/s\b/g, ""); // basic plural->singular (pads->pad)
  }, []);

  // Local safety filter to mirror selected facets (covers API mismatch)
  const applyLocalFilter = useCallback(
    (list) => {
      const wantBrand = norm(brand);
      const wantType = norm(itemType);
      return list.filter((it) => {
        const brandOk = !wantBrand || norm(it.brand) === wantBrand; // itemType can live either on it.itemType or as the leaf of categoryPath
        const leaf = it.categoryPath?.slice?.(-1)?.[0];
        const typeVal = it.itemType || leaf || "";
        const typeOk = !wantType || norm(typeVal) === wantType;
        return brandOk && typeOk;
      });
    },
    [brand, itemType, norm]
  );

  // Initial facet loads (no constraints)
  useEffect(() => {
    loadBrandFacets("");
    loadTypeFacets("");
  }, [loadBrandFacets, loadTypeFacets]);

  // When itemType changes, narrow BRAND options
  useEffect(() => {
    loadBrandFacets(itemType);
  }, [itemType, loadBrandFacets]);

  // When brand changes, narrow ITEM TYPE options
  useEffect(() => {
    loadTypeFacets(brand);
  }, [brand, loadTypeFacets]);

  // Search with current q + filters (fresh page)
  const runSearch = useCallback(
    async (pageNum = 1) => {
      setBusy(true);
      setError("");
      const seq = ++reqSeq.current;
      try {
        const params = {
          q: debouncedQ || "",
          region,
          ...(merchantId && { merchantId }),
          // Send canonical keys...
          ...(brand && { brand }),
          ...(itemType && { itemType }),
          // ...and common aliases some backends expect:
          ...(brand && { brandExact: brand }),
          ...(itemType && { categoryLeaf: itemType }),
          page: pageNum,
          limit,
          sort: debouncedQ ? "relevance" : "-updated",
        };
        const res = await searchAwinProducts(params);
        // If a newer request finished, ignore this response
        if (seq !== reqSeq.current) return;

        const pageItems = Array.isArray(res.items) ? res.items : [];
        const filtered = applyLocalFilter(pageItems);
        if (pageNum === 1) {
          setItems(filtered);
        } else {
          setItems((prev) => [...prev, ...filtered]);
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
    [debouncedQ, region, merchantId, brand, itemType, limit, applyLocalFilter]
  );

  // Reset to page 1 when q or filters change
  useEffect(() => {
    // Clear list & scroll to top to avoid mixing old/new pages
    setItems([]);
    setPage(1);
    setHasMore(false);
    listRef.current?.scrollTo?.({ top: 0, behavior: "auto" });
    runSearch(1);
  }, [runSearch]);

  // Infinite scroll: observe sentinel at list bottom
  useEffect(() => {
    if (!hasMore || busy) return;
    const sentinel = sentinelRef.current;
    const root = listRef.current;
    if (!sentinel || !root) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !busy) {
          runSearch(page + 1);
        }
      },
      { root, rootMargin: "200px", threshold: 0.1 }
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
            {brandOpts.length === 0 && (
              <option value="" disabled>
                No brands for this selection
              </option>
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
            {typeOpts.length === 0 && (
              <option value="" disabled>
                No item types for this selection
              </option>
            )}
          </select>
        </div>
      </div>

      {error ? <div className="text-xs text-red-600">{error}</div> : null}

      {/* Results (fixed height to avoid modal jumping) */}
      <div
        ref={listRef}
        className="flex flex-col gap-1.5 h-64 sm:h-72 overflow-auto border border-primary/30 rounded-md p-1.5"
      >
        {!busy && items.length === 0 && (
          <div className="text-sm text-primary/70 p-2">
            No results for that selection.
          </div>
        )}
        {items.map((p) => (
          <div
            key={p._id || p.externalProductId}
            className="flex gap-2 items-center border border-primary/20 rounded p-1.5"
          >
            {p.imageUrl ? (
              <img
                src={p.imageUrl}
                alt={p.name}
                className="w-7 h-7 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded bg-primary/10" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-sm text-primary line-clamp-1">
                {p.name}
              </div>
              {/* <div className="text-xs text-primary/80 truncate">
                {p.brand || p.merchantName} •{" "}
                {p.itemType || (p.categoryPath?.slice?.(-1)[0] ?? "")}
                {typeof p.price === "number"
                  ? ` • ${p.price} ${p.currency || ""}`
                  : ""}
              </div> */}
              {/* <div className="text-xs opacity-70">
                {p.merchantName || p.merchantId} · {p.region}
              </div> */}
            </div>
            <button
              type="button"
              className="p-1 rounded bg-secondary text-white hover:bg-secondary-700"
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
        {/* No button needed; infinite scroll handles paging */}
      </div>
    </div>
  );
}
