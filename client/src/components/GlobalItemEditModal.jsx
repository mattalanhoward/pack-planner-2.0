import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaTimes, FaCheck } from 'react-icons/fa';

export default function GlobalItemEditModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    brand: '',
    description: '',
    weight: 0,
    price: 0,
    link: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        brand: item.brand || '',
        description: item.description || '',
        weight: item.weight || 0,
        price: item.price || 0,
        link: item.link || '',
      });
    }
  }, [item]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required.';
    if (form.weight < 0) return 'Weight cannot be negative.';
    if (form.price < 0) return 'Price cannot be negative.';
    try {
      if (form.link && !/^https?:\/\//.test(form.link)) throw 0;
    } catch {
      return 'Link must be a valid URL.';
    }
    return '';
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    if (!window.confirm('This change will apply to every instance of this item. Continue?')) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.patch(`/global/items/${item._id}`, {
        name: form.name.trim(),
        brand: form.brand.trim(),
        description: form.description.trim(),
        weight: Number(form.weight),
        price: Number(form.price),
        link: form.link.trim(),
      });
      onSaved();
      onClose();
    } catch (e) {
      console.error('Error saving global item:', e);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-pine bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-sand rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-pine">Edit Global Item</h2>
          <button onClick={onClose} disabled={saving} className="text-ember hover:text-ember/80">
            <FaTimes />
          </button>
        </div>
        {error && <div className="text-ember mb-2">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-pine">Name*</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-pine">Brand</label>
            <input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-pine">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-pine">Weight (g)</label>
              <input
                type="number"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                className="mt-1 block w-full border border-pine rounded p-2 text-pine"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-pine">Price ($)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                className="mt-1 block w-full border border-pine rounded p-2 text-pine"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-pine">Link</label>
            <input
              name="link"
              value={form.link}
              onChange={handleChange}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-sand rounded hover:bg-sunset text-pine"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-teal text-white rounded hover:bg-teal-700 flex items-center"
          >
            <FaCheck className="mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}