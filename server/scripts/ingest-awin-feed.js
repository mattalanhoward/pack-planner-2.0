// server/scripts/ingest-awin-feed.js
/**
 * Ingest an Awin product CSV into AffiliateProduct with idempotent upserts.
 *
 * Usage examples:
 *   node scripts/ingest-awin-feed.js --file=seeds/awin-sample.csv --region=GB --merchant=26895 --merchantName="Decathlon UK"
 *   node scripts/ingest-awin-feed.js --file=/path/to/feed.csv --region=NL --merchant=12345 --delimiter="," --limit=50000
 *
 * Required flags:
 *   --file        Path to CSV file
 *   --region      ISO country code (e.g., GB, NL, DE)
 *   --merchant    Merchant/advertiser ID (Awin)
 *
 * Optional:
 *   --merchantName "Human name"
 *   --delimiter    Defaults to comma
 *   --limit        Max rows to process (for testing)
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");
const mongoose = require("mongoose");

const AffiliateProduct = require("../src/models/affiliateProduct");

function deriveItemType(categoryPath, category, categories) {
  const pickLast = (arr) =>
    Array.isArray(arr) && arr.length ? String(arr[arr.length - 1]).trim() : "";
  if (Array.isArray(categoryPath)) return pickLast(categoryPath);
  if (typeof categoryPath === "string") {
    const norm = categoryPath.replace(/[›»/|]/g, ">");
    const parts = norm
      .split(">")
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "";
  }
  if (typeof category === "string") return category.trim();
  if (Array.isArray(categories)) return pickLast(categories);
  return "";
}

// ---- args parsing ----
function getArg(name, def) {
  const a = process.argv.find((s) => s.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : def;
}
const FILE = getArg("file");
const REGION = getArg("region");
const MERCHANT_ID = getArg("merchant");
const MERCHANT_NAME = getArg("merchantName") || "";
const DELIM = (getArg("delimiter") || ",").trim();
const LIMIT = Number(getArg("limit") || 0);

if (!FILE || !REGION || !MERCHANT_ID) {
  console.error(
    "Usage: node scripts/ingest-awin-feed.js --file=... --region=GB --merchant=26895 [--merchantName=...] [--delimiter=,] [--limit=1000]"
  );
  process.exit(1);
}

// ---- helpers ----
function stripHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function toNumber(x) {
  if (x == null || x === "") return undefined;
  // remove currency symbols, spaces, thousands sep, handle comma decimals
  const clean = String(x)
    .replace(/[^\d,.\-]/g, "")
    .replace(/,/g, ".");
  const n = Number(clean);
  return Number.isFinite(n) ? n : undefined;
}
function pick(row, candidates) {
  for (const k of candidates) {
    if (row[k] != null && String(row[k]).trim() !== "") return row[k];
  }
  return undefined;
}

// Known/likely header variants seen in Awin feeds:
const HDR = {
  productId: ["product_id", "aw_product_id", "id", "Product ID"],
  name: ["product_name", "name", "Title", "productName"],
  brand: ["brand_name", "brand", "Brand"],
  description: [
    "long_description",
    "description",
    "desc",
    "Description",
    "product_description",
  ],
  price: ["search_price", "price", "Price", "amount"],
  currency: ["currency", "Currency"],
  deepLink: [
    "aw_deep_link",
    "deeplink",
    "deep_link",
    "aw_deeplink",
    "aw_deep_link_url",
  ],
  imageUrl: ["aw_image_url", "image_url", "merchant_image_url", "Image URL"],
  category: [
    "category_name",
    "category",
    "merchant_category",
    "categories",
    "Category",
  ],
  ean: ["ean", "gtin", "barcode"],
  sku: ["sku", "mpn"],
  itemGroupId: ["parent_id", "group_id", "item_group_id"],
  merchantId: ["merchant_id", "advertiser_id", "Merchant ID"],
  merchantName: ["merchant_name", "advertiser_name", "Merchant"],
};

function mapRow(row) {
  const externalProductId = String(pick(row, HDR.productId) || "").trim();
  const name = String(pick(row, HDR.name) || "").trim();
  const awDeepLink = String(pick(row, HDR.deepLink) || "").trim();

  if (!externalProductId || !name || !awDeepLink) return null;

  const brand = (pick(row, HDR.brand) || "").toString().trim();
  const description = stripHtml(pick(row, HDR.description));
  const price = toNumber(pick(row, HDR.price));
  const currency = (pick(row, HDR.currency) || "").toString().trim();
  const imageUrl = (pick(row, HDR.imageUrl) || "").toString().trim();
  const catRaw = pick(row, HDR.category);
  const categoryPath = catRaw
    ? String(catRaw)
        .split(">")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const ean = (pick(row, HDR.ean) || "").toString().trim();
  const sku = (pick(row, HDR.sku) || "").toString().trim();
  const itemGroupId = (pick(row, HDR.itemGroupId) || "").toString().trim();

  // If merchant info exists in feed, use it; else fall back to CLI flags
  const merchantId =
    (pick(row, HDR.merchantId) || "").toString().trim() || MERCHANT_ID;
  const merchantName =
    (pick(row, HDR.merchantName) || "").toString().trim() || MERCHANT_NAME;

  return {
    network: "awin",
    region: REGION,
    currency: currency || undefined,
    merchantId: merchantId || MERCHANT_ID,
    merchantName: merchantName || MERCHANT_NAME,

    externalProductId,
    name,
    brand: brand || undefined,
    brandLC: brand ? brand.toLowerCase() : undefined,
    description: description || undefined,
    categoryPath,
    itemType:
      deriveItemType(categoryPath, row.category, row.categories) || undefined,

    price,
    awDeepLink,
    imageUrl: imageUrl || undefined,

    ean: ean || undefined,
    sku: sku || undefined,
    itemGroupId: itemGroupId || undefined,

    lastUpdated: new Date(),
  };
}

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ No MONGO_URI defined in environment!");
    process.exit(1);
  }

  const abs = path.isAbsolute(FILE) ? FILE : path.join(process.cwd(), FILE);
  if (!fs.existsSync(abs)) {
    console.error(`❌ File not found: ${abs}`);
    process.exit(1);
  }

  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME, // ← ensure we don't default to 'test'
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected DB =", mongoose.connection.name);

  console.log(
    `→ Ingesting ${abs}\n   region=${REGION} merchant=${MERCHANT_ID} merchantName="${MERCHANT_NAME}" delimiter="${DELIM}" limit=${
      LIMIT || "∞"
    }`
  );

  const batch = [];
  const BATCH_SIZE = 500; // safe batch size

  let processed = 0;
  let upserts = 0;
  let skipped = 0;

  function flushBatch() {
    if (batch.length === 0) return Promise.resolve();
    const ops = batch.splice(0, batch.length).map((doc) => ({
      updateOne: {
        filter: {
          network: "awin",
          region: doc.region,
          merchantId: doc.merchantId,
          externalProductId: doc.externalProductId,
        },
        update: { $set: doc },
        upsert: true,
      },
    }));
    return AffiliateProduct.bulkWrite(ops, { ordered: false }).then((res) => {
      // nUpserted not always present; approximate via upserts + modified
      upserts += (res.upsertedCount || 0) + (res.modifiedCount || 0);
    });
  }

  const parser = fs.createReadStream(abs).pipe(
    parse({
      columns: true,
      delimiter: DELIM,
      relaxColumnCount: true,
      skip_empty_lines: true,
      bom: true,
      trim: true,
    })
  );

  for await (const row of parser) {
    const doc = mapRow(row);
    processed++;
    if (!doc) {
      skipped++;
    } else {
      batch.push(doc);
    }

    if (LIMIT && processed >= LIMIT) break;
    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }
  }

  await flushBatch();

  console.log(
    `✅ Done. rows=${processed} upserts/updates≈${upserts} skipped=${skipped}`
  );

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("❌ Ingestion error:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
