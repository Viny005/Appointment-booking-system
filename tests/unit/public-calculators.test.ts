import { describe, expect, it } from "vitest";
import {
  budgetBalance,
  futureValue,
  monthlyForGoal,
  nonNegativeNumber,
  reserveTarget,
} from "@/app/berater/[slug]/rechner/calculator-math";

describe("public calculator helpers", () => {
  it("parses German decimals and clamps invalid or negative input", () => {
    expect(nonNegativeNumber("12,5")).toBe(12.5);
    expect(nonNegativeNumber("-4")).toBe(0);
    expect(nonNegativeNumber("abc")).toBe(0);
  });

  it("calculates monthly budget balance", () => {
    expect(budgetBalance(2500, 1500, 500)).toBe(500);
    expect(budgetBalance(1000, 1200, 100)).toBe(-300);
  });

  it("calculates savings at zero return without division errors", () => {
    expect(futureValue(1000, 100, 0, 1)).toBe(2200);
    expect(futureValue(1000, 100, 5, 0)).toBe(1000);
  });

  it("calculates a positive future value with compound growth", () => {
    const value = futureValue(5000, 200, 3, 10);
    expect(value).toBeGreaterThan(33000);
    expect(value).toBeLessThan(35000);
  });

  it("calculates goal contribution and returns zero when already funded", () => {
    expect(monthlyForGoal(12000, 0, 0, 1)).toBe(1000);
    expect(monthlyForGoal(1000, 2000, 3, 10)).toBe(0);
  });

  it("calculates reserve target", () => {
    expect(reserveTarget(1500, 3)).toBe(4500);
  });
});
