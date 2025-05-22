// backend/src/routes/gearLists.js
const express = require('express');
const auth = require('../middleware/auth');
const GearList = require('../models/gearList');
const Category = require('../models/category');

const router = express.Router();

// Protect all gear-list routes
router.use(auth);

// GET /api/lists — only this user’s lists
router.get('/', async (req, res) => {
  try {
    const lists = await GearList.find({ owner: req.userId });
    res.json(lists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/lists — create a new gear list with one sample category
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required.' });
    }

    // Create the gear list document
    const newList = await GearList.create({
      owner: req.userId,
      title
    });

    // Seed exactly one sample category
    const sampleCategory = await Category.create({
      gearList: newList._id,
      title: 'Sample Category',
      position: 0
    });

    res.status(201).json({
      list: newList,
      categories: [sampleCategory]
    });
  } catch (err) {
    console.error('Error creating list with sample category:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/lists/:listId — update a gear list’s title
router.patch('/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required.' });
    }
    const updated = await GearList.findOneAndUpdate(
      { _id: listId, owner: req.userId },
      { title },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Gear list not found.' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Error PATCH /api/lists/:listId:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/lists/:listId — remove a gear list (and its categories)
router.delete('/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    const deleted = await GearList.findOneAndDelete({
      _id: listId,
      owner: req.userId
    });
    if (!deleted) {
      return res.status(404).json({ message: 'Gear list not found.' });
    }
    // Cascade-delete its categories
    await Category.deleteMany({ gearList: listId });
    res.json({ message: 'Gear list deleted.' });
  } catch (err) {
    console.error('Error DELETE /api/lists/:listId:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
