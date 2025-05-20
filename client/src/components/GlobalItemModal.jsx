// src/components/GlobalItemModal.jsx
import React, { useState } from 'react';
import api from '../services/api';

export default function GlobalItemModal({ categories = [], onClose, onCreated }) {
  // Required
  const [category, setCategory]       = useState('');
  const [name, setName]               = useState('');
  // Optional
  const [brand, setBrand]             = useState('');
  const [itemType, setItemType]       = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight]           = useState(''); // we'll parse to Number if provided
  const [price, setPrice]             = useState(''); // parse to Number
  const [link, setLink]               = useState('');
  const [worn, setWorn]               = useState(false);
  const [consumable, setConsumable]   = useState(false);
  const [quantity, setQuantity]       = useState(1);

  const handleSubmit = async e => {
    e.preventDefault();

    // Basic required check
    if (!category) {
      return alert('Category is required.');
    }
    if (!name.trim()) {
      return alert('Name is required.');
    }

    // Build payload
    const payload = { category, name: name.trim() };

    if (brand.trim())       payload.brand       = brand.trim();
    if (itemType.trim())    payload.itemType    = itemType.trim();
    if (description.trim()) payload.description = description.trim();
    if (weight)             payload.weight      = Number(weight);
    if (price)              payload.price       = Number(price);
    if (link.trim())        payload.link        = link.trim();
    payload.worn       = worn;
    payload.consumable = consumable;
    payload.quantity   = Number(quantity);

    try {
      await api.post('/global/items', payload);
      onCreated();  // refresh the sidebar items list
      onClose();    // close the modal
    } catch (err) {
      console.error('Error creating global item:', err);
      alert('Failed to create item.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-lg w-96 max-h-[90vh] overflow-auto"
      >
        <h2 className="text-xl font-semibold mb-4">New Gear Item</h2>

        {/* Category */}
        <label className="block mb-3">
          Category<span className="text-red-500">*</span>
          <select
            required
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          >
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat.title}>
                {cat.title}
              </option>
            ))}
          </select>
        </label>

        {/* Name */}
        <label className="block mb-3">
          Name<span className="text-red-500">*</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
            required
          />
        </label>

        {/* Brand */}
        <label className="block mb-3">
          Brand
          <input
            type="text"
            value={brand}
            onChange={e => setBrand(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          />
        </label>

        {/* Item Type */}
        <label className="block mb-3">
          Type
          <input
            type="text"
            value={itemType}
            onChange={e => setItemType(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          />
        </label>

        {/* Description */}
        <label className="block mb-3">
          Description
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
            rows={2}
          />
        </label>

        {/* Weight */}
        <label className="block mb-3">
          Weight (g)
          <input
            type="number"
            min="0"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          />
        </label>

        {/* Price */}
        <label className="block mb-3">
          Price (USD)
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          />
        </label>

        {/* Link */}
        <label className="block mb-3">
          Link
          <input
            type="url"
            value={link}
            onChange={e => setLink(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          />
        </label>

        {/* Worn / Consumable */}
        <div className="flex items-center space-x-4 mb-3">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={worn}
              onChange={e => setWorn(e.target.checked)}
              className="mr-2"
            />
            Worn
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={consumable}
              onChange={e => setConsumable(e.target.checked)}
              className="mr-2"
            />
            Consumable
          </label>
        </div>

        {/* Quantity */}
        <label className="block mb-3">
          Quantity
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          />
        </label>

        {/* Actions */}
        <div className="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
