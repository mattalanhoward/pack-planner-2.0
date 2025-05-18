const mongoose = require('mongoose');

const gearItemSchema = new mongoose.Schema({
  category: {
    type:     mongoose.Types.ObjectId,
    ref:      'Category',
    required: true
  },
  brand:      { type: String },
  itemType:   { type: String },
  name:       { type: String, required: true },
  description:{ type: String },
  weight:     { type: Number, required: true }, // grams
  price:      { type: Number, required: true }, // USD
  link:       { type: String },
  worn:       { type: Boolean, default: false },
  consumable: { type: Boolean, default: false },
  quantity:   { type: Number, default: 1 },
  position:   { type: Number, required: true },
}, {
  timestamps: true
});

module.exports = mongoose.model('GearItem', gearItemSchema);
