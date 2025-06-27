// models/ShareToken.js
const mongoose = require("mongoose");
const ShareToken = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  list: { type: mongoose.Types.ObjectId, ref: "GearList", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ShareToken", ShareToken);
