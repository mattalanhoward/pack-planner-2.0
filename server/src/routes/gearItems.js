const express  = require('express');
const auth     = require('../middleware/auth');
const Category = require('../models/category');
const GearItem = require('../models/gearItem');

const router   = express.Router({ mergeParams: true });
router.use(auth);

// GET /api/categories/:catId/items
router.get('/', async (req, res) => {
  try {
    const { listId, catId } = req.params;
    // verify list ownership
    const cat = await Category.findOne({ _id: catId, gearList: listId });
    if (!cat || String(cat.gearList) !== req.params.listId) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const items = await GearItem.find({ category: catId }).sort('position');
    res.json(items);
  } catch (err) {
    console.error('Error GET items:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/categories/:catId/items
router.post('/', async (req, res) => {
  try {
    const { listId, catId } = req.params;
    const payload = { ...req.body, category: catId };
    // basic validation
    if (payload.position == null || !payload.name || payload.weight == null || payload.price == null) {
      return res.status(400).json({ message: 'Required fields: name, weight, price, position' });
    }
    // verify category under the right list
    const cat = await Category.findOne({ _id: catId, gearList: listId });
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    const item = new GearItem(payload);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error('Error POST item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/categories/:catId/items/:itemId
router.patch('/:itemId', async (req, res) => {
  try {
    const { listId, catId, itemId } = req.params;
    // verify category
    const cat = await Category.findOne({ _id: catId, gearList: listId });
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    const updated = await GearItem.findOneAndUpdate(
      { _id: itemId, category: catId },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Item not found' });

    res.json(updated);
  } catch (err) {
    console.error('Error PATCH item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/categories/:catId/items/:itemId/position
router.patch('/:itemId/position', async (req, res) => {
  try {
    const { listId, catId, itemId } = req.params;
    const { position } = req.body;
    if (position == null) return res.status(400).json({ message: 'Position required' });

    // verify category
    const cat = await Category.findOne({ _id: catId, gearList: listId });
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    const updated = await GearItem.findOneAndUpdate(
      { _id: itemId, category: catId },
      { position },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Item not found' });

    res.json(updated);
  } catch (err) {
    console.error('Error PATCH item position:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/categories/:catId/items/:itemId
router.delete('/:itemId', async (req, res) => {
  try {
    const { listId, catId, itemId } = req.params;
    // verify category
    const cat = await Category.findOne({ _id: catId, gearList: listId });
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    const deleted = await GearItem.findOneAndDelete({ _id: itemId, category: catId });
    if (!deleted) return res.status(404).json({ message: 'Item not found' });

    res.json({ message: 'Item deleted.' });
  } catch (err) {
    console.error('Error DELETE item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;