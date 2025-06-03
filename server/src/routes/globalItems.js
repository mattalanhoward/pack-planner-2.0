// server/src/routes/globalItems.js
const express    = require('express');
const auth       = require('../middleware/auth');
const GlobalItem = require('../models/globalItem');
const GearItem   = require('../models/gearItem');

const router = express.Router();

// Protect all routes
router.use(auth);

// GET /api/global/items
router.get('/', async (req, res) => {
  try {
    const items = await GlobalItem.find({ owner: req.userId });
    res.json(items);
  } catch (err) {
    console.error(err);
res.status(500).json({ message: err.message });  }
});

// POST /api/global/items
router.post('/', async (req, res) => {
  try {
    const { category, name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required.' });
    }
    const newItem = await GlobalItem.create({
      owner: req.userId,
      ...req.body
    });
    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
res.status(500).json({ message: err.message });  }
});

// PATCH /api/global/items/:id — update template & cascade to GearItem instances
router.patch('/:id', async (req, res) => {
  try {
    // Update master template
    const updated = await GlobalItem.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Global item not found.' });
    }
    // Cascade update to all GearItem instances referencing this template
    await GearItem.updateMany(
      { globalItem: req.params.id },
      {
        name:        updated.name,
        brand:       updated.brand,
        description: updated.description,
        weight:      updated.weight,
        price:       updated.price,
        link:        updated.link
      }
    );
    res.json(updated);
  } catch (err) {
    console.error('Error propagating global item update:', err);
res.status(500).json({ message: err.message });  }
});

// DELETE /api/global/items/:id — remove template & all its GearItem instances
router.delete('/:id', async (req, res) => {
  try {
    // Delete the master template
    const deleted = await GlobalItem.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId
    });
    if (!deleted) {
      return res.status(404).json({ message: 'Global item not found.' });
    }
    // Cascade delete all GearItem instances referencing this template
    await GearItem.deleteMany({ globalItem: req.params.id });
    res.json({ message: 'Global item and its instances deleted.' });
  } catch (err) {
    console.error('Error deleting global item:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
