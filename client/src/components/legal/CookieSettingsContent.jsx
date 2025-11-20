// src/components/legal/CookieSettingsContent.jsx
import React, { useEffect, useState } from "react";
import {
  defaultConsent,
  loadConsent,
  saveConsent,
} from "../../utils/cookieConsent";
import { initAnalytics } from "../../utils/analytics";

export default function CookieSettingsContent() {
  const [consent, setConsent] = useState(defaultConsent);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    const loaded = loadConsent();
    setConsent(loaded);
    setSavedAt(loaded.updatedAt);
    if (typeof window !== "undefined") {
      window.cookieConsent = loaded;
    }
  }, []);

  const formattedSavedAt =
    savedAt &&
    new Date(savedAt).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleToggleAnalytics = () => {
    setConsent((prev) => ({
      ...prev,
      analytics: !prev.analytics,
    }));
    setDirty(true);
  };

  const handleAcceptAll = () => {
    const next = saveConsent({
      ...consent,
      analytics: true,
    });
    setConsent(next);
    setSavedAt(next.updatedAt);
    setDirty(false);
    initAnalytics();
  };

  const handleRejectNonEssential = () => {
    const next = saveConsent({
      ...consent,
      analytics: false,
    });
    setConsent(next);
    setSavedAt(next.updatedAt);
    setDirty(false);
    if (next.analytics) {
      initAnalytics();
    }
  };

  const handleSave = () => {
    const next = saveConsent(consent);
    setConsent(next);
    setSavedAt(next.updatedAt);
    setDirty(false);
  };

  return (
    <>
      <h1 className="text-2xl font-semibold mb-4">Cookie Settings</h1>

      <p className="mb-3 text-sm">
        Here you can manage which <strong>non-essential cookies</strong> you
        allow. TrekList always uses a small number of{" "}
        <strong>essential cookies</strong> to keep the site secure and make
        basic features work (for example, keeping you logged in).
      </p>

      <p className="mb-4 text-xs text-secondary">
        We currently do <strong>not</strong> use marketing / advertising
        cookies. If we introduce new cookie categories in the future, they will
        appear here with clear explanations.
      </p>

      <div className="border border-base-300 rounded-lg overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-base-200 bg-base-200/60 text-xs uppercase tracking-wide text-secondary">
          Cookie categories
        </div>
        <div className="divide-y divide-base-200 text-sm">
          <div className="px-4 py-3 flex items-start gap-3">
            <div className="mt-1">
              <input
                type="checkbox"
                checked
                disabled
                className="checkbox checkbox-xs"
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="font-medium">Essential</div>
              <div className="text-xs text-secondary mt-1">
                Required for TrekList to function: secure login, basic
                preferences, and protection against abuse. These are always
                enabled.
              </div>
            </div>
          </div>

          <div className="px-4 py-3 flex items-start gap-3">
            <div className="mt-1">
              <input
                id="cookie-analytics"
                type="checkbox"
                className="checkbox checkbox-xs"
                checked={!!consent.analytics}
                onChange={handleToggleAnalytics}
              />
            </div>
            <div>
              <label
                htmlFor="cookie-analytics"
                className="font-medium cursor-pointer"
              >
                Analytics
              </label>
              <div className="text-xs text-secondary mt-1">
                Allows us to collect anonymous usage statistics (for example,
                which pages are most popular) to improve TrekList. We will never
                use analytics cookies to show you ads.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reserve space so layout doesn't jump when the timestamp appears */}
      <p className="text-[11px] text-secondary mb-3 min-h-[1.25rem]">
        {formattedSavedAt ? `Last saved: ${formattedSavedAt}` : "\u00A0"}
      </p>

      <div className="flex flex-wrap gap-2 mt-2">
        <button
          type="button"
          onClick={handleAcceptAll}
          className="px-2 py-1 rounded bg-secondary text-white hover:bg-secondary/80"
        >
          Accept all
        </button>
        <button
          type="button"
          onClick={handleRejectNonEssential}
          className="px-2 py-1 text-sm rounded border border-base-300 text-secondary hover:bg-secondary/20"
        >
          Reject non-essential
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty}
          className={`px-2 py-1 text-sm rounded border ${
            dirty
              ? "border-secondary text-secondary hover:bg-secondary/20"
              : "border-base-300 text-secondary hover:bg-base-200/60 cursor-default"
          }`}
        >
          Save preferences
        </button>
      </div>
    </>
  );
}
