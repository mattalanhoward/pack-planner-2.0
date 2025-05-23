// server/src/routes/gearLists.js
const express  = require('express');
const auth     = require('../middleware/auth');
const GearList = require('../models/gearList');
const Category = require('../models/category');

const router = express.Router();
router.use(auth);

// GET /api/lists — only this user’s lists
router.get('/', async (req, res) => {
  try {
    const lists = await GearList.find({ owner: req.userId });
    res.json(lists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/lists — create a new gear list + one sample category
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required.' });

    // 1) create the gear list
    const newList = await GearList.create({ owner: req.userId, title });

    // 2) seed exactly one category at position 0
    const sample = await Category.create({
      gearList: newList._id,
      title:    'Sample Category',
      position: 0
    });

    // 3) return both
    res.status(201).json({ list: newList, categories: [sample] });
  } catch (err) {
    console.error('Error creating list:', err);
    // send the real error back so you can see it in your client console
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/lists/:listId — rename a list
router.patch('/:listId', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required.' });
    const updated = await GearList.findOneAndUpdate(
      { _id: req.params.listId, owner: req.userId },
      { title },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'List not found.' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/lists/:listId — delete a list and its categories
router.delete('/:listId', async (req, res) => {
  try {
    const deleted = await GearList.findOneAndDelete({
      _id: req.params.listId,
      owner: req.userId
    });
    if (!deleted) return res.status(404).json({ message: 'List not found.' });
    await Category.deleteMany({ gearList: req.params.listId });
    res.json({ message: 'List deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
