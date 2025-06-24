// src/components/StatWithDetails.jsx
import React from "react";
import * as Popover from "@radix-ui/react-popover";
import { formatWeight } from "../utils/weight";

/**
 * Renders a stat with an icon and weight, showing details in a popover
 */
export default function StatWithDetails({
  icon: Icon,
  raw,
  label,
  items = [],
  colorClass,
}) {
  const displayValue = formatWeight(raw, "auto");

  console.log("Popover namespace:", Popover);
  console.log("Icon prop is:", Icon);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <div
          title={label}
          className={`flex items-center space-x-1 cursor-help ${colorClass}`}
        >
          <Icon className="w-4 h-4" />
          <span>{displayValue}</span>
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="center"
          className="w-56 p-2 bg-white rounded-lg shadow-lg max-h-64 overflow-y-auto text-xs"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium text-gray-800">{label}</span>
            <span className="font-medium text-gray-800">{displayValue}</span>
          </div>
          <ul className="divide-y divide-gray-200">
            {items.map((it) => (
              <li
                key={it._id}
                className="py-1 flex justify-between hover:bg-gray-50"
              >
                <div className="flex flex-col truncate">
                  <span className="font-medium truncate">{it.name}</span>
                  <span className="text-xs text-gray-500 truncate">
                    {it.brand} • {it.itemType}
                  </span>
                </div>
                <span className="ml-2 whitespace-nowrap">
                  {formatWeight(it.weight * (it.quantity || 1), "auto")}
                </span>
              </li>
            ))}
          </ul>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
