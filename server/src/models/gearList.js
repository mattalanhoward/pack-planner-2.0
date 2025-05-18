// src/models/gearList.js
const mongoose = require('mongoose');

const gearListSchema = new mongoose.Schema({
  owner: {
    type:     mongoose.Types.ObjectId,
    ref:      'User',
    required: true
  },
  title: {
    type:     String,
    required: true,
    trim:     true
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('GearList', gearListSchema);
