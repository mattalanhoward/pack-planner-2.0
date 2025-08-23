// server/scripts/generate-sample-awin-feeds.js
/**
 * Generate small Awin-like CSV feeds for multiple regions/merchants.
 * Files are written to server/seeds/ as: awin-TEST-<REGION>-<merchant>.csv
 *
 * NOTE: These are TEST-ONLY placeholders that point to example.com.
 */
const fs = require("fs");
const path = require("path");

const seedsDir = path.join(__dirname, "..", "seeds");
if (!fs.existsSync(seedsDir)) fs.mkdirSync(seedsDir, { recursive: true });

/** 20 product families (stable across regions via item_group_id) */
const families = [
  [
    "OS-EXOS-48",
    "Osprey",
    "Exos 48 Backpack",
    "Packs > Backpacks",
    "0845111000000",
    "OS-EXOS-48",
    260,
  ],
  [
    "OS-STRATOS-24",
    "Osprey",
    "Stratos 24 Backpack",
    "Packs > Daypacks",
    "0843817000000",
    "OS-STRATOS-24",
    180,
  ],
  [
    "BD-ACC",
    "Black Diamond",
    "Alpine Carbon Cork Trekking Poles",
    "Hiking > Trekking Poles",
    "0793661000000",
    "BD-ACC",
    200,
  ],
  [
    "PZ-ACTIK-350",
    "Petzl",
    "Actik Headlamp 350",
    "Lighting > Headlamps",
    "3342540000000",
    "PZ-ACTIK-350",
    40,
  ],
  [
    "MSR-HH-2",
    "MSR",
    "Hubba Hubba 2 Tent",
    "Shelter > Tents",
    "0040818000000",
    "MSR-HH-2",
    499,
  ],
  [
    "TAR-XLITE-NXT",
    "Therm-a-Rest",
    "NeoAir Xlite NXT Sleeping Pad",
    "Sleep > Sleeping Pads",
    "0040819000000",
    "TAR-XLITE-NXT",
    229,
  ],
  [
    "JB-FLASH",
    "Jetboil",
    "Flash Cooking System",
    "Kitchen > Stoves",
    "0858940000000",
    "JB-FLASH",
    129,
  ],
  [
    "GAR-INR-MINI2",
    "Garmin",
    "inReach Mini 2",
    "Electronics > GPS & Satellite",
    "0753759000000",
    "GAR-INR-MINI2",
    399,
  ],
  [
    "SAL-XU4-GTX",
    "Salomon",
    "X Ultra 4 GTX",
    "Footwear > Hiking Shoes",
    "0193120000000",
    "SAL-XU4-GTX",
    165,
  ],
  [
    "AL-LP8",
    "Altra",
    "Lone Peak 8",
    "Footwear > Trail Runners",
    "1961000000000",
    "AL-LP8",
    150,
  ],
  [
    "LS-UR2",
    "La Sportiva",
    "Ultra Raptor II",
    "Footwear > Trail Runners",
    "8020640000000",
    "LS-UR2",
    165,
  ],
  [
    "PAT-R1-AIR-HDY",
    "Patagonia",
    "R1 Air Hoody",
    "Apparel > Midlayers",
    "0194690000000",
    "PAT-R1-AIR-HDY",
    179,
  ],
  [
    "ARC-BETA-LT",
    "Arc'teryx",
    "Beta LT Jacket",
    "Apparel > Shells",
    "6843570000000",
    "ARC-BETA-LT",
    399,
  ],
  [
    "IB-200-OASIS",
    "Icebreaker",
    "200 Oasis Merino Base Layer Top",
    "Apparel > Base Layers",
    "9420040000000",
    "IB-200-OASIS",
    105,
  ],
  [
    "BUFF-ORIG",
    "Buff",
    "Original Multifunctional Headwear",
    "Accessories > Headwear",
    "8428920000000",
    "BUFF-ORIG",
    20,
  ],
  [
    "SAW-SQUEEZE",
    "Sawyer",
    "Squeeze Water Filter",
    "Water > Filters",
    "0507160000000",
    "SAW-SQUEEZE",
    39,
  ],
  [
    "KAT-BEFREE-1L",
    "Katadyn",
    "BeFree 1.0L Water Filter",
    "Water > Filters",
    "7612010000000",
    "KAT-BEFREE-1L",
    49,
  ],
  [
    "HF-TRAIL-24",
    "Hydro Flask",
    "Trail Series 24oz Bottle",
    "Hydration > Bottles",
    "8100070000000",
    "HF-TRAIL-24",
    45,
  ],
  [
    "DT-HIKER-MC",
    "Darn Tough",
    "Hiker Micro Crew Cushion Socks",
    "Apparel > Socks",
    "6422490000000",
    "DT-HIKER-MC",
    25,
  ],
  [
    "NEMO-TENSOR-UL",
    "NEMO",
    "Tensor Ultralight Sleeping Pad",
    "Sleep > Sleeping Pads",
    "0811660000000",
    "NEMO-TENSOR-UL",
    229,
  ],
];

