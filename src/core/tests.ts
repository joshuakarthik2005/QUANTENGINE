/**
 * Statistical Tests Module for QuantEngine
 * Includes Jarque-Bera and Kolmogorov-Smirnov tests
 */

import { chi2CDF, normCDF } from '../utils/math';
import type { StatisticalTest } from '../utils/types';

/**
 * Jarque-Bera test for normality
 * Tests null hypothesis: data comes from a normal distribution
 * Based on sample skewness and kurtosis
 */
export function jarqueBeraTest(
  data: number[],
  skewness: number,
  kurtosis: number,
  alpha: number = 0.05
): StatisticalTest {
  const n = data.length;

  // JB statistic = (n/6) * (S² + K²/4)
  // where S = skewness, K = excess kurtosis
  const jb = (n / 6) * (Math.pow(skewness, 2) + Math.pow(kurtosis, 2) / 4);

  // JB follows chi-squared distribution with df = 2
  const pValue = 1 - chi2CDF(jb, 2);

  return {
    name: 'Jarque-Bera',
    statistic: jb,
    pValue,
    rejectNull: pValue < alpha,
    alpha
  };
}

/**
 * Kolmogorov-Smirnov test for normality
 * Tests null hypothesis: data comes from specified normal distribution
 * Compares empirical CDF with theoretical CDF
 */
export function kolmogorovSmirnovTest(
  data: number[],
  mu: number,
  sigma: number,
  alpha: number = 0.05
): StatisticalTest {
  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);

  // Compute D-statistic: max difference between empirical and theoretical CDF
  let dPlus = 0;
  let dMinus = 0;

  for (let i = 0; i < n; i++) {
    const x = sorted[i];
    const empiricalCDF = (i + 1) / n;
    const theoreticalCDF = normCDF((x - mu) / sigma);

    // D+ = max(F_empirical - F_theoretical)
    dPlus = Math.max(dPlus, empiricalCDF - theoreticalCDF);
    
    // D- = max(F_theoretical - F_empirical)
    dMinus = Math.max(dMinus, theoreticalCDF - (i / n));
  }

  const d = Math.max(dPlus, dMinus);

  // Compute p-value using asymptotic approximation
  const pValue = ksAsymptoticPValue(d, n);

  return {
    name: 'Kolmogorov-Smirnov',
    statistic: d,
    pValue,
    rejectNull: pValue < alpha,
    alpha
  };
}

/**
 * Asymptotic p-value for KS test
 * Using Kolmogorov distribution approximation
 */
function ksAsymptoticPValue(d: number, n: number): number {
  const lambda = (Math.sqrt(n) + 0.12 + 0.11 / Math.sqrt(n)) * d;

  // Compute complementary CDF using series approximation
  let sum = 0;
  for (let k = 1; k <= 100; k++) {
    const term = 2 * Math.pow(-1, k - 1) * Math.exp(-2 * k * k * lambda * lambda);
    sum += term;
    if (Math.abs(term) < 1e-10) break;
  }

  return Math.max(0, Math.min(1, sum));
}

/**
 * Anderson-Darling test for normality (alternative to KS)
 * More sensitive to tail differences
 */
export function andersonDarlingTest(
  data: number[],
  mu: number,
  sigma: number,
  alpha: number = 0.05
): StatisticalTest {
  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);

  // Compute A² statistic
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = sorted[i];
    const z = (x - mu) / sigma;
    const phi = normCDF(z);
    
    // Avoid log(0)
    const phi1 = Math.max(1e-10, Math.min(1 - 1e-10, phi));
    const phi2 = Math.max(1e-10, Math.min(1 - 1e-10, 1 - phi));
    
    sum += (2 * (i + 1) - 1) * (Math.log(phi1) + Math.log(phi2));
  }

  const a2 = -n - sum / n;

  // Adjust for estimated parameters
  const a2Adjusted = a2 * (1 + 0.75 / n + 2.25 / (n * n));

  // Critical values for normal distribution
  // alpha = 0.05: critical value = 0.787
  const criticalValue = 0.787;
  const rejectNull = a2Adjusted > criticalValue;

  // Approximate p-value
  let pValue: number;
  if (a2Adjusted < 0.2) {
    pValue = 1 - Math.exp(-13.436 + 101.14 * a2Adjusted - 223.73 * a2Adjusted * a2Adjusted);
  } else if (a2Adjusted < 0.34) {
    pValue = 1 - Math.exp(-8.318 + 42.796 * a2Adjusted - 59.938 * a2Adjusted * a2Adjusted);
  } else if (a2Adjusted < 0.6) {
    pValue = Math.exp(0.9177 - 4.279 * a2Adjusted - 1.38 * a2Adjusted * a2Adjusted);
  } else {
    pValue = Math.exp(1.2937 - 5.709 * a2Adjusted + 0.0186 * a2Adjusted * a2Adjusted);
  }

  pValue = Math.max(0, Math.min(1, pValue));

  return {
    name: 'Anderson-Darling',
    statistic: a2Adjusted,
    pValue,
    rejectNull,
    alpha
  };
}

/**
 * Shapiro-Wilk test for normality
 * Very powerful but computationally intensive for large samples
 * Recommended for n < 2000
 */
export function shapiroWilkTest(
  data: number[],
  alpha: number = 0.05
): StatisticalTest | null {
  const n = data.length;

  // Only compute for reasonable sample sizes
  if (n < 3 || n > 5000) {
    return null;
  }

  const sorted = [...data].sort((a, b) => a - b);

  // Compute mean
  const mean = data.reduce((sum, x) => sum + x, 0) / n;

  // Compute denominator: sum of squared deviations
  const ssTotal = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);

  // Compute numerator using Shapiro-Wilk coefficients (simplified)
  // Full implementation requires looking up coefficient tables
  // This is a simplified approximation
  let numerator = 0;
  const k = Math.floor(n / 2);

  for (let i = 0; i < k; i++) {
    const ai = computeShapiroWilkCoefficient(i + 1, n);
    numerator += ai * (sorted[n - 1 - i] - sorted[i]);
  }

  const w = Math.pow(numerator, 2) / ssTotal;

  // Approximate p-value (simplified)
  const logW = Math.log(1 - w);
  const z = (-logW - 1) / Math.sqrt(2 / n);
  const pValue = 1 - normCDF(z);

  return {
    name: 'Shapiro-Wilk',
    statistic: w,
    pValue: Math.max(0, Math.min(1, pValue)),
    rejectNull: pValue < alpha,
    alpha
  };
}

/**
 * Approximate Shapiro-Wilk coefficients
 * Full implementation would use precomputed tables
 */
function computeShapiroWilkCoefficient(_i: number, n: number): number {
  // Simplified approximation
  return 1 / Math.sqrt(n);
}

/**
 * Interpret test result in plain language
 */
export function interpretTest(test: StatisticalTest): string {
  if (test.name.includes('normality') || test.name === 'Jarque-Bera' || 
      test.name === 'Kolmogorov-Smirnov' || test.name === 'Anderson-Darling' ||
      test.name === 'Shapiro-Wilk') {
    
    if (test.rejectNull) {
      return `Reject normality at ${test.alpha * 100}% significance level (p = ${test.pValue.toFixed(4)})`;
    } else {
      return `Cannot reject normality at ${test.alpha * 100}% significance level (p = ${test.pValue.toFixed(4)})`;
    }
  }

  return test.rejectNull 
    ? `Reject null hypothesis (p = ${test.pValue.toFixed(4)})`
    : `Cannot reject null hypothesis (p = ${test.pValue.toFixed(4)})`;
}
