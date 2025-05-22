// src/components/AddGearItemModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaTimes, FaSearch, FaSave } from 'react-icons/fa';

export default function AddGearItemModal({ listId, categoryId, onClose, onAdded }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch global items matching searchQuery
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/global/items', { params: { search: searchQuery } });
        setResults(data);
      } catch (err) {
        console.error('Error searching global items:', err);
      }
    };
    fetch();
  }, [searchQuery]);

  const handleSave = async () => {
    if (!selected) return alert('Please select an item');
    setSaving(true);
    try {
      const payload = {
        brand:      selected.brand,
        itemType:   selected.itemType,
        name:       selected.name,
        description: notes || selected.description,
        weight:     selected.weight,
        price:      selected.price,
        link:       selected.link,
        worn:       selected.worn,
        consumable: selected.consumable,
        quantity,
        position:   0
      };
      await api.post(
        `/lists/${listId}/categories/${categoryId}/items`,
        payload
      );
      onAdded();
      onClose();
    } catch (err) {
      console.error('Error adding gear item:', err);
      alert('Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Gear Item</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex mb-4">
          <input
            className="flex-1 border rounded p-2"
            placeholder="Search global items"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <FaSearch className="ml-2 mt-2 text-gray-500" />
        </div>

        {/* Results List */}
        <ul className="max-h-40 overflow-y-auto mb-4">
          {results.map(item => (
            <li
              key={item._id}
              onClick={() => setSelected(item)}
              className={`p-2 rounded cursor-pointer mb-1 ${
                selected?._id === item._id ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-600">{item.brand} — {item.itemType}</div>
            </li>
          ))}
          {results.length === 0 && (
            <li className="text-gray-500 p-2">No items found</li>
          )}
        </ul>

        {/* Quantity & Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            className="mt-1 block w-full border rounded p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
          >
            <FaSave className="mr-2" />
            {saving ? 'Adding...' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
