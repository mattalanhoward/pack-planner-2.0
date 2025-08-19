// server/src/routes/affiliates.js
const express = require("express");
const { query, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const auth = require("../middleware/auth");
const AffiliateProduct = require("../models/affiliateProduct");
const GlobalItem = require("../models/globalItem");
const MerchantOffer = require("../models/MerchantOffer");

const router = express.Router();

// Protect all affiliate endpoints
router.use(auth);

// Rate limit: 90 req / 5 min per IP for product search
const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 90,
  standardHeaders: true,
  legacyHeaders: false,
});

// Small helpers
function escapeRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeBrandKey(brand) {
  return String(brand || "")
    .toLowerCase()
    .trim();
}

/**
 * GET /api/affiliates/awin/facets
 * Query params:
 *  - region: "GB" | "DE" | "US" ... (required)
 *  - merchantId?: number-like
 *  - q?: string (simple regex search on name/description)
 *  - brand?: string (filters results before faceting)
 *  - itemType?: string (filters results before faceting)
 *  - limit?: number (how many facet buckets to return, default 50)
 */
router.get(
  "/awin/facets",
  [
    query("region").isString().isLength({ min: 2, max: 2 }).trim(),
    query("merchantId").optional().isString().trim(),
    query("q").optional().isString().trim(),
    query("brand").optional().isString().trim(),
    query("itemType").optional().isString().trim(),
    query("limit").optional().isInt({ min: 1, max: 200 }),
  ],
  async (req, res) => {
    // validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: { code: "BAD_QUERY", details: errors.array() } });
    }

    try {
      const {
        region,
        merchantId,
        q = "",
        brand = "",
        itemType = "",
        limit = 50,
      } = req.query;

      const match = { network: "awin", region };
      if (merchantId) match.merchantId = Number(merchantId);
      if (brand) match.brandLC = normalizeBrandKey(brand);
      if (itemType) match.itemType = String(itemType).trim();

      if (q && q.trim()) {
        const rx = new RegExp(escapeRegex(q.trim()), "i");
        match.$or = [{ name: rx }, { description: rx }];
      }

      const [agg] = await AffiliateProduct.aggregate([
        { $match: match },
        {
          $facet: {
            // Brands: group by stable key brandLC, expose "value" as the proper-cased brand
            brands: [
              { $match: { brandLC: { $type: "string", $ne: "" } } },
              {
                $group: {
                  _id: "$brandLC",
                  proper: { $first: "$brand" },
                  count: { $sum: 1 },
                },
              },
              { $project: { _id: 0, key: "$_id", value: "$proper", count: 1 } },
              { $sort: { count: -1, value: 1 } },
              { $limit: Number(limit) },
            ],
            // Item types: already denormalized
            itemTypes: [
              { $match: { itemType: { $type: "string", $ne: "" } } },
              { $group: { _id: "$itemType", count: { $sum: 1 } } },
              { $project: { _id: 0, value: "$_id", count: 1 } },
              { $sort: { count: -1, value: 1 } },
              { $limit: Number(limit) },
            ],
          },
        },
      ]).option({ allowDiskUse: true });

      res.json({
        brands: agg?.brands || [],
        itemTypes: agg?.itemTypes || [],
      });
    } catch (err) {
      console.error("affiliates/facets error:", err);
      res.status(500).json({ message: "Server error." });
    }
  }
);

/**
 * GET /api/affiliates/awin/products
 * Query params:
 *  - region: "GB" | "DE" | "US" ... (required)
 *  - merchantId?: number-like
 *  - brand?: string (exact, case-insensitive via brandLC)
 *  - itemType?: string (exact on denormalized itemType)
 *  - category?: string (substring match against categoryPath for legacy UIs)
 *  - q?: string (regex search in name/description; safe w/o text index)
 *  - minPrice?: number
 *  - maxPrice?: number
 *  - page?: number (default 1)
 *  - limit?: number (default 24, max 50)
 *  - sort?: "relevance" | "-updated" | "price" | "-price" (relevance behaves same as -updated here)
 */