const regions = [
  {
    code: "US",
    currency: "USD",
    fx: 1.0,
    merchants: [
      { id: "10001", name: "REI" },
      { id: "10002", name: "Backcountry" },
    ],
  },
  {
    code: "GB",
    currency: "GBP",
    fx: 0.8,
    merchants: [
      { id: "20001", name: "Decathlon UK" },
      { id: "20002", name: "Bergfreunde UK" },
    ],
  },
  {
    code: "DE",
    currency: "EUR",
    fx: 0.92,
    merchants: [
      { id: "30001", name: "Bergfreunde DE" },
      { id: "30002", name: "Amazon DE" },
    ],
  },
  {
    code: "NL",
    currency: "EUR",
    fx: 0.92,
    merchants: [
      { id: "40001", name: "Bever NL" },
      { id: "40002", name: "Decathlon NL" },
    ],
  },
  {
    code: "CA",
    currency: "CAD",
    fx: 1.35,
    merchants: [
      { id: "50001", name: "MEC" },
      { id: "50002", name: "Amazon CA" },
    ],
  },
];

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildRow(fam, regionCode, currency, merchant, i) {
  const [groupId, brand, product, category, ean, sku, usd] = fam;
  const price = Math.round(usd * regions.find((r) => r.code === regionCode).fx);
  const productId = `TEST-${groupId}-${regionCode}-${merchant.id}-${i + 1}`;
  const deep = `https://example.com/${regionCode}/${slugify(
    brand + " " + product
  )}?m=${merchant.id}&g=${groupId}`;
  const image = `https://picsum.photos/seed/${slugify(groupId)}/600/600`;
  return {
    product_id: productId,
    product_name: `${brand} ${product}`,
    brand_name: brand,
    long_description: `${brand} ${product} (TEST FEED).`,
    search_price: price,
    currency,
    aw_deep_link: deep,
    aw_image_url: image,
    category_name: category,
    ean,
    sku,
    item_group_id: `TEST-GL-${groupId}`,
    merchant_id: merchant.id,
    merchant_name: merchant.name,
  };
}

function toCSV(rows) {
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const out = [headers.join(",")];
  for (const r of rows) {
    out.push(headers.map((h) => esc(r[h])).join(","));
  }
  return out.join("\n");
}

let files = [];
regions.forEach(({ code, currency, merchants }) => {
  merchants.forEach((m, mi) => {
    // 10 rows per merchant to total 100 (5 regions x 2 merchants x 10)
    const rows = families
      .slice(mi * 10, mi * 10 + 10)
      .map((fam, idx) => buildRow(fam, code, currency, m, idx));
    const fname = `awin-TEST-${code}-${slugify(m.name)}.csv`;
    fs.writeFileSync(path.join(seedsDir, fname), toCSV(rows), "utf8");
    files.push(fname);
  });
});

console.log("Wrote sample feeds:", files.join(", "));
