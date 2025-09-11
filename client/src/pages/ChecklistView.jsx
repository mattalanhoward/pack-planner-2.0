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
 * Screen: interactive checklist (2-col grid)
 * Print: dedicated two-column table DOM (mobile & desktop consistent),
 *        repeating header, totals-only, blank checkboxes, no split categories.
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

  // Build the print columns (must be before any early returns to keep hook order stable)
  const { leftCols, rightCols } = useMemo(() => {
    // Greedy balance by item counts for similar column heights
    const left = [];
    const right = [];
    const totalItems = grouped.reduce((a, g) => a + g.items.length, 0);
    const target = totalItems / 2;
    let acc = 0;
    for (const g of grouped) {
      if (acc <= target) {
        left.push(g);
        acc += g.items.length;
      } else {
        right.push(g);
      }
    }
    if (left.length === 0 && right.length > 0) left.push(right.shift());
    return { leftCols: left, rightCols: right };
  }, [grouped]);

  // ---- Skeleton while loading ----
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
      {/* Header: brand + actions (screen only) */}
      <header className="border-b bg-base-100 print:hidden">
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

      {/* ---------- SCREEN CONTENT (interactive) ---------- */}
      <main className="mx-auto max-w-5xl px-4 py-6 print:hidden">
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
              <div className="text-sm font-medium">
                Packed {packed} / {total}
              </div>
              <div className="mt-1 h-2 w-48 overflow-hidden rounded-full bg-base-200">
                <div
                  className="h-full bg-emerald-600"
                  style={{ width: `${pct}%` }}
                  aria-label={`Progress ${pct}%`}
                />
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

        {/* 2-column categories (screen) */}
        <div className="grid gap-4 md:grid-cols-2">
          {grouped.map(({ cat, items }) => {
            const cTotal = items.length;
            const cPacked = items.filter((i) => checked[i._id]).length;
            return (
              <section key={cat._id} className="break-inside-avoid">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {cat.title || cat.name}
                  </h2>
                  <div className="text-sm text-secondary">
                    {cPacked} / {cTotal}
                  </div>
                </div>
                <ul className="divide-y divide-base-200 rounded-xl border bg-base-100">
                  {items.map((item) => {
                    const label = `${
                      item.itemType ? item.itemType + " - " : ""
                    }${item.name}`;
                    return (
                      <li
                        key={item._id}
                        className="flex items-center gap-2 px-3 py-2"
                      >
                        <input
                          id={`cb-${item._id}`}
                          type="checkbox"
                          className="h-4 w-4 rounded border-base-300 text-emerald-600 focus:ring-emerald-600"
                          checked={!!checked[item._id]}
                          onChange={() => toggle(item._id)}
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

      {/* ---------- PRINT CONTENT (two-column table, totals only, blank boxes) ---------- */}
      <div className="hidden print:block px-4">
        <table className="w-full print-table">
          <thead>
            <tr>
              <th colSpan={2} className="align-bottom">
                {/* Brand strip + list meta (repeats on every page) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={logo}
                      alt="TrekList logo"
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "9999px",
                      }}
                    />
                    <div className="leading-tight">
                      <div
                        className="font-semibold"
                        style={{ fontSize: "12pt" }}
                      >
                        TrekList
                      </div>
                      <div
                        className="text-secondary"
                        style={{ fontSize: "8.5pt" }}
                      >
                        treklist.co
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold" style={{ fontSize: "12pt" }}>
                      {tripMeta.title}
                    </div>
                    <div className="text-secondary" style={{ fontSize: "9pt" }}>
                      {tripMeta.dates}
                      {tripMeta.nights != null &&
                        ` · ${tripMeta.nights} ${
                          tripMeta.nights === 1 ? "night" : "nights"
                        }`}
                      {tripMeta.location && ` · ${tripMeta.location}`}
                    </div>
                    <div className="mt-1" style={{ fontSize: "10pt" }}>
                      Total items: {total}
                    </div>
                  </div>
                </div>
                <div style={{ height: "10mm" }} />{" "}
                {/* breathing room under header */}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* LEFT COLUMN */}
              <td className="align-top" style={{ width: "50%" }}>
                {leftCols.map(({ cat, items }) => (
                  <section
                    key={cat._id}
                    className="print-category"
                    style={{ marginBottom: "8px" }}
                  >
                    <div className="flex items-center justify-between">
                      <h2 style={{ fontSize: "11.5pt", fontWeight: 600 }}>
                        {cat.title || cat.name}
                      </h2>
                      <div
                        className="text-secondary"
                        style={{ fontSize: "9.5pt" }}
                      >
                        Total: {items.length}
                      </div>
                    </div>
                    <ul className="print-ul">
                      {items.map((item) => {
                        const label = `${
                          item.itemType ? item.itemType + " - " : ""
                        }${item.name}`;
                        return (
                          <li key={item._id} className="print-row">
                            <span className="checkbox-print" aria-hidden />
                            <span className="font-medium">{label}</span>
                            {item.quantity > 1 && (
                              <span className="qty">×{item.quantity}</span>
                            )}
                            <span className="icons">
                              {item.worn && <span className="ico">👕</span>}
                              {item.consumable && (
                                <span className="ico">🍴</span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </td>

              {/* RIGHT COLUMN */}
              <td className="align-top" style={{ width: "50%" }}>
                {rightCols.map(({ cat, items }) => (
                  <section
                    key={cat._id}
                    className="print-category"
                    style={{ marginBottom: "8px" }}
                  >
                    <div className="flex items-center justify-between">
                      <h2 style={{ fontSize: "11.5pt", fontWeight: 600 }}>
                        {cat.title || cat.name}
                      </h2>
                      <div
                        className="text-secondary"
                        style={{ fontSize: "9.5pt" }}
                      >
                        Total: {items.length}
                      </div>
                    </div>
                    <ul className="print-ul">
                      {items.map((item) => {
                        const label = `${
                          item.itemType ? item.itemType + " - " : ""
                        }${item.name}`;
                        return (
                          <li key={item._id} className="print-row">
                            <span className="checkbox-print" aria-hidden />
                            <span className="font-medium">{label}</span>
                            {item.quantity > 1 && (
                              <span className="qty">×{item.quantity}</span>
                            )}
                            <span className="icons">
                              {item.worn && <span className="ico">👕</span>}
                              {item.consumable && (
                                <span className="ico">🍴</span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Print styles (scoped) */}
      <style>{`
        @page { margin: 14mm 12mm; } /* generous top & side margins for mobile/desktop */
        @media print {
          /* Two-column table that works on iOS/Android/desktop */
          table.print-table {
            border-collapse: separate;    /* allow a real gutter */
            border-spacing: 12mm 0;       /* center gutter width */
            width: 100%;
          }
          table.print-table thead { display: table-header-group; } /* repeat each page */
          table.print-table th, table.print-table td { border: none !important; padding: 0; }

          /* Keep each category intact; if it won't fit, move to next page */
          .print-category { break-inside: avoid-page; page-break-inside: avoid; }

          /* Compact rows to fit ~50 items per page */
          .print-ul { list-style: none; margin: 0; padding: 0; }
          .print-row { display: flex; align-items: center; gap: 6px; padding: 2px 0; font-size: 9.5pt; }
          .checkbox-print { width: 12px; height: 12px; border: 1px solid #000; margin-right: 6px; display: inline-block; }
          .qty { margin-left: 8px; font-size: 8.5pt; color: #555; }
          .icons { margin-left: auto; display: inline-flex; gap: 6px; color: #555; font-size: 10pt; }
          .ico { line-height: 1; }

          body { background: #fff; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
