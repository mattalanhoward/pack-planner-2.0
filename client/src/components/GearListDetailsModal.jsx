import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import api from "../services/api";
import ConfirmDialog from "./ConfirmDialog";
import PackStats from "./PackStats";
import { useUserSettings } from "../contexts/UserSettings";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { dateFnsLocales } from "../utils/dateLocales";

/**
 * Modal for viewing/editing a gear list's details
 */
export default function GearListDetailsModal({
  isOpen,
  onClose,
  list,
  breakdowns,
  itemsCount,
  totalCost,
  onRefresh,
  onRefreshSidebar,
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [tripStart, setTripStart] = useState(null);
  const [tripEnd, setTripEnd] = useState(null);
  const [location, setLocation] = useState("");
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isDirty, setDirty] = useState(false);

  // Pull locale and currency code from user settings
  const { locale, currency } = useUserSettings();
  const dfnsLocale = dateFnsLocales[locale] || dateFnsLocales["en-US"];

  // Intl.NumberFormat requires an ISO currency code (e.g. "EUR"), not a symbol
  const currencyCodeMap = { $: "USD", "€": "EUR", "£": "GBP" };
  const currencyCode = currencyCodeMap[currency] || currency;
  const formattedCost = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
  }).format(totalCost || 0);

  // initialize form when list changes
  useEffect(() => {
    if (!list) return;
    setTitle(list.title || "");
    setNotes(list.notes || "");
    setTripStart(list.tripStart ? new Date(list.tripStart) : null);
    setTripEnd(list.tripEnd ? new Date(list.tripEnd) : null);
    setLocation(list.location || "");
    setDirty(false);
  }, [list]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/dashboard/${list._id}`, {
        title,
        notes,
        tripStart: tripStart ? tripStart.toISOString() : null,
        tripEnd: tripEnd ? tripEnd.toISOString() : null,
        location,
      });
      onRefresh();
      onRefreshSidebar();
      onClose();
    } catch (err) {
      console.error("Failed to save list details:", err);
    }
  };

  const handleClose = () => {
    if (isDirty) setShowConfirmClose(true);
    else onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-primary bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSave}
        className="bg-neutralAlt rounded-lg shadow-2xl max-w-xl w-full px-6 py-6 overflow-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-primary">
            Gear List Details
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-error hover:text-error/80"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Grid: 3 cols on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Weight Breakdown full row */}
          <div className="md:col-span-3 flex flex-col items-center py-2">
            <label className="block text-sm font-medium text-primary mb-3">
              Weight Breakdown
            </label>
            <div className="scale-110">
              <PackStats
                base={breakdowns.base.reduce(
                  (s, i) => s + (i.weight || 0) * (i.quantity || 1),
                  0
                )}
                worn={breakdowns.worn.reduce(
                  (s, i) => s + (i.weight || 0) * (i.quantity || 1),
                  0
                )}
                consumable={breakdowns.consumable.reduce(
                  (s, i) => s + (i.weight || 0) * (i.quantity || 1),
                  0
                )}
                total={breakdowns.total.reduce(
                  (s, i) => s + (i.weight || 0) * (i.quantity || 1),
                  0
                )}
                breakdowns={breakdowns}
                // disablePopover
                showLabels={true}
              />
            </div>
          </div>
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-primary mb-1">
              Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
              className="w-full border border-primary rounded p-2 text-primary text-sm"
            />
          </div>
          {/* Placeholder */}
          <div className="md:col-span-1"></div>

          {/* Trip Dates */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            {/* Trip Start */}
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Trip Start
              </label>
              <DatePicker
                selected={tripStart}
                onChange={(date) => {
                  setTripStart(date);
                  setDirty(true);
                }}
                dateFormat="P"
                locale={dfnsLocale}
                className="w-full border border-primary rounded p-2 text-primary text-sm"
                placeholderText="Select date"
              />
            </div>
            {/* Trip End */}
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Trip End
              </label>
              <DatePicker
                selected={tripEnd}
                onChange={(date) => {
                  setTripEnd(date);
                  setDirty(true);
                }}
                dateFormat="P"
                locale={dfnsLocale}
                className="w-full border border-primary rounded p-2 text-primary text-sm"
                placeholderText="Select date"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setDirty(true);
              }}
              className="w-full border border-primary rounded p-2 text-primary text-sm"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-primary mb-1">
              Notes / Description
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setDirty(true);
              }}
              className="w-full border border-primary rounded p-2 text-primary text-sm"
            />
          </div>
          {/* Stats */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4 justify-items-center md:justify-items-start">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Total Cost
              </label>
              <p className="text-lg font-semibold text-primary">
                {formattedCost}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                # of Items
              </label>
              <p className="text-base text-primary">{itemsCount}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-neutralAlt rounded hover:bg-neutralAlt/90 text-primary text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/80 text-sm"
          >
            Save
          </button>
        </div>
      </form>

      {/* Confirm discard */}
      <ConfirmDialog
        isOpen={showConfirmClose}
        title="Discard changes?"
        message="You have unsaved changes. Are you sure you want to close?"
        confirmText="Discard"
        cancelText="Continue Editing"
        onConfirm={() => {
          setShowConfirmClose(false);
          onClose();
        }}
        onCancel={() => setShowConfirmClose(false)}
      />
    </div>
  );
}
