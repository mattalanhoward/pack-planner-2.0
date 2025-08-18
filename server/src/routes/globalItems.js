// server/src/routes/globalItems.js
const express = require("express");
const auth = require("../middleware/auth");
const GlobalItem = require("../models/globalItem");
const GearItem = require("../models/gearItem");
const AffiliateProduct = require("../models/affiliateProduct");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Protect all routes
router.use(auth);

// GET /api/global/items
router.get("/", async (req, res) => {
  try {
    const items = await GlobalItem.find({ owner: req.userId });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/global/items/from-affiliate — create a template from an affiliate product
router.post(
  "/from-affiliate",
  [
    body("affiliateProductId").isString().isLength({ min: 8 }),
    body("name").optional().isString().isLength({ min: 1, max: 200 }).trim(),
    body("brand").optional().isString().isLength({ min: 1, max: 120 }).trim(),
    body("description").optional().isString().isLength({ max: 5000 }).trim(),
    body("weight").optional().isFloat({ min: 0 }),
    body("worn").optional().isBoolean(),
    body("consumable").optional().isBoolean(),
    body("itemType")
      .optional()
      .isString()
      .isLength({ min: 1, max: 120 })
      .trim(),
    body("quantity").optional().isInt({ min: 1, max: 999 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Invalid payload", errors: errors.array() });
    }
    try {
      const { affiliateProductId } = req.body;
      const p = await AffiliateProduct.findById(affiliateProductId).lean();
      if (!p)
        return res
          .status(404)
          .json({ message: "Affiliate product not found." });

      // Build the new GlobalItem — price/link always from affiliate product
      const data = {
        owner: req.userId,
        name: req.body.name ?? p.name,
        brand: req.body.brand ?? p.brand,
        description: req.body.description ?? p.description,
        itemType: req.body.itemType ?? null,
        weight: req.body.weight ?? null,
        worn: Boolean(req.body.worn),
        consumable: Boolean(req.body.consumable),
        quantity: Number.isFinite(req.body.quantity)
          ? Number(req.body.quantity)
          : 1,
        price: p.price ?? null,
        link: p.awDeepLink,
        // keep whatever category model you use today; skip if not applicable
        category: req.body.category ?? null,
        // store affiliate metadata (we added this in Step 2)
        affiliate: {
          network: "awin",
          merchantId: p.merchantId,
          merchantName: p.merchantName,
          region: p.region,
          externalProductId: p.externalProductId,
          deepLink: p.awDeepLink,
        },
      };

      const created = await GlobalItem.create(data);
      return res.status(201).json(created);
    } catch (err) {
      console.error("Error creating from affiliate product:", err);
      return res
        .status(500)
        .json({ message: "Could not create from affiliate product." });
    }
  }
);

// POST /api/global/items
router.post("/", async (req, res) => {
  try {
    const { category, name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }
    const newItem = await GlobalItem.create({
      owner: req.userId,
      ...req.body,
    });
    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/global/items/:id — update template & cascade to GearItem instances
router.patch("/:id", async (req, res) => {
  try {
    // Load first to enforce immutability for affiliate-backed items
    const current = await GlobalItem.findOne({
      _id: req.params.id,
      owner: req.userId,
    });
    if (!current) {
      return res.status(404).json({ message: "Global item not found." });
    }
    const isAffiliate = current.affiliate && current.affiliate.network;
    if (
      isAffiliate &&
      (Object.prototype.hasOwnProperty.call(req.body, "price") ||
        Object.prototype.hasOwnProperty.call(req.body, "link"))
    ) {
      return res.status(400).json({
        message: "price and link are immutable for affiliate-backed items.",
      });
    }

    // Update master template with allowed fields
    const updated = await GlobalItem.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Global item not found." });
    }
    // Cascade update to all GearItem instances referencing this template
    await GearItem.updateMany(
      { globalItem: req.params.id },
      {
        name: updated.name,
        brand: updated.brand,
        description: updated.description,
        weight: updated.weight,
        // Keep your existing cascade fields as-is; do NOT change price/link here
        // price/link remain whatever GlobalItem has (unchanged for affiliate items)
        price: updated.price,
        link: updated.link,
      }
    );
    res.json(updated);
  } catch (err) {
    console.error("Error propagating global item update:", err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/global/items/:id — remove template & all its GearItem instances
router.delete("/:id", async (req, res) => {
  try {
    // Delete the master template
    const deleted = await GlobalItem.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });
    if (!deleted) {
      return res.status(404).json({ message: "Global item not found." });
    }
    // Cascade delete all GearItem instances referencing this template
    await GearItem.deleteMany({ globalItem: req.params.id });
    res.json({ message: "Global item and its instances deleted." });
  } catch (err) {
    console.error("Error deleting global item:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
