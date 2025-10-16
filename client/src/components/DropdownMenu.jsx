import React, { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";

/**
 * Reusable dropdown menu component using HeadlessUI.
 *
 * Props:
 * - trigger: React node to render as the toggle (e.g. an icon button).
 * - items: Array of menu items. Each item can be either:
 *     { key, label, icon?, onClick, disabled?, className? }
 *     { key, render: () => ReactNode }
 * - menuWidth: Tailwind width class for the menu (default "w-48").
 * - menuClassName: additional Tailwind classes for the Menu.Items container.
 */

export default function DropdownMenu({
  trigger,
  items,
  menuWidth = "w-48",
  menuClassName = "",
}) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button as="div">{trigger}</Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={`absolute right-0 mt-2 ${menuWidth} bg-base-100 isolate shadow-lg ring-1 ring-black/5 focus:outline-none z-[1000]
                      max-h-[75vh] overflow-y-auto overscroll-contain pr-1 ${menuClassName}`}
        >
          {items.map((item) =>
            item.render ? (
              <div key={item.key} className="px-4 py-2">
                {item.render()}
              </div>
            ) : (
              <Menu.Item key={item.key} disabled={item.disabled}>
                {({ active, disabled }) => (
                  <button
                    onClick={item.onClick}
                    disabled={disabled}
                    className={`${
                      active ? "bg-primaryAlt hover:text-base-100" : ""
                    } block w-full text-left px-4 py-2 text-sm text-secondary ${
                      item.className || ""
                    }`}
                  >
                    {item.icon && <item.icon className="inline-block mr-2" />}
                    {item.label}
                  </button>
                )}
              </Menu.Item>
            )
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
