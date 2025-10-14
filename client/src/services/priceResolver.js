// client/src/services/priceResolver.js

import api from "./api";

const cache = new Map();
const TTL = 30 * 60 * 1000; // 30 min

export async function resolveAffiliatePrice(itemId, region) {
  const key = `${itemId}:${region}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < TTL) return cached.data;

  try {
    const res = await api.get(`/affiliates/resolve`, {
      params: { itemId, region },
    });
    const data = res.data || null;
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  } catch (err) {
    console.error("resolveAffiliatePrice error:", err);
    return null;
  }
}

export function clearPriceCache() {
  cache.clear();
}
