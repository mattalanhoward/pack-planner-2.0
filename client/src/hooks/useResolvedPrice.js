// client/src/hooks/useResolvedPrice.js

import { useEffect, useState } from "react";
import { resolveAffiliatePrice } from "../services/priceResolver";
import { useUserSettings } from "../contexts/UserSettings";

export function useResolvedPrice(item) {
  const { region } = useUserSettings();
  const [resolved, setResolved] = useState(null);

  useEffect(() => {
    if (!item?._id || !item?.affiliate?.network) return;
    resolveAffiliatePrice(item._id, region).then(setResolved);
  }, [item?._id, region]);

  return resolved; // may be null or {amount,currency,merchant,deeplink,source}
}
