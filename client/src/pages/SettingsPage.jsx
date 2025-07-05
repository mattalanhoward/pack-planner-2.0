// src/pages/SettingsPage.jsx
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const timezones = [
  "UTC",
  "America/New_York",
  "Europe/London",
  "Asia/Tokyo",
  // …add your full list…
];
const locales = ["en-US", "en-GB", "fr-FR", "es-ES"];
const currencies = ["USD", "EUR", "GBP", "JPY"];

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);

  const [form, setForm] = useState({
    email: "",
    trailname: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    viewMode: "grid",
    timezone: "",
    locale: "",
    currency: "",
  });
  const [tab, setTab] = useState("Profile");

  useEffect(() => {
    api.get("/settings").then(({ data }) => {
      setSettings(data);
      setForm((f) => ({
        ...f,
        email: data.email,
        trailname: data.trailname,
        viewMode: data.viewMode,
        timezone: data.timezone,
        locale: data.locale,
        currency: data.currency,
      }));
    });
  }, []);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {};
    // Only send the fields that changed
    [
      "email",
      "trailname",
      "viewMode",
      "timezone",
      "locale",
      "currency",
    ].forEach((key) => {
      if (form[key] !== settings[key]) payload[key] = form[key];
    });
    // Password change
    if (form.newPassword && form.newPassword === form.confirmPassword) {
      payload.password = form.newPassword;
      payload.currentPassword = form.currentPassword;
    }

    if (Object.keys(payload).length === 0) return;

    try {
      await api.patch("/settings", payload);
      setSettings((s) => ({ ...s, ...payload }));
      // optional: show a toast here
    } catch (err) {
      console.error(err);
    }
  };

  if (!settings) return <div>Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* ← BACK BUTTON */}
      <button
        onClick={() => navigate("/lists")}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
      >
        <FaArrowLeft className="h-5 w-5 mr-2" />
        Back to Dashboard
      </button>
      <h2 className="text-2xl font-semibold mb-6">Personal Settings</h2>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {["Profile", "Security", "Preferences"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`mr-6 pb-2 ${
              tab === t
                ? "border-b-2 border-emerald-500 font-medium"
                : "text-gray-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {tab === "Profile" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Trailname
              </label>
              <input
                name="trailname"
                value={form.trailname}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded shadow-sm"
              />
            </div>
          </>
        )}

        {tab === "Security" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                name="currentPassword"
                type="password"
                value={form.currentPassword}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                name="newPassword"
                type="password"
                value={form.newPassword}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded shadow-sm"
              />
            </div>
          </>
        )}

        {tab === "Preferences" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default View Mode
              </label>
              <select
                name="viewMode"
                value={form.viewMode}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded shadow-sm"
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <select
                name="timezone"
                value={form.timezone}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded shadow-sm"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Locale
              </label>
              <select
                name="locale"
                value={form.locale}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded shadow-sm"
              >
                {locales.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded shadow-sm"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
