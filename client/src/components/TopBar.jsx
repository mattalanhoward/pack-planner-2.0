// src/components/TopBar.jsx
import React, { Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { FaSignOutAlt, FaCheck } from "react-icons/fa";
import logo from "../assets/logo.png";
import { useUserSettings } from "../contexts/UserSettings";
import AccountModal from "./AccountModal";
import ViewToggle from "./ViewToggle";

const themes = [
  { name: "forest", label: "Forest", color: "#163A28" },
  { name: "snow", label: "Snow", color: "#f0f4f8" },
  { name: "alpine", label: "Alpine", color: "#172b4d" },
  { name: "desert", label: "Desert", color: "#E0B251" }, // default
  { name: "light", label: "Light", color: "#ffffff" },
  { name: "dark", label: "Dark", color: "#0f172a" },
];

export default function TopBar({ title, openSettings }) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const { user, logout } = useAuth();
  const {
    weightUnit,
    setWeightUnit,
    currency,
    setCurrency,
    language,
    setLanguage,
    region,
    setRegion,
    theme,
    setTheme,
    viewMode,
    setViewMode,
  } = useUserSettings();
  const navigate = useNavigate();

  // const currentTheme = themes.find((t) => t.name === theme)?.label || theme;

  if (!user) return null;

  const initial =
    user.trailname?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-base-100 border-b">
      <div className="flex items-center space-x-3">
        <img src={logo} alt="Logo" className="h-8" />
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>

      <div className="flex items-center space-x-4">
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button
            className="w-8 h-8 rounded-full bg-primaryAlt flex items-center justify-center text-sm font-medium uppercase text-base-100 hover:bg-primaryAlt/80 focus:outline-none"
            aria-label="Open account menu"
          >
            {initial}
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-64 bg-base-100 rounded shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              {/* 1) ACCOUNT */}
              <div className="px-4 py-2 text-xs font-semibold text-primary uppercase">
                Account
              </div>
              <div className="px-4 pb-2 text-sm text-secondary">
                <div>{user.trailname}</div>
                <div className="text-primary text-xs">{user.email}</div>
              </div>
              <Menu.Item
                as="button"
                onClick={() => setIsAccountOpen(true)}
                className={({ active }) =>
                  `${
                    active ? "bg-primaryAlt hover:text-base-100" : ""
                  } block w-full text-left px-4 py-2 text-sm text-secondary`
                }
              >
                Manage account…
              </Menu.Item>
              <div className="border-t border-gray-200 my-2" />

              {/* Preferences header */}
              <div className="px-4 py-2 text-xs font-semibold text-primary uppercase">
                Preferences
              </div>

              {/* View mode (you probably already moved this) */}
              <div className="px-4 py-2 flex items-center justify-between text-sm text-secondary">
                <span>View mode</span>
                <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
              </div>

              {/* Theme */}
              <div
                className="px-4 py-2 flex items-center justify-between text-sm text-secondary"
                onClick={(e) => e.stopPropagation()} // prevent HeadlessUI from auto-closing
              >
                <span>Theme</span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="ml-2 bg-transparent focus:outline-none"
                >
                  {themes.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Weight unit */}
              <div className="px-4 py-2 flex items-center justify-between text-sm text-secondary">
                <span>Weight unit</span>
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                  className="ml-2 bg-transparent focus:outline-none"
                >
                  <option value="g">g</option>
                  <option value="oz">oz</option>
                </select>
              </div>

              {/* Currency */}
              <div className="px-4 py-2 flex items-center justify-between text-sm text-secondary">
                <span>Currency</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="ml-2 bg-transparent focus:outline-none"
                >
                  <option value="€">€</option>
                  <option value="$">$</option>
                  <option value="£">£</option>
                </select>
              </div>

              {/* Language */}
              <div className="px-4 py-2 flex items-center justify-between text-sm text-secondary">
                <span>Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="ml-2 bg-transparent focus:outline-none"
                >
                  <option value="en">EN</option>
                  <option value="de">DE</option>
                  <option value="fr">FR</option>
                  <option value="es">ES</option>
                  <option value="it">IT</option>
                  <option value="nl">NL</option>
                </select>
              </div>

              {/* Region */}
              <div className="px-4 py-2 flex items-center justify-between text-sm text-secondary">
                <span>Region</span>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="ml-2 bg-transparent focus:outline-none"
                >
                  <option value="eu">EU</option>
                  <option value="us">USA</option>
                  <option value="ca">CDN</option>
                  <option value="gb">GB</option>
                </select>
              </div>

              <div className="border-t border-gray-200 my-2" />

              {/* 3) ABOUT */}
              <Menu.Item
                as="a"
                href="/about"
                className={({ active }) =>
                  `${
                    active ? "bg-primaryAlt hover:text-base-100" : ""
                  } block w-full text-left px-4 py-2 text-sm text-secondary`
                }
              >
                About
              </Menu.Item>

              <div className="border-t border-gray-200 my-2" />

              {/* 4) LOG OUT */}
              <Menu.Item
                as="button"
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                className={({ active }) =>
                  `${
                    active ? "bg-primaryAlt hover:text-base-100" : ""
                  } block w-full text-left px-4 py-2 text-sm text-secondary`
                }
              >
                Log out
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
        <AccountModal
          isOpen={isAccountOpen}
          onClose={() => setIsAccountOpen(false)}
        />
      </div>
    </header>
  );
}
