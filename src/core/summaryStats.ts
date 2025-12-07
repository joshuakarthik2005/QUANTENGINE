/**
 * Summary Statistics Module for QuantEngine
 * Uses Welford's algorithm for numerical stability
 */

import { quantile } from '../utils/math';
import type { SummaryStats } from '../utils/types';

/**
 * Compute comprehensive summary statistics using numerically stable algorithms
 */
export function computeSummaryStats(data: number[]): SummaryStats {
  const n = data.length;
  
  if (n === 0) {
    throw new Error('Cannot compute statistics on empty data');
  }

  // Use Welford's algorithm for mean and variance (numerically stable)
  const welford = welfordAlgorithm(data);
  const mean = welford.mean;
  const variance = welford.variance;
  const stdDev = Math.sqrt(variance);

  // Sort data for percentiles and median
  const sorted = [...data].sort((a, b) => a - b);
  const median = quantile(sorted, 0.5);
  const min = sorted[0];
  const max = sorted[n - 1];

  // Percentiles
  const p5 = quantile(sorted, 0.05);
  const p25 = quantile(sorted, 0.25);
  const p50 = median;
  const p75 = quantile(sorted, 0.75);
  const p95 = quantile(sorted, 0.95);

  // Skewness and kurtosis
  const skewness = computeSkewness(data, mean, stdDev);
  const kurtosis = computeKurtosis(data, mean, stdDev);

  return {
    count: n,
    mean,
    variance,
    stdDev,
    median,
    skewness,
    kurtosis,
    min,
    max,
    p5,
    p25,
    p50,
    p75,
    p95
  };
}

/**
 * Welford's algorithm for computing mean and variance in a single pass
 * Numerically stable and avoids catastrophic cancellation
 */
export function welfordAlgorithm(data: number[]): {
  mean: number;
  variance: number;
  m2: number;
} {
  let n = 0;
  let mean = 0;
  let m2 = 0;

  for (const x of data) {
    n++;
    const delta = x - mean;
    mean += delta / n;
    const delta2 = x - mean;
    m2 += delta * delta2;
  }

  const variance = n > 1 ? m2 / (n - 1) : 0;

  return { mean, variance, m2 };
}

/**
 * Compute sample skewness (Fisher-Pearson standardized moment coefficient)
 * Measures asymmetry of the distribution
 */
export function computeSkewness(data: number[], mean: number, stdDev: number): number {
  const n = data.length;
  
  if (n < 3 || stdDev === 0) {
    return 0;
  }

  let m3 = 0;
  for (const x of data) {
    const z = (x - mean) / stdDev;
    m3 += z * z * z;
  }

  // Sample skewness with bias correction
  const skew = m3 / n;
  const correction = Math.sqrt(n * (n - 1)) / (n - 2);
  
  return skew * correction;
}

/**
 * Compute sample excess kurtosis (4th standardized moment - 3)
 * Measures tail heaviness relative to normal distribution
 * Excess kurtosis = 0 for normal distribution
 */
export function computeKurtosis(data: number[], mean: number, stdDev: number): number {
  const n = data.length;
  
  if (n < 4 || stdDev === 0) {
    return 0;
  }

  let m4 = 0;
  for (const x of data) {
    const z = (x - mean) / stdDev;
    m4 += z * z * z * z;
  }

  // Sample kurtosis with bias correction
  const kurt = m4 / n;
  
  // Bias correction for excess kurtosis
  const correction1 = (n - 1) / ((n - 2) * (n - 3));
  const correction2 = ((n + 1) * kurt - 3 * (n - 1));
  
  return correction1 * correction2;
}

/**
 * Compute median (50th percentile) from sorted data
 */
export function computeMedian(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  
  if (n % 2 === 1) {
    return sorted[Math.floor(n / 2)];
  } else {
    const mid = n / 2;
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
}

/**
 * Compute interquartile range (IQR)
 */
export function computeIQR(sorted: number[]): number {
  const q25 = quantile(sorted, 0.25);
  const q75 = quantile(sorted, 0.75);
  return q75 - q25;
}

/**
 * Compute mean absolute deviation (MAD)
 */
export function computeMAD(data: number[], center?: number): number {
  const c = center ?? data.reduce((sum, x) => sum + x, 0) / data.length;
  const mad = data.reduce((sum, x) => sum + Math.abs(x - c), 0) / data.length;
  return mad;
}

/**
 * Format a statistic for display with appropriate precision
 */
export function formatStat(value: number, decimals: number = 4): string {
  if (!isFinite(value)) return 'N/A';
  
  // Use scientific notation for very large or very small numbers
  if (Math.abs(value) > 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
    return value.toExponential(3);
  }
  
  return value.toFixed(decimals);
}
