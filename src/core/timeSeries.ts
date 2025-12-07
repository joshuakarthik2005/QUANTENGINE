/**
 * Time-Series Analysis Module for QuantEngine
 * ACF, PACF, rolling statistics, AR(1), stationarity tests
 */

export interface ACFPoint {
  lag: number;
  value: number;
  significant: boolean;
}

export interface TimeSeriesDiagnostics {
  acf: ACFPoint[];
  pacf: ACFPoint[];
  rollingMean: number[];
  rollingStd: number[];
  squaredReturns: number[];
  ar1Phi: number;
  ar1TStat: number;
  ar1RSquared: number;
  ar1Stationary: boolean;
  adfStatistic: number;
  adfPValue: number;
  adfStationarity: 'stationary' | 'non-stationary' | 'marginal';
}

/**
 * Compute autocorrelation function (ACF)
 */
export function computeACF(data: number[], maxLag: number = 20): ACFPoint[] {
  const n = data.length;
  const mean = data.reduce((sum, x) => sum + x, 0) / n;
  
  // Variance
  const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
  
  const acf: ACFPoint[] = [];
  const confidenceBound = 1.96 / Math.sqrt(n); // 95% confidence interval
  
  for (let lag = 1; lag <= Math.min(maxLag, n - 1); lag++) {
    let covariance = 0;
    for (let t = lag; t < n; t++) {
      covariance += (data[t] - mean) * (data[t - lag] - mean);
    }
    covariance /= n;
    
    const correlation = covariance / variance;
    acf.push({
      lag,
      value: correlation,
      significant: Math.abs(correlation) > confidenceBound
    });
  }
  
  return acf;
}

/**
 * Compute partial autocorrelation function (PACF) using Levinson-Durbin recursion
 */
export function computePACF(data: number[], maxLag: number = 20): ACFPoint[] {
  const n = data.length;
  const acfValues = computeACF(data, maxLag);
  const pacf: ACFPoint[] = [];
  const confidenceBound = 1.96 / Math.sqrt(n);
  
  if (acfValues.length === 0) return [];
  
  // PACF[1] = ACF[1]
  pacf.push({
    lag: 1,
    value: acfValues[0].value,
    significant: Math.abs(acfValues[0].value) > confidenceBound
  });
  
  // Levinson-Durbin recursion for higher lags
  const phi: number[][] = [[acfValues[0].value]];
  
  for (let k = 2; k <= Math.min(maxLag, acfValues.length); k++) {
    let numerator = acfValues[k - 1].value;
    let denominator = 1;
    
    for (let j = 1; j < k; j++) {
      numerator -= phi[k - 2][j - 1] * acfValues[k - 1 - j].value;
      denominator -= phi[k - 2][j - 1] * acfValues[j - 1].value;
    }
    
    const pacfValue = numerator / denominator;
    
    // Update phi coefficients
    const newPhi: number[] = [];
    for (let j = 0; j < k - 1; j++) {
      newPhi[j] = phi[k - 2][j] - pacfValue * phi[k - 2][k - 2 - j];
    }
    newPhi[k - 1] = pacfValue;
    phi.push(newPhi);
    
    pacf.push({
      lag: k,
      value: pacfValue,
      significant: Math.abs(pacfValue) > confidenceBound
    });
  }
  
  return pacf;
}

/**
 * Compute rolling statistics
 */
export function computeRollingStats(data: number[], window: number): {
  rollingMean: number[];
  rollingStd: number[];
} {
  const n = data.length;
  const rollingMean: number[] = [];
  const rollingStd: number[] = [];
  
  for (let i = window - 1; i < n; i++) {
    const slice = data.slice(i - window + 1, i + 1);
    const mean = slice.reduce((sum, x) => sum + x, 0) / window;
    const variance = slice.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / window;
    
    rollingMean.push(mean);
    rollingStd.push(Math.sqrt(variance));
  }
  
  return { rollingMean, rollingStd };
}

/**
 * Compute squared returns for volatility clustering
 */
export function computeSquaredReturns(data: number[]): number[] {
  return data.map(x => x * x);
}

/**
 * Fit AR(1) model: r_t = phi * r_{t-1} + epsilon_t
 */
