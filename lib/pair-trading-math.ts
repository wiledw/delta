/**
 * Pure utility functions for pair trading calculations
 */

/**
 * Parse a series from text input (CSV or newline-separated)
 */
export function parseSeries(text: string): number[] {
  if (!text.trim()) return [];
  
  const values = text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => parseFloat(s))
    .filter((n) => !isNaN(n) && n > 0);
  
  return values;
}

/**
 * Calculate mean of an array
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

/**
 * Calculate sample standard deviation
 */
export function stdevSample(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Calculate Pearson correlation coefficient
 */
export function pearsonCorrelation(
  seriesA: number[],
  seriesB: number[],
): number {
  if (seriesA.length !== seriesB.length || seriesA.length < 2) {
    return 0;
  }

  const meanA = mean(seriesA);
  const meanB = mean(seriesB);

  let numerator = 0;
  let sumSqDiffA = 0;
  let sumSqDiffB = 0;

  for (let i = 0; i < seriesA.length; i++) {
    const diffA = seriesA[i] - meanA;
    const diffB = seriesB[i] - meanB;
    numerator += diffA * diffB;
    sumSqDiffA += diffA * diffA;
    sumSqDiffB += diffB * diffB;
  }

  const denominator = Math.sqrt(sumSqDiffA * sumSqDiffB);
  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Calculate simple returns
 */
export function returns(series: number[]): number[] {
  const result: number[] = [];
  for (let i = 1; i < series.length; i++) {
    result.push((series[i] - series[i - 1]) / series[i - 1]);
  }
  return result;
}

/**
 * Calculate beta using OLS regression (seriesA ~ alpha + beta * seriesB)
 */
export function computeBetaRegression(
  seriesA: number[],
  seriesB: number[],
): number {
  if (seriesA.length !== seriesB.length || seriesA.length < 2) {
    return 0;
  }

  const meanA = mean(seriesA);
  const meanB = mean(seriesB);

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < seriesA.length; i++) {
    const diffB = seriesB[i] - meanB;
    numerator += (seriesA[i] - meanA) * diffB;
    denominator += diffB * diffB;
  }

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Calculate beta using volatility ratio method
 */
export function computeBetaVolRatio(
  seriesA: number[],
  seriesB: number[],
): number {
  if (seriesA.length !== seriesB.length || seriesA.length < 2) {
    return 0;
  }

  const returnsA = returns(seriesA);
  const returnsB = returns(seriesB);

  const stdevA = stdevSample(returnsA);
  const stdevB = stdevSample(returnsB);

  if (stdevB === 0) return 0;

  const correlation = pearsonCorrelation(returnsA, returnsB);
  return correlation * (stdevA / stdevB);
}

/**
 * Compute beta using specified method
 */
export function computeBeta(
  method: "regression" | "volRatio",
  seriesA: number[],
  seriesB: number[],
): number {
  if (method === "volRatio") {
    return computeBetaVolRatio(seriesA, seriesB);
  }
  return computeBetaRegression(seriesA, seriesB);
}

/**
 * Compute spread series: spread[t] = A[t] - beta * B[t]
 */
export function computeSpreadSeries(
  seriesA: number[],
  seriesB: number[],
  beta: number,
): number[] {
  if (seriesA.length !== seriesB.length) return [];
  return seriesA.map((a, i) => a - beta * seriesB[i]);
}

/**
 * Calculate z-score
 */
export function zScore(x: number, mean: number, stdev: number): number {
  if (stdev === 0) return 0;
  return (x - mean) / stdev;
}

/**
 * Input parameters for analysis
 */
export interface AnalysisInputs {
  assetA: string;
  assetB: string;
  priceA: number;
  priceB: number;
  historicalA: number[];
  historicalB: number[];
  lookbackN?: number;
  portfolioSizeUsd: number;
  riskPct: number;
  maxLeverageCap: number;
  entryThresholdZ: number;
  exitZ: number;
  softExitZ: number;
  maxHoldingDays: number;
  stopLossMult: number;
  takeProfitMult: number;
  hedgeMethod: "regression" | "volRatio";
}

/**
 * Analysis results
 */
export interface AnalysisStats {
  correlation: number;
  beta: number;
  spreadMean: number;
  spreadStdev: number;
  spreadNow: number;
  zScoreNow: number;
}

export interface AnalysisSignal {
  tradeSignal: "SHORT_A_LONG_B" | "LONG_A_SHORT_B" | "NO_SIGNAL";
  confidenceNote: string;
  warnings: string[];
}

export interface PositionLeg {
  direction: "long" | "short";
  usdNotional: number;
  units: number;
  leverageX?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
}

export interface AnalysisPositions {
  assetA: PositionLeg;
  assetB: PositionLeg;
  grossNotionalUsd: number;
  suggestedLeverageX: number;
}

export interface ExitRule {
  title: string;
  description: string;
  detail: string;
  type: "profit" | "partial" | "time" | "stop";
}

export interface AnalysisRiskPlan {
  riskBudgetUsd: number;
  stopLossSpreadDistance: number;
  takeProfitSpreadDistance: number;
  exitRules: ExitRule[];
  holdingTimeGuidance: string;
}

export interface AnalysisResult {
  inputs: {
    assetA: string;
    assetB: string;
    priceA: number;
    priceB: number;
    lookbackN: number;
    portfolioSizeUsd: number;
    riskPct: number;
    maxLeverageCap: number;
    entryThresholdZ: number;
    exitZ: number;
    softExitZ: number;
    maxHoldingDays: number;
    stopLossMult: number;
    takeProfitMult: number;
    hedgeMethod: "regression" | "volRatio";
  };
  stats: AnalysisStats;
  signal: AnalysisSignal;
  positions: AnalysisPositions | null;
  riskPlan: AnalysisRiskPlan;
  foils?: {
    oi: "Bullish" | "Neutral" | "Bearish";
    fr: "Bullish" | "Neutral" | "Bearish";
    ls: "Bullish" | "Neutral" | "Bearish";
    overall: "Bullish" | "Neutral" | "Bearish";
    confidence: number;
  };
}

/**
 * Run complete pair trading analysis
 */
export function runAnalysis(inputs: AnalysisInputs): AnalysisResult {
  const warnings: string[] = [];
  
  // Apply lookback window if specified
  let seriesA = inputs.historicalA;
  let seriesB = inputs.historicalB;
  
  if (inputs.lookbackN && inputs.lookbackN > 0) {
    seriesA = seriesA.slice(-inputs.lookbackN);
    seriesB = seriesB.slice(-inputs.lookbackN);
  }
  
  // Validation
  if (seriesA.length !== seriesB.length) {
    throw new Error("Historical series lengths must match");
  }
  
  if (seriesA.length < 20) {
    throw new Error("Need at least 20 data points");
  }
  
  // Compute correlation
  const correlation = pearsonCorrelation(seriesA, seriesB);
  if (correlation < 0.7) {
    warnings.push(`Low correlation (${correlation.toFixed(3)}). Pair may not be suitable for mean reversion.`);
  }
  
  // Compute beta
  const beta = computeBeta(inputs.hedgeMethod, seriesA, seriesB);
  if (!isFinite(beta) || beta <= 0) {
    warnings.push(`Invalid beta (${beta}). Cannot size positions.`);
  }
  
  // Compute spread series
  const spreadSeries = computeSpreadSeries(seriesA, seriesB, beta);
  const spreadMean = mean(spreadSeries);
  const spreadStdev = stdevSample(spreadSeries);
  
  if (spreadStdev <= 1e-9) {
    warnings.push("Spread standard deviation too small. Cannot size positions.");
  }
  
  // Current spread and z-score
  const spreadNow = inputs.priceA - beta * inputs.priceB;
  const zScoreNow = zScore(spreadNow, spreadMean, spreadStdev);
  
  // Determine signal
  let tradeSignal: "SHORT_A_LONG_B" | "LONG_A_SHORT_B" | "NO_SIGNAL";
  if (zScoreNow >= inputs.entryThresholdZ) {
    tradeSignal = "SHORT_A_LONG_B";
  } else if (zScoreNow <= -inputs.entryThresholdZ) {
    tradeSignal = "LONG_A_SHORT_B";
  } else {
    tradeSignal = "NO_SIGNAL";
  }
  
  // Confidence note
  let confidenceNote = "";
  if (tradeSignal === "NO_SIGNAL") {
    confidenceNote = "No entry signal. Current Z-score is within entry threshold.";
  } else {
    const absZ = Math.abs(zScoreNow);
    if (absZ >= 3) {
      confidenceNote = "Strong signal. Z-score indicates significant deviation.";
    } else if (absZ >= 2) {
      confidenceNote = "Moderate signal. Z-score indicates notable deviation.";
    } else {
      confidenceNote = "Weak signal. Z-score is near entry threshold.";
    }
  }
  
  // Position sizing - always calculate if beta and spread are valid
  // Even with NO_SIGNAL, show positions for reference (user can decide)
  let positions: AnalysisPositions | null = null;
  let positionDirection: "SHORT_A_LONG_B" | "LONG_A_SHORT_B" = "LONG_A_SHORT_B";
  
  // Determine direction: use signal if available, otherwise use Z-score direction
  if (tradeSignal !== "NO_SIGNAL") {
    positionDirection = tradeSignal;
  } else {
    // When NO_SIGNAL, use Z-score direction as default (even if below threshold)
    positionDirection = zScoreNow >= 0 ? "SHORT_A_LONG_B" : "LONG_A_SHORT_B";
  }
  
  if (
    isFinite(beta) &&
    beta > 0 &&
    spreadStdev > 1e-9
  ) {
    const riskBudgetUsd = inputs.portfolioSizeUsd * (inputs.riskPct / 100);
    const stopLossSpreadDistance = inputs.stopLossMult * spreadStdev;
    const takeProfitSpreadDistance = inputs.takeProfitMult * spreadStdev;
    
    if (stopLossSpreadDistance > 0) {
      // Conservative sizing factor
      const k = 1.0;
      
      // Base notional for asset B
      let x = (riskBudgetUsd * inputs.priceB) / (k * stopLossSpreadDistance);
      
      // Calculate units
      const unitsB = x / inputs.priceB;
      const unitsA = (beta * unitsB * inputs.priceB) / inputs.priceA;
      const usdB = x;
      const usdA = unitsA * inputs.priceA;
      
      // Calculate leverage
      const grossNotional = Math.abs(usdA) + Math.abs(usdB);
      let suggestedLeverage = Math.max(1, grossNotional / inputs.portfolioSizeUsd);
      
      // Calculate individual leverage for each position
      const leverageA = Math.abs(usdA) / inputs.portfolioSizeUsd;
      const leverageB = Math.abs(usdB) / inputs.portfolioSizeUsd;
      
      // Calculate stop loss and take profit prices for each asset
      // Based on spread movement and beta relationship
      let stopLossPriceA: number | undefined;
      let takeProfitPriceA: number | undefined;
      let stopLossPriceB: number | undefined;
      let takeProfitPriceB: number | undefined;
      let stopLossPercentA: number | undefined;
      let takeProfitPercentA: number | undefined;
      let stopLossPercentB: number | undefined;
      let takeProfitPercentB: number | undefined;
      
      if (positionDirection === "SHORT_A_LONG_B") {
        // Short A, Long B
        // Stop loss: spread increases (bad for short spread)
        // Take profit: spread decreases (good for short spread)
        const adjustmentFactor = 1 / (1 + beta * beta);
        const stopLossAdjustA = stopLossSpreadDistance * adjustmentFactor / beta;
        const stopLossAdjustB = -stopLossSpreadDistance * adjustmentFactor;
        const takeProfitAdjustA = -takeProfitSpreadDistance * adjustmentFactor / beta;
        const takeProfitAdjustB = takeProfitSpreadDistance * adjustmentFactor;
        
        stopLossPriceA = inputs.priceA + stopLossAdjustA;
        takeProfitPriceA = inputs.priceA + takeProfitAdjustA;
        stopLossPriceB = inputs.priceB + stopLossAdjustB;
        takeProfitPriceB = inputs.priceB + takeProfitAdjustB;
        
        stopLossPercentA = (stopLossAdjustA / inputs.priceA) * 100;
        takeProfitPercentA = (takeProfitAdjustA / inputs.priceA) * 100;
        stopLossPercentB = (stopLossAdjustB / inputs.priceB) * 100;
        takeProfitPercentB = (takeProfitAdjustB / inputs.priceB) * 100;
      } else {
        // Long A, Short B
        // Stop loss: spread decreases (bad for long spread)
        // Take profit: spread increases (good for long spread)
        const adjustmentFactor = 1 / (1 + beta * beta);
        const stopLossAdjustA = -stopLossSpreadDistance * adjustmentFactor / beta;
        const stopLossAdjustB = stopLossSpreadDistance * adjustmentFactor;
        const takeProfitAdjustA = takeProfitSpreadDistance * adjustmentFactor / beta;
        const takeProfitAdjustB = -takeProfitSpreadDistance * adjustmentFactor;
        
        stopLossPriceA = inputs.priceA + stopLossAdjustA;
        takeProfitPriceA = inputs.priceA + takeProfitAdjustA;
        stopLossPriceB = inputs.priceB + stopLossAdjustB;
        takeProfitPriceB = inputs.priceB + takeProfitAdjustB;
        
        stopLossPercentA = (stopLossAdjustA / inputs.priceA) * 100;
        takeProfitPercentA = (takeProfitAdjustA / inputs.priceA) * 100;
        stopLossPercentB = (stopLossAdjustB / inputs.priceB) * 100;
        takeProfitPercentB = (takeProfitAdjustB / inputs.priceB) * 100;
      }
      
      // Clamp to max leverage
      if (suggestedLeverage > inputs.maxLeverageCap) {
        suggestedLeverage = inputs.maxLeverageCap;
        // Recalculate X to fit leverage constraint
        x = (inputs.portfolioSizeUsd * inputs.maxLeverageCap * inputs.priceB) / 
            (inputs.priceB + beta * inputs.priceA);
        const adjustedUnitsB = x / inputs.priceB;
        const adjustedUnitsA = (beta * adjustedUnitsB * inputs.priceB) / inputs.priceA;
        const adjustedUsdB = x;
        const adjustedUsdA = adjustedUnitsA * inputs.priceA;
        
        const adjustedLeverageA = Math.abs(adjustedUsdA) / inputs.portfolioSizeUsd;
        const adjustedLeverageB = Math.abs(adjustedUsdB) / inputs.portfolioSizeUsd;
        
        positions = {
          assetA: {
            direction: positionDirection === "SHORT_A_LONG_B" ? "short" : "long",
            usdNotional: Math.abs(adjustedUsdA),
            units: Math.abs(adjustedUnitsA),
            leverageX: adjustedLeverageA,
            stopLossPrice: stopLossPriceA,
            takeProfitPrice: takeProfitPriceA,
            stopLossPercent: stopLossPercentA,
            takeProfitPercent: takeProfitPercentA,
          },
          assetB: {
            direction: positionDirection === "SHORT_A_LONG_B" ? "long" : "short",
            usdNotional: Math.abs(adjustedUsdB),
            units: Math.abs(adjustedUnitsB),
            leverageX: adjustedLeverageB,
            stopLossPrice: stopLossPriceB,
            takeProfitPrice: takeProfitPriceB,
            stopLossPercent: stopLossPercentB,
            takeProfitPercent: takeProfitPercentB,
          },
          grossNotionalUsd: Math.abs(adjustedUsdA) + Math.abs(adjustedUsdB),
          suggestedLeverageX: suggestedLeverage,
        };
      } else {
        positions = {
          assetA: {
            direction: positionDirection === "SHORT_A_LONG_B" ? "short" : "long",
            usdNotional: Math.abs(usdA),
            units: Math.abs(unitsA),
            leverageX: leverageA,
            stopLossPrice: stopLossPriceA,
            takeProfitPrice: takeProfitPriceA,
            stopLossPercent: stopLossPercentA,
            takeProfitPercent: takeProfitPercentA,
          },
          assetB: {
            direction: positionDirection === "SHORT_A_LONG_B" ? "long" : "short",
            usdNotional: Math.abs(usdB),
            units: Math.abs(unitsB),
            leverageX: leverageB,
            stopLossPrice: stopLossPriceB,
            takeProfitPrice: takeProfitPriceB,
            stopLossPercent: stopLossPercentB,
            takeProfitPercent: takeProfitPercentB,
          },
          grossNotionalUsd: grossNotional,
          suggestedLeverageX: suggestedLeverage,
        };
      }
    }
  }
  
  // Risk plan
  const riskBudgetUsd = inputs.portfolioSizeUsd * (inputs.riskPct / 100);
  const stopLossSpreadDistance = inputs.stopLossMult * spreadStdev;
  const takeProfitSpreadDistance = inputs.takeProfitMult * spreadStdev;
  
  // Create user-friendly exit rules
  const exitRules = [
    {
      title: "Target Exit (Profit)",
      description: `Exit when spread returns to normal (Z-score reaches ${inputs.exitZ})`,
      detail: "This is your main profit target - when the spread reverts to its average",
      type: "profit" as const,
    },
    {
      title: "Soft Exit (Partial Profit)",
      description: `Consider taking partial profits when spread gets close to normal (Z-score ≤ ${inputs.softExitZ})`,
      detail: "The spread is moving back toward normal - good time to lock in some gains",
      type: "partial" as const,
    },
    {
      title: "Time Limit",
      description: `Exit after ${inputs.maxHoldingDays} days regardless of profit/loss`,
      detail: "For airdrop farming: Hold positions for the required period, but don't exceed this limit. Monitor funding costs daily.",
      type: "time" as const,
    },
    {
      title: "Stop Loss (Risk Control)",
      description: `Exit immediately if spread moves ${stopLossSpreadDistance.toFixed(2)} against you`,
      detail: `This limits your loss to $${riskBudgetUsd.toFixed(2)} (${inputs.riskPct}% of portfolio)`,
      type: "stop" as const,
    },
    {
      title: "Take Profit (Quick Win)",
      description: `Consider exiting early if spread moves ${takeProfitSpreadDistance.toFixed(2)} in your favor`,
      detail: "Lock in profits if the spread moves strongly in your direction before reaching target",
      type: "profit" as const,
    },
  ];
  
  const holdingTimeGuidance = `For airdrop farming: These delta-neutral positions are designed to minimize market risk while maintaining eligibility. Monitor funding rates hourly/daily - high funding costs can erode profits. Exit immediately if any stop loss conditions are met. Hold for ${inputs.maxHoldingDays} days maximum or until airdrop requirements are met.`;
  
  // Build result
  const result: AnalysisResult = {
    inputs: {
      assetA: inputs.assetA,
      assetB: inputs.assetB,
      priceA: inputs.priceA,
      priceB: inputs.priceB,
      lookbackN: inputs.lookbackN || seriesA.length,
      portfolioSizeUsd: inputs.portfolioSizeUsd,
      riskPct: inputs.riskPct,
      maxLeverageCap: inputs.maxLeverageCap,
      entryThresholdZ: inputs.entryThresholdZ,
      exitZ: inputs.exitZ,
      softExitZ: inputs.softExitZ,
      maxHoldingDays: inputs.maxHoldingDays,
      stopLossMult: inputs.stopLossMult,
      takeProfitMult: inputs.takeProfitMult,
      hedgeMethod: inputs.hedgeMethod,
    },
    stats: {
      correlation,
      beta,
      spreadMean,
      spreadStdev,
      spreadNow,
      zScoreNow,
    },
    signal: {
      tradeSignal,
      confidenceNote,
      warnings,
    },
    positions,
    riskPlan: {
      riskBudgetUsd,
      stopLossSpreadDistance,
      takeProfitSpreadDistance,
      exitRules,
      holdingTimeGuidance,
    },
  };
  
  return result;
}

