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
  query("brand").optional().isString().isLength({ max: 120 }).trim(),
  query("category").optional().isString().isLength({ max: 200 }).trim(), // substring
  query("itemType").optional().isString().isLength({ max: 200 }).trim(), // last segment
  query("region").optional().isString().isLength({ min: 2, max: 2 }).trim(),
  query("minPrice").optional().isFloat({ min: 0 }),
  query("maxPrice").optional().isFloat({ min: 0 }),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 96 }),
  query("sort")
    .optional()
    .isIn(["price", "-price", "updated", "-updated", "relevance"]),
];

/**
 * GET /api/affiliates/awin/facets?region=GB[&merchantId=26895]&limit=50
 * Returns top brands and itemTypes (last category segment) for independent filtering.
 */
router.get(
  "/awin/facets",
  [
    query("region").isString().isLength({ min: 2, max: 2 }).trim(),
    query("merchantId").optional().isString().trim(),
    query("limit").optional().isInt({ min: 1, max: 200 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ error: { code: "BAD_QUERY", details: errors.array() } });
    }
    try {
      const { region, merchantId, limit = 50 } = req.query;
      const match = { network: "awin", region };
      if (merchantId) match.merchantId = String(merchantId);

      // Build a raw category string from any of: categoryPath (array|string) | category | categories[]
      const normalizeAndLastSegment = [
        {
          $addFields: {
            _raw: {
              $switch: {
                branches: [
                  // categoryPath: array -> join with " > "
                  {
                    case: { $eq: [{ $type: "$categoryPath" }, "array"] },
                    then: {
                      $reduce: {
                        input: "$categoryPath",
                        initialValue: "",
                        in: {
                          $concat: [
                            { $cond: [{ $eq: ["$$value", ""] }, "", " > "] },
                            { $toString: "$$this" },
                          ],
                        },
                      },
                    },
                  },
                  // categoryPath: string
                  {
                    case: { $eq: [{ $type: "$categoryPath" }, "string"] },
                    then: "$categoryPath",
                  },
                  // category: string
                  {
                    case: { $eq: [{ $type: "$category" }, "string"] },
                    then: "$category",
                  },
                  // categories: array -> join
                  {
                    case: { $eq: [{ $type: "$categories" }, "array"] },
                    then: {
                      $reduce: {
                        input: "$categories",
                        initialValue: "",
                        in: {
                          $concat: [
                            { $cond: [{ $eq: ["$$value", ""] }, "", " > "] },
                            { $toString: "$$this" },
                          ],
                        },
                      },
                    },
                  },
                ],
                default: "",
              },
            },
          },
        },
        // Normalize separators to ">"
        {
          $addFields: {
            _path: {
              $replaceAll: { input: "$_raw", find: "›", replacement: ">" },
            },
          },
        },
        {
          $addFields: {
            _path: {
              $replaceAll: { input: "$_path", find: "»", replacement: ">" },
            },
          },
        },
        {
          $addFields: {
            _path: {
              $replaceAll: { input: "$_path", find: "/", replacement: ">" },
            },
          },
        },
        {
          $addFields: {
            _path: {
              $replaceAll: { input: "$_path", find: "|", replacement: ">" },
            },
          },
        },
        // Split, trim, drop empties
        {
          $addFields: {
            _parts: {
              $filter: {
                input: {
                  $map: {
                    input: { $split: ["$_path", ">"] },
                    as: "p",
                    in: { $trim: { input: "$$p" } },
                  },
                },
                as: "x",
                cond: { $ne: ["$$x", ""] },
              },
            },
          },
        },
        // Take last segment
        {
          $addFields: {
            _cat: {
              $cond: [
                { $gt: [{ $size: "$_parts" }, 0] },
                {
                  $arrayElemAt: [
                    "$_parts",
                    { $subtract: [{ $size: "$_parts" }, 1] },
                  ],
                },
                "",
              ],
            },
          },
        },
        { $project: { _raw: 0, _path: 0, _parts: 0 } },
      ];

      const [brandsAgg, itemTypesAgg] = await Promise.all([
        AffiliateProduct.aggregate([
          { $match: match },
          { $match: { brand: { $type: "string", $ne: "" } } },
          { $group: { _id: "$brand", count: { $sum: 1 } } },
          { $project: { _id: 0, value: "$_id", count: 1 } },
          { $sort: { count: -1, value: 1 } },
          { $limit: Number(limit) },
        ]).option({ allowDiskUse: true }),
        AffiliateProduct.aggregate([
          { $match: match },
          ...normalizeAndLastSegment,
          { $match: { _cat: { $type: "string", $ne: "" } } },
          { $group: { _id: "$_cat", count: { $sum: 1 } } },
          { $project: { _id: 0, value: "$_id", count: 1 } },
          { $sort: { count: -1, value: 1 } },
          { $limit: Number(limit) },
        ]).option({ allowDiskUse: true }),
      ]);

      return res.json({ brands: brandsAgg, itemTypes: itemTypesAgg });
    } catch (err) {
      console.error("facets error:", err);
      return res.status(500).json({
        error: {
          code: "FACETS_ERROR",
          message: err.message || "Aggregation failed",
        },
      });
    }
  }
);

/**
 * GET /api/affiliates/awin/products
 * Search + filters + pagination.
 */
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
      itemType,
      region,
      minPrice,
      maxPrice,
      page = 1,
      limit = 24,
      sort = q ? "relevance" : "-updated",
    } = req.query;

    const filter = { network: "awin" };
    const and = [];

    if (region) filter.region = region;
    if (merchantId) filter.merchantId = String(merchantId);
    if (brand) and.push({ brand: new RegExp(`^${escapeRegex(brand)}$`, "i") });
    if (category)
      and.push({ categoryPath: new RegExp(escapeRegex(category), "i") });
    if (itemType) {
      const seg = escapeRegex(itemType);
      const tail = new RegExp(`(?:^|[>›»/|])\\s*${seg}\\s*$`, "i");
      and.push({
        $or: [
          { categoryPath: tail },
          { category: tail },
          { categories: tail }, // arrays accept regex element-match
        ],
      });
    }
    if (and.length) filter.$and = and;

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
      categoryPath: 1,
      category: 1,
      categories: 1,
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
      if (sort === "relevance") sortSpec.score = { $meta: "textScore" };
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
