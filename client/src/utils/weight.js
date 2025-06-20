// src/utils/weight.js

/**
 * @param {number} grams
 * @param {"auto"|"g"|"kg"|"lb"} unitPref
 */
export function formatWeight(grams, unitPref = "auto") {
  // "auto" mode: grams under 1000 stay in g, everything else in kg
  if (unitPref === "auto") {
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(1)} kg`;
    } else {
      return `${grams} g`;
    }
  }

  // explicit units:
  switch (unitPref) {
    case "kg":
      return `${(grams / 1000).toFixed(1)} kg`;
    case "lb":
      return `${(grams * 0.00220462).toFixed(1)} lb`;
    case "g":
    default:
      return `${grams} g`;
  }
}
