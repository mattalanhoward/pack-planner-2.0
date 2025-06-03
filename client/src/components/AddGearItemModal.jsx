// src/components/AddGearItemModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { FaTimes, FaSearch, FaSave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function AddGearItemModal({
  listId,
  categoryId,
  onClose,
  onAdded,
}) {
  // 1) Store all global items (fetched once on mount)
  const [allResults, setAllResults] = useState([]);
  // 2) searchQuery (initially empty string)
  const [searchQuery, setSearchQuery]   = useState('');
  // 3) Which IDs are currently checked
  const [selectedIds, setSelectedIds]   = useState(new Set());
  // 4) Quantity for all selected items
  const [quantity, setQuantity]         = useState(1);
  // 5) Loading flag while saving
  const [saving, setSaving]             = useState(false);

  // ────────────────────────────────────────────────────────────────
  // Fetch all global items once (no search param)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/global/items');
        setAllResults(data || []);
      } catch (err) {
        console.error('Error fetching global items:', err);
      }
    })();
  }, []);
  // ────────────────────────────────────────────────────────────────

// allResults ⇒ filteredResults (sorted by itemType/name)
const filteredResults = useMemo(() => {
  const lowerQuery = searchQuery.trim().toLowerCase();

  // 1) If no query, use entire allResults; otherwise filter
  const filtered =
    lowerQuery === ""
      ? allResults
      : allResults.filter((item) => {
          const hay = `${item.itemType} ${item.name}`.toLowerCase();
          return hay.includes(lowerQuery);
        });

  // 2) Sort alphabetically by `name` only:
  return [...filtered].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );
}, [allResults, searchQuery]);
  // ────────────────────────────────────────────────────────────────

  // Toggle a single ID in the Set of selectedIds
  const toggleCheckbox = (itemId) => {
    setSelectedIds(prev => {
      const copy = new Set(prev);
      if (copy.has(itemId)) copy.delete(itemId);
      else copy.add(itemId);
      return copy;
    });
  };

  // ────────────────────────────────────────────────────────────────
  // Save all selected items in parallel
  const handleSave = async () => {
    if (selectedIds.size === 0) {
      return toast.error('Please select at least one item');
    }
    setSaving(true);

    try {
      const promises = Array.from(selectedIds).map(itemId => {
        const selectedItem = allResults.find(i => i._id === itemId);
        if (!selectedItem) return Promise.resolve();

        return api.post(
          `/lists/${listId}/categories/${categoryId}/items`,
          {
            globalItem:  selectedItem._id,
            brand:       selectedItem.brand,
            itemType:    selectedItem.itemType,
            name:        selectedItem.name,
            description: selectedItem.description,
            weight:      selectedItem.weight,
            price:       selectedItem.price,
            link:        selectedItem.link,
            worn:        selectedItem.worn,
            consumable:  selectedItem.consumable,
            quantity,
            position:    0,
          }
        );
      });

      await Promise.all(promises);
      toast.success('Items added successfully');
      onAdded(); // let parent know to refresh
      onClose();
    } catch (err) {
      console.error('Error adding multiple gear items:', err);
      toast.error('Failed to add one or more items');
    } finally {
      setSaving(false);
    }
  };
  // ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-pine bg-opacity-50 flex items-center justify-center z-50">
      {/*
        Changed max-h-[80vh] → h-[80vh] so the modal’s overall height never
        shrinks as results load. Only its inner content scrolls.
      */}
      <div className="bg-sand rounded-xl shadow-2xl max-w-lg w-full h-[80vh] p-6 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-pine">
            Add Gear Item(s)
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-ember hover:text-ember/80"
          >
            <FaTimes size={20} />
          </button>
        </div>
          <div className="flex items-center w-full pb-6 ">
            <input
              type="text"
              placeholder="Search global items…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 border border-pine rounded p-2 text-pine placeholder:text-pine/50 bg-white"
            />
            <FaSearch className="ml-2 text-pine" size={20} />
          </div>
        {/* ─── Scrollable content area ─── */}
        <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
          {/* Search bar */}


          {/* Results list with checkboxes */}
<ul className="w-full space-y-1">
  {filteredResults.length > 0 ? (
    filteredResults.map(item => (
      <li
        key={item._id}
        className="flex items-center w-full p-2 rounded bg-white hover:bg-pine/10 cursor-pointer"
      >
        {/* checkbox + label, etc. */}
        <input
          type="checkbox"
          checked={selectedIds.has(item._id)}
          onChange={() => toggleCheckbox(item._id)}
          className="mr-3 h-4 w-4 text-teal border-pine rounded focus:ring-teal"
        />
        <div
          onClick={() => toggleCheckbox(item._id)}
          className="flex-1 select-none"
        >
          <div className="font-medium text-pine">{item.name}</div>
          <div className="text-sm text-pine/70">
            {item.brand} — {item.itemType}
          </div>
        </div>
      </li>
    ))
  ) : (
    <li className="w-full p-2 text-pine/70">No items found</li>
  )}
</ul>

          {/* Quantity selector
          <div className="w-full">
            <label className="block text-sm font-medium text-pine mb-1">
              Quantity (for all selected)
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value))}
              className="w-20 border border-pine rounded p-2 text-pine"
            />
          </div> */}
        </div>

        {/* ─── Action buttons fixed at bottom ─── */}
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
            disabled={saving || selectedIds.size === 0}
            className={`px-4 py-2 bg-teal text-white rounded flex items-center
              ${
                (saving || selectedIds.size === 0)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-teal-700'
              }
            `}
          >
            <FaSave className="mr-2" />
            {saving
              ? 'Adding…'
              : `Add ${selectedIds.size} Item${selectedIds.size > 1 ? 's' : ''}`
            }
          </button>
        </div>
      </div>
    </div>
  );
}
