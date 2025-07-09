// src/utils/weight.js
/**
 * Convert grams into a numeric value in the target unit.
 */
export function convertWeight(grams, unit) {
  switch (unit) {
    case "kg":
      return grams / 1000;
    case "lb":
      return grams * 0.00220462;
    case "oz":
      return grams * 0.035274;
    case "g":
    default:
      return grams;
  }
}

/**
 * Format a grams value into a localized string.
 * Supports explicit units ("g","kg","lb","oz") and "auto" mode.
 */
export function formatWeight(grams, unitPref = "auto") {
  if (unitPref === "auto") {
    // fallback to original auto: <1000 g, else kg
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(1)} kg`;
    } else {
      return `${grams} g`;
    }
  }

  // explicit units – handle composite oz→lb + oz
  switch (unitPref) {
    case "oz": {
      // fractional ounces to 1 decimal
      const totalOz = grams * 0.035274;
      if (totalOz >= 16) {
        const lbs = Math.floor(totalOz / 16);
        // leftover ounces
        let oz = totalOz - lbs * 16;
        // round to tenths
        oz = parseFloat(oz.toFixed(1));
        // if oz rounds to 16.0, roll up into next lb
        if (oz === 16.0) {
          return `${lbs + 1}\u00A0lb`;
        }
        // drop the “0 oz” when it's an even pound
        return oz === 0 ? `${lbs}\u00A0lb` : `${lbs}\u00A0lb ${oz}\u00A0oz`;
      }
      // under a pound—show fractional ounces
      return `${totalOz.toFixed(1)}\u00A0oz`;
    }
    case "lb": {
      // if you prefer decimal pounds, keep your old behavior:
      const lbs = grams * 0.00220462;
      return `${lbs.toFixed(1)}\u00A0lb`;
    }
    case "kg": {
      const kg = grams / 1000;
      return `${kg.toFixed(1)}\u00A0kg`;
    }
    case "g":
    default: {
      const g = Math.round(grams);
      return `${g}\u00A0g`;
    }
  }
}

/**
 * Turn a display value in {kg, lb, oz, g} back into *rounded* grams.
 */
export function parseWeight(value, unit) {
  const v = parseFloat(value) || 0;
  let grams;
  switch (unit) {
    case "kg":
      grams = v * 1000;
      break;
    case "lb":
      grams = v / 0.00220462;
      break;
    case "oz":
      grams = v / 0.035274;
      break;
    case "g":
    default:
      grams = v;
  }
  // Round to nearest whole gram:
  return Math.round(grams);
}
