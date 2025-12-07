/**
 * Data Parsing Module for QuantEngine
 * Handles extraction and validation of numerical data from various sources
 */

export interface ParseResult {
  success: boolean;
  data: number[];
  error?: string;
}

/**
 * Parse numbers from pasted text
 * Handles comma/space/newline delimited, CSV format, etc.
 */
export function parseText(text: string): ParseResult {
  if (!text || text.trim().length === 0) {
    return {
      success: false,
      data: [],
      error: 'Input is empty'
    };
  }

  // Remove common non-numeric characters but keep negatives, decimals, scientific notation
  const cleaned = text
    .replace(/[^\d\s.,\-+eE\n\r\t]/g, ' ')
    .trim();

  // Split by various delimiters
  const tokens = cleaned.split(/[\s,\t\n\r]+/).filter(t => t.length > 0);

  const numbers: number[] = [];
  const errors: string[] = [];

  for (const token of tokens) {
    const num = parseFloat(token);
    if (!isNaN(num) && isFinite(num)) {
      numbers.push(num);
    } else if (token.length > 0) {
      errors.push(token);
    }
  }

  if (numbers.length === 0) {
    return {
      success: false,
      data: [],
      error: 'No valid numbers found in input'
    };
  }

  // Warning if sample size is too small
  if (numbers.length < 10) {
    return {
      success: true,
      data: numbers,
      error: `Warning: Only ${numbers.length} data points. Results may be unreliable.`
    };
  }

  return {
    success: true,
    data: numbers,
    error: errors.length > 0 ? `Ignored ${errors.length} invalid tokens` : undefined
  };
}

/**
 * Parse CSV file content
 * Assumes first row might be headers, tries to extract numbers from any column
 */
export function parseCSV(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    return {
      success: false,
      data: [],
      error: 'CSV file is empty'
    };
  }

  const numbers: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim());
    
    for (const cell of cells) {
      const num = parseFloat(cell);
      if (!isNaN(num) && isFinite(num)) {
        numbers.push(num);
      }
    }
  }

  if (numbers.length === 0) {
    return {
      success: false,
      data: [],
      error: 'No valid numbers found in CSV'
    };
  }

  if (numbers.length < 10) {
    return {
      success: true,
      data: numbers,
      error: `Warning: Only ${numbers.length} data points. Results may be unreliable.`
    };
  }

  return {
    success: true,
    data: numbers
  };
}

/**
 * Generate sample data for testing
 */
export function generateSampleData(
  distribution: 'normal' | 't' | 'laplace' | 'mixture',
  n: number = 1000
): number[] {
  const data: number[] = [];

  switch (distribution) {
    case 'normal':
      // Standard normal N(0,1)
      for (let i = 0; i < n; i++) {
        data.push(boxMullerTransform());
      }
      break;

    case 't':
      // Student t with df=5 (moderate fat tails)
      for (let i = 0; i < n; i++) {
        data.push(studentT(5));
      }
      break;

    case 'laplace':
      // Laplace(0, 1)
      for (let i = 0; i < n; i++) {
        data.push(laplaceRandom(0, 1));
      }
      break;

    case 'mixture':
      // 80% N(0,1) + 20% N(0,5) - fat tails
      for (let i = 0; i < n; i++) {
        if (Math.random() < 0.8) {
          data.push(boxMullerTransform());
        } else {
          data.push(boxMullerTransform() * 5);
        }
      }
      break;
  }

  return data;
}

/**
 * Box-Muller transform for generating standard normal random variables
 */
function boxMullerTransform(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Generate Student t random variable using Gaussian + Chi-squared ratio
 */
function studentT(df: number): number {
  const z = boxMullerTransform();
  let chiSq = 0;
  for (let i = 0; i < df; i++) {
    const g = boxMullerTransform();
    chiSq += g * g;
  }
  return z / Math.sqrt(chiSq / df);
}

/**
 * Generate Laplace random variable
 */
function laplaceRandom(mu: number, b: number): number {
  const u = Math.random() - 0.5;
  return mu - b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/**
 * Validate data array
 */
export function validateData(data: number[]): { valid: boolean; error?: string } {
  if (data.length === 0) {
    return { valid: false, error: 'No data provided' };
  }

  if (data.length < 3) {
    return { valid: false, error: 'Need at least 3 data points for statistical analysis' };
  }

  // Check for all identical values
  const allSame = data.every(x => x === data[0]);
  if (allSame) {
    return { valid: false, error: 'All values are identical - no variation to analyze' };
  }

  // Check for invalid numbers
  const hasInvalid = data.some(x => !isFinite(x));
  if (hasInvalid) {
    return { valid: false, error: 'Data contains invalid numbers (NaN or Infinity)' };
  }

  return { valid: true };
}
