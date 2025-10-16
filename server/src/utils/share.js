// server/src/utils/share.js
const { v4: uuidv4 } = require("uuid");
const ShareToken = require("../models/ShareToken");

async function ensureActiveTokenForList(listId) {
  let doc = await ShareToken.findOne({ list: listId, revokedAt: null });
  if (doc) return doc;
  doc = await ShareToken.create({ list: listId, token: uuidv4() });
  return doc;
}

async function revokeTokenForList(listId) {
  const doc = await ShareToken.findOneAndUpdate(
    { list: listId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { new: true }
  );
  return doc;
}

async function resolveActiveToken(token) {
  return ShareToken.findOne({ token, revokedAt: null });
}

module.exports = {
  ensureActiveTokenForList,
  revokeTokenForList,
  resolveActiveToken,
};
