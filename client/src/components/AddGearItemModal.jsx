// src/components/AddGearItemModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaTimes, FaSearch, FaSave } from 'react-icons/fa';

export default function AddGearItemModal({
  listId,
  categoryId,
  onClose,
  onAdded,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults]         = useState([]);
  const [selected, setSelected]       = useState(null);
  const [quantity, setQuantity]       = useState(1);
  const [saving, setSaving]           = useState(false);

  // Fetch global items
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/global/items', {
          params: { search: searchQuery },
        });
        setResults(data);
      } catch (err) {
        console.error('Error searching global items:', err);
      }
    })();
  }, [searchQuery]);

  const handleSave = async () => {
    if (!selected) return alert('Please select an item');
    setSaving(true);
    try {
      await api.post(
        `/lists/${listId}/categories/${categoryId}/items`,
        {
          globalItem:  selected._id,
          brand:       selected.brand,
          itemType:    selected.itemType,
          name:        selected.name,
          description: selected.description,
          weight:      selected.weight,
          price:       selected.price,
          link:        selected.link,
          worn:        selected.worn,
          consumable:  selected.consumable,
          quantity,
          position:    0,
        }
      );
      onAdded();
      onClose();
    } catch (err) {
      console.error('Error adding gear item:', err);
      alert(err.response?.data?.message || 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-pine bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-sand rounded-xl shadow-2xl max-w-lg w-full p-6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-pine">
            Add Gear Item
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-ember hover:text-ember/80"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
          {/* Search bar */}
          <div className="flex items-center w-full">
            <input
              type="text"
              placeholder="Search global items…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 w-full border border-pine rounded p-2 text-pine placeholder:text-pine/50 bg-white"
            />
            <FaSearch className="ml-2 text-pine" size={20} />
          </div>

          {/* Results list */}
          <ul className="w-full max-h-40 overflow-y-auto space-y-1">
            {results.length > 0 ? (
              results.map(item => (
                <li
                  key={item._id}
                  onClick={() => setSelected(item)}
                  className={`w-full p-2 rounded cursor-pointer bg-white ${
                    selected?._id === item._id
                      ? 'ring-2 ring-teal'
                      : 'hover:bg-pine/10'
                  }`}
                >
                  <div className="font-medium text-pine">
                    {item.name}
                  </div>
                  <div className="text-sm text-pine/70">
                    {item.brand} — {item.itemType}
                  </div>
                </li>
              ))
            ) : (
              <li className="w-full p-2 text-pine/70">
                No items found
              </li>
            )}
          </ul>

          {/* Quantity */}
          <div className="w-full">
            <label className="block text-sm font-medium text-pine mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-20 border border-pine rounded p-2 text-pine"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-sand text-pine rounded hover:bg-sand/90"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-teal text-white rounded hover:bg-teal-700 flex items-center"
          >
            <FaSave className="mr-2" />
            {saving ? 'Adding…' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
