// models/ShareToken.js
const mongoose = require("mongoose");
const ShareToken = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  list: { type: mongoose.Types.ObjectId, ref: "GearList", required: true },
  createdAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null },
});

// One active token per list (enforced at app layer; index helps querying)
ShareToken.index(
  { list: 1 },
  { unique: true, partialFilterExpression: { revokedAt: null } }
);

module.exports = mongoose.model("ShareToken", ShareToken);
