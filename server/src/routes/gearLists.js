// server/src/routes/gearLists.js
const mongoose = require("mongoose");
const express = require("express");
const auth = require("../middleware/auth");
const GearList = require("../models/gearList");
const Item = require("../models/gearItem");
const Category = require("../models/category");
const Share = require("../models/ShareToken");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

/**
 * Public route: resolve a share token back to its listId
 * GET /api/lists/share/:token
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

// GET /api/lists/:listId/full
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
    console.error("Error in GET /lists/:listId/full →", err.message);
    return res.status(500).json({ error: "Server error." });
  }
});

// GET /api/lists — only this user’s lists
router.get("/", async (req, res) => {
  try {
    const lists = await GearList.find({ owner: req.userId });
    res.json(lists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/lists — create a new gear list + one sample category
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

// PATCH /api/lists/:listId — rename a list
router.patch("/:listId", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required." });
    const updated = await GearList.findOneAndUpdate(
      { _id: req.params.listId, owner: req.userId },
      { title },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "List not found." });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/lists/:listId — delete a list and its categories
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

module.exports = router;
