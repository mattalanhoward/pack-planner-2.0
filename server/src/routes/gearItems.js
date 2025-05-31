// server/src/routes/gearItems.js
const express   = require('express');
const auth      = require('../middleware/auth');
const GearItem  = require('../models/gearItem');
const Category  = require('../models/category');
const GearList  = require('../models/gearList');

const router = express.Router({ mergeParams: true });
router.use(auth);

// GET /api/lists/:listId/categories/:catId/items
// ── Return all items in this category
router.get('/', async (req, res) => {
  try {
    const { listId, catId } = req.params;

    // verify that this list belongs to the user
    const list = await GearList.findOne({ _id: listId, owner: req.userId });
    if (!list) return res.status(404).json({ message: 'Gear list not found.' });

    // verify that this category lives under that list
    const cat = await Category.findOne({ _id: catId, gearList: listId });
    if (!cat) return res.status(404).json({ message: 'Category not found.' });

    const items = await GearItem.find({ gearList: listId, category: catId })
      .sort('position')
      .lean();
    res.json(items);
  } catch (err) {
    console.error('Error GET items:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/lists/:listId/categories/:catId/items
// ── Create a new item in this category
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

  // basic required validation
  if (!globalItem || !name || position == null) {
    return res
      .status(400)
      .json({ message: 'Required fields: globalItem, name, position' });
  }

  // verify ownership and category
  const list = await GearList.findOne({ _id: listId, owner: req.userId });
  if (!list) return res.status(404).json({ message: 'Gear list not found.' });

  const cat = await Category.findOne({ _id: catId, gearList: listId });
  if (!cat) return res.status(404).json({ message: 'Category not found.' });

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
    console.error('Error POST item:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── PATCH /api/lists/:listId/categories/:catId/items/:itemId ───
router.patch('/:itemId', async (req, res) => {
  console.log('PATCH /items/:itemId  →  req.params =', req.params);
console.log('PATCH /items/:itemId  →  req.body  =', req.body);
  try {
    const { listId, catId, itemId } = req.params;
    const updates = {};

    // 1) Copy over any of the inline fields (consumable, worn, quantity, position)
    for (const field of ['consumable', 'worn', 'quantity', 'position']) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // 2) **ALLOW** updating category when provided
    if (req.body.category) {
      updates.category = req.body.category;
    }

    // If nothing valid was provided, return early
    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'No valid fields to update.' });
    }

    // 3) Verify the list belongs to this user
    const list = await GearList.findOne({ _id: listId, owner: req.userId });
    if (!list) {
      return res.status(404).json({ message: 'Gear list not found.' });
    }

    // 4) Verify the *old* category (so our filter matches it)
    const oldCat = await Category.findOne({ _id: catId, gearList: listId });
    if (!oldCat) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    // 5) If the request wants to move this item to a new category, validate that new category
    if (updates.category) {
      const newCat = await Category.findOne({
        _id: updates.category,
        gearList: listId
      });
      if (!newCat) {
        return res.status(400).json({ message: 'Target category not found.' });
      }
    }

    // 6) Finally perform the update. Note: we still filter by `category: catId` (the old category).
    const updated = await GearItem.findOneAndUpdate(
      {
        _id: itemId,
        gearList: listId,
        category: catId
      },
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // Return the fully updated item (now with category set to newCatId if moved)
    res.json(updated);
  } catch (err) {
    console.error('Error PATCH item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// DELETE /api/lists/:listId/categories/:catId/items/:itemId
// ── Remove a single item
router.delete('/:itemId', async (req, res) => {
  try {
    const { listId, catId, itemId } = req.params;

    // verify ownership
    const list = await GearList.findOne({ _id: listId, owner: req.userId });
    if (!list) return res.status(404).json({ message: 'Gear list not found.' });

    // verify category
    const cat = await Category.findOne({ _id: catId, gearList: listId });
    if (!cat) return res.status(404).json({ message: 'Category not found.' });

    const deleted = await GearItem.findOneAndDelete({
      _id: itemId,
      gearList: listId,
      category: catId
    });
    if (!deleted) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    res.json({ message: 'Item deleted.' });
  } catch (err) {
    console.error('Error DELETE item:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;