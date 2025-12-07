/**
 * Plotting Module for QuantEngine
 * Canvas-based histogram, PDF overlays, and QQ-plots
 */

import { normInv, tInv } from '../utils/math';
import { normalPDF, laplaceDistPDF, studentTPDF } from './distributions';
import type { NormalFit, LaplaceFit, StudentTFit } from '../utils/types';

export interface PlotConfig {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  backgroundColor: string;
  gridColor: string;
  axisColor: string;
  textColor: string;
}

const defaultConfig: PlotConfig = {
  width: 600,
  height: 400,
  padding: { top: 40, right: 40, bottom: 60, left: 60 },
  backgroundColor: '#ffffff',
  gridColor: '#e0e0e0',
  axisColor: '#333333',
  textColor: '#333333'
};

/**
 * Plot histogram with overlaid PDF curves
 */
export function plotHistogramWithPDFs(
  canvas: HTMLCanvasElement,
  data: number[],
  normalFit: NormalFit,
  laplaceFit: LaplaceFit,
  tFit: StudentTFit,
  config: Partial<PlotConfig> = {}
): void {
  const cfg = { ...defaultConfig, ...config };
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size
  canvas.width = cfg.width;
  canvas.height = cfg.height;

  // Clear canvas
  ctx.fillStyle = cfg.backgroundColor;
  ctx.fillRect(0, 0, cfg.width, cfg.height);

  const plotWidth = cfg.width - cfg.padding.left - cfg.padding.right;
  const plotHeight = cfg.height - cfg.padding.top - cfg.padding.bottom;

  // Compute histogram
  const numBins = Math.min(50, Math.ceil(Math.sqrt(data.length)));
  const hist = computeHistogram(data, numBins);

  // Determine plot ranges
  const xMin = hist.binEdges[0];
  const xMax = hist.binEdges[hist.binEdges.length - 1];
  const yMax = Math.max(...hist.densities) * 1.1;

  // Scale functions
  const scaleX = (x: number) => 
    cfg.padding.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  
  const scaleY = (y: number) => 
    cfg.padding.top + plotHeight - (y / yMax) * plotHeight;

  // Draw grid
  drawGrid(ctx, cfg, plotWidth, plotHeight, xMin, xMax, yMax, scaleX, scaleY);

  // Draw histogram bars
  ctx.fillStyle = 'rgba(100, 150, 200, 0.5)';
  ctx.strokeStyle = 'rgba(100, 150, 200, 0.8)';
  ctx.lineWidth = 1;

  for (let i = 0; i < hist.counts.length; i++) {
    const x1 = scaleX(hist.binEdges[i]);
    const x2 = scaleX(hist.binEdges[i + 1]);
    const y = scaleY(hist.densities[i]);
    const barHeight = scaleY(0) - y;

    ctx.fillRect(x1, y, x2 - x1, barHeight);
    ctx.strokeRect(x1, y, x2 - x1, barHeight);
  }

  // Draw PDF curves
  const numPoints = 200;
  const xStep = (xMax - xMin) / numPoints;

  // Normal PDF
  drawCurve(ctx, 'rgba(0, 100, 255, 0.8)', 2, xMin, xMax, xStep, 
    x => normalPDF(x, normalFit.params.mu, normalFit.params.sigma),
    scaleX, scaleY);

  // Laplace PDF
  drawCurve(ctx, 'rgba(255, 100, 0, 0.8)', 2, xMin, xMax, xStep,
    x => laplaceDistPDF(x, laplaceFit.params.mu, laplaceFit.params.b),
    scaleX, scaleY);

  // Student t PDF
  drawCurve(ctx, 'rgba(0, 200, 100, 0.8)', 2, xMin, xMax, xStep,
    x => studentTPDF(x, tFit.params.mu, tFit.params.sigma, tFit.params.nu),
    scaleX, scaleY);

  // Draw legend
  drawLegend(ctx, cfg, [
    { color: 'rgba(100, 150, 200, 0.8)', label: 'Histogram' },
    { color: 'rgba(0, 100, 255, 0.8)', label: 'Normal' },
    { color: 'rgba(255, 100, 0, 0.8)', label: 'Laplace' },
    { color: 'rgba(0, 200, 100, 0.8)', label: 'Student-t' }
  ]);

  // Draw axes labels
  ctx.fillStyle = cfg.textColor;
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Value', cfg.width / 2, cfg.height - 10);
  
  ctx.save();
  ctx.translate(15, cfg.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Density', 0, 0);
  ctx.restore();
}

/**
 * Plot QQ-plot (quantile-quantile plot)
 */
export function plotQQPlot(
  canvas: HTMLCanvasElement,
  data: number[],
  distribution: 'normal' | 't' = 'normal',
  df?: number,
  config: Partial<PlotConfig> = {}
): void {
  const cfg = { ...defaultConfig, ...config };
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = cfg.width;
  canvas.height = cfg.height;

  ctx.fillStyle = cfg.backgroundColor;
  ctx.fillRect(0, 0, cfg.width, cfg.height);

  const plotWidth = cfg.width - cfg.padding.left - cfg.padding.right;
  const plotHeight = cfg.height - cfg.padding.top - cfg.padding.bottom;

  // Sort data and compute empirical quantiles
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  // Standardize data
  const mean = data.reduce((sum, x) => sum + x, 0) / n;
  const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  const empiricalQuantiles: number[] = [];
  const theoreticalQuantiles: number[] = [];

  for (let i = 0; i < n; i++) {
    const p = (i + 0.5) / n; // Plotting position
    
    empiricalQuantiles.push((sorted[i] - mean) / std);
    
    if (distribution === 'normal') {
      theoreticalQuantiles.push(normInv(p));
    } else {
      // Student t-distribution quantile
      theoreticalQuantiles.push(tInv(p, df || 10));
    }
  }

  // Determine plot ranges
  const allValues = [...empiricalQuantiles, ...theoreticalQuantiles];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal;
  const xMin = minVal - range * 0.1;
  const xMax = maxVal + range * 0.1;

  const scaleX = (x: number) => 
    cfg.padding.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  
  const scaleY = (y: number) => 
    cfg.padding.top + plotHeight - ((y - xMin) / (xMax - xMin)) * plotHeight;

  // Draw grid
  drawGrid(ctx, cfg, plotWidth, plotHeight, xMin, xMax, xMax, scaleX, scaleY);

  // Draw reference line (y = x)
  ctx.strokeStyle = 'rgba(200, 0, 0, 0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(scaleX(xMin), scaleY(xMin));
  ctx.lineTo(scaleX(xMax), scaleY(xMax));
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw data points
  ctx.fillStyle = 'rgba(0, 100, 200, 0.6)';
  for (let i = 0; i < n; i++) {
    const x = scaleX(theoreticalQuantiles[i]);
    const y = scaleY(empiricalQuantiles[i]);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Draw axes labels
  ctx.fillStyle = cfg.textColor;
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Theoretical Quantiles', cfg.width / 2, cfg.height - 10);
  
  ctx.save();
  ctx.translate(15, cfg.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Sample Quantiles', 0, 0);
  ctx.restore();

  // Title
  ctx.fillText(
    distribution === 'normal' ? 'Normal Q-Q Plot' : `t Q-Q Plot (df=${df})`,
    cfg.width / 2,
    25
  );
}

/**
 * Compute histogram from data
 */
function computeHistogram(data: number[], numBins: number): {
  counts: number[];
  densities: number[];
  binEdges: number[];
} {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / numBins;

  const counts = new Array(numBins).fill(0);
  const binEdges = Array.from({ length: numBins + 1 }, (_, i) => min + i * binWidth);

  for (const x of data) {
    let binIndex = Math.floor((x - min) / binWidth);
    if (binIndex === numBins) binIndex--; // Handle edge case for max value
    if (binIndex >= 0 && binIndex < numBins) {
      counts[binIndex]++;
    }
  }

  // Convert to density
  const totalArea = data.length * binWidth;
  const densities = counts.map(c => c / totalArea);

  return { counts, densities, binEdges };
}

/**
 * Draw a curve on the canvas
 */
function drawCurve(
  ctx: CanvasRenderingContext2D,
  color: string,
  lineWidth: number,
  xMin: number,
  xMax: number,
  xStep: number,
  func: (x: number) => number,
  scaleX: (x: number) => number,
  scaleY: (y: number) => number
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();

  let firstPoint = true;
  for (let x = xMin; x <= xMax; x += xStep) {
    const y = func(x);
    const px = scaleX(x);
    const py = scaleY(y);

    if (firstPoint) {
      ctx.moveTo(px, py);
      firstPoint = false;
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();
}

/**
 * Draw grid lines
 */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  cfg: PlotConfig,
  plotWidth: number,
  plotHeight: number,
  xMin: number,
  xMax: number,
  yMax: number,
  scaleX: (x: number) => number,
  scaleY: (y: number) => number
): void {
  ctx.strokeStyle = cfg.gridColor;
  ctx.lineWidth = 1;

  // Vertical grid lines
  const numXLines = 5;
  for (let i = 0; i <= numXLines; i++) {
    const x = xMin + (i / numXLines) * (xMax - xMin);
    const px = scaleX(x);
    ctx.beginPath();
    ctx.moveTo(px, cfg.padding.top);
    ctx.lineTo(px, cfg.padding.top + plotHeight);
    ctx.stroke();

    // X-axis labels
    ctx.fillStyle = cfg.textColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(x.toFixed(2), px, cfg.height - cfg.padding.bottom + 20);
  }

  // Horizontal grid lines
  const numYLines = 5;
  for (let i = 0; i <= numYLines; i++) {
    const y = (i / numYLines) * yMax;
    const py = scaleY(y);
    ctx.beginPath();
    ctx.moveTo(cfg.padding.left, py);
    ctx.lineTo(cfg.padding.left + plotWidth, py);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = cfg.textColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(y.toFixed(2), cfg.padding.left - 10, py + 4);
  }

  // Draw axes
  ctx.strokeStyle = cfg.axisColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(cfg.padding.left, cfg.padding.top, plotWidth, plotHeight);
}

/**
 * Draw legend
 */
function drawLegend(
  ctx: CanvasRenderingContext2D,
  cfg: PlotConfig,
  items: { color: string; label: string }[]
): void {
  const legendX = cfg.width - cfg.padding.right - 150;
  const legendY = cfg.padding.top + 10;
  const lineHeight = 20;

  ctx.font = '12px Arial';
  ctx.textAlign = 'left';

  items.forEach((item, i) => {
    const y = legendY + i * lineHeight;

    // Draw color box
    ctx.fillStyle = item.color;
    ctx.fillRect(legendX, y - 8, 15, 12);

    // Draw label
    ctx.fillStyle = cfg.textColor;
    ctx.fillText(item.label, legendX + 20, y + 2);
  });
}

/**
 * Plot ACF or PACF as stem plot
 */
export function plotACFPACF(
  canvas: HTMLCanvasElement,
  acfPoints: { lag: number; value: number; significant: boolean }[],
  title: string,
  config: Partial<PlotConfig> = {}
): void {
  const cfg = { ...defaultConfig, ...config };
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = cfg.width;
  canvas.height = cfg.height;

  ctx.fillStyle = cfg.backgroundColor;
  ctx.fillRect(0, 0, cfg.width, cfg.height);

  const plotWidth = cfg.width - cfg.padding.left - cfg.padding.right;
  const plotHeight = cfg.height - cfg.padding.top - cfg.padding.bottom;

  const maxLag = Math.max(...acfPoints.map(p => p.lag));
  const maxAbsValue = Math.max(...acfPoints.map(p => Math.abs(p.value)), 0.5);
  
  const scaleX = (lag: number) =>
    cfg.padding.left + (lag / maxLag) * plotWidth;
  
  const scaleY = (value: number) =>
    cfg.padding.top + plotHeight / 2 - (value / maxAbsValue) * (plotHeight / 2) * 0.9;

  // Draw grid
  drawGrid(ctx, cfg, plotWidth, plotHeight, 0, maxLag, maxAbsValue, scaleX, scaleY);

  // Draw zero line
  ctx.strokeStyle = cfg.axisColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cfg.padding.left, scaleY(0));
  ctx.lineTo(cfg.padding.left + plotWidth, scaleY(0));
  ctx.stroke();

  // Draw confidence bounds
  const confidenceBound = 1.96 / Math.sqrt(100); // Approximate
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  
  ctx.beginPath();
  ctx.moveTo(cfg.padding.left, scaleY(confidenceBound));
  ctx.lineTo(cfg.padding.left + plotWidth, scaleY(confidenceBound));
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(cfg.padding.left, scaleY(-confidenceBound));
  ctx.lineTo(cfg.padding.left + plotWidth, scaleY(-confidenceBound));
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw stems
  acfPoints.forEach(point => {
    const x = scaleX(point.lag);
    const y = scaleY(point.value);
    const y0 = scaleY(0);

    ctx.strokeStyle = point.significant ? 'rgba(47, 128, 237, 0.8)' : 'rgba(100, 100, 100, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Draw marker
    ctx.fillStyle = point.significant ? 'rgba(47, 128, 237, 1)' : 'rgba(100, 100, 100, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  });

  // Draw title
  ctx.fillStyle = cfg.textColor;
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, cfg.width / 2, cfg.padding.top - 15);
  
  // Draw axes labels
  ctx.fillText('Lag', cfg.width / 2, cfg.height - 10);
  
  ctx.save();
  ctx.translate(15, cfg.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Correlation', 0, 0);
  ctx.restore();
}

/**
 * Plot rolling statistics
 */
export function plotRollingStats(
  canvas: HTMLCanvasElement,
  data: number[],
  rollingMean: number[],
  rollingStd: number[],
  rollingWindow: number,
  config: Partial<PlotConfig> = {}
): void {
  const cfg = { ...defaultConfig, ...config };
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = cfg.width;
  canvas.height = cfg.height;

  ctx.fillStyle = cfg.backgroundColor;
  ctx.fillRect(0, 0, cfg.width, cfg.height);

  const plotWidth = cfg.width - cfg.padding.left - cfg.padding.right;
  const plotHeight = cfg.height - cfg.padding.top - cfg.padding.bottom;

  const n = data.length;
  const allValues = [...data, ...rollingMean, ...rollingStd];
  const yMin = Math.min(...allValues);
  const yMax = Math.max(...allValues);
  const yRange = yMax - yMin;

  const scaleX = (index: number) =>
    cfg.padding.left + (index / (n - 1)) * plotWidth;
  
  const scaleY = (value: number) =>
    cfg.padding.top + plotHeight - ((value - yMin) / yRange) * plotHeight;

  // Draw grid
  drawGrid(ctx, cfg, plotWidth, plotHeight, 0, n - 1, yMax, scaleX, scaleY);

  // Draw original data
  ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = scaleX(i);
    const y = scaleY(data[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Draw rolling mean
  ctx.strokeStyle = 'rgba(47, 128, 237, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < rollingMean.length; i++) {
    const x = scaleX(i + rollingWindow - 1);
    const y = scaleY(rollingMean[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Draw rolling std (as band)
  ctx.fillStyle = 'rgba(255, 100, 0, 0.1)';
  ctx.beginPath();
  for (let i = 0; i < rollingMean.length; i++) {
    const x = scaleX(i + rollingWindow - 1);
    const yUpper = scaleY(rollingMean[i] + rollingStd[i]);
    if (i === 0) ctx.moveTo(x, yUpper);
    else ctx.lineTo(x, yUpper);
  }
  for (let i = rollingMean.length - 1; i >= 0; i--) {
    const x = scaleX(i + rollingWindow - 1);
    const yLower = scaleY(rollingMean[i] - rollingStd[i]);
    ctx.lineTo(x, yLower);
  }
  ctx.closePath();
  ctx.fill();

  // Draw legend
  drawLegend(ctx, cfg, [
    { color: 'rgba(150, 150, 150, 0.5)', label: 'Original' },
    { color: 'rgba(47, 128, 237, 0.9)', label: 'Rolling Mean' },
    { color: 'rgba(255, 100, 0, 0.3)', label: '±1 Std Dev' }
  ]);

  // Draw labels
  ctx.fillStyle = cfg.textColor;
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Rolling Statistics (Window = ${rollingWindow})`, cfg.width / 2, cfg.padding.top - 15);
  ctx.fillText('Time', cfg.width / 2, cfg.height - 10);
  
  ctx.save();
  ctx.translate(15, cfg.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Value', 0, 0);
  ctx.restore();
}

/**
 * Plot squared returns for volatility clustering
 */
export function plotVolatilityClustering(
  canvas: HTMLCanvasElement,
  squaredReturns: number[],
  config: Partial<PlotConfig> = {}
): void {
  const cfg = { ...defaultConfig, ...config };
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = cfg.width;
  canvas.height = cfg.height;

  ctx.fillStyle = cfg.backgroundColor;
  ctx.fillRect(0, 0, cfg.width, cfg.height);

  const plotWidth = cfg.width - cfg.padding.left - cfg.padding.right;
  const plotHeight = cfg.height - cfg.padding.top - cfg.padding.bottom;

  const n = squaredReturns.length;
  const yMax = Math.max(...squaredReturns);

  const scaleX = (index: number) =>
    cfg.padding.left + (index / (n - 1)) * plotWidth;
  
  const scaleY = (value: number) =>
    cfg.padding.top + plotHeight - (value / yMax) * plotHeight;

  // Draw grid
  drawGrid(ctx, cfg, plotWidth, plotHeight, 0, n - 1, yMax, scaleX, scaleY);

  // Draw bars
  ctx.fillStyle = 'rgba(220, 53, 69, 0.6)';
  const barWidth = plotWidth / n;
  
  for (let i = 0; i < n; i++) {
    const x = scaleX(i) - barWidth / 2;
    const y = scaleY(squaredReturns[i]);
    const height = scaleY(0) - y;
    ctx.fillRect(x, y, barWidth, height);
  }

  // Draw labels
  ctx.fillStyle = cfg.textColor;
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Volatility Clustering (Squared Returns)', cfg.width / 2, cfg.padding.top - 15);
  ctx.fillText('Time', cfg.width / 2, cfg.height - 10);
  
  ctx.save();
  ctx.translate(15, cfg.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('r²', 0, 0);
  ctx.restore();
}
