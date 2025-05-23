// server/src/models/gearItem.js
const mongoose = require('mongoose');

const gearItemSchema = new mongoose.Schema({
  globalItem: {
    type: mongoose.Types.ObjectId,
    ref:  'GlobalItem',
    required: true
  },
  gearList: {
    type: mongoose.Types.ObjectId,
    ref:  'GearList',
    required: true
  },
  category: {
    type: mongoose.Types.ObjectId,
    ref:  'Category',
    required: true
  },
  brand:      { type: String },
  itemType:   { type: String },
  name:       { type: String, required: true },
  description:{ type: String },
  weight:     { type: Number }, // grams
  price:      { type: Number }, // USD
  link:       { type: String },
  worn:       { type: Boolean, default: false },
  consumable: { type: Boolean, default: false },
  quantity:   { type: Number, default: 1 },
  position:   { type: Number, required: true },
}, {
  timestamps: true
});

// Index globalItem for efficient bulk updates
gearItemSchema.index({ globalItem: 1 });

module.exports = mongoose.models.GearItem
  ? mongoose.models.GearItem
  : mongoose.model('GearItem', gearItemSchema);