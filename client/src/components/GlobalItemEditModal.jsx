// src/components/GlobalItemEditModal.jsx
import React, { useState, useEffect } from "react";
import api from "../services/api";
import { FaTimes, FaCheck } from "react-icons/fa";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import CurrencyInput from "../components/CurrencyInput";

export default function GlobalItemEditModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    category: "",
    itemType: "",
    name: "",
    brand: "",
    description: "",
    weight: "",
    price: "",
    link: "",
  });
  const [worn, setWorn] = useState(false);
  const [consumable, setConsumable] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!item) return;
    setForm({
      category: item.category || "",
      itemType: item.itemType || "",
      name: item.name || "",
      brand: item.brand || "",
      description: item.description || "",
      weight: item.weight || "",
      price: item.price || "",
      link: item.link || "",
    });
    setWorn(item.worn);
    setConsumable(item.consumable);
    setQuantity(item.quantity || 1);
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required.";
    if (Number(form.weight) < 0) return "Weight cannot be negative.";
    if (Number(form.price) < 0) return "Price cannot be negative.";
    if (form.link && !/^https?:\/\//.test(form.link))
      return "Link must be a valid URL.";
    return "";
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setError(err);
      toast.error(err);
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: "Apply changes to every instance?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, update all",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!isConfirmed) return;

    setSaving(true);
    setError("");
    try {
      await api.patch(`/global/items/${item._id}`, {
        category: form.category,
        itemType: form.itemType,
        name: form.name.trim(),
        brand: form.brand.trim(),
        description: form.description.trim(),
        weight: Number(form.weight),
        price: Number(form.price),
        link: form.link.trim(),
        worn,
        consumable,
        quantity,
      });
      toast.success("Global item updated");
      onSaved();
      onClose();
    } catch (e) {
      console.error("Error saving global item:", e);
      const msg =
        e.response?.data?.message || "Failed to save. Please try again.";
      await Swal.fire({ icon: "error", title: "Save failed", text: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed h-d-screen inset-0 bg-pine bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-sand rounded-lg shadow-2xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-pine">Edit Global Item</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-ember hover:text-ember/80"
          >
            <FaTimes />
          </button>
        </div>

        {error && <div className="text-ember mb-2">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-pine mb-1">
              Item Type
            </label>
            <input
              name="itemType"
              value={form.itemType}
              onChange={handleChange}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-pine mb-1">
              Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-pine mb-1">
              Brand
            </label>
            <input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-pine mb-1">
              Weight (g)
            </label>
            <input
              type="number"
              name="weight"
              min="0"
              value={form.weight}
              onChange={handleChange}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            />
          </div>

          <div>
            <CurrencyInput
              value={form.price}
              onChange={(value) => setForm({ ...form, price: value })}
              label="Price (Euro)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-pine mb-1">
              Link
            </label>
            <input
              name="link"
              value={form.link}
              onChange={handleChange}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-pine mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-4 mt-4">
            <label className="inline-flex items-center text-pine">
              <input
                type="checkbox"
                checked={worn}
                onChange={(e) => setWorn(e.target.checked)}
                className="mr-2"
              />
              Worn
            </label>
            <label className="inline-flex items-center text-pine">
              <input
                type="checkbox"
                checked={consumable}
                onChange={(e) => setConsumable(e.target.checked)}
                className="mr-2"
              />
              Consumable
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 bg-sand rounded hover:bg-sand/90 text-pine"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-teal text-white rounded hover:bg-teal-700 flex items-center"
          >
            <FaCheck className="mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
