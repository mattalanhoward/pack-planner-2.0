// client/src/services/affiliates.js
import api from "./api";

export async function resolveAwinLink({ globalItemId, itemGroupId, region }) {
  const { data } = await api.get("/affiliates/awin/resolve-link", {
    params: { globalItemId, itemGroupId, region },
  });
  return data; // { link, region, network, source }
}

// Search Awin products
export async function searchAwinProducts(params) {
  const { data } = await api.get("/affiliates/awin/products", { params });
  return data; // { items, page, total, hasMore }
}

// Create a GlobalItem from an affiliate product with optional overrides
export async function createGlobalItemFromAffiliate(payload) {
  const { data } = await api.post("/global/items/from-affiliate", payload);
  return data;
}

export async function getAwinFacets(params) {
  const { data } = await api.get("/affiliates/awin/facets", { params });
  return data; // { brands: [{value,count}], itemTypes: [{value,count}] }
}

export async function fetchAwinFacets({
  region,
  merchantId,
  q,
  brand,
  itemType,
  limit = 100,
}) {
  const { data } = await api.get("/affiliates/awin/facets", {
    params: { region, merchantId, q, brand, itemType, limit },
  });
  return data; // { brands: [{key,value,count}], itemTypes: [{value,count}] }
}

export async function fetchAwinProducts({
  region,
  merchantId,
  brand,
  itemType,
  q,
  page = 1,
  limit = 24,
}) {
  const { data } = await api.get("/affiliates/awin/products", {
    params: { region, merchantId, brand, itemType, q, page, limit },
  });
  return data; // { items, page, total, hasMore }
}
