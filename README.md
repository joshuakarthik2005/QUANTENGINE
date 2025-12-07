# QuantEngine – Statistical Diagnostics

Professional-grade statistical diagnostics engine for quantitative research.

## 🎯 Features

- **Summary Statistics**: Mean, variance, skewness, kurtosis, percentiles
- **Distribution Fitting**: MLE for Normal, Laplace, and Student-t distributions
- **Statistical Tests**: Jarque-Bera and Kolmogorov-Smirnov normality tests
- **Tail Risk Metrics**: VaR, CVaR, and Hill tail index estimator
- **Visualizations**: Histogram with PDF overlays and Q-Q plots
- **100% Local**: All computation runs in your browser. No data leaves your machine.

## 🚀 Installation

### From Source

1. Clone the repository:
```bash
git clone https://github.com/joshuakarthik2005/QUANTENGINE.git
cd QUANTENGINE
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## 📊 Usage

1. Click the QuantEngine extension icon
2. Paste your data (comma, space, or newline separated)
3. Click "Analyze"
4. View comprehensive statistical diagnostics

### Sample Data

Generate sample data to test the engine:
- Normal Distribution
- Student-t Distribution (fat tails)
- Laplace Distribution
- Mixture Distribution (80% normal + 20% fat tails)

## 🧮 Mathematical Methods

### Summary Statistics
- Uses Welford's algorithm for numerical stability
- Bias-corrected skewness and kurtosis estimators

### Distribution Fitting
- **Normal**: Closed-form MLE (μ, σ)
- **Laplace**: Median and MAD-based MLE (μ, b)
- **Student-t**: Numerical optimization for degrees of freedom (μ, σ, ν)

### Statistical Tests
- **Jarque-Bera**: Tests normality using skewness and kurtosis
- **Kolmogorov-Smirnov**: Tests goodness-of-fit against normal distribution

### Tail Risk
- **VaR**: Historical Value at Risk (95%, 99%)
- **CVaR**: Conditional Value at Risk / Expected Shortfall
- **Hill Index**: Estimates tail heaviness (Pareto-like behavior)

## 🔒 Privacy

QuantEngine runs **entirely locally** in your browser. No data is transmitted to any server. All computation happens on your machine.

## 🛠️ Development

```bash
# Install dependencies
npm install

# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

## 📦 Project Structure

```
QUANTENGINE/
├── src/
│   ├── core/           # Core statistical algorithms
│   │   ├── parse.ts
│   │   ├── summaryStats.ts
│   │   ├── distributions.ts
│   │   ├── tests.ts
│   │   ├── tails.ts
│   │   └── plots.ts
│   ├── utils/          # Utilities and types
│   │   ├── math.ts
│   │   └── types.ts
│   └── popup/          # UI components
│       ├── Popup.tsx
│       └── Popup.css
├── manifest.json
├── package.json
└── vite.config.ts
```

## 🎓 Use Cases

- **Quant Research**: Analyze return distributions
- **Risk Management**: Compute VaR and CVaR
- **Data Science**: Test distributional assumptions
- **Education**: Learn about statistical distributions
- **Finance**: Analyze PnL and portfolio returns

## 📈 Roadmap

This is **Step 1 of 6** in the full QuantEngine ecosystem:

1. ✅ **Statistical Engine** (Current)
2. 🔜 Time-Series Lab (ACF, PACF, GARCH, regime detection)
3. 🔜 Portfolio & Optimization Studio
4. 🔜 Microstructure & HFT Toolkit
5. 🔜 Machine Learning Quant Tools
6. 🔜 Stochastic Simulation & Monte Carlo Lab

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**QuantEngine** - Professional statistical diagnostics for quantitative research.
