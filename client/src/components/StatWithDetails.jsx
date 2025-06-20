import React from "react";
import * as Popover from "@radix-ui/react-popover";
import { formatWeight } from "../utils/weight";
import { useUserSettings } from "../contexts/UserSettings";

// your four icons:
import { BsBackpack4 } from "react-icons/bs";
import { FaTshirt, FaUtensils, FaBalanceScale } from "react-icons/fa";

function baseColorClass(grams) {
  if (grams < 5_000) return "text-green-600";
  if (grams < 15_000) return "text-orange-500";
  return "text-red-500";
}

function StatWithDetails({ icon: Icon, raw, label, items = [], colorClass }) {
  const { weightUnit } = useUserSettings();

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <div
          title={label}
          className={`flex items-center space-x-1 cursor-help ${colorClass}`}
        >
          <Icon className="w-4 h-4" />
          <span>{formatWeight(raw, "auto")}</span>
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="center"
          className="w-56 p-2 bg-sand rounded-lg shadow-lg max-h-64 overflow-y-auto text-xs"
        >
          <div className="font-medium mb-1">{label}</div>
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

export default function PackStats({
  base = 0,
  worn = 0,
  consumable = 0,
  total = 0,
  breakdowns = { base: [], worn: [], consumable: [], total: [] },
}) {
  const stats = [
    {
      icon: BsBackpack4,
      raw: base,
      label: "Base Weight",
      items: breakdowns.base,
      colorClass: baseColorClass(base),
    },
    {
      icon: FaTshirt,
      raw: worn,
      label: "Worn Items Weight",
      items: breakdowns.worn,
      colorClass: "text-blue-600",
    },
    {
      icon: FaUtensils,
      raw: consumable,
      label: "Consumable Weight",
      items: breakdowns.consumable,
      colorClass: "text-green-600",
    },
    {
      icon: FaBalanceScale,
      raw: total,
      label: "Total Weight",
      items: breakdowns.total,
      colorClass: "text-sunset",
    },
  ];

  return (
    <div className="flex items-center space-x-3 text-xs overflow-x-auto px-3 hide-scrollbar">
      {stats.map((s) => (
        <StatWithDetails key={s.label} {...s} />
      ))}
    </div>
  );
}
