// src/components/GlobalItemEditModal.jsx
import React, { useState, useEffect } from "react";
import api from "../services/api";
import { toast } from "react-hot-toast";
import CurrencyInput from "../components/CurrencyInput";
import LinkInput from "../components/LinkInput";
import ConfirmDialog from "./ConfirmDialog";
import { useUnit } from "../hooks/useUnit";
import { useWeightInput } from "../hooks/useWeightInput";
import { useUserSettings } from "../contexts/UserSettings";

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

  const unit = useUnit();
  const { unitLabel, formatInput, parseInput } = useWeightInput(unit);
  const [displayWeight, setDisplayWeight] = useState("");
  const [worn, setWorn] = useState(false);
  const [consumable, setConsumable] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const itemId = item ? item._id : null;

  const { currency, locale } = useUserSettings();
  const CURRENCY_SYMBOL = { EUR: "€", USD: "$", GBP: "£" };
  const currencySymbol = CURRENCY_SYMBOL[currency] || currency;

  // affiliate-backed items (Awin)
  const isAffiliate = Boolean(item?.affiliate?.network === "awin");

  // Hydrate when item changes
  useEffect(() => {
    if (!item) return;
    const initialGrams = item.weight ?? "";
    setForm({
      category: item.category || "",
      itemType: item.itemType || "",
      name: item.name || "",
      brand: item.brand || "",
      description: item.description || "",
      weight: initialGrams,
      price: item.price ?? "", // keep empty string if none
      link: item.link || "",
    });
    setWorn(!!item.worn);
    setConsumable(!!item.consumable);
    setQuantity(item.quantity || 1);
  }, [itemId]);

  // Recalc display weight when unit or item changes
  useEffect(() => {
    if (!item) return;
    const initialGrams = item.weight ?? "";
    setDisplayWeight(initialGrams !== "" ? formatInput(initialGrams) : "");
  }, [itemId, unit, formatInput]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required.";
    const trimmed = String(displayWeight ?? "").trim();
    const parsed = trimmed === "" ? null : parseInput(trimmed);
    if (trimmed !== "" && parsed == null) return "Enter a valid weight.";
    if (parsed != null && parsed < 0) return "Weight cannot be negative.";
    if (!isAffiliate && form.price !== "" && Number(form.price) < 0)
      return "Price cannot be negative.";
    if (!isAffiliate && form.link && !/^https?:\/\//.test(form.link))
      return "Link must be a valid URL.";
    return "";
  };

  // Step 1: validate -> open confirm
  const handleSave = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      toast.error(err);
      return;
    }
    setConfirmOpen(true);
  };

  // Step 2: user confirmed
  const handleConfirm = async () => {
    setConfirmOpen(false);
    setSaving(true);
    setError("");
    try {
      const payload = {
        category: form.category,
        itemType: form.itemType,
        name: form.name.trim(),
        brand: form.brand.trim(),
        description: form.description.trim(),
        weight:
          String(displayWeight ?? "").trim() === ""
            ? null
            : parseInput(displayWeight), // integer grams
        worn,
        consumable,
        quantity,
      };

      // Price/Link handling:
      if (isAffiliate) {
        delete payload.price;
        delete payload.link;
      } else {
        if (form.price === "" || form.price == null) {
          payload.price = null; // clear price when input is empty
        } else {
          const p = Number(form.price);
          if (!Number.isNaN(p)) payload.price = p; // keep 0 if they typed 0
        }
        if (form.link && form.link.trim()) payload.link = form.link.trim();
      }

      await api.patch(`/global/items/${item._id}`, payload);
      toast.success("Global item updated");
      onSaved?.();
      onClose?.();
    } catch (e) {
      console.error("Error saving global item:", e);
      const msg =
        e.response?.data?.message || "Failed to save. Please try again.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelConfirm = () => setConfirmOpen(false);

  return (
    <div className="fixed inset-0 bg-primary bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSave}
        className="bg-neutralAlt rounded-lg shadow-2xl max-w-xl w-full px-4 py-4 sm:px-6 sm:py-6 my-4"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-primary">
            Edit Global Item
          </h2>
        </div>

        {error && <div className="text-error mb-2">{error}</div>}

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {/* Item Type */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-primary mb-0.5">
              Item Type
            </label>
            <input
              name="itemType"
              value={form.itemType}
              onChange={handleChange}
              className="mt-0.5 block w-full border border-primary rounded p-2 text-primary text-sm"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-primary mb-0.5">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-0.5 block w-full border border-primary rounded p-2 text-primary text-sm"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-primary mb-0.5">
              Brand
            </label>
            <input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              className="mt-0.5 block w-full border border-primary rounded p-2 text-primary text-sm"
            />
          </div>

          {/* Link (locked for affiliate-backed) */}
          <div className="relative">
            <LinkInput
              value={form.link}
              onChange={(newLink) => setForm((f) => ({ ...f, link: newLink }))}
              label="Link"
              placeholder="tarptent.com"
              required={false}
              disabled={isAffiliate}
            />
            {isAffiliate && (
              <button
                type="button"
                aria-label="Link is locked"
                title="Link is locked"
                className="absolute inset-0 cursor-not-allowed bg-transparent"
                onClick={(e) => e.preventDefault()}
              />
            )}
            {isAffiliate ? (
              <p className="mt-1 text-[11px] text-primary/80">
                Link is set by the merchant for imported items.
              </p>
            ) : null}
          </div>

          {/* Weight + Price */}
          <div className="flex space-x-1 sm:space-x-2 col-span-1 sm:col-span-2">
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-medium text-primary mb-0.5">
                Weight ({unitLabel})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={displayWeight}
                onChange={(e) => setDisplayWeight(e.target.value)}
                className="mt-0.5 block w-full border border-primary rounded p-2 text-primary text-sm"
              />
            </div>

            <div className="flex-1 relative">
              <label className="block text-xs sm:text-sm font-medium text-primary mb-0.5">
                Price ({currencySymbol})
              </label>
              <div className="relative">
                <CurrencyInput
                  value={form.price}
                  currency={currency}
                  locale={locale}
                  onChange={(val) => setForm((f) => ({ ...f, price: val }))}
                />
                {isAffiliate && (
                  <button
                    type="button"
                    aria-label="Price is locked"
                    title="Price is locked"
                    className="absolute inset-0 cursor-not-allowed bg-transparent"
                    onClick={(e) => e.preventDefault()}
                  />
                )}
              </div>
              {isAffiliate ? (
                <p className="mt-1 text-[11px] text-primary/80">
                  Price is set by the merchant for imported items.
                </p>
              ) : null}
            </div>
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-primary mb-0.5">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="mt-0.5 block w-full border border-primary rounded p-2 text-primary text-sm"
              rows={2}
            />
          </div>
        </div>

        {/* Worn / Consumable */}
        <div className="flex items-center space-x-4 mt-2">
          <label className="inline-flex items-center text-xs sm:text-sm text-primary">
            <input
              type="checkbox"
              checked={worn}
              onChange={(e) => setWorn(e.target.checked)}
              className="mr-1 sm:mr-2"
            />
            Worn
          </label>
          <label className="inline-flex items-center text-xs sm:text-sm text-primary">
            <input
              type="checkbox"
              checked={consumable}
              onChange={(e) => setConsumable(e.target.checked)}
              className="mr-1 sm:mr-2"
            />
            Consumable
          </label>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-between items-center">
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={saving}
            className="px-4 py-2 bg-error text-neutral text-sm font-semibold rounded-md shadow hover:bg-error/80 focus:outline-none focus:ring-2 focus:ring-error transition"
          >
            Delete Item
          </button>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-neutralAlt rounded hover:bg-neutralAlt/90 text-primary text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded bg-secondary text-white hover:bg-secondary/80"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {/* Apply changes confirm dialog */}
        <ConfirmDialog
          isOpen={confirmOpen}
          title="Apply changes to every instance?"
          confirmText="Yes, update all"
          cancelText="Cancel"
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
        />

        {/* Delete confirm dialog */}
        <ConfirmDialog
          isOpen={deleteConfirmOpen}
          title="Delete this Gear Item?"
          message="This will remove it from your gear items and all of your gear lists."
          confirmText="Delete Item"
          cancelText="Cancel"
          onConfirm={async () => {
            setDeleteConfirmOpen(false);
            try {
              await api.delete(`/global/items/${item._id}`);
              toast.success("Item deleted");
              onSaved?.();
              onClose?.();
            } catch (err) {
              toast.error(err.response?.data?.message || "Delete failed");
            }
          }}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      </form>
    </div>
  );
}
