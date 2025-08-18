// backend/src/models/globalItem.js
const mongoose = require("mongoose");

const GlobalItemSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      trim: true,
      default: null,
    },
    brand: String,
    itemType: String,
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    weight: {
      type: Number,
      required: false,
    },
    price: {
      type: Number,
      required: false,
    },
    link: String,
    worn: {
      type: Boolean,
      default: false,
    },
    consumable: {
      type: Boolean,
      default: false,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    affiliate: {
      type: new (require("mongoose").Schema)(
        {
          network: { type: String, enum: ["awin"], required: true },
          merchantId: { type: String },
          merchantName: { type: String },
          region: { type: String }, // source region (e.g., "GB")
          externalProductId: { type: String }, // Awin product id
          deepLink: { type: String }, // canonical deep link we stored
          alternates: [
            {
              region: String,
              deepLink: String,
              merchantId: String,
              externalProductId: String,
            },
          ],
        },
        { _id: false }
      ),
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Frequent query path: "all my global items"
GlobalItemSchema.index({ owner: 1 }, { name: "owner_idx" });

module.exports = mongoose.model("GlobalItem", GlobalItemSchema);
