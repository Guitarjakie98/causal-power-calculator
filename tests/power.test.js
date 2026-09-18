import test from "node:test";
import assert from "node:assert/strict";
import {
  inverseNormalCdf,
  normalCdf,
  treatmentRate,
  powerForTotalN,
  requiredSampleSize,
  analyzeDesign
} from "../src/power.js";

test("normal distribution helpers are approximately consistent", () => {
  const z = inverseNormalCdf(0.975);
  assert.ok(Math.abs(z - 1.95996) < 0.002);
  assert.ok(Math.abs(normalCdf(z) - 0.975) < 0.001);
});

test("relative effect converts baseline to treatment rate", () => {
  const p1 = treatmentRate({ baseline: 10, effectValue: 20, effectMode: "relative" });
  assert.ok(Math.abs(p1 - 0.12) < 1e-12);
});

test("absolute effect converts baseline to treatment rate", () => {
  const p1 = treatmentRate({ baseline: 10, effectValue: 2, effectMode: "absolute" });
  assert.ok(Math.abs(p1 - 0.12) < 1e-12);
});

test("power increases with sample size", () => {
  const small = powerForTotalN({ totalN: 1000, p0: 0.10, p1: 0.12, alpha: 0.05, treatmentShare: 0.5 });
  const large = powerForTotalN({ totalN: 10000, p0: 0.10, p1: 0.12, alpha: 0.05, treatmentShare: 0.5 });
  assert.ok(large > small);
});

test("required sample for 10% to 12% is near 7.7k under 80% power", () => {
  const n = requiredSampleSize({
    p0: 0.10,
    p1: 0.12,
    alpha: 0.05,
    targetPower: 0.80,
    treatmentShare: 0.5
  });
  assert.ok(n > 7400 && n < 8000);
});

test("attrition inflates recruitment target", () => {
  const result = analyzeDesign({
    baseline: 10,
    effectValue: 20,
    effectMode: "relative",
    alphaPct: 5,
    powerPct: 80,
    treatmentPct: 50,
    availableSample: 10000,
    attritionPct: 10
  });
  assert.ok(result.startingN > result.requiredAnalyzable);
  assert.equal(result.feasible, true);
});

test("unequal allocation requires at least as much total N as balanced allocation", () => {
  const balanced = requiredSampleSize({
    p0: 0.10,
    p1: 0.12,
    alpha: 0.05,
    targetPower: 0.80,
    treatmentShare: 0.5
  });
  const unbalanced = requiredSampleSize({
    p0: 0.10,
    p1: 0.12,
    alpha: 0.05,
    targetPower: 0.80,
    treatmentShare: 0.2
  });
  assert.ok(unbalanced >= balanced);
});
