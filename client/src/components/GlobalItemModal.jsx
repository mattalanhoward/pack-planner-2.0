// src/components/GlobalItemModal.jsx
import React, { useState } from "react";
import api from "../services/api";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import CurrencyInput from "../components/CurrencyInput";

export default function GlobalItemModal({
  categories = [],
  onClose,
  onCreated,
}) {
  const [category, setCategory] = useState("");
  const [itemType, setItemType] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState("");
  const [link, setLink] = useState("");
  const [worn, setWorn] = useState(false);
  const [consumable, setConsumable] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }

    const payload = { category, name: name.trim() };
    if (itemType.trim()) payload.itemType = itemType.trim();
    if (brand.trim()) payload.brand = brand.trim();
    if (description.trim()) payload.description = description.trim();
    if (weight) payload.weight = Number(weight);
    if (price) payload.price = Number(price);
    if (link.trim()) payload.link = link.trim();
    payload.worn = worn;
    payload.consumable = consumable;
    payload.quantity = Number(quantity);

    setLoading(true);
    try {
      await api.post("/global/items", payload);
      toast.success("Global item created!");
      onCreated();
      onClose();
    } catch (err) {
      console.error("Error creating global item:", err);
      const msg = err.response?.data?.message || "Failed to create item.";
      await Swal.fire({
        icon: "error",
        title: "Creation Failed",
        text: msg,
      });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-pine bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-sand rounded-lg shadow-2xl max-w-xl w-full p-6 h-d-screen"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-pine">New Gear Item</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-ember hover:text-ember/80"
          >
            <FaTimes />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category
          <div>
            <label className="block text-sm font-medium text-pine mb-1">
              Category<span className="text-red-500">*</span>
            </label>
            <select
              required
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat.title}>{cat.title}</option>
              ))}
            </select>
          </div> */}

          {/* Item Type */}
          <div>
            <label className="block text-sm font-medium text-pine mb-1">
              Item Type
            </label>
            <input
              type="text"
              placeholder="Tent"
              required="required"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-pine mb-1">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Tarptent"
              value={name}
              required="required"
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-pine mb-1">
              Brand
            </label>
            <input
              type="text"
              placeholder="Rainbow"
              value={brand}
              required="required"
              onChange={(e) => setBrand(e.target.value)}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-pine mb-1">
              Weight (g)
            </label>
            <input
              type="number"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            />
          </div>

          {/* Price */}
          <div>
            <CurrencyInput
              value={price}
              onChange={(value) => setForm({ ...form, price: value })}
              label="Price (Euro)"
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-pine mb-1">
              Link
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            />
          </div>

          {/* Description (span two columns) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-pine mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
              rows={2}
            />
          </div>

          {/* Quantity
          <div>
            <label className="block text-sm font-medium text-pine mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="mt-1 block w-full border border-pine rounded p-2 text-pine"
            />
          </div>*/}
        </div>

        {/* Worn / Consumable */}
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

        {/* Actions */}
        <div className="flex justify-end space-x-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-sand rounded hover:bg-sand/90 text-pine"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-teal text-white rounded hover:bg-teal-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
