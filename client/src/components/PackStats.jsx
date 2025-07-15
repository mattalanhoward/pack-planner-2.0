// src/components/PackStats.jsx
import React from "react";
import { useUserSettings } from "../contexts/UserSettings";
import { BsBackpack4 } from "react-icons/bs";
import { FaTshirt, FaUtensils, FaBalanceScale } from "react-icons/fa";
import StatWithDetails from "./StatWithDetails";

/**
 * Returns a tailwind text color class based on weight thresholds
 */
function baseColorClass(grams) {
  if (grams < 5_000) return "text-green-600";
  if (grams < 15_000) return "text-orange-500";
  return "text-red-500";
}

/**
 * Shows summary stats for a pack: base, worn, consumable, and total
 */
export default function PackStats({
  base = 0,
  worn = 0,
  consumable = 0,
  total = 0,
  breakdowns = { base: [], worn: [], consumable: [], total: [] },
}) {
  const { weightUnit } = useUserSettings();

  // only in imperial units we’ll hide the “Total” stat
  const isImperial = weightUnit === "lb" || weightUnit === "oz";

  const stats = [
    {
      icon: BsBackpack4,
      raw: base,
      label: "Base",
      items: breakdowns.base,
      colorClass: baseColorClass(base),
    },
    {
      icon: FaTshirt,
      raw: worn,
      label: "Worn",
      items: breakdowns.worn,
      colorClass: "text-blue-600",
    },
    {
      icon: FaUtensils,
      raw: consumable,
      label: "Consumable",
      items: breakdowns.consumable,
      colorClass: "text-green-600",
    },
    {
      icon: FaBalanceScale,
      raw: total,
      label: "Total",
      items: breakdowns.total,
      colorClass: "text-accent",
    },
  ];

  // drop the Total entry when in lb/oz mode
  const visibleStats = isImperial
    ? stats.filter((s) => s.label !== "Total")
    : stats;

  return (
    <div className="flex items-center space-x-3 text-xs overflow-x-auto px-3 hide-scrollbar">
      {visibleStats.map((s) => (
        <StatWithDetails key={s.label} {...s} />
      ))}
    </div>
  );
}
