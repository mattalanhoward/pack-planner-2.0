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
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - list: { _id, title, notes, createdAt, updatedAt, tripStart, tripEnd, location, backgroundColor }
 * - breakdowns: { base: [], worn: [], consumable: [], total: [] }
 * - itemsCount: number
 * - totalCost: number|string
 * - onRefresh: () => void
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
  disablePopover,
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [tripStart, setTripStart] = useState(/** @type {Date|null} */ (null));
  const [tripEnd, setTripEnd] = useState(/** @type {Date|null} */ (null));
  const [location, setLocation] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [isDirty, setDirty] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const { locale } = useUserSettings();
  const dfnsLocale = dateFnsLocales[locale] || dateFnsLocales["en-US"];

  // initialize form when list changes
  useEffect(() => {
    if (!list) return;
    setTitle(list.title || "");
    setNotes(list.notes || "");
    setTripStart(list.tripStart ? new Date(list.tripStart) : null);
    setTripEnd(list.tripEnd ? new Date(list.tripEnd) : null);
    setLocation(list.location || "");
    setBackgroundColor(list.backgroundColor || "");
    setDirty(false);
  }, [list]);

  const handleSave = async () => {
    try {
      await api.patch(`/dashboard/${list._id}`, {
        title,
        notes,
        tripStart: tripStart ? tripStart.toISOString() : null,
        tripEnd: tripEnd ? tripEnd.toISOString() : null,
        location,
        backgroundColor,
      });
      onRefresh();
      onRefreshSidebar();
      onClose();
    } catch (err) {
      console.error("Failed to save list details:", err);
      // could show toast error here
    }
  };

  const handleClose = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-neutralAlt rounded-lg shadow-2xl w-full max-w-xl p-6 overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">View / Edit Gear List</h2>
          <button
            onClick={handleClose}
            className="text-primary hover:text-primaryDark p-1"
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
              className="mt-1 block w-full rounded border bg-base-100 p-2"
            />
          </div>

          {/* Created On / Last Modified */}
          <div>
            <label className="block text-sm font-medium">Created On</label>
            <p className="mt-1">
              {new Date(list.createdAt).toLocaleDateString(locale)}
            </p>
            {list.updatedAt && (
              <p className="mt-1 text-xs text-secondary">
                Last modified{" "}
                {new Date(list.updatedAt).toLocaleDateString(locale)}{" "}
              </p>
            )}
          </div>

          {/* Trip Start */}
          <div>
            <label className="block text-sm font-medium">Trip Start</label>
            <DatePicker
              selected={tripStart}
              onChange={(date) => {
                setTripStart(date);
                setDirty(true);
              }}
              dateFormat="P" // localized short format
              locale={dfnsLocale}
              className="mt-1 block w-full rounded border bg-base-100 p-2"
              placeholderText="Select date"
            />
          </div>

          {/* Trip End */}
          <div>
            <label className="block text-sm font-medium">Trip End</label>
            <DatePicker
              selected={tripEnd}
              onChange={(date) => {
                setTripEnd(date);
                setDirty(true);
              }}
              dateFormat="P"
              locale={dfnsLocale}
              className="mt-1 block w-full rounded border bg-base-100 p-2"
              placeholderText="Select date"
            />
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">
              Notes / Description
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setDirty(true);
              }}
              className="mt-1 block w-full rounded border bg-base-100 p-2"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setDirty(true);
              }}
              className="mt-1 block w-full rounded border bg-base-100 p-2"
            />
          </div>

          {/* Items count */}
          <div>
            <label className="block text-sm font-medium"># of Items</label>
            <p className="mt-1">{itemsCount}</p>
          </div>

          {/* Total Cost */}
          <div>
            <label className="block text-sm font-medium">Total Cost</label>
            <p className="mt-1">{totalCost}</p>
          </div>

          {/* Weight Breakdown */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">
              Weight Breakdown
            </label>
            <div className="mt-1">
              <PackStats
                base={breakdowns.base.reduce(
                  (sum, i) => sum + (i.weight || 0) * (i.quantity || 1),
                  0
                )}
                worn={breakdowns.worn.reduce(
                  (sum, i) => sum + (i.weight || 0) * (i.quantity || 1),
                  0
                )}
                consumable={breakdowns.consumable.reduce(
                  (sum, i) => sum + (i.weight || 0) * (i.quantity || 1),
                  0
                )}
                total={breakdowns.total.reduce(
                  (sum, i) => sum + (i.weight || 0) * (i.quantity || 1),
                  0
                )}
                breakdowns={breakdowns}
                disablePopover
              />
            </div>
          </div>

          {/* Background (preview only) */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Background</label>
            {backgroundColor && (
              <div
                className="mt-2 w-12 h-12 rounded"
                style={{ backgroundColor }}
              />
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-base-100 rounded hover:bg-base-100/80"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
          >
            Save
          </button>
        </div>
      </div>

      {/* Unsaved changes confirmation */}
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
