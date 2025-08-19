require("dotenv").config();
const mongoose = require("mongoose");
const GlobalItem = require("../src/models/globalItem");
const AffiliateProduct = require("../src/models/affiliateProduct");

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME;
  if (!uri || !dbName) throw new Error("Missing MONGO_URI or MONGO_DB_NAME");

  await mongoose.connect(uri, { dbName });
  console.log("Connected DB =", mongoose.connection.name);

  const cur = GlobalItem.find({
    "affiliate.network": "awin",
    $or: [
      { "affiliate.itemGroupId": { $exists: false } },
      { "affiliate.itemGroupId": null },
      { "affiliate.itemGroupId": "" },
    ],
  }).cursor();

  let scanned = 0;
  let updated = 0;

  for (let g = await cur.next(); g; g = await cur.next()) {
    scanned++;
    const ext = g?.affiliate?.externalProductId || null;
    const link = g?.affiliate?.deepLink || g?.link || null;

    let ap = null;
    if (ext) {
      ap = await AffiliateProduct.findOne({
        network: "awin",
        externalProductId: String(ext),
      }).lean();
    }
    if (!ap && link) {
      ap = await AffiliateProduct.findOne({
        network: "awin",
        awDeepLink: link,
      }).lean();
    }
    if (ap?.itemGroupId) {
      await GlobalItem.updateOne(
        { _id: g._id },
        { $set: { "affiliate.itemGroupId": String(ap.itemGroupId) } }
      );
      updated++;
      process.stdout.write(".");
    }
  }

  console.log(`\nScanned=${scanned}, Updated=${updated}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("Backfill error:", e);
  process.exit(1);
});
