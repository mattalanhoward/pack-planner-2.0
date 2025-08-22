// Jest version of the weight tests (no vitest import)
import { extractWeightGrams } from "./weight";

describe("extractWeightGrams", () => {
  it("grams", () => {
    expect(extractWeightGrams("weighs 250 g")).toBe(250);
    expect(extractWeightGrams("350g pack")).toBe(350);
  });

  it("kilograms", () => {
    expect(extractWeightGrams("1 kg tent")).toBe(1000);
    expect(extractWeightGrams("1.2kg")).toBe(1200);
  });

  it("ounces", () => {
    expect(extractWeightGrams("7 oz headlamp")).toBeCloseTo(198, 0);
    expect(extractWeightGrams("12.5oz")).toBeCloseTo(354, 0);
  });

  it("pounds", () => {
    expect(extractWeightGrams("1 lb quilt")).toBeCloseTo(454, 0);
    expect(extractWeightGrams("2lb")).toBeCloseTo(907, 0);
  });

  it("pounds and ounces", () => {
    expect(extractWeightGrams("1 lb 4 oz")).toBeCloseTo(567, 0);
    expect(extractWeightGrams("0 lb 8 oz")).toBeCloseTo(227, 0);
  });

  it("comma decimal", () => {
    expect(extractWeightGrams("0,5 kg")).toBe(500);
    expect(extractWeightGrams("12,3 oz")).toBeCloseTo(349, 0);
  });

  it("no weight returns null", () => {
    expect(extractWeightGrams("no weight here")).toBeNull();
  });

  it("plural pounds + ounces", () => {
    expect(extractWeightGrams("2 lbs 3 oz total")).toBeCloseTo(992, 0);
  });
});
