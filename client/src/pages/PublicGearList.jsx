// client/src/pages/PublicGearList.jsx
import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  FaBalanceScale,
  FaUtensils,
  FaTshirt,
  FaShoppingCart,
  FaDollarSign,
} from "react-icons/fa";
import api, { refreshAccessToken } from "../services/api";
// tiny class combiner to avoid pulling in classnames
const cx = (...parts) => parts.filter(Boolean).join(" ");

// helpers
function gToOz(g) {
  if (typeof g !== "number") return null;
  return g / 28.349523125;
}

function formatCurrencyUSD(value) {
  if (typeof value !== "number") return "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export default function PublicGearList() {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const copyRanRef = React.useRef(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [data, setData] = React.useState(null);
  const [unit, setUnit] = React.useState("g"); // "g" | "oz"

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        const { data } = await api.get(`/public/share/${token}/full`);
        if (!cancelled) {
          setData(data);
          setError("");
        }
      } catch (e) {
        console.error(e);
        if (!cancelled)
          setError(e.response?.data?.error || "Failed to load list");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // If ?copy=1 is present, attempt copy automatically after mount (post-auth return)
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("copy") === "1" && !copyRanRef.current) {
      copyRanRef.current = true; // guard against React StrictMode double-invoke
      attemptCopy(); // fire and forget; it will redirect on success
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  async function attemptCopy() {
    try {
      const { data: resp } = await api.post(
        `/public/share/${token}/copy`,
        null,
        { __noGlobal401: true } // <-- let us handle 401 here
      ); // success → go to new list
      const newId = resp.listId || resp.list?._id;
      if (newId) {
        navigate(`/dashboard/${newId}`, { replace: true });
      } else {
        // Safety net: if API shape changes
        window.location.href = "/dashboard";
      }
    } catch (e) {
      if (e.response?.status === 401) {
        // Token may be expired but user has a refresh cookie — try a silent refresh once.
        try {
          await refreshAccessToken(); // sets new access token if possible
          const { data: retry } = await api.post(
            `/public/share/${token}/copy`,
            null,
            { __noGlobal401: true }
          );
          const newId2 = retry.listId || retry.list?._id;
          if (newId2) {
            navigate(`/dashboard/${newId2}`, { replace: true });
            return;
          }
        } catch {
          // Silent refresh failed → treat as anonymous and go to auth with `next`
          const nextUrl = encodeURIComponent(`/share/${token}?copy=1`);
          // Go to Landing, opening the register modal and preserving `next`
          window.location.href = `/?auth=register&next=${nextUrl}`;
          return;
        }
      }
      // Other errors → surface and stay
      console.error(e);
      alert(e.response?.data?.error || "Could not copy this list.");
    }
  }

  // document title + noindex
  React.useEffect(() => {
    const prevTitle = document.title;
    if (data?.list?.title)
      document.title = `${data.list.title} • Public Gear List`;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => {
      document.title = prevTitle;
      document.head.removeChild(meta);
    };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-secondary">
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-error">
        {error}
      </div>
    );
  }
  if (!data) return null;

  const catById = new Map(data.categories.map((c) => [c.id, c.title]));

  // items grouped by category (single table, category header rows)
  const grouped = data.items.reduce((acc, it) => {
    const key = it.categoryId || "__uncategorized__";
    (acc[key] ||= []).push(it);
    return acc;
  }, {});

  const catOrder = [
    ...data.categories.map((c) => c.id),
    ...(grouped["__uncategorized__"] ? ["__uncategorized__"] : []),
  ];

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-end justify-between mb-4">
          <h1 className="text-2xl font-semibold text-primary">
            {data.list.title}
          </h1>
          {/* unit toggle */}
          <div
            className="inline-flex border rounded overflow-hidden"
            aria-live="polite"
          >
            <button
              className={cx(
                "px-3 py-1 text-sm",
                unit === "g" ? "bg-primary text-base-100" : "bg-base-100"
              )}
              onClick={() => setUnit("g")}
              aria-pressed={unit === "g"}
            >
              grams
            </button>
            <button
              className={cx(
                "px-3 py-1 text-sm",
                unit === "oz" ? "bg-primary text-base-100" : "bg-base-100"
              )}
              onClick={() => setUnit("oz")}
              aria-pressed={unit === "oz"}
            >
              ounces
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded border bg-base-100">
          <table className="min-w-full text-sm">
            <caption className="sr-only">
              Read-only gear list with weights, prices, and shopping links
            </caption>
            <thead className="bg-base-200 sticky top-0 z-10">
              <tr className="text-left text-secondary">
                <th scope="col" className="px-3 py-2 w-[140px]">
                  Gear List Item
                </th>
                <th scope="col" className="px-3 py-2">
                  Brand
                </th>
                <th scope="col" className="px-3 py-2">
                  Name
                </th>
                <th scope="col" className="px-3 py-2">
                  <span className="inline-flex items-center gap-1">
                    <FaBalanceScale aria-hidden /> Weight ({unit})
                  </span>
                </th>
                <th scope="col" className="px-3 py-2">
                  <span className="inline-flex items-center gap-1">
                    <FaUtensils aria-hidden /> Consumable
                  </span>
                </th>
                <th scope="col" className="px-3 py-2">
                  <span className="inline-flex items-center gap-1">
                    <FaTshirt aria-hidden /> Worn
                  </span>
                </th>
                <th scope="col" className="px-3 py-2">
                  Qty
                </th>
                <th scope="col" className="px-3 py-2">
                  <span className="inline-flex items-center gap-1">
                    <FaDollarSign aria-hidden /> Price (USD)
                  </span>
                </th>
                <th scope="col" className="px-3 py-2">
                  <span className="inline-flex items-center gap-1">
                    <FaShoppingCart aria-hidden /> Link
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {catOrder.map((catId) => {
                const title =
                  catId === "__uncategorized__"
                    ? "Uncategorized"
                    : catById.get(catId) || "Category";
                const rows = grouped[catId] || [];
                return (
                  <React.Fragment key={catId}>
                    {/* category header row spanning full width */}
                    <tr>
                      <td
                        colSpan={9}
                        className="bg-base-200 text-primary font-semibold px-3 py-2"
                      >
                        {title}
                      </td>
                    </tr>
                    {rows.map((it) => {
                      const weight =
                        unit === "g"
                          ? it.weight_g ?? null
                          : it.weight_g != null
                          ? gToOz(it.weight_g)
                          : null;
                      const weightText =
                        weight == null
                          ? ""
                          : unit === "g"
                          ? `${Math.round(weight)}`
                          : `${weight.toFixed(2)}`;
                      const priceText =
                        it.price == null ? "" : formatCurrencyUSD(it.price);
                      // prefer affiliate.deepLink (schema), then affiliate.url (if any), then plain link
                      const linkHref =
                        it.affiliate?.deepLink ||
                        it.affiliate?.url ||
                        it.link ||
                        null;

                      return (
                        <tr key={it.id} className="border-t">
                          <td className="px-3 py-2">{it.itemType || ""}</td>
                          <td className="px-3 py-2">{it.brand || ""}</td>
                          <td className="px-3 py-2">{it.name || ""}</td>
                          <td className="px-3 py-2 tabular-nums">
                            {weightText}
                          </td>
                          <td className="px-3 py-2">
                            {it.consumable ? "Yes" : ""}
                          </td>
                          <td className="px-3 py-2">{it.worn ? "Yes" : ""}</td>
                          <td className="px-3 py-2">{it.qty ?? 1}</td>
                          <td className="px-3 py-2">{priceText}</td>
                          <td className="px-3 py-2">
                            {linkHref ? (
                              <a
                                href={linkHref}
                                target="_blank"
                                rel="noopener noreferrer nofollow sponsored"
                                className="text-primary underline"
                              >
                                View
                              </a>
                            ) : (
                              ""
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Customize CTA (Step 6 will wire this up) */}
        <div className="mt-6 flex justify-end">
          <button className="btn btn-primary" onClick={attemptCopy}>
            Customize this list
          </button>
        </div>
      </div>
    </div>
  );
}
