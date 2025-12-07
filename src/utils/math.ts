/**
 * Core Mathematical Utilities for QuantEngine Statistical Diagnostics
 * Professional-grade numerical functions with numerical stability
 */

/**
 * Error function (erf) approximation using Abramowitz and Stegun formula
 * Maximum error: 1.5e-7
 */
export function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Complementary error function
 */
export function erfc(x: number): number {
  return 1.0 - erf(x);
}

/**
 * Inverse error function approximation
 */
export function erfInv(x: number): number {
  if (x < -1 || x > 1) return NaN;
  if (x === 0) return 0;
  if (x === 1) return Infinity;
  if (x === -1) return -Infinity;

  const a = 0.147;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const ln1mx2 = Math.log(1 - x * x);
  const term1 = 2 / (Math.PI * a) + ln1mx2 / 2;
  const term2 = ln1mx2 / a;

  return sign * Math.sqrt(Math.sqrt(term1 * term1 - term2) - term1);
}

/**
 * Standard normal cumulative distribution function (CDF)
 */
export function normCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

/**
 * Standard normal probability density function (PDF)
 */
export function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Inverse standard normal CDF (quantile function)
 */
export function normInv(p: number): number {
  if (p <= 0 || p >= 1) return NaN;
  return Math.sqrt(2) * erfInv(2 * p - 1);
}

/**
 * Log-gamma function using Lanczos approximation
 */
export function logGamma(x: number): number {
  if (x <= 0) return NaN;

  const g = 7;
  const coef = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];

  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }

  x -= 1;
  let a = coef[0];
  for (let i = 1; i < g + 2; i++) {
    a += coef[i] / (x + i);
  }

  const t = x + g + 0.5;
  return Math.log(Math.sqrt(2 * Math.PI)) + Math.log(a) + (x + 0.5) * Math.log(t) - t;
}

/**
 * Gamma function
 */
export function gamma(x: number): number {
  return Math.exp(logGamma(x));
}

/**
 * Incomplete beta function (needed for Student t-distribution CDF)
 */
export function betaInc(x: number, a: number, b: number): number {
  if (x < 0 || x > 1) return NaN;
  if (x === 0) return 0;
  if (x === 1) return 1;

  // Use continued fraction approximation
  const MAXIT = 100;
  const EPS = 3e-7;
  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  
  let front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;
  let f = 1.0;
  let c = 1.0;
  let d = 1.0 / (1.0 - (a + b) * x / (a + 1.0));

  for (let i = 1; i <= MAXIT; i++) {
    const m = i;
    const aa = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1.0 / (1.0 + aa * d);
    c = 1.0 + aa / c;
    f *= d * c;

    const aa2 = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1.0 / (1.0 + aa2 * d);
    c = 1.0 + aa2 / c;
    const del = d * c;
    f *= del;

    if (Math.abs(del - 1.0) < EPS) break;
  }

  return front * f;
}

/**
 * Student t-distribution CDF
 */
export function tCDF(x: number, df: number): number {
  if (df <= 0) return NaN;
  
  const t2 = x * x;
  const z = t2 / (df + t2);
  const p = 0.5 * betaInc(z, 0.5 * df, 0.5);
  
  return x >= 0 ? 1 - p : p;
}

/**
 * Student t-distribution PDF
 */
export function tPDF(x: number, df: number): number {
  if (df <= 0) return NaN;
  
  const num = gamma((df + 1) / 2);
  const denom = Math.sqrt(df * Math.PI) * gamma(df / 2);
  return (num / denom) * Math.pow(1 + (x * x) / df, -(df + 1) / 2);
}

/**
 * Laplace distribution PDF
 */
export function laplacePDF(x: number, mu: number, b: number): number {
  return (1 / (2 * b)) * Math.exp(-Math.abs(x - mu) / b);
}

/**
 * Chi-squared CDF (for Jarque-Bera test)
 */
export function chi2CDF(x: number, df: number): number {
  if (x < 0 || df <= 0) return NaN;
  if (x === 0) return 0;
  
  return betaInc(x / (x + df), x / 2, df / 2);
}

/**
 * Golden section search for 1D optimization
 * Used for finding degrees of freedom in Student t-distribution
 */
export function goldenSectionSearch(
  f: (x: number) => number,
  a: number,
  b: number,
  tol: number = 1e-5
): number {
  const phi = (1 + Math.sqrt(5)) / 2;
  const resphi = 2 - phi;

  let x1 = a + resphi * (b - a);
  let x2 = b - resphi * (b - a);
  let f1 = f(x1);
  let f2 = f(x2);

  while (Math.abs(b - a) > tol) {
    if (f1 < f2) {
      b = x2;
      x2 = x1;
      f2 = f1;
      x1 = a + resphi * (b - a);
      f1 = f(x1);
    } else {
      a = x1;
      x1 = x2;
      f1 = f2;
      x2 = b - resphi * (b - a);
      f2 = f(x2);
    }
  }

  return (a + b) / 2;
}

/**
 * Sort array in ascending order (in-place)
 */
export function sort(arr: number[]): number[] {
  return arr.sort((a, b) => a - b);
}

/**
 * Calculate quantile from sorted array
 */
export function quantile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return NaN;
  if (p <= 0) return sortedArr[0];
  if (p >= 1) return sortedArr[sortedArr.length - 1];

  const index = p * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
}

/**
 * Safe division (returns 0 if denominator is 0)
 */
export function safeDivide(num: number, den: number): number {
  return den === 0 ? 0 : num / den;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Approximate inverse Student t-distribution CDF (quantile function)
 * Uses Hill and Davis (1968) approximation
 */
export function tInv(p: number, df: number): number {
  if (p <= 0 || p >= 1) return NaN;
  if (df <= 0) return NaN;
  
  // For large df, approximate as normal
  if (df > 100) {
    return normInv(p);
  }
  
  // Use normal approximation with correction terms
  const z = normInv(p);
  
  // Hill and Davis approximation
  const g1 = (z * z * z + z) / 4;
  const g2 = (5 * z * z * z * z * z + 16 * z * z * z + 3 * z) / 96;
  const g3 = (3 * z * z * z * z * z * z * z + 19 * z * z * z * z * z + 17 * z * z * z - 15 * z) / 384;
  
  const correction = g1 / df + g2 / (df * df) + g3 / (df * df * df);
  
  return z + correction;
}
