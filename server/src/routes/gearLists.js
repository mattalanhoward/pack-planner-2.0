// server/src/routes/gearLists.js
const mongoose = require("mongoose");
const express = require("express");
const auth = require("../middleware/auth");
const GearList = require("../models/gearList");
const Item = require("../models/gearItem");
const Category = require("../models/category");
const Share = require("../models/ShareToken");
const { v4: uuidv4 } = require("uuid");
const upload = require("../middleware/upload");

const router = express.Router();

/**
 * Public route: resolve a share token back to its listId
 * GET /api/dashboard/share/:token
 */
router.get("/share/:token", async (req, res) => {
  const share = await Share.findOne({ token: req.params.token });
  if (!share) return res.status(404).json({ error: "Invalid token" });
  res.json({ listId: share.list.toString() });
});

// All routes below here require auth
router.use(auth);

// 1) Create a share token
router.post("/:listId/share", async (req, res) => {
  const listId = req.params.listId;
  // 1a) ensure they actually own / can share this list
  const list = await GearList.findOne({ _id: listId, owner: req.userId });
  if (!list) return res.status(404).json({ error: "List not found" });

  // 1b) generate & persist token
  const token = uuidv4();
  await Share.create({ token, list: listId });

  res.json({ token });
});

// GET /api/dashboard/:listId/full
router.get("/:listId/full", async (req, res) => {
  try {
    const { listId } = req.params;

    // 1) ensure this is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      return res.status(400).json({ error: "Invalid list ID." });
    }

    // 2) ensure the user owns this list
    const list = await GearList.findOne({ _id: listId, owner: req.userId });
    if (!list) {
      return res.status(404).json({ error: "List not found" });
    }

    // 3) fetch categories and items
    const [categories, items] = await Promise.all([
      Category.find({ gearList: listId }).sort({ position: 1 }),
      Item.find({ gearList: listId }).sort({ category: 1, position: 1 }),
    ]);

    return res.json({ list, categories, items });
  } catch (err) {
    console.error("Error in GET /dashboard/:listId/full →", err.message);
    return res.status(500).json({ error: "Server error." });
  }
});

// GET /api/dashboard — only this user’s lists
router.get("/", async (req, res) => {
  try {
    const lists = await GearList.find({ owner: req.userId });
    res.json(lists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/dashboard — create a new gear list + one sample category
router.post("/", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required." });

    // 1) create the gear list
    const newList = await GearList.create({ owner: req.userId, title });

    // 2) seed exactly one category at position 0
    const sample = await Category.create({
      gearList: newList._id,
      title: "Sample Category",
      position: 0,
    });

    // 3) return both
    res.status(201).json({ list: newList, categories: [sample] });
  } catch (err) {
    console.error("Error creating list:", err);
    // send the real error back so you can see it in your client console
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/dashboard/:listId — rename a list
router.patch("/:listId", async (req, res) => {
  try {
    // pull all updatable props from body
    const { title, notes, tripStart, tripEnd, location, backgroundColor } =
      req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required." });
    }

    // build an update object only with provided fields
    const update = { title };
    if (notes !== undefined) update.notes = notes;
    if (tripStart !== undefined) update.tripStart = tripStart;
    if (tripEnd !== undefined) update.tripEnd = tripEnd;
    if (location !== undefined) update.location = location;
    if (backgroundColor !== undefined) update.backgroundColor = backgroundColor;

    const updated = await GearList.findOneAndUpdate(
      { _id: req.params.listId, owner: req.userId },
      update,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "List not found." });
    }
    // return the full updated document
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/dashboard/:listId — delete a list and its categories
router.delete("/:listId", async (req, res) => {
  try {
    const deleted = await GearList.findOneAndDelete({
      _id: req.params.listId,
      owner: req.userId,
    });
    if (!deleted) {
      return res.status(404).json({ message: "List not found." });
    }

    // cascade-delete everything tied to that list
    await Promise.all([
      Category.deleteMany({ gearList: req.params.listId }),
      Item.deleteMany({ gearList: req.params.listId }),
      Share.deleteMany({ list: req.params.listId }),
    ]);

    return res.json({ message: "List and all related data deleted." });
  } catch (err) {
    console.error("Error deleting list:", err.message);
    return res.status(500).json({ message: "Server error deleting list." });
  }
});

// PATCH colors
router.patch("/:listId/preferences", async (req, res) => {
  const { backgroundColor } = req.body;
  await GearList.findOneAndUpdate(
    { _id: req.params.listId, owner: req.userId },
    { backgroundColor, backgroundImageUrl: null },
    { new: true }
  );
  res.json({ success: true });
});

// PATCH /api/gear-lists/:listId/preferences
// Set a solid-color background
router.patch("/:listId/preferences", async (req, res) => {
  const { backgroundColor } = req.body;
  try {
    const updated = await GearList.findOneAndUpdate(
      { _id: req.params.listId, owner: req.userId },
      { backgroundColor, backgroundImageUrl: null },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "List not found" });
    }
    return res.json({ list: updated });
  } catch (err) {
    console.error("Error updating background color:", err);
    return res.status(500).json({ error: "Could not update color." });
  }
});

// POST /api/gear-lists/:listId/preferences/image
// Upload and set a background image via Cloudinary
router.post(
  "/:listId/preferences/image",
  upload.single("image"), // multer-storage-cloudinary
  async (req, res) => {
    console.log("📤 Hit image‐upload route, req.file:", req.file);

    try {
      if (!req.file || !req.file.path) {
        console.error("❌ No file in request");
        return res.status(400).json({ error: "No image file provided." });
      }
      console.log("✅ File uploaded, path/url:", req.file.path);
      const imageUrl = req.file.path;
      const updated = await GearList.findOneAndUpdate(
        { _id: req.params.listId, owner: req.userId },
        { backgroundImageUrl: imageUrl, backgroundColor: null },
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ error: "List not found" });
      }
      return res.json({ list: updated });
    } catch (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "Image too large (max 5 MB)." });
      }
      console.error("Image upload error:", err);
      return res.status(500).json({ error: "Upload failed." });
    }
  }
);

// POST /api/dashboard/:listId/copy
router.post("/:listId/copy", async (req, res) => {
  try {
    // 1) Find original list
    const orig = await GearList.findOne({
      _id: req.params.listId,
      owner: req.userId,
    });
    if (!orig) return res.status(404).json({ error: "List not found" });

    // 2) Clone the GearList document (new title + null prefs)
    const copy = await GearList.create({
      owner: req.userId,
      title: `Copy of ${orig.title}`,
    });

    // 3) Clone categories + items
    const cats = await Category.find({ gearList: orig._id });
    for (const c of cats) {
      const newCat = await Category.create({
        gearList: copy._id,
        title: c.title,
        position: c.position,
      });
      const its = await Item.find({ gearList: orig._id, category: c._id });
      for (const i of its) {
        await Item.create({
          // REQUIRED fields from the original:
          globalItem: i.globalItem,
          name: i.name,
          gearList: copy._id,
          category: newCat._id,
          brand: i.brand,
          itemType: i.itemType,
          description: i.description,
          weight: i.weight,
          price: i.price,
          link: i.link,
          worn: i.worn,
          consumable: i.consumable,
          quantity: i.quantity,
          position: i.position,
        });
      }
    }

    return res.json({ list: copy });
  } catch (err) {
    console.error("Copy list error:", err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
