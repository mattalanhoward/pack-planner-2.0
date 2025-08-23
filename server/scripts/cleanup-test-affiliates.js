// server/scripts/cleanup-test-affiliates.js
require("dotenv").config();
const mongoose = require("mongoose");
const AffiliateProduct = require("../src/models/affiliateProduct");
const MerchantOffer = require("../src/models/merchantOffer");

const prefix = (
  process.argv.find((a) => a.startsWith("--prefix=")) || "--prefix=TEST-GL-"
).split("=")[1];

(async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ No MONGO_URI in env");
    process.exit(1);
  }

  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const apFilter = {
    $or: [
      { itemGroupId: { $regex: `^${prefix}` } },
      { externalProductId: { $regex: `^TEST-` } },
    ],
  };
  const moFilter = { itemGroupId: { $regex: `^${prefix}` } };

  const apRes = await AffiliateProduct.deleteMany(apFilter);
  const moRes = await MerchantOffer.deleteMany(moFilter);

  console.log(
    `🧹 Deleted AffiliateProduct=${apRes.deletedCount}, MerchantOffer=${moRes.deletedCount} for prefix=${prefix}`
  );

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error("cleanup error:", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
