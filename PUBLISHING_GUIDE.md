# QuantEngine - Installation & Publishing Guide

## 📦 Local Installation (Testing)

1. **Build the Extension**
   ```bash
   cd C:\Users\DELL\Desktop\quantengine\QUANTENGINE
   npm install
   npm run build
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Navigate to and select the `dist` folder inside QUANTENGINE

3. **Test the Extension**
   - Click the QuantEngine icon in your Chrome toolbar
   - Try the "Generate Sample Data" feature
   - Paste some numbers and click "Analyze"

## 🌐 Publishing to Chrome Web Store

### Step 1: Prepare for Publication

1. **Create Production Build**
   ```bash
   npm run build
   ```

2. **Test Thoroughly**
   - Test with various datasets
   - Check all statistical calculations
   - Verify plots render correctly
   - Test CSV upload feature
   - Test on different screen sizes

3. **Create ZIP for Upload**
   ```bash
   # From QUANTENGINE directory
   cd dist
   # Select all files and create a ZIP
   # Do NOT zip the dist folder itself - zip its contents
   ```

   **PowerShell command:**
   ```powershell
   Compress-Archive -Path .\dist\* -DestinationPath .\quantengine-v1.0.0.zip
   ```

### Step 2: Chrome Web Store Developer Account

1. **Register as Developer**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Sign in with your Google account
   - Pay the one-time $5 developer registration fee
   - Accept the Chrome Web Store Developer Agreement

### Step 3: Prepare Store Listing Assets

#### Required Information

**Basic Info:**
- **Name:** QuantEngine – Statistical Diagnostics
- **Summary (132 chars):** Local-only statistical diagnostics for quant research: distribution fitting, tests, VaR, CVaR and more.
- **Category:** Productivity (or Developer Tools)
- **Language:** English

**Detailed Description:**

```
Professional-grade statistical diagnostics engine for quantitative research.

🎯 KEY FEATURES

• Summary Statistics - Mean, variance, skewness, kurtosis, percentiles
• Distribution Fitting - MLE for Normal, Laplace, and Student-t distributions
• Statistical Tests - Jarque-Bera and Kolmogorov-Smirnov normality tests
• Tail Risk Metrics - VaR (95%, 99%), CVaR, and Hill tail index estimator
• Visualizations - Histogram with PDF overlays and Q-Q plots

🔒 100% LOCAL & PRIVATE

All computation runs entirely in your browser. No data is transmitted to any server. 
Perfect for sensitive financial data and proprietary research.

🧮 PROFESSIONAL ALGORITHMS

• Welford's algorithm for numerical stability
• Maximum Likelihood Estimation (MLE) for distribution fitting
• Numerical optimization for Student-t degrees of freedom
• Bias-corrected skewness and kurtosis estimators
• Hill estimator for tail risk analysis

📊 USE CASES

• Quantitative Research - Analyze return distributions
• Risk Management - Compute VaR and CVaR
• Data Science - Test distributional assumptions
• Finance - Analyze PnL and portfolio returns
• Education - Learn about statistical distributions

🚀 EASY TO USE

1. Click the QuantEngine icon
2. Paste your data (comma, space, or newline separated)
3. Click "Analyze"
4. View comprehensive diagnostics instantly

Generate sample data to test: Normal, Student-t, Laplace, or Mixture distributions.

This is Step 1 of the QuantEngine ecosystem - a professional toolkit for quantitative analysis.
```

#### Screenshots (Required: at least 1, max 5)

Take screenshots of:
1. Main interface with sample data analyzed
2. Summary statistics section
3. Distribution fits and statistical tests
4. Histogram with PDF overlays
5. Q-Q plot

**Screenshot specs:**
- 1280x800 or 640x400 pixels
- PNG or JPEG format
- Show the extension in action

#### Privacy Policy

Create a simple privacy policy page (can host on GitHub Pages):

```markdown
# QuantEngine Privacy Policy

Last Updated: December 7, 2025

## Data Collection

QuantEngine does NOT collect, store, or transmit any user data.

## How It Works

All statistical computations are performed entirely locally in your web browser. 
The extension does not:
- Send data to any server
- Track user behavior
- Store data outside your local browser
- Share information with third parties
- Use cookies or analytics

## Permissions

QuantEngine requires NO permissions beyond the basic extension popup functionality.

## Contact

For questions about privacy, please open an issue on our GitHub repository:
https://github.com/joshuakarthik2005/QUANTENGINE

## Changes to This Policy

Any changes to this privacy policy will be posted on this page and in the extension's 
update notes.
```

### Step 4: Upload to Chrome Web Store

1. **Create New Item**
   - Go to [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Click "New Item"
   - Upload your `quantengine-v1.0.0.zip`

2. **Fill Out Store Listing**
   - Add all the information from Step 3
   - Upload screenshots
   - Add privacy policy URL (if you have one)
   - Select category: Productivity
   - Choose distribution regions: All regions
   - Pricing: Free

3. **Privacy Practices**
   Under "Data practices":
   - "Does this item collect user data?" → **No**
   - Check the box: "This item does not collect or use user data"

4. **Submit for Review**
   - Review all information
   - Click "Submit for review"
   - Google typically reviews within 1-3 days

### Step 5: After Publication

1. **Share Your Extension**
   - Add Chrome Web Store badge to README
   - Share on:
     - r/algotrading
     - r/quantfinance
     - LinkedIn
     - Twitter/X
     - Quant Discord servers

2. **Monitor Reviews**
   - Respond to user feedback
   - Track installation metrics
   - Plan improvements

3. **Updates**
   - When you make changes, increment version in `manifest.json`
   - Build and zip again
   - Upload new version to dashboard

## 🎨 Optional: Professional Icons (Before Publishing)

For better presentation, consider creating professional PNG icons:

**Tools:**
- Inkscape (free) - convert SVG to PNG
- GIMP (free) - create/edit PNG icons
- Figma (free tier) - design icons
- Canva (free tier) - simple icon creation

**Recommended:**
1. Keep the current gradient blue design
2. Add a chart/graph element (bell curve, bars)
3. Make it recognizable at 16x16 pixels
4. Maintain professional, clean look

## 📊 Success Metrics to Track

- Installation count
- Active users
- User reviews and ratings
- Feature requests
- Bug reports

## 🚀 Next Steps (Future Modules)

This is Step 1 of 6. Plan ahead:
- Step 2: Time-Series Lab
- Step 3: Portfolio Optimization
- Step 4: Microstructure Tools
- Step 5: ML Quant Tools
- Step 6: Monte Carlo Simulations

## ⚠️ Important Notes

- **No External Permissions:** Keep manifest permissions empty for user trust
- **Privacy First:** Emphasize local computation in all marketing
- **Professional Quality:** This is a serious quant tool, not a toy
- **Accurate Math:** Double-check all formulas before publishing
- **Support:** Be ready to help users and fix bugs quickly

## 📞 Support & Feedback

GitHub Issues: https://github.com/joshuakarthik2005/QUANTENGINE/issues

Good luck with your launch! 🚀
