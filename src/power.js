const SQRT2 = Math.sqrt(2);

export function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const ax = Math.abs(x);
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

export function normalCdf(x) {
  return 0.5 * (1 + erf(x / SQRT2));
}

export function inverseNormalCdf(p) {
  if (!(p > 0 && p < 1)) throw new Error("p must be between 0 and 1");
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const plow = 0.02425, phigh = 1 - plow;
  let q, r;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > phigh) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  q = p - 0.5;
  r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export function treatmentRate({ baseline, effectValue, effectMode }) {
  const p0 = baseline / 100;
  const p1 = effectMode === "relative"
    ? p0 * (1 + effectValue / 100)
    : p0 + effectValue / 100;
  return p1;
}

export function powerForTotalN({ totalN, p0, p1, alpha = 0.05, treatmentShare = 0.5 }) {
  if (totalN <= 1 || p0 <= 0 || p0 >= 1 || p1 <= 0 || p1 >= 1) return 0;
  const nt = totalN * treatmentShare;
  const nc = totalN * (1 - treatmentShare);
  if (nt <= 0 || nc <= 0) return 0;
  const se = Math.sqrt((p0 * (1 - p0)) / nc + (p1 * (1 - p1)) / nt);
  if (!Number.isFinite(se) || se <= 0) return 0;
  const lambda = Math.abs(p1 - p0) / se;
  const z = inverseNormalCdf(1 - alpha / 2);
  return (1 - normalCdf(z - lambda)) + normalCdf(-z - lambda);
}

export function requiredSampleSize({ p0, p1, alpha = 0.05, targetPower = 0.8, treatmentShare = 0.5, maxN = 100000000 }) {
  let lo = 4;
  let hi = 8;
  while (hi < maxN && powerForTotalN({ totalN: hi, p0, p1, alpha, treatmentShare }) < targetPower) {
    hi *= 2;
  }
  if (hi > maxN) hi = maxN;
  if (powerForTotalN({ totalN: hi, p0, p1, alpha, treatmentShare }) < targetPower) {
    return null;
  }
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const pow = powerForTotalN({ totalN: mid, p0, p1, alpha, treatmentShare });
    if (pow >= targetPower) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

export function analyzeDesign({
  baseline,
  effectValue,
  effectMode,
  alphaPct,
  powerPct,
  treatmentPct,
  availableSample,
  attritionPct
}) {
  const p0 = baseline / 100;
  const p1 = treatmentRate({ baseline, effectValue, effectMode });
  const alpha = alphaPct / 100;
  const targetPower = powerPct / 100;
  const treatmentShare = treatmentPct / 100;
  const attrition = attritionPct / 100;

  const requiredAnalyzable = requiredSampleSize({ p0, p1, alpha, targetPower, treatmentShare });
  if (!requiredAnalyzable) return { error: "Required sample exceeds calculator limit." };

  const startingN = Math.ceil(requiredAnalyzable / (1 - attrition));
  const controlN = Math.ceil(requiredAnalyzable * (1 - treatmentShare));
  const treatmentN = requiredAnalyzable - controlN;
  const analyzableAvailable = Math.max(2, Math.floor(availableSample * (1 - attrition)));
  const achievedPower = powerForTotalN({
    totalN: analyzableAvailable,
    p0,
    p1,
    alpha,
    treatmentShare
  });

  return {
    p0, p1, alpha, targetPower, treatmentShare, attrition,
    requiredAnalyzable, startingN, controlN, treatmentN,
    analyzableAvailable, achievedPower,
    feasible: availableSample >= startingN
  };
}
