/**
 * Tail Risk Metrics Module for QuantEngine
 * Includes VaR, CVaR, and Hill tail index estimator
 */

import { quantile } from '../utils/math';
import type { TailMetrics } from '../utils/types';

/**
 * Compute comprehensive tail risk metrics
 */
export function computeTailMetrics(data: number[]): TailMetrics {
  const sorted = [...data].sort((a, b) => a - b);

  // Value at Risk (VaR) - historical method
  const var95 = computeVaR(sorted, 0.95);
  const var99 = computeVaR(sorted, 0.99);

  // Conditional Value at Risk (CVaR) / Expected Shortfall
  const cvar95 = computeCVaR(sorted, 0.95);
  const cvar99 = computeCVaR(sorted, 0.99);

  // Hill tail index (estimates tail heaviness)
  const hillIndex = computeHillIndex(sorted);

  return {
    var95,
    var99,
    cvar95,
    cvar99,
    hillIndex
  };
}

/**
 * Compute Value at Risk (VaR) at given confidence level
 * VaR(α) = quantile at (1-α) for loss distribution
 * 
 * For returns: negative of lower tail quantile
 * VaR(95%) = -5th percentile (loss that will not be exceeded with 95% confidence)
 */
export function computeVaR(sorted: number[], confidence: number): number {
  // For a loss distribution, VaR is the (1-α) quantile
  // For returns, we look at the lower tail
  const alpha = 1 - confidence;
  return -quantile(sorted, alpha); // Negative sign for loss convention
}

/**
 * Compute Conditional Value at Risk (CVaR) / Expected Shortfall
 * CVaR(α) = E[X | X ≤ VaR(α)]
 * 
 * Average of losses beyond VaR threshold
 */
export function computeCVaR(sorted: number[], confidence: number): number {
  const n = sorted.length;
  const alpha = 1 - confidence;
  
  // Find index for VaR
  const varIndex = Math.floor(alpha * n);
  
  if (varIndex === 0) {
    return -sorted[0];
  }

  // Average of all losses beyond VaR (in the tail)
  let sum = 0;
  for (let i = 0; i < varIndex; i++) {
    sum += sorted[i];
  }

  return -sum / varIndex; // Negative sign for loss convention
}

/**
 * Compute Hill tail index estimator
 * Estimates the tail index γ of a Pareto-like tail
 * 
 * Higher γ → heavier tail
 * γ > 0.3: very heavy tail (common in financial data)
 * γ ~ 0.2: moderate tail
 * γ < 0.1: light tail (close to normal)
 * 
 * For returns, we analyze the right tail (extreme positive returns)
 */
export function computeHillIndex(sorted: number[]): number {
  const n = sorted.length;
  
  // Select top k observations for tail analysis
  // Rule of thumb: k = max(√n, 5% of n, 20)
  const k = Math.max(
    Math.floor(Math.sqrt(n)),
    Math.floor(0.05 * n),
    20
  );

  // Ensure k doesn't exceed reasonable bounds
  const kActual = Math.min(k, Math.floor(n * 0.2)); // Max 20% of data

  if (kActual < 5) {
    return NaN; // Not enough data for reliable estimation
  }

  // Hill estimator for right tail (extreme high values)
  const threshold = sorted[n - kActual];
  
  let sum = 0;
  for (let i = n - kActual; i < n; i++) {
    const logRatio = Math.log(sorted[i] / threshold);
    sum += logRatio;
  }

  const gamma = sum / kActual;

  return gamma;
}

/**
 * Compute left tail index (for negative extreme returns)
 */
export function computeLeftTailIndex(sorted: number[]): number {
  const n = sorted.length;
  
  const k = Math.max(
    Math.floor(Math.sqrt(n)),
    Math.floor(0.05 * n),
    20
  );

  const kActual = Math.min(k, Math.floor(n * 0.2));

  if (kActual < 5) {
    return NaN;
  }

  // Analyze left tail (extreme low values)
  // Transform to positive values for Hill estimator
  const threshold = -sorted[kActual - 1];
  
  let sum = 0;
  for (let i = 0; i < kActual; i++) {
    const val = -sorted[i];
    if (val > 0) {
      const logRatio = Math.log(val / threshold);
      sum += logRatio;
    }
  }

  return sum / kActual;
}

/**
 * Interpret Hill index value
 */
export function interpretHillIndex(gamma: number): string {
  if (isNaN(gamma)) {
    return 'Insufficient data';
  }

  if (gamma > 0.5) {
    return 'Extremely heavy tail (Pareto-like)';
  } else if (gamma > 0.3) {
    return 'Very heavy tail (common in finance)';
  } else if (gamma > 0.15) {
    return 'Moderate tail';
  } else if (gamma > 0.05) {
    return 'Light tail';
  } else {
    return 'Very light tail (near-normal)';
  }
}

/**
 * Compute Maximum Drawdown (for time series data)
 * Largest peak-to-trough decline
 */
export function computeMaxDrawdown(data: number[]): {
  maxDrawdown: number;
  maxDrawdownPercent: number;
  peakIndex: number;
  troughIndex: number;
} {
  const n = data.length;
  
  if (n === 0) {
    return {
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      peakIndex: -1,
      troughIndex: -1
    };
  }

  // Compute cumulative returns
  let cumulative = 1;
  const cumReturns: number[] = [cumulative];
  
  for (let i = 0; i < n; i++) {
    cumulative *= (1 + data[i]);
    cumReturns.push(cumulative);
  }

  // Find maximum drawdown
  let maxDD = 0;
  let maxDDPercent = 0;
  let peakIdx = 0;
  let troughIdx = 0;
  let runningMax = cumReturns[0];
  let runningMaxIdx = 0;

  for (let i = 1; i < cumReturns.length; i++) {
    if (cumReturns[i] > runningMax) {
      runningMax = cumReturns[i];
      runningMaxIdx = i;
    }

    const dd = runningMax - cumReturns[i];
    const ddPercent = (runningMax - cumReturns[i]) / runningMax;

    if (ddPercent > maxDDPercent) {
      maxDDPercent = ddPercent;
      maxDD = dd;
      peakIdx = runningMaxIdx;
      troughIdx = i;
    }
  }

  return {
    maxDrawdown: maxDD,
    maxDrawdownPercent: maxDDPercent,
    peakIndex: peakIdx,
    troughIndex: troughIdx
  };
}

/**
 * Compute downside deviation (semi-deviation)
 * Only considers returns below a threshold (typically 0)
 */
export function computeDownsideDeviation(
  data: number[],
  threshold: number = 0
): number {
  const n = data.length;
  let sum = 0;
  let count = 0;

  for (const x of data) {
    if (x < threshold) {
      sum += Math.pow(x - threshold, 2);
      count++;
    }
  }

  return count > 0 ? Math.sqrt(sum / n) : 0;
}

/**
 * Compute Sortino ratio
 * Risk-adjusted return using downside deviation
 */
export function computeSortinoRatio(
  data: number[],
  riskFreeRate: number = 0
): number {
  const mean = data.reduce((sum, x) => sum + x, 0) / data.length;
  const downsideDev = computeDownsideDeviation(data, riskFreeRate);
  
  return downsideDev > 0 ? (mean - riskFreeRate) / downsideDev : 0;
}
