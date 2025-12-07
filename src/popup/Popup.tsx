/**
 * QuantEngine Statistical Diagnostics - Main Popup Component
 * Professional-grade UI for quant analysis
 */

import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { parseText, parseCSV, generateSampleData, validateData } from '../core/parse';
import { computeSummaryStats, formatStat } from '../core/summaryStats';
import { fitNormal, fitLaplace, fitStudentT } from '../core/distributions';
import { jarqueBeraTest, kolmogorovSmirnovTest, interpretTest } from '../core/tests';
import { computeTailMetrics, interpretHillIndex } from '../core/tails';
import { plotHistogramWithPDFs, plotQQPlot, plotACFPACF, plotRollingStats, plotVolatilityClustering } from '../core/plots';
import { computeTimeSeriesDiagnostics } from '../core/timeSeries';
import type { AnalysisResult } from '../utils/types';
import './Popup.css';

function Popup() {
  const [activeTab, setActiveTab] = useState<'stats' | 'distributions' | 'timeseries'>('stats');
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [warning, setWarning] = useState<string>('');
  const [qqDistribution, setQqDistribution] = useState<'normal' | 't'>('normal');
  const histogramCanvasRef = useRef<HTMLCanvasElement>(null);
  const qqPlotCanvasRef = useRef<HTMLCanvasElement>(null);
  const acfCanvasRef = useRef<HTMLCanvasElement>(null);
  const pacfCanvasRef = useRef<HTMLCanvasElement>(null);
  const rollingCanvasRef = useRef<HTMLCanvasElement>(null);
  const volatilityCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update plots when result changes or QQ distribution changes
  useEffect(() => {
    if (result && histogramCanvasRef.current && qqPlotCanvasRef.current) {
      plotHistogramWithPDFs(
        histogramCanvasRef.current,
        result.data,
        result.normalFit,
        result.laplaceFit,
        result.tFit
      );

      plotQQPlot(
        qqPlotCanvasRef.current,
        result.data,
        qqDistribution,
        result.tFit.params.nu
      );
    }
  }, [result, qqDistribution]);

  // Update time-series plots when tab is active
  useEffect(() => {
    if (result && activeTab === 'timeseries' && acfCanvasRef.current && pacfCanvasRef.current && rollingCanvasRef.current && volatilityCanvasRef.current) {
      const tsData = computeTimeSeriesDiagnostics(result.data, 20, 20);
      
      // Plot ACF and PACF
      plotACFPACF(acfCanvasRef.current, tsData.acf, 'Autocorrelation Function (ACF)');
      plotACFPACF(pacfCanvasRef.current, tsData.pacf, 'Partial Autocorrelation Function (PACF)');
      
      // Plot rolling statistics
      plotRollingStats(
        rollingCanvasRef.current,
        result.data,
        tsData.rollingMean,
        tsData.rollingStd,
        20
      );
      
      // Plot volatility clustering
      plotVolatilityClustering(volatilityCanvasRef.current, tsData.squaredReturns);
      
      // Display AR(1) results
      const ar1Container = document.getElementById('ar1-results');
      if (ar1Container) {
        ar1Container.innerHTML = `
          <div class="stat-item">
            <span class="stat-label">φ (AR coefficient)</span>
            <span class="stat-value">${tsData.ar1Phi.toFixed(4)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">t-statistic</span>
            <span class="stat-value">${tsData.ar1TStat.toFixed(3)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">R²</span>
            <span class="stat-value">${tsData.ar1RSquared.toFixed(4)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Stationarity</span>
            <span class="stat-value">${tsData.ar1Stationary ? '✓ Stationary' : '✗ Non-Stationary'}</span>
          </div>
        `;
      }
      
      // Display ADF test results
      const adfContainer = document.getElementById('adf-results');
      if (adfContainer) {
        const isStationary = tsData.adfStationarity === 'stationary';
        adfContainer.className = `test-card ${isStationary ? 'accept' : 'reject'}`;
        adfContainer.innerHTML = `
          <h3 class="test-name">Augmented Dickey-Fuller Test</h3>
          <div class="test-content">
            <div class="test-stat">
              <span>Test Statistic:</span>
              <span>${tsData.adfStatistic.toFixed(4)}</span>
            </div>
            <div class="test-stat">
              <span>p-value:</span>
              <span>${tsData.adfPValue.toFixed(4)}</span>
            </div>
            <div class="test-verdict">
              ${isStationary
                ? '<strong style="color: #28a745;">Reject H₀</strong>: Series is stationary' 
                : '<strong style="color: #dc3545;">Fail to reject H₀</strong>: Series appears non-stationary (unit root present)'}
            </div>
          </div>
        `;
      }
    }
  }, [result, activeTab]);

  const analyzeData = (data: number[]) => {
    setError('');
    setWarning('');

    const validation = validateData(data);
    if (!validation.valid) {
      setError(validation.error || 'Invalid data');
      return;
    }

    if (data.length < 10) {
      setWarning(`Warning: Only ${data.length} data points. Results may be unreliable.`);
    }

    try {
      // Compute all statistics
      const summary = computeSummaryStats(data);
      const normalFit = fitNormal(data);
      const laplaceFit = fitLaplace(data);
      const tFit = fitStudentT(data);
      
      const jarqueBeraTest_ = jarqueBeraTest(data, summary.skewness, summary.kurtosis);
      const ksTest = kolmogorovSmirnovTest(data, normalFit.params.mu, normalFit.params.sigma);
      const tails = computeTailMetrics(data);

      setResult({
        summary,
        normalFit,
        laplaceFit,
        tFit,
        jarqueBeraTest: jarqueBeraTest_,
        ksTest,
        tails,
        data
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    }
  };

  const handleAnalyze = () => {
    const parseResult = parseText(inputText);
    if (!parseResult.success) {
      setError(parseResult.error || 'Failed to parse data');
      return;
    }

    if (parseResult.error) {
      setWarning(parseResult.error);
    }

    analyzeData(parseResult.data);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parseResult = parseCSV(text);
      
      if (!parseResult.success) {
        setError(parseResult.error || 'Failed to parse CSV');
        return;
      }

      if (parseResult.error) {
        setWarning(parseResult.error);
      }

      analyzeData(parseResult.data);
    };
    reader.readAsText(file);
  };

  const handleGenerateSample = (type: 'normal' | 't' | 'laplace' | 'mixture') => {
    const sampleData = generateSampleData(type, 1000);
    analyzeData(sampleData);
    setInputText(sampleData.slice(0, 100).join(', ') + ', ...');
  };

  return (
    <div className="quantengine-container">
      {/* Header */}
      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="title">QuantEngine – Statistical Diagnostics</h1>
            <p className="subtitle">Runs entirely locally. No data leaves this browser.</p>
          </div>
          <button 
            className="btn-link"
            onClick={() => window.open('https://joshuakarthik2005.github.io/QUANTENGINE/landing.html', '_blank')}
            title="Visit our website"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Website
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <button 
          className={activeTab === 'stats' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
        <button 
          className={activeTab === 'distributions' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('distributions')}
        >
          Distributions
        </button>
        <button 
          className={activeTab === 'timeseries' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('timeseries')}
        >
          Time-Series
        </button>
      </div>

      {/* Data Input Section */}
      <section className="section">
        <h2 className="section-title">Data Input</h2>
        <textarea
          className="data-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your data here (comma, space, or newline separated)..."
          rows={5}
        />
        <div className="button-group">
          <button className="btn btn-primary" onClick={handleAnalyze}>
            Analyze
          </button>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            Upload CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <div className="dropdown">
            <button className="btn btn-secondary">Generate Sample Data ▼</button>
            <div className="dropdown-content">
              <button onClick={() => handleGenerateSample('normal')}>Normal Distribution</button>
              <button onClick={() => handleGenerateSample('t')}>Student-t Distribution</button>
              <button onClick={() => handleGenerateSample('laplace')}>Laplace Distribution</button>
              <button onClick={() => handleGenerateSample('mixture')}>Mixture (Fat Tails)</button>
            </div>
          </div>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {warning && <div className="alert alert-warning">{warning}</div>}
      </section>

      {/* Tab Content */}
      {result && activeTab === 'stats' && (
        <>
          {/* Summary Statistics */}
          <section className="section section-separator">
            <h2 className="section-title">Summary Statistics</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Count</span>
                <span className="stat-value">{result.summary.count}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Mean</span>
                <span className="stat-value">{formatStat(result.summary.mean)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Median</span>
                <span className="stat-value">{formatStat(result.summary.median)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Std Dev</span>
                <span className="stat-value">{formatStat(result.summary.stdDev)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Variance</span>
                <span className="stat-value">{formatStat(result.summary.variance)}</span>
              </div>
              <div className="stat-item" title="Measures asymmetry of distribution. 0 = symmetric, >0 = right-skewed, <0 = left-skewed">
                <span className="stat-label">Skewness</span>
                <span className="stat-value">{formatStat(result.summary.skewness)}</span>
              </div>
              <div className="stat-item" title="Measures tail heaviness. >0 = heavy tails (leptokurtic), <0 = light tails (platykurtic), 0 = normal">
                <span className="stat-label">Kurtosis</span>
                <span className="stat-value">{formatStat(result.summary.kurtosis)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Min</span>
                <span className="stat-value">{formatStat(result.summary.min)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Max</span>
                <span className="stat-value">{formatStat(result.summary.max)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">5th Percentile</span>
                <span className="stat-value">{formatStat(result.summary.p5)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">25th Percentile</span>
                <span className="stat-value">{formatStat(result.summary.p25)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">75th Percentile</span>
                <span className="stat-value">{formatStat(result.summary.p75)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">95th Percentile</span>
                <span className="stat-value">{formatStat(result.summary.p95)}</span>
              </div>
            </div>
          </section>
        </>
      )}

      {result && activeTab === 'distributions' && (
        <>
          {/* Distribution Fits */}
          <section className="section section-separator">
            <h2 className="section-title">Distribution Fits (MLE)</h2>
            <div className="cards-container">
              <div className="card">
                <h3 className="card-title">Normal Distribution</h3>
                <div className="card-content">
                  <div className="param-item">
                    <span className="param-label">μ (mean)</span>
                    <span className="param-value">{formatStat(result.normalFit.params.mu)}</span>
                  </div>
                  <div className="param-item">
                    <span className="param-label">σ (std dev)</span>
                    <span className="param-value">{formatStat(result.normalFit.params.sigma)}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="card-title">Laplace Distribution</h3>
                <div className="card-content">
                  <div className="param-item">
                    <span className="param-label">μ (location)</span>
                    <span className="param-value">{formatStat(result.laplaceFit.params.mu)}</span>
                  </div>
                  <div className="param-item">
                    <span className="param-label">b (scale)</span>
                    <span className="param-value">{formatStat(result.laplaceFit.params.b)}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="card-title">Student-t Distribution</h3>
                <div className="card-content">
                  <div className="param-item">
                    <span className="param-label">μ (location)</span>
                    <span className="param-value">{formatStat(result.tFit.params.mu)}</span>
                  </div>
                  <div className="param-item">
                    <span className="param-label">σ (scale)</span>
                    <span className="param-value">{formatStat(result.tFit.params.sigma)}</span>
                  </div>
                  <div className="param-item">
                    <span className="param-label">ν (df)</span>
                    <span className="param-value">{result.tFit.params.nu.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Statistical Tests */}
          <section className="section">
            <h2 className="section-title">Statistical Tests</h2>
            <div className="tests-container">
              <div className={`test-card ${result.jarqueBeraTest.rejectNull ? 'reject' : 'accept'}`}>
                <h3 className="test-name">{result.jarqueBeraTest.name}</h3>
                <div className="test-content">
                  <div className="test-stat">
                    <span>Statistic:</span>
                    <span>{formatStat(result.jarqueBeraTest.statistic)}</span>
                  </div>
                  <div className="test-stat">
                    <span>p-value:</span>
                    <span>{result.jarqueBeraTest.pValue.toFixed(4)}</span>
                  </div>
                  <div className="test-verdict">
                    {interpretTest(result.jarqueBeraTest)}
                  </div>
                </div>
              </div>

              <div className={`test-card ${result.ksTest.rejectNull ? 'reject' : 'accept'}`}>
                <h3 className="test-name">{result.ksTest.name}</h3>
                <div className="test-content">
                  <div className="test-stat">
                    <span>D-statistic:</span>
                    <span>{formatStat(result.ksTest.statistic)}</span>
                  </div>
                  <div className="test-stat">
                    <span>p-value:</span>
                    <span>{result.ksTest.pValue.toFixed(4)}</span>
                  </div>
                  <div className="test-verdict">
                    {interpretTest(result.ksTest)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tail Risk Metrics */}
          <section className="section section-separator">
            <h2 className="section-title">Tail Risk Metrics</h2>
            <div className="tail-metrics">
              <div className="metric-row" title="Value at Risk: Maximum expected loss at 95% confidence level using historical quantiles">
                <span className="metric-label">VaR (95%)</span>
                <span className="metric-value">{formatStat(result.tails.var95)}</span>
              </div>
              <div className="metric-row" title="Value at Risk: Maximum expected loss at 99% confidence level using historical quantiles">
                <span className="metric-label">VaR (99%)</span>
                <span className="metric-value">{formatStat(result.tails.var99)}</span>
              </div>
              <div className="metric-row" title="Conditional Value at Risk: Expected loss beyond VaR threshold (95% confidence)">
                <span className="metric-label">CVaR (95%)</span>
                <span className="metric-value">{formatStat(result.tails.cvar95)}</span>
              </div>
              <div className="metric-row" title="Conditional Value at Risk: Expected loss beyond VaR threshold (99% confidence)">
                <span className="metric-label">CVaR (99%)</span>
                <span className="metric-value">{formatStat(result.tails.cvar99)}</span>
              </div>
              <div className="metric-row" title="Tail heaviness estimator using Hill method. Larger values indicate heavier tails (more extreme events)">
                <span className="metric-label">Hill Tail Index</span>
                <span className="metric-value">
                  {formatStat(result.tails.hillIndex)}
                  <span className="metric-hint"> ({interpretHillIndex(result.tails.hillIndex)})</span>
                </span>
              </div>
            </div>
          </section>

          {/* Plots */}
          <section className="section section-separator">
            <h2 className="section-title">Visualizations</h2>
            <div className="plots-container">
              <div className="plot-box">
                <h3 className="plot-title" style={{ marginBottom: '12px' }}>Histogram with PDF Overlays</h3>
                <canvas ref={histogramCanvasRef} className="plot-canvas" />
              </div>
              <div className="plot-box">
                <div className="plot-header">
                  <h3 className="plot-title">Q-Q Plot</h3>
                  <div className="qq-toggle">
                    <button 
                      className={qqDistribution === 'normal' ? 'toggle-btn active' : 'toggle-btn'}
                      onClick={() => setQqDistribution('normal')}
                    >
                      Normal
                    </button>
                    <button 
                      className={qqDistribution === 't' ? 'toggle-btn active' : 'toggle-btn'}
                      onClick={() => setQqDistribution('t')}
                    >
                      Student-t
                    </button>
                  </div>
                </div>
                <canvas ref={qqPlotCanvasRef} className="plot-canvas" />
              </div>
            </div>
          </section>
        </>
      )}

      {result && activeTab === 'timeseries' && (
        <>
          {/* ACF / PACF */}
          <section className="section section-separator">
            <h2 className="section-title">Autocorrelation Analysis</h2>
            <div className="plots-container">
              <div className="plot-box">
                <canvas ref={acfCanvasRef} className="plot-canvas" />
              </div>
              <div className="plot-box">
                <canvas ref={pacfCanvasRef} className="plot-canvas" />
              </div>
            </div>
          </section>

          {/* Rolling Statistics */}
          <section className="section section-separator">
            <h2 className="section-title">Rolling Statistics</h2>
            <div className="plot-box">
              <canvas ref={rollingCanvasRef} className="plot-canvas" style={{ width: '100%', height: '350px' }} />
            </div>
            <p className="metric-hint" style={{ marginTop: '12px', textAlign: 'center', color: '#666' }}>
              Rolling window = 20 periods. Tracks local mean and volatility over time.
            </p>
          </section>

          {/* Volatility Clustering */}
          <section className="section section-separator">
            <h2 className="section-title">Volatility Clustering</h2>
            <div className="plot-box">
              <canvas ref={volatilityCanvasRef} className="plot-canvas" style={{ width: '100%', height: '300px' }} />
            </div>
            <p className="metric-hint" style={{ marginTop: '12px', textAlign: 'center', color: '#666' }}>
              Squared returns reveal volatility clustering: periods of high/low volatility tend to cluster together.
            </p>
          </section>

          {/* AR(1) Model */}
          <section className="section section-separator">
            <h2 className="section-title">AR(1) Model Fit</h2>
            <div className="stats-grid" id="ar1-results">
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666' }}>
                Waiting for analysis...
              </p>
            </div>
          </section>

          {/* Stationarity Test */}
          <section className="section section-separator">
            <h2 className="section-title">Stationarity Test (ADF)</h2>
            <div id="adf-results" className="test-card accept">
              <div className="test-content">
                <p style={{ textAlign: 'center', color: '#666' }}>
                  Waiting for analysis...
                </p>
              </div>
            </div>
          </section>
        </>
      )}
      {/* Footer */}
      <footer className="footer">
        <p>QuantEngine v1.0.0 | All computation runs locally | No data transmitted</p>
      </footer>
    </div>
  );
}

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}

export default Popup;