export function fitAR1(data: number[]): {
  phi: number;
  tStat: number;
  rSquared: number;
  stationary: boolean;
} {
  const n = data.length;
  if (n < 3) {
    return { phi: NaN, tStat: NaN, rSquared: NaN, stationary: false };
  }
  
  // Prepare lagged data
  const y: number[] = []; // r_t
  const x: number[] = []; // r_{t-1}
  
  for (let t = 1; t < n; t++) {
    y.push(data[t]);
    x.push(data[t - 1]);
  }
  
  // OLS regression
  const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
  const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < x.length; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += Math.pow(x[i] - meanX, 2);
  }
  
  const phi = numerator / denominator;
  
  // Compute residuals
  const residuals: number[] = [];
  for (let i = 0; i < x.length; i++) {
    residuals.push(y[i] - phi * x[i]);
  }
  
  // Standard error
  const ssr = residuals.reduce((sum, r) => sum + r * r, 0);
  const variance = ssr / (x.length - 1);
  const seNum = variance / denominator;
  const sePhi = Math.sqrt(seNum);
  
  const tStat = phi / sePhi;
  
  // R-squared
  const sst = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
  const rSquared = 1 - (ssr / sst);
  
  const stationary = Math.abs(phi) < 1;
  
  return { phi, tStat, rSquared, stationary };
}

/**
 * Augmented Dickey-Fuller test (simplified)
 * Tests H0: series has unit root (non-stationary)
 */
export function adfTest(data: number[]): {
  statistic: number;
  pValue: number;
  stationarity: 'stationary' | 'non-stationary' | 'marginal';
} {
  const n = data.length;
  if (n < 4) {
    return { statistic: NaN, pValue: NaN, stationarity: 'marginal' };
  }
  
  // Compute first differences
  const diff: number[] = [];
  for (let t = 1; t < n; t++) {
    diff.push(data[t] - data[t - 1]);
  }
  
  // Regress diff[t] on data[t-1]
  const y = diff; // Δx_t
  const x = data.slice(0, -1); // x_{t-1}
  
  const meanX = x.reduce((sum, val) => sum + val, 0) / x.length;
  const meanY = y.reduce((sum, val) => sum + val, 0) / y.length;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < x.length; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += Math.pow(x[i] - meanX, 2);
  }
  
  const gamma = numerator / denominator;
  
  // Standard error
  const residuals: number[] = [];
  for (let i = 0; i < x.length; i++) {
    residuals.push(y[i] - gamma * x[i]);
  }
  
  const ssr = residuals.reduce((sum, r) => sum + r * r, 0);
  const variance = ssr / (x.length - 1);
  const seGamma = Math.sqrt(variance / denominator);
  
  const statistic = gamma / seGamma;
  
  // Approximate p-value using MacKinnon critical values
  // Critical values at 1%, 5%, 10% for n=100: -3.51, -2.89, -2.58
  let pValue: number;
  if (statistic < -3.51) {
    pValue = 0.005;
  } else if (statistic < -2.89) {
    pValue = 0.03;
  } else if (statistic < -2.58) {
    pValue = 0.08;
  } else {
    pValue = 0.15;
  }
  
  const stationarity: 'stationary' | 'non-stationary' | 'marginal' =
    pValue < 0.05 ? 'stationary' : pValue < 0.10 ? 'marginal' : 'non-stationary';
  
  return { statistic, pValue, stationarity };
}

/**
 * Compute all time-series diagnostics
 */
export function computeTimeSeriesDiagnostics(
  data: number[],
  maxLag: number = 20,
  rollingWindow: number = 20
): TimeSeriesDiagnostics {
  const acf = computeACF(data, maxLag);
  const pacf = computePACF(data, maxLag);
  const { rollingMean, rollingStd } = computeRollingStats(data, rollingWindow);
  const squaredReturns = computeSquaredReturns(data);
  const ar1 = fitAR1(data);
  const adf = adfTest(data);
  
  return {
    acf,
    pacf,
    rollingMean,
    rollingStd,
    squaredReturns,
    ar1Phi: ar1.phi,
    ar1TStat: ar1.tStat,
    ar1RSquared: ar1.rSquared,
    ar1Stationary: ar1.stationary,
    adfStatistic: adf.statistic,
    adfPValue: adf.pValue,
    adfStationarity: adf.stationarity
  };
}
