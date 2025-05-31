// backend/src/models/globalItem.js
const mongoose = require('mongoose');

const globalItemSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    trim: true,
    default: null
  },
  brand: String,
  itemType: String,
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  weight: {
    type: Number,
    required: false
  },
  price: {
    type: Number,
    required: false
  },
  link: String,
  worn: {
    type: Boolean,
    default: false
  },
  consumable: {
    type: Boolean,
    default: false
  },
  quantity: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GlobalItem', globalItemSchema);