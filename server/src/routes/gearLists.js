// backend/src/routes/gearLists.js
const express = require('express');
const auth = require('../middleware/auth');
const GearList = require('../models/gearList');
const Category = require('../models/category');
const DEFAULT_CATEGORIES = require('../constants/defaultCategories');

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

// // POST /api/lists
// // Create a new gear list and auto-seed default categories
// router.post('/', async (req, res) => {
//   try {
//     const { title } = req.body;
//     if (!title) {
//       return res.status(400).json({ message: 'Title is required.' });
//     }

//     // Create the gear list document
//     const newList = await GearList.create({
//       owner: req.userId,
//       title
//     });

//     // Auto-seed default categories
//     await Promise.all(
//       DEFAULT_CATEGORIES.map((catTitle, index) =>
//         Category.create({
//           gearList: newList._id,
//           title: catTitle,
//           position: index
//         })
//       )
//     );

//     // Fetch seeded categories
//     const createdCategories = await Category.find({ gearList: newList._id }).sort('position');

//     // Return both list and its categories
//     res.status(201).json({ list: newList, categories: createdCategories });
//   } catch (err) {
//     console.error('Error creating list with defaults:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

router.post('/', async (req, res) => {
  try {
    const newList = await GearList.create({ owner: req.userId, title: req.body.title });
    console.log('🆕 New list created:', newList._id);

    // seed
    await Promise.all(
      DEFAULT_CATEGORIES.map((title, idx) => {
        console.log('Seeding category:', title);
        return Category.create({ gearList: newList._id, title, position: idx });
      })
    );

    const createdCategories = await Category.find({ gearList: newList._id }).sort('position');
    console.log('🌱 Seeded categories:', createdCategories.map(c => c.title));

    res.status(201).json({ list: newList, categories: createdCategories });
  } catch (err) {
    console.error('Error creating list with defaults:', err);
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
