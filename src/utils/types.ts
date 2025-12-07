/**
 * Type definitions for QuantEngine Statistical Diagnostics
 */

export interface SummaryStats {
  count: number;
  mean: number;
  variance: number;
  stdDev: number;
  median: number;
  skewness: number;
  kurtosis: number;
  min: number;
  max: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

export interface DistributionFit {
  name: string;
  params: { [key: string]: number };
}

export interface NormalFit extends DistributionFit {
  name: 'Normal';
  params: {
    mu: number;
    sigma: number;
  };
}

export interface LaplaceFit extends DistributionFit {
  name: 'Laplace';
  params: {
    mu: number;
    b: number;
  };
}

export interface StudentTFit extends DistributionFit {
  name: 'Student-t';
  params: {
    mu: number;
    sigma: number;
    nu: number;
  };
}

export interface StatisticalTest {
  name: string;
  statistic: number;
  pValue: number;
  rejectNull: boolean;
  alpha: number;
}

export interface TailMetrics {
  var95: number;
  var99: number;
  cvar95: number;
  cvar99: number;
  hillIndex: number;
}

export interface AnalysisResult {
  summary: SummaryStats;
  normalFit: NormalFit;
  laplaceFit: LaplaceFit;
  tFit: StudentTFit;
  jarqueBeraTest: StatisticalTest;
  ksTest: StatisticalTest;
  tails: TailMetrics;
  data: number[];
}
