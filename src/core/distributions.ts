/**
 * Distribution Fitting Module for QuantEngine
 * Maximum Likelihood Estimation (MLE) for Normal, Laplace, and Student-t distributions
 */

import { goldenSectionSearch, tPDF, normPDF, laplacePDF } from '../utils/math';
import { computeMedian, computeMAD } from './summaryStats';
import type { NormalFit, LaplaceFit, StudentTFit } from '../utils/types';

/**
 * Fit Normal distribution using MLE
 * Parameters: μ (mean), σ (standard deviation)
 */
export function fitNormal(data: number[]): NormalFit {
  const n = data.length;
  
  // MLE for normal distribution
  const mu = data.reduce((sum, x) => sum + x, 0) / n;
  const variance = data.reduce((sum, x) => sum + Math.pow(x - mu, 2), 0) / n;
  const sigma = Math.sqrt(variance);

  return {
    name: 'Normal',
    params: { mu, sigma }
  };
}

/**
 * Fit Laplace distribution using MLE
 * Parameters: μ (location, = median), b (scale, = mean absolute deviation)
 */
export function fitLaplace(data: number[]): LaplaceFit {
  const sorted = [...data].sort((a, b) => a - b);
  
  // MLE for Laplace: μ = median
  const mu = computeMedian(sorted);
  
  // b = mean absolute deviation from median
  const b = computeMAD(data, mu);

  return {
    name: 'Laplace',
    params: { mu, b }
  };
}

/**
 * Fit Student t-distribution using MLE
 * Parameters: μ (location), σ (scale), ν (degrees of freedom)
 * 
 * Uses numerical optimization for ν (degrees of freedom)
 */
export function fitStudentT(data: number[]): StudentTFit {
  const n = data.length;
  
  // Initial estimates for μ and σ
  const mu = data.reduce((sum, x) => sum + x, 0) / n;
  const variance = data.reduce((sum, x) => sum + Math.pow(x - mu, 2), 0) / n;
  const sigma = Math.sqrt(variance);

  // Standardize data
  const standardized = data.map(x => (x - mu) / sigma);

  // Find optimal degrees of freedom using log-likelihood maximization
  // Search range: [2, 50] degrees of freedom
  const logLikelihood = (nu: number): number => {
    let ll = 0;
    for (const z of standardized) {
      const pdf = tPDF(z, nu);
      if (pdf > 0) {
        ll += Math.log(pdf);
      } else {
        ll += -1e10; // Penalty for invalid PDF
      }
    }
    return -ll; // Negative for minimization
  };

  // Use golden section search to find optimal nu
  const nu = goldenSectionSearch(logLikelihood, 2, 50, 0.1);

  // Refine σ estimate based on optimal ν
  // For Student t, Var[X] = σ² * ν/(ν-2) for ν > 2
  const sigmaRefined = nu > 2 
    ? sigma * Math.sqrt((nu - 2) / nu)
    : sigma;

  return {
    name: 'Student-t',
    params: {
      mu,
      sigma: sigmaRefined,
      nu: Math.round(nu * 10) / 10 // Round to 1 decimal
    }
  };
}

/**
 * Compute PDF value for Normal distribution
 */
export function normalPDF(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return normPDF(z) / sigma;
}

/**
 * Compute PDF value for Laplace distribution
 */
export function laplaceDistPDF(x: number, mu: number, b: number): number {
  return laplacePDF(x, mu, b);
}

/**
 * Compute PDF value for Student t-distribution
 */
export function studentTPDF(x: number, mu: number, sigma: number, nu: number): number {
  const z = (x - mu) / sigma;
  return tPDF(z, nu) / sigma;
}

/**
 * Compute log-likelihood for a distribution fit
 */
export function computeLogLikelihood(
  data: number[],
  pdfFunc: (x: number) => number
): number {
  let ll = 0;
  for (const x of data) {
    const pdf = pdfFunc(x);
    if (pdf > 0) {
      ll += Math.log(pdf);
    } else {
      return -Infinity;
    }
  }
  return ll;
}

/**
 * Compute AIC (Akaike Information Criterion) for model comparison
 * AIC = 2k - 2ln(L)
 * where k = number of parameters, L = likelihood
 */
export function computeAIC(logLikelihood: number, numParams: number): number {
  return 2 * numParams - 2 * logLikelihood;
}

/**
 * Compute BIC (Bayesian Information Criterion) for model comparison
 * BIC = k*ln(n) - 2ln(L)
 * where k = number of parameters, n = sample size, L = likelihood
 */
export function computeBIC(
  logLikelihood: number,
  numParams: number,
  sampleSize: number
): number {
  return numParams * Math.log(sampleSize) - 2 * logLikelihood;
}

/**
 * Compare distribution fits and rank by AIC
 */
export function compareDistributions(
  data: number[],
  normalFit: NormalFit,
  laplaceFit: LaplaceFit,
  tFit: StudentTFit
): { name: string; aic: number; bic: number }[] {
  const n = data.length;

  // Compute log-likelihoods
  const normalLL = computeLogLikelihood(
    data,
    x => normalPDF(x, normalFit.params.mu, normalFit.params.sigma)
  );
  
  const laplaceLL = computeLogLikelihood(
    data,
    x => laplaceDistPDF(x, laplaceFit.params.mu, laplaceFit.params.b)
  );
  
  const tLL = computeLogLikelihood(
    data,
    x => studentTPDF(x, tFit.params.mu, tFit.params.sigma, tFit.params.nu)
  );

  // Compute AICs and BICs
  const results = [
    {
      name: 'Normal',
      aic: computeAIC(normalLL, 2),
      bic: computeBIC(normalLL, 2, n)
    },
    {
      name: 'Laplace',
      aic: computeAIC(laplaceLL, 2),
      bic: computeBIC(laplaceLL, 2, n)
    },
    {
      name: 'Student-t',
      aic: computeAIC(tLL, 3),
      bic: computeBIC(tLL, 3, n)
    }
  ];

  // Sort by AIC (lower is better)
  return results.sort((a, b) => a.aic - b.aic);
}
