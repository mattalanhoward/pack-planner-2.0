// src/routes/gearLists.js
const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const GearList = require('../models/gearList'); 

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

// Protected by router.use(auth) already
// POST /api/lists — create a new gear list
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required.' });
    }
    const newList = new GearList({ title, owner: req.userId });
    await newList.save();
    res.status(201).json(newList);
  } catch (err) {
    console.error('🔥 Error in POST /api/lists:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// PATCH /api/lists/:listId — update a gear list’s title
router.patch('/:listId', async (req, res) => {
  try {
    const { listId } = req.params;
    const { title }  = req.body;
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

// DELETE /api/lists/:listId — remove a gear list
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
    res.json({ message: 'Gear list deleted.' });
  } catch (err) {
    console.error('Error DELETE /api/lists/:listId:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
