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
        className="bg-sand rounded-lg shadow-2xl max-w-xl w-full px-4 py-4 sm:px-6 sm:py-6 my-4"
      >
        {/* Header (smaller on phones) */}
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-pine">
            New Gear Item
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-ember hover:text-ember/80 text-xl sm:text-2xl"
          >
            <FaTimes />
          </button>
        </div>

        {/* Grid: most fields are 1col on phones, 2col on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {/* Item Type */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-pine mb-0.5">
              Item Type
            </label>
            <input
              type="text"
              placeholder="Tent"
              required
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              className="mt-0.5 block w-full border border-pine rounded p-2 text-pine text-sm"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-pine mb-0.5">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Tarptent"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
              className="mt-0.5 block w-full border border-pine rounded p-2 text-pine text-sm"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-pine mb-0.5">
              Brand
            </label>
            <input
              type="text"
              placeholder="Rainbow"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="mt-0.5 block w-full border border-pine rounded p-2 text-pine text-sm"
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-pine mb-0.5">
              Link
            </label>
            <input
              type="url"
              placeholder="https://tarptent.com"
              pattern="https?://.+"
              title="Must start with http:// or https://"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="mt-0.5 block w-full border border-pine rounded p-2 text-pine text-sm"
            />
          </div>

          {/* Weight + Price: force flex on all breakpoints */}
          <div className="flex space-x-1 sm:space-x-2 col-span-1 sm:col-span-2">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-pine mb-0.5">
                Weight (g)
              </label>
              <input
                type="number"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-0.5 block w-full border border-pine rounded p-2 text-pine text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-pine mb-0.5">
                Price (€)
              </label>
              <CurrencyInput
                value={price}
                onChange={(value) => setPrice(value)}
              />
            </div>
          </div>

          {/* Description spans full width */}
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-pine mb-0.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-0.5 block w-full border border-pine rounded p-2 text-pine text-sm"
              rows={1}
            />
          </div>
        </div>

        {/* Worn / Consumable (smaller) */}
        <div className="flex items-center space-x-4 mt-2">
          <label className="inline-flex items-center text-xs sm:text-sm text-pine">
            <input
              type="checkbox"
              checked={worn}
              onChange={(e) => setWorn(e.target.checked)}
              className="mr-1 sm:mr-2"
            />
            Worn
          </label>
          <label className="inline-flex items-center text-xs sm:text-sm text-pine">
            <input
              type="checkbox"
              checked={consumable}
              onChange={(e) => setConsumable(e.target.checked)}
              className="mr-1 sm:mr-2"
            />
            Consumable
          </label>
        </div>

        {/* Actions (slightly tighter) */}
        <div className="flex justify-end space-x-2 mt-4 sm:mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-sand rounded hover:bg-sand/90 text-pine text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal text-white rounded hover:bg-teal-700 text-sm sm:text-base"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
