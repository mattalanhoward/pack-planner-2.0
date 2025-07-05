import React, { Fragment, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { FaSignOutAlt, FaCheck } from "react-icons/fa";
import logo from "../assets/logo.png";
import api from "../services/api";
import ViewToggle from "./ViewToggle";

const themes = [
  { name: "forest", label: "Forest", color: "#163A28" },
  { name: "snow", label: "Snow", color: "#f0f4f8" },
  { name: "alpine", label: "Alpine", color: "#172b4d" },
  { name: "ocean", label: "Ocean", color: "#1e3a8a" },
  { name: "desert", label: "Desert", color: "#E0B251" }, // default
  { name: "light", label: "Light", color: "#ffffff" },
  { name: "dark", label: "Dark", color: "#0f172a" },
];

export default function TopBar({ title, viewMode, setViewMode, openSettings }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Track currently selected theme in component state
  const [selectedTheme, setSelectedTheme] = useState(user?.theme || "desert");
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  if (!user) return null;

  const handleThemeChange = async (theme) => {
    try {
      await api.patch("/settings", { theme });
      setSelectedTheme(theme);
      setIsThemeOpen(false);
      // Switch the DaisyUI theme for the whole app:
      document.documentElement.setAttribute("data-theme", theme);
    } catch (err) {
      console.error(err);
    }
  };

  const initial =
    user.trailname?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?";

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-white border-b">
      <div className="bg-pine text-sand p-4">Theming test!</div>
      <button className="btn btn-primary">Test Button</button>

      <div className="flex items-center space-x-3">
        <img src={logo} alt="Logo" className="h-8" />
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>

      <div className="flex items-center space-x-4">
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />

        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium uppercase text-gray-700 hover:bg-gray-300 focus:outline-none"
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
            <Menu.Items className="absolute right-0 mt-2 w-56 bg-white rounded shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              {/* ACCOUNT HEADER */}
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                Account
              </div>
              <div className="px-4 mb-2">
                <p className="text-sm font-medium text-gray-900">
                  {user.trailname}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>

              <div className="border-t border-gray-200 my-2" />

              {/* Settings Link */}
              <Menu.Item
                as="button"
                onClick={openSettings || (() => navigate("/settings"))}
                className={({ active }) =>
                  `${
                    active ? "bg-gray-100" : ""
                  } block w-full text-left px-4 py-2 text-sm text-gray-700`
                }
              >
                Settings
              </Menu.Item>

              {/* Theme: hover submenu using CSS */}
              <div className="relative group">
                <div className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                  Default Theme ({selectedTheme})<span className="ml-2">▶</span>
                </div>
                <div className="absolute right-full top-0 mt-0 -mr-1 w-40 bg-white rounded shadow-lg ring-1 ring-black ring-opacity-5 z-50 opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 group-hover:pointer-events-auto">
                  {themes.map((themeObj) => (
                    <button
                      key={themeObj.name}
                      onClick={() => handleThemeChange(themeObj.name)}
                      className={`flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                        themeObj.name === selectedTheme
                          ? "bg-gray-100 font-semibold"
                          : ""
                      }`}
                    >
                      <span
                        className="w-3 h-3 mr-2 rounded-full"
                        style={{ backgroundColor: themeObj.color }}
                      />
                      {themeObj.label}
                      {themeObj.name === selectedTheme && (
                        <FaCheck className="ml-auto text-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 my-2" />

              {/* Logout */}
              <Menu.Item
                as="button"
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                className={({ active }) =>
                  `${
                    active ? "bg-gray-100" : ""
                  } block w-full text-left px-4 py-2 text-sm text-gray-700`
                }
              >
                <FaSignOutAlt className="inline mr-2" />
                Log out
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}
