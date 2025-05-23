const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  gearList: {
    type:     mongoose.Types.ObjectId,
    ref:      'GearList',
    required: true
  },
  title: {
    type:     String,
    required: true,
    trim:     true
  },
  position: {
    type:     Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
