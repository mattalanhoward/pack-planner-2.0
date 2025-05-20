const express = require('express');
const auth = require('../middleware/auth');
const GlobalItem = require('../models/globalItem');
const router = express.Router();

// Protect all routes
router.use(auth);

// GET /api/global/items?search=&category=
router.get('/', async (req, res) => {
  try {
    const { search = '', category = '' } = req.query;
    const filter = { owner: req.userId };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    const items = await GlobalItem.find(filter).sort('name');
    res.json(items);
  } catch (err) {
    console.error('Error fetching global items:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/global/items
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body, owner: req.userId };
    // Validate required fields
    const required = ['category', 'name'];
    for (const field of required) {
      if (data[field] == null) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }
    const newItem = new GlobalItem(data);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error creating global item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;