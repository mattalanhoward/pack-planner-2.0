// client/src/pages/ChecklistView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaPrint,
  FaUndoAlt,
  FaTshirt,
  FaUtensils,
  FaChevronLeft,
} from "react-icons/fa";
import api from "../services/api";
import useAuth from "../hooks/useAuth";
import useChecklistProgress from "../hooks/useChecklistProgress";
import logo from "../assets/images/logo.png";

/**
 * v1: local-only checklist, 2-column screen + print, icons for worn/consumable.
 */
export default function ChecklistView() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [full, setFull] = useState({ list: null, categories: [], items: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const { data } = await api.get(`/dashboard/${listId}/full`);
        if (aborted) return;
        setFull({
          list: data.list,
          categories: data.categories,
          items: data.items,
        });
        setError(null);
      } catch (e) {
        console.error("Failed to load checklist data", e);
        if (!aborted) setError(e);
      } finally {
        if (!aborted) setLoading(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [listId]);

  const revision = useMemo(() => {
    // Use updatedAt + item count as a simple, idempotent revision key
    const u = full.list?.updatedAt || "";
    return `${u}:${full.items?.length || 0}`;
  }, [full.list?.updatedAt, full.items]);

  const { checked, toggle, reset } = useChecklistProgress({
    userId: user?._id || "anon",
    listId,
    revision,
  });

  const grouped = useMemo(() => {
    const map = new Map();
    for (const cat of full.categories) map.set(cat._id, { cat, items: [] });
    for (const it of full.items) {
      if (map.has(it.category)) map.get(it.category).items.push(it);
    }
    // Only render categories that have items
    return [...map.values()].filter((g) => g.items.length > 0);
  }, [full.categories, full.items]);

  const allItems = useMemo(() => full.items || [], [full.items]);
  const total = allItems.length;
  const packed = allItems.filter((i) => checked[i._id]).length;
  const pct = total ? Math.round((packed / total) * 100) : 0;

  const tripMeta = useMemo(() => {
    const s = full.list?.tripStart ? new Date(full.list.tripStart) : null;
    const e = full.list?.tripEnd ? new Date(full.list.tripEnd) : null;
    const nights =
      s && e ? Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24))) : null;
    return {
      title: full.list?.title || "Gear List",
      location: full.list?.location || "",
      dates:
        s && e
          ? s.toLocaleDateString() + " – " + e.toLocaleDateString()
          : s
          ? s.toLocaleDateString()
          : "",
      nights,
    };
  }, [full.list]);

  useEffect(() => {
    document.title = `${tripMeta.title} · Checklist`;
  }, [tripMeta.title]);

  // ---- Skeleton while loading (2 columns, grey boxes) ----
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral/50 text-primary">
        <header className="border-b bg-base-100 print:hidden">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
            <div className="h-5 w-20 bg-base-200 rounded animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-base-200 animate-pulse" />
              <div className="leading-tight">
                <div className="h-4 w-24 bg-base-200 rounded animate-pulse" />
                <div className="mt-1 h-3 w-20 bg-base-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-8 w-28 bg-base-200 rounded animate-pulse" />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">
          <section className="mb-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="h-6 w-64 bg-base-200 rounded animate-pulse" />
                <div className="mt-2 h-4 w-48 bg-base-200 rounded animate-pulse" />
              </div>
              <div className="text-right">
                <div className="h-4 w-28 bg-base-200 rounded animate-pulse" />
                <div className="mt-1 h-2 w-48 bg-base-200 rounded animate-pulse" />
              </div>
            </div>
          </section>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <section key={i} className="break-inside-avoid">
                <div className="mb-2 flex items-center justify-between">
                  <div className="h-5 w-32 bg-base-200 rounded animate-pulse" />
                  <div className="h-4 w-10 bg-base-200 rounded animate-pulse" />
                </div>
                <ul className="divide-y divide-base-200 rounded-xl border bg-base-100">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <li key={j} className="flex items-center gap-2 px-3 py-2">
                      <div className="h-4 w-4 rounded bg-base-200 animate-pulse" />
                      <div className="h-4 w-40 bg-base-200 rounded animate-pulse" />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!full.list && error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-secondary">
        Could not load this list.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral/50 text-primary">
      {/* Header: brand + actions (actions hidden when printing) */}
      <header className="border-b bg-base-100 print:border-none print:pb-2">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(`/dashboard/${listId}`)}
            className="no-print inline-flex items-center gap-2 text-secondary hover:text-primary"
            aria-label="Back to gear list"
          >
            <FaChevronLeft /> Back
          </button>

          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="TrekList logo"
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="leading-tight">
              <div className="font-semibold text-lg tracking-tight">
                TrekList
              </div>
              <div className="text-xs text-secondary">treklist.co</div>
            </div>
          </div>

          <div className="no-print flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-base-200"
            >
              <FaPrint /> Print
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-base-200"
            >
              <FaUndoAlt /> Reset
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 print:py-4">
        {/* Title + progress */}
        <section className="mb-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {tripMeta.title}
              </h1>
              <p className="text-sm text-secondary">
                {tripMeta.dates}
                {tripMeta.nights != null && (
                  <>
                    {" "}
                    · {tripMeta.nights}{" "}
                    {tripMeta.nights === 1 ? "night" : "nights"}
                  </>
                )}
                {tripMeta.location && <> · {tripMeta.location}</>}
              </p>
            </div>
            <div className="text-right">
              {/* Screen: packed/total + progress bar */}
              <div className="text-sm font-medium print:hidden">
                Packed {packed} / {total}
              </div>
              <div className="mt-1 h-2 w-48 overflow-hidden rounded-full bg-base-200 print:hidden">
                <div
                  className="h-full bg-emerald-600"
                  style={{ width: `${pct}%` }}
                  aria-label={`Progress ${pct}%`}
                />
              </div>
              {/* Print: only total count */}
              <div className="hidden text-sm font-medium print:block">
                Total items: {total}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-4 text-xs text-secondary">
            <div className="flex items-center gap-1">
              <FaTshirt className="h-3.5 w-3.5" /> worn
            </div>
            <div className="flex items-center gap-1">
              <FaUtensils className="h-3.5 w-3.5" /> consumable
            </div>
          </div>
        </section>

        {/* 2-column categories */}
        <div className="grid gap-4 md:grid-cols-2 print-two-col">
          {grouped.map(({ cat, items }) => {
            const cTotal = items.length;
            const cPacked = items.filter((i) => checked[i._id]).length;
            return (
              <section key={cat._id} className="category break-inside-avoid">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {cat.title || cat.name}
                  </h2>
                  <div className="text-sm text-secondary">
                    <span className="print:hidden">
                      {cPacked} / {cTotal}
                    </span>
                    <span className="hidden print:inline">Total: {cTotal}</span>
                  </div>
                </div>
                <ul className="divide-y divide-base-200 rounded-xl border bg-base-100 print:border-0 print:divide-base-300">
                  {items.map((item) => {
                    const label = `${
                      item.itemType ? item.itemType + " - " : ""
                    }${item.name}`;
                    return (
                      <li
                        key={item._id}
                        className="row flex items-center gap-2 px-3 py-2"
                      >
                        {/* Screen: real interactive checkbox */}
                        <input
                          id={`cb-${item._id}`}
                          type="checkbox"
                          className="h-4 w-4 rounded border-base-300 text-emerald-600 focus:ring-emerald-600 print:hidden"
                          checked={!!checked[item._id]}
                          onChange={() => toggle(item._id)}
                        />
                        {/* Print: always show a blank square, regardless of state */}
                        <span
                          className="hidden print:inline-block checkbox-print"
                          aria-hidden
                        />
                        <label
                          htmlFor={`cb-${item._id}`}
                          className="flex-1 cursor-pointer select-none"
                        >
                          <span className="font-medium">{label}</span>
                          {item.quantity > 1 && (
                            <span className="ml-2 rounded bg-base-200 px-2 py-0.5 text-xs text-secondary">
                              ×{item.quantity}
                            </span>
                          )}
                        </label>
                        <div className="flex items-center gap-2 text-secondary">
                          {item.worn && (
                            <FaTshirt className="h-4 w-4" aria-label="worn" />
                          )}
                          {item.consumable && (
                            <FaUtensils
                              className="h-4 w-4"
                              aria-label="consumable"
                            />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </main>

      {/* Print tweaks (scoped) */}
      <style>{`
        @page { margin: 8mm; }
        @media print {
          .no-print { display: none !important; }
          /* 2 columns on print (override grid) */
          .print-two-col { display: block !important; column-count: 2; column-gap: 16px; }
          .print-two-col > .category { break-inside: avoid; page-break-inside: avoid; margin-bottom: 8px; }
          .row { padding-top: 2px !important; padding-bottom: 2px !important; }
          body { background: #fff; font-size: 9.5pt; }
          h1 { font-size: 15pt; }
          h2 { font-size: 11.5pt; }
          /* Fallback: hide any checkbox that slipped through without print:hidden */
          input[type="checkbox"] { display: none !important; }
          .checkbox-print { width: 12px; height: 12px; border: 1px solid #000; margin-right: 8px; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
