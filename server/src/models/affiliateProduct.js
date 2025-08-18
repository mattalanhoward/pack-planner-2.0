// server/src/models/affiliateProduct.js
const { Schema, model } = require("mongoose");

/**
 * Canonical store for ingested product rows from affiliate networks.
 * v1 supports Awin; the schema stays network-agnostic so we can add AvantLink later.
 */
const AffiliateProductSchema = new Schema(
  {
    network: { type: String, enum: ["awin"], required: true },

    region: { type: String, required: true }, // e.g., "GB","NL","DE"
    currency: { type: String }, // e.g., "GBP","EUR"
    merchantId: { type: String, required: true }, // Awin advertiser id
    merchantName: { type: String },

    // External product ID from the network (Awin product id)
    externalProductId: { type: String, required: true },

    name: { type: String, required: true },
    brand: { type: String },
    description: { type: String },
    categoryPath: [{ type: String }],

    price: { type: Number }, // numeric price (native currency)
    awDeepLink: { type: String, required: true },
    imageUrl: { type: String },

    // Matching helpers for alternates/grouping
    ean: { type: String },
    sku: { type: String },
    itemGroupId: { type: String },

    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Uniqueness per network/region/merchant/product
AffiliateProductSchema.index(
  { network: 1, region: 1, merchantId: 1, externalProductId: 1 },
  { unique: true, name: "uniq_network_region_merchant_prod" }
);

// Search & filters
AffiliateProductSchema.index({ name: "text", brand: "text" });
AffiliateProductSchema.index({ region: 1, merchantId: 1, price: 1 });

module.exports = model("AffiliateProduct", AffiliateProductSchema);
