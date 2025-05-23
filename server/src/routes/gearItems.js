// server/src/routes/gearItems.js
const express  = require('express');
const auth     = require('../middleware/auth');
const GearItem = require('../models/gearItem');
const Category = require('../models/category');

const router = express.Router({ mergeParams: true });
router.use(auth);

// GET /api/lists/:listId/categories/:catId/items
// — return all items in a category, sorted by position
router.get('/', async (req, res) => {
  const { listId, catId } = req.params;
  try {
    // Verify category belongs to this list
    const cat = await Category.findOne({ _id: catId, gearList: listId });
    if (!cat) {
      return res.status(404).json({ message: 'Category not found for this list.' });
    }

    const items = await GearItem.find({
      gearList: listId,
      category: catId
    }).sort('position');

    res.json(items);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/lists/:listId/categories/:catId/items
router.post('/', async (req, res) => {
  const { listId, catId } = req.params;
  const {
    globalItem,
    brand,
    itemType,
    name,
    description,
    weight,
    price,
    link,
    worn,
    consumable,
    quantity,
    position
  } = req.body;

  // 1) Validate required fields
  if (!globalItem || !name || position == null) {
    return res
      .status(400)
      .json({ message: 'Required fields: globalItem, name, position' });
  }

  // 2) Verify the category belongs to this list
  const cat = await Category.findOne({ _id: catId, gearList: listId });
  if (!cat) {
    return res
      .status(404)
      .json({ message: 'Category not found for this list.' });
  }

  // 3) Create the GearItem
  try {
    const newItem = await GearItem.create({
      globalItem,
      gearList: listId,
      category: catId,
      brand,
      itemType,
      name,
      description,
      weight,
      price,
      link,
      worn,
      consumable,
      quantity,
      position
    });
    res.status(201).json(newItem);
  } catch (err) {
    console.error('Error creating GearItem:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
