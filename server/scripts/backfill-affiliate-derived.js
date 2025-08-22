#!/usr/bin/env node
require("dotenv").config();
const mongoose = require("mongoose");
const AffiliateProduct = require("../src/models/affiliateProduct");

const BATCH = Number(process.env.BACKFILL_BATCH || 1000);
const DRY = process.argv.includes("--dry-run");

function deriveItemType(categoryPath, category, categories) {
  const last = (arr) =>
    Array.isArray(arr) && arr.length ? String(arr[arr.length - 1]).trim() : "";
  if (Array.isArray(categoryPath)) return last(categoryPath);
  if (typeof categoryPath === "string") {
    const norm = categoryPath.replace(/[›»/|]/g, ">");
    const parts = norm
      .split(">")
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "";
  }
  if (typeof category === "string") return category.trim();
  if (Array.isArray(categories)) return last(categories);
  return "";
}

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME;
  if (!uri || !dbName) {
    console.error("Missing MONGO_URI or MONGO_DB_NAME");
    process.exit(1);
  }

  await mongoose.connect(uri, {
    dbName,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected DB =", mongoose.connection.name);

  const cursor = AffiliateProduct.find({ network: "awin" }).lean().cursor();
  let seen = 0,
    changed = 0,
    batch = [];
  for await (const p of cursor) {
    seen++;
    const brandLC = p.brand ? String(p.brand).toLowerCase().trim() : undefined;
    const itemType =
      deriveItemType(p.categoryPath, p.category, p.categories) || undefined;

    const update = {};
    if (brandLC && brandLC !== p.brandLC) update.brandLC = brandLC;
    if (itemType && itemType !== p.itemType) update.itemType = itemType;

    if (Object.keys(update).length) {
      changed++;
      batch.push({
        updateOne: { filter: { _id: p._id }, update: { $set: update } },
      });
      if (batch.length >= BATCH) {
        if (!DRY) await AffiliateProduct.bulkWrite(batch, { ordered: false });
        batch = [];
        process.stdout.write(".");
      }
    }
  }
  if (batch.length) {
    if (!DRY) await AffiliateProduct.bulkWrite(batch, { ordered: false });
  }

  console.log(`\nScanned=${seen}, Updated=${changed}, DryRun=${DRY}`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error("❌ Backfill error:", e);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