router.get(
  "/awin/products",
  searchLimiter,
  [
    query("region").isString().isLength({ min: 2, max: 2 }).trim(),
    query("merchantId").optional().isString().trim(),
    query("brand").optional().isString().trim(),
    query("itemType").optional().isString().trim(),
    query("category").optional().isString().trim(),
    query("q").optional().isString().trim(),
    query("minPrice").optional().isFloat({ min: 0 }),
    query("maxPrice").optional().isFloat({ min: 0 }),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
    query("sort").optional().isString().trim(),
  ],
  async (req, res) => {
    // validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: { code: "BAD_QUERY", details: errors.array() } });
    }

    try {
      const {
        region,
        merchantId,
        brand = "",
        itemType = "",
        category = "",
        q = "",
        minPrice,
        maxPrice,
        page = 1,
        limit = 24,
        sort = q ? "relevance" : "-updated",
      } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10));
      const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * pageSize;

      const filter = { network: "awin", region };
      const and = [];

      if (merchantId) filter.merchantId = Number(merchantId);

      // denormalized brand/itemType
      if (brand) filter.brandLC = normalizeBrandKey(brand);
      if (itemType) filter.itemType = String(itemType).trim();

      // legacy category-path contains (kept for compatibility)
      if (category) {
        and.push({ categoryPath: new RegExp(escapeRegex(category), "i") });
      }

      // price range
      if (minPrice != null || maxPrice != null) {
        const p = {};
        if (minPrice != null) p.$gte = Number(minPrice);
        if (maxPrice != null) p.$lte = Number(maxPrice);
        filter.price = p;
      }

      // safe regex search; avoids requiring a text index
      if (q && q.trim()) {
        const rx = new RegExp(escapeRegex(q.trim()), "i");
        and.push({ $or: [{ name: rx }, { description: rx }] });
      }

      if (and.length) filter.$and = and;

      // simple sorts (no textScore since we're using regex)
      const sortSpec = {};
      if (sort === "price") sortSpec.price = 1;
      else if (sort === "-price") sortSpec.price = -1;
      else if (sort === "-updated" || sort === "relevance")
        sortSpec.updatedAt = -1;
      else sortSpec.updatedAt = -1;

      const total = await AffiliateProduct.countDocuments(filter);
      const items = await AffiliateProduct.find(filter)
        .sort(sortSpec)
        .skip(skip)
        .limit(pageSize)
        .lean();

      return res.json({
        items,
        page: pageNum,
        total,
        hasMore: skip + items.length < total,
      });
    } catch (err) {
      console.error("affiliates/products error:", err);
      res.status(500).json({ message: "Server error." });
    }
  }
);

/**
 * GET /api/affiliates/awin/resolve-link
 * Either provide:
 *   - globalItemId=<id>&region=GB
 * OR
 *   - itemGroupId=<group>&region=GB
 * Returns best deep link for that region; falls back to original global item link.
 */
router.get(
  "/awin/resolve-link",
  [
    query("region").isString().isLength({ min: 2, max: 2 }).trim(),
    query("globalItemId").optional().isString().trim(),
    query("itemGroupId").optional().isString().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: { code: "BAD_QUERY", details: errors.array() } });
    }
    try {
      const { region, globalItemId, itemGroupId } = req.query;

      let group = itemGroupId || null;
      let original = null;

      if (globalItemId) {
        // Owner-scoped for now (future public share route can be unauth)
        const gi = await GlobalItem.findOne({
          _id: globalItemId,
          owner: req.userId,
        }).lean();
        if (!gi)
          return res.status(404).json({ message: "Global item not found." });
        original = { link: gi.link, region: gi?.affiliate?.region || null };
        group =
          group ||
          gi?.affiliate?.itemGroupId ||
          gi?.affiliate?.externalProductId ||
          null;
      }

      if (!group) {
        return res
          .status(400)
          .json({ message: "Missing itemGroupId or globalItemId." });
      }

      // Find best match for requested region
      const mo = await MerchantOffer.findOne({
        network: "awin",
        itemGroupId: String(group),
        region: String(region),
      })
        .sort({ updatedAt: -1 })
        .lean();

      if (mo?.awDeepLink) {
        return res.json({
          link: mo.awDeepLink,
          region: mo.region,
          network: mo.network,
          merchantId: mo.merchantId,
          merchantName: mo.merchantName,
          source: "exact-region",
        });
      }

      // Fallback: return the original global item deeplink if any
      if (original?.link) {
        return res.json({
          link: original.link,
          region: original.region,
          network: "awin",
          source: "fallback-original",
        });
      }

      return res.status(404).json({ message: "No link available." });
    } catch (err) {
      console.error("affiliates/resolve-link error:", err);
      res.status(500).json({ message: "Server error." });
    }
  }
);

module.exports = router;
