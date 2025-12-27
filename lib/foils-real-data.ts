/**
 * Real FOILS Data Integration
 * 
 * This file provides functions to fetch actual FOILS data from exchange APIs.
 * Currently supports Binance Futures API (free, no API key required for public data).
 * 
 * Note: Exchange APIs have rate limits. For production, consider:
 * - Using WebSocket streams for real-time data
 * - Implementing caching
 * - Adding API keys for higher rate limits
 */

const BINANCE_API = "https://fapi.binance.com/fapi/v1";

export interface RealFOILSData {
  symbol: string;
  openInterest: number;
  openInterestChange24h: number;
  fundingRate: number;
  fundingRateTimestamp: number;
  longShortRatio?: number; // Not always available from public APIs
  timestamp: number;
}

/**
 * Get real Open Interest from Binance Futures
 * @param symbol - Trading pair symbol (e.g., "BTCUSDT", "ETHUSDT")
 */
export async function getRealOpenInterest(symbol: string): Promise<{
  openInterest: number;
  openInterestChange24h: number;
} | null> {
  try {
    // Binance uses uppercase symbols like "BTCUSDT"
    const binanceSymbol = symbol.toUpperCase().replace("/", "");
    
    // Get current open interest
    const response = await fetch(
      `${BINANCE_API}/openInterest?symbol=${binanceSymbol}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      console.error(`Binance API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Note: Binance doesn't provide 24h change directly, would need historical data
    // For now, return current OI
    return {
      openInterest: parseFloat(data.openInterest),
      openInterestChange24h: 0, // Would need to calculate from historical data
    };
  } catch (error) {
    console.error(`Error fetching open interest for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get real Funding Rate from Binance Futures
 * @param symbol - Trading pair symbol (e.g., "BTCUSDT", "ETHUSDT")
 */
export async function getRealFundingRate(symbol: string): Promise<{
  fundingRate: number;
  fundingRatePercent: number;
  nextFundingTime: number;
} | null> {
  try {
    const binanceSymbol = symbol.toUpperCase().replace("/", "");
    
    const response = await fetch(
      `${BINANCE_API}/premiumIndex?symbol=${binanceSymbol}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      console.error(`Binance API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    return {
      fundingRate: parseFloat(data.lastFundingRate),
      fundingRatePercent: parseFloat(data.lastFundingRate) * 100,
      nextFundingTime: data.nextFundingTime,
    };
  } catch (error) {
    console.error(`Error fetching funding rate for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get Long/Short Ratio from Binance (if available)
 * Note: Binance public API doesn't provide this directly
 * Would need to use account API or third-party service
 */
export async function getRealLongShortRatio(symbol: string): Promise<number | null> {
  // Binance doesn't provide this in public API
  // Would need:
  // 1. Account API with API key (not recommended for client-side)
  // 2. Third-party service like CryptoQuant
  // 3. Calculate from order book imbalance (complex)
  
  return null;
}

/**
 * Get complete real FOILS data for a symbol
 */
export async function getRealFOILSData(symbol: string): Promise<RealFOILSData | null> {
  try {
    const [oiData, frData] = await Promise.all([
      getRealOpenInterest(symbol),
      getRealFundingRate(symbol),
    ]);

    if (!oiData || !frData) {
      return null;
    }

    return {
      symbol,
      openInterest: oiData.openInterest,
      openInterestChange24h: oiData.openInterestChange24h,
      fundingRate: frData.fundingRate,
      fundingRateTimestamp: frData.nextFundingTime,
      longShortRatio: undefined, // Not available from public API
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error(`Error fetching real FOILS data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Convert real FOILS data to indicator format
 */
export function realFOILSToIndicator(
  realData: RealFOILSData,
  spreadZScore: number
): {
  oi: "Bullish" | "Neutral" | "Bearish";
  fr: "Bullish" | "Neutral" | "Bearish";
  ls: "Bullish" | "Neutral" | "Bearish";
  overall: "Bullish" | "Neutral" | "Bearish";
  confidence: number;
} {
  // Open Interest Indicator
  let oi: "Bullish" | "Neutral" | "Bearish" = "Neutral";
  if (realData.openInterestChange24h > 5) {
    oi = "Bullish";
  } else if (realData.openInterestChange24h < -5) {
    oi = "Bearish";
  }

  // Funding Rate Indicator
  // Positive funding = longs pay shorts (bearish for longs)
  // Negative funding = shorts pay longs (bullish for longs)
  let fr: "Bullish" | "Neutral" | "Bearish" = "Neutral";
  const frPercent = realData.fundingRate * 100;
  if (frPercent > 0.01) {
    fr = "Bearish"; // High positive funding
  } else if (frPercent < -0.01) {
    fr = "Bullish"; // Negative funding
  }

  // Long/Short Ratio (use spread Z-score as proxy if not available)
  let ls: "Bullish" | "Neutral" | "Bearish" = "Neutral";
  if (realData.longShortRatio !== undefined) {
    if (realData.longShortRatio > 1.5) {
      ls = "Bearish"; // Too many longs
    } else if (realData.longShortRatio < 0.67) {
      ls = "Bullish"; // Too many shorts
    }
  } else {
    // Fallback to spread Z-score
    if (Math.abs(spreadZScore) > 2) {
      ls = spreadZScore > 0 ? "Bearish" : "Bullish";
    }
  }

  // Overall indicator
  const indicators = [oi, fr, ls];
  const bullishCount = indicators.filter(i => i === "Bullish").length;
  const bearishCount = indicators.filter(i => i === "Bearish").length;
  
  let overall: "Bullish" | "Neutral" | "Bearish" = "Neutral";
  if (bullishCount >= 2) {
    overall = "Bullish";
  } else if (bearishCount >= 2) {
    overall = "Bearish";
  }

  // Confidence based on data quality
  const confidence = Math.min(100, 
    Math.abs(frPercent) * 1000 + 
    Math.abs(realData.openInterestChange24h) * 10 +
    (realData.longShortRatio !== undefined ? 20 : 0)
  );

  return {
    oi,
    fr,
    ls,
    overall,
    confidence: Math.round(confidence),
  };
}

