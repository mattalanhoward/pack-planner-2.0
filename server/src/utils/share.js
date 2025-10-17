// server/src/utils/share.js
const ShareToken = require("../models/ShareToken");
const { customAlphabet } = require("nanoid");

// URL-safe base62; length 16 ≈ 95 bits of entropy (good balance of short + secure)
const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 16);

async function ensureActiveTokenForList(listId, ownerId) {
  // Reuse existing active token if present
  const existing = await ShareToken.findOne({
    list: listId,
    owner: ownerId,
    revokedAt: null,
  });
  if (existing) return existing;

  // Otherwise, create a new one with collision-safe retries
  const MAX_TRIES = 5;
  for (let i = 0; i < MAX_TRIES; i++) {
    try {
      const token = nanoid();
      const doc = await ShareToken.create({
        list: listId,
        owner: ownerId,
        token,
      });
      return doc;
    } catch (err) {
      // 11000 = duplicate key (unique index on token). Try again with a new id.
      if (err && err.code === 11000) continue;
      throw err;
    }
  }
  throw new Error(
    "Failed to create a unique share token after multiple attempts."
  );
}

async function revokeTokenForList(listId, ownerId) {
  return ShareToken.findOneAndUpdate(
    { list: listId, owner: ownerId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { new: true }
  );
}

async function resolveActiveToken(token) {
  return ShareToken.findOne({ token, revokedAt: null });
}

module.exports = {
  ensureActiveTokenForList,
  revokeTokenForList,
  resolveActiveToken,
};
