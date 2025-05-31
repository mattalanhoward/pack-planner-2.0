// IS THIS BEING USED? //

// src/components/GearItemModal.jsx
import React, { useState } from 'react';
import api from '../services/api';
import { FaTimes, FaSave } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function GearItemModal({ listId, categoryId, item, onClose, onSaved }) {
  const [quantity, setQuantity] = useState(item.quantity || 0);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.patch(
        `/lists/${listId}/categories/${categoryId}/items/${item._id}`,
        { quantity }
      );
      toast.success('Quantity updated');
      onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving item:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Save failed',
        text: err.response?.data?.message || 'Failed to save changes',
      });
      toast.error('Could not save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-pine bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-sand rounded-lg shadow-2xl max-w-sm w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-pine">Edit {item.name}</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-ember hover:text-ember/80"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-pine mb-1">Quantity</label>
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            className="w-20 border border-pine rounded p-2 text-pine"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-sand rounded hover:bg-sand/90 text-pine"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-teal text-white rounded hover:bg-teal-700 flex items-center"
          >
            <FaSave className="mr-2" />
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
