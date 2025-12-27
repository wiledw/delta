"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult } from "@/lib/pair-trading-math";
import { getFOILSBadgeVariant } from "@/lib/foils-indicator";

interface AnalysisViewProps {
  result: AnalysisResult;
  inputs: AnalysisResult["inputs"];
}

export function AnalysisView({ result, inputs }: AnalysisViewProps) {
  return (
    <div className="space-y-4">
      {/* Quick Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Z-Score</div>
              <div className="text-lg font-bold">{result.stats.zScoreNow.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Signal</div>
              <Badge variant={result.signal.tradeSignal === "NO_SIGNAL" ? "secondary" : "default"}>
                {result.signal.tradeSignal === "SHORT_A_LONG_B" ? "SHORT A / LONG B" : 
                 result.signal.tradeSignal === "LONG_A_SHORT_B" ? "LONG A / SHORT B" : 
                 "NO SIGNAL"}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Correlation</div>
              <div className="text-lg font-bold">{(result.stats.correlation * 100).toFixed(0)}%</div>
            </div>
          </div>
          {result.foils && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-1">Market Sentiment (FOILS)</div>
              <Badge variant={getFOILSBadgeVariant(result.foils.overall)}>
                {result.foils.overall}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Positions to Open */}
      {result.positions && (
        <Card>
          <CardHeader>
            <CardTitle>Open These Positions on Perp DEX</CardTitle>
            <CardDescription>
              Delta-neutral pair: Hold both positions together
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Asset A Position */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
                <div className="text-lg font-bold mb-3">{inputs.assetA}</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Direction:</span>
                    <Badge variant={result.positions.assetA.direction === "long" ? "default" : "destructive"} className="text-base px-3 py-1">
                      {result.positions.assetA.direction.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Size (USD):</span>
                    <span className="text-lg font-bold">${result.positions.assetA.usdNotional.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Units:</span>
                    <span className="text-lg font-semibold">{result.positions.assetA.units.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Leverage:</span>
                    <span className="text-base font-semibold">{Math.round(result.positions.suggestedLeverageX)}x</span>
                  </div>
                </div>
              </div>

              {/* Asset B Position */}
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-300 dark:border-green-700 rounded-lg">
                <div className="text-lg font-bold mb-3">{inputs.assetB}</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Direction:</span>
                    <Badge variant={result.positions.assetB.direction === "long" ? "default" : "destructive"} className="text-base px-3 py-1">
                      {result.positions.assetB.direction.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Size (USD):</span>
                    <span className="text-lg font-bold">${result.positions.assetB.usdNotional.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Units:</span>
                    <span className="text-lg font-semibold">{result.positions.assetB.units.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Leverage:</span>
                    <span className="text-base font-semibold">{Math.round(result.positions.suggestedLeverageX)}x</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* When to Close */}
      <Card>
        <CardHeader>
          <CardTitle>When to Close Positions</CardTitle>
          <CardDescription>
            Exit both positions together based on spread levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white dark:bg-gray-900 rounded border">
              <div className="text-xs text-muted-foreground mb-1">Current Spread</div>
              <div className="text-xl font-bold">{result.stats.spreadNow.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">Z: {result.stats.zScoreNow.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-white dark:bg-gray-900 rounded border">
              <div className="text-xs text-muted-foreground mb-1">Target Spread</div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">{result.stats.spreadMean.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">Z: {result.inputs.exitZ}</div>
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
              <strong>✅ Close for profit:</strong> When spread reaches {result.stats.spreadMean.toFixed(2)} (Z-score = {result.inputs.exitZ})
            </div>
            <div className="p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
              <strong>⏰ Time limit:</strong> After {result.inputs.maxHoldingDays} days or when airdrop requirements met
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
              <strong>🚨 Emergency exit:</strong> If spread reaches{" "}
              {result.signal.tradeSignal === "SHORT_A_LONG_B" || 
               (result.signal.tradeSignal === "NO_SIGNAL" && result.stats.zScoreNow >= 0)
                ? (result.stats.spreadNow + result.riskPlan.stopLossSpreadDistance).toFixed(2)
                : (result.stats.spreadNow - result.riskPlan.stopLossSpreadDistance).toFixed(2)}
              {" "}(current: {result.stats.spreadNow.toFixed(2)})
            </div>
          </div>

          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
            💡 Monitor spread daily. Exit both positions simultaneously. Goal is volume/trading activity with minimal profits from outperformance.
          </div>
        </CardContent>
      </Card>

      {/* Inputs Card */}
      <Card>
        <CardHeader>
          <CardTitle>Input Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Price A</div>
              <div className="font-semibold">${inputs.priceA.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Price B</div>
              <div className="font-semibold">${inputs.priceB.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Portfolio Size</div>
              <div className="font-semibold">
                ${inputs.portfolioSizeUsd.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Risk %</div>
              <div className="font-semibold">{inputs.riskPct}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Max Leverage</div>
              <div className="font-semibold">{inputs.maxLeverageCap}x</div>
            </div>
            <div>
              <div className="text-muted-foreground">Entry Z Threshold</div>
              <div className="font-semibold">{inputs.entryThresholdZ}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Exit Z</div>
              <div className="font-semibold">{inputs.exitZ}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Soft Exit Z</div>
              <div className="font-semibold">{inputs.softExitZ}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Max Holding Days</div>
              <div className="font-semibold">{inputs.maxHoldingDays}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Stop-Loss Mult</div>
              <div className="font-semibold">{inputs.stopLossMult}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Take-Profit Mult</div>
              <div className="font-semibold">{inputs.takeProfitMult}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Hedge Method</div>
              <div className="font-semibold">{inputs.hedgeMethod}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Lookback N</div>
              <div className="font-semibold">{inputs.lookbackN}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
