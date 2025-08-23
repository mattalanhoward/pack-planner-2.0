// client/src/components/ResolvedAffiliateLink.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { resolveAwinLink } from "../services/affiliates";
import { detectRegion, normalizeRegion } from "../utils/region";
import { useUserSettings } from "../contexts/UserSettings";

// per-session in-memory cache
const cache = new Map(); // key: `${id}|${region}` -> link

/**
 * Props:
 * - item: GlobalItem-like object (expects item._id and item.affilate metadata for Awin)
 * - href: original link to use immediately (fallback)
 * - region?: override viewer region (two-letter)
 * - className, children, ...anchor props
 */
export default function ResolvedAffiliateLink({
  item,
  href,
  region: regionOverride,
  children,
  className,
  ...rest
}) {
  const initialHref = href || "";
  const [resolved, setResolved] = useState(initialHref);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  const { region: settingsRegion } = useUserSettings();

  const region = normalizeRegion(
    regionOverride || settingsRegion || detectRegion()
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Only resolve for awin-backed items
    const aff = item?.affiliate;
    if (!aff || aff.network !== "awin") {
      setResolved(initialHref);
      return;
    }

    const key = `${
      item?._id || aff.itemGroupId || aff.externalProductId
    }|${region}`;
    const cached = cache.get(key);
    if (cached) {
      setResolved(cached);
      return;
    }

    // Kick off resolve; don't block rendering
    setLoading(true);
    resolveAwinLink({
      globalItemId: item?._id, // preferred
      itemGroupId: aff?.itemGroupId || aff?.externalProductId, // fallback
      region,
    })
      .then((res) => {
        if (!mounted.current) return;
        if (res?.link) {
          cache.set(key, res.link);
          setResolved(res.link);
        } else {
          setResolved(initialHref);
        }
      })
      .catch(() => {
        if (!mounted.current) return;
        setResolved(initialHref);
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
  }, [
    item?._id,
    item?.affiliate?.itemGroupId,
    item?.affiliate?.externalProductId,
    item?.affiliate?.network,
    region,
    initialHref,
  ]);

  return (
    <a
      href={resolved || "#"}
      className={className}
      rel="nofollow noopener noreferrer"
      target="_blank"
      aria-busy={loading ? "true" : "false"}
      data-resolve-href={resolved || ""}
      data-resolve-region={region}
      {...rest}
    >
      {children}
    </a>
  );
}
