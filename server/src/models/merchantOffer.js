// server/src/models/merchantOffer.js
const mongoose = require("mongoose");

const MerchantOfferSchema = new mongoose.Schema(
  {
    network: { type: String, required: true }, // 'awin'
    region: { type: String, required: true }, // 'GB', 'DE', ...
    merchantId: { type: String, required: true }, // Awin mid (string OK)
    merchantName: { type: String },
    itemGroupId: { type: String, required: true }, // stable group across regions
    externalProductId: { type: String }, // optional reference
    awDeepLink: { type: String, required: true }, // the actual deeplink to use
    currency: { type: String }, // optional
    price: { type: Number }, // optional (informational)
  },
  { timestamps: true }
);

MerchantOfferSchema.index(
  { network: 1, itemGroupId: 1, region: 1, merchantId: 1 },
  { unique: true }
);
// Helpful lookup by group+region
MerchantOfferSchema.index({ network: 1, itemGroupId: 1, region: 1 });

module.exports = mongoose.model("MerchantOffer", MerchantOfferSchema);
