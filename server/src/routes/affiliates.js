// server/src/routes/affiliates.js
const express = require("express");
const { query, validationResult } = require("express-validator");
const rateLimit = require("express-rate-limit");
const AffiliateProduct = require("../models/affiliateProduct");

const router = express.Router();

// Rate limit: 90 req / 5 min per IP
const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 90,
  standardHeaders: true,
  legacyHeaders: false,
});

const validateSearch = [
  query("q").optional().isString().isLength({ max: 120 }).trim(),
  query("merchantId").optional().isString().isLength({ max: 40 }).trim(),
  query("brand").optional().isString().isLength({ max: 60 }).trim(),
  query("category").optional().isString().isLength({ max: 120 }).trim(),
  query("region").optional().isString().isLength({ min: 2, max: 2 }).trim(),
  query("minPrice").optional().isFloat({ min: 0 }),
  query("maxPrice").optional().isFloat({ min: 0 }),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 96 }),
  query("sort")
    .optional()
    .isIn(["price", "-price", "updated", "-updated", "relevance"]),
];

router.get(
  "/awin/products",
  searchLimiter,
  validateSearch,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: { code: "BAD_QUERY", details: errors.array() } });
    }

    const {
      q = "",
      merchantId,
      brand,
      category,
      region,
      minPrice,
      maxPrice,
      page = 1,
      limit = 24,
      sort = q ? "relevance" : "-updated",
    } = req.query;

    const filter = { network: "awin" };
    if (region) filter.region = region;
    if (merchantId) filter.merchantId = String(merchantId);
    if (brand) filter.brand = new RegExp(`^${escapeRegex(brand)}$`, "i");
    if (category) filter.categoryPath = new RegExp(escapeRegex(category), "i");
    if (minPrice)
      filter.price = Object.assign(filter.price || {}, {
        $gte: Number(minPrice),
      });
    if (maxPrice)
      filter.price = Object.assign(filter.price || {}, {
        $lte: Number(maxPrice),
      });

    let projection = {
      name: 1,
      brand: 1,
      description: 1,
      price: 1,
      currency: 1,
      imageUrl: 1,
      awDeepLink: 1,
      region: 1,
      merchantId: 1,
      merchantName: 1,
      externalProductId: 1,
      itemGroupId: 1,
      ean: 1,
      sku: 1,
      lastUpdated: 1,
    };
    const sortSpec = {};

    if (q) {
      filter.$text = { $search: String(q) };
      projection = { ...projection, score: { $meta: "textScore" } };
      if (sort === "relevance") {
        sortSpec.score = { $meta: "textScore" };
      }
    }

    if (!sortSpec.score) {
      switch (sort) {
        case "price":
          sortSpec.price = 1;
          break;
        case "-price":
          sortSpec.price = -1;
          break;
        case "updated":
          sortSpec.lastUpdated = 1;
          break;
        case "-updated":
          sortSpec.lastUpdated = -1;
          break;
        default:
          break;
      }
    }

    const pageNum = Number(page) || 1;
    const lim = Number(limit) || 24;
    const skip = (pageNum - 1) * lim;

    const [items, total] = await Promise.all([
      AffiliateProduct.find(filter, projection)
        .sort(sortSpec)
        .skip(skip)
        .limit(lim)
        .lean()
        .exec(),
      AffiliateProduct.countDocuments(filter),
    ]);

    res.json({
      items,
      page: pageNum,
      total,
      hasMore: skip + items.length < total,
    });
  }
);

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = router;
