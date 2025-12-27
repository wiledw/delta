/**
 * FOILS Indicator Calculation
 * FOILS = Funding, Open Interest, Long/Short Ratio indicator
 * 
 * Based on the combination of:
 * - Open Interest (OI) trends
 * - Funding Rate (FR) levels
 * - Long/Short Ratio (L/S) sentiment
 * 
 * Note: For this implementation, we'll use simplified proxies since we don't have
 * direct access to futures data. We'll use price action and volume patterns as indicators.
 */

export type FOILSIndicator = "Bullish" | "Neutral" | "Bearish";

export interface FOILSData {
  oi: FOILSIndicator;
  fr: FOILSIndicator;
  ls: FOILSIndicator;
  overall: FOILSIndicator;
  confidence: number; // 0-100
}

/**
 * Calculate FOILS indicator based on price action and spread analysis
 * This is a simplified version that uses available data
 */
export function calculateFOILS(
  priceChange24h: number,
  priceChangePercent24h: number,
  spreadZScore: number,
  correlation: number,
  spreadStdev: number,
  spreadMean: number,
  spreadNow: number
): FOILSData {
  // Open Interest Indicator (OI)
  // Simplified: Use price momentum and volatility as proxy
  // Rising prices with increasing volatility = increasing OI (bullish)
  // Falling prices with high volatility = decreasing OI (bearish)
  let oi: FOILSIndicator = "Neutral";
  if (priceChangePercent24h > 2 && spreadStdev > spreadMean * 0.1) {
    oi = "Bullish";
  } else if (priceChangePercent24h < -2 && spreadStdev > spreadMean * 0.1) {
    oi = "Bearish";
  }

  // Funding Rate Indicator (FR)
  // Simplified: Use spread Z-score as proxy
  // High positive Z = high funding (bearish for longs)
  // High negative Z = low/negative funding (bullish for longs)
  let fr: FOILSIndicator = "Neutral";
  if (spreadZScore > 1.5) {
    fr = "Bearish"; // High funding, longs paying shorts
  } else if (spreadZScore < -1.5) {
    fr = "Bullish"; // Low/negative funding, shorts paying longs
  }

  // Long/Short Ratio Indicator (L/S)
  // Simplified: Use correlation and spread deviation
  // High correlation + extreme spread = imbalanced positioning
  let ls: FOILSIndicator = "Neutral";
  if (correlation > 0.8) {
    if (Math.abs(spreadZScore) > 2) {
      ls = spreadZScore > 0 ? "Bearish" : "Bullish";
    }
  }

  // Overall FOILS indicator
  const indicators = [oi, fr, ls];
  const bullishCount = indicators.filter(i => i === "Bullish").length;
  const bearishCount = indicators.filter(i => i === "Bearish").length;
  
  let overall: FOILSIndicator = "Neutral";
  if (bullishCount >= 2) {
    overall = "Bullish";
  } else if (bearishCount >= 2) {
    overall = "Bearish";
  }

  // Confidence based on how clear the signals are
  const confidence = Math.min(100, Math.abs(spreadZScore) * 20 + Math.abs(priceChangePercent24h) * 5);

  return {
    oi,
    fr,
    ls,
    overall,
    confidence: Math.round(confidence),
  };
}

/**
 * Get color for FOILS indicator
 */
export function getFOILSColor(indicator: FOILSIndicator): string {
  switch (indicator) {
    case "Bullish":
      return "text-green-600 dark:text-green-400";
    case "Bearish":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
}

/**
 * Get badge variant for FOILS indicator
 */
export function getFOILSBadgeVariant(indicator: FOILSIndicator): "default" | "secondary" | "destructive" {
  switch (indicator) {
    case "Bullish":
      return "default";
    case "Bearish":
      return "destructive";
    default:
      return "secondary";
  }
}

