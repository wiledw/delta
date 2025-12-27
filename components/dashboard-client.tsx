"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  runAnalysis,
  parseSeries,
  type AnalysisResult,
  type AnalysisInputs,
} from "@/lib/pair-trading-math";
import Link from "next/link";
import { LogoutButton } from "./logout-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@supabase/supabase-js";
import { SavedAnalysesList } from "./saved-analyses-list";
import { calculateFOILS, getFOILSBadgeVariant } from "@/lib/foils-indicator";
import {
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Zap,
  Shield,
  Target,
  Clock,
  AlertCircle,
} from "lucide-react";

interface DashboardClientProps {
  user: User | null;
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [assetA, setAssetA] = useState("BTC");
  const [assetB, setAssetB] = useState("ETH");
  const [priceA, setPriceA] = useState("50000");
  const [priceB, setPriceB] = useState("3000");
  const [historicalA, setHistoricalA] = useState("");
  const [historicalB, setHistoricalB] = useState("");
  const [portfolioSizeUsd, setPortfolioSizeUsd] = useState("100000");
  const [riskPct, setRiskPct] = useState("2");
  const [maxLeverageCap, setMaxLeverageCap] = useState("3");
  const [lookbackN, setLookbackN] = useState("");
  const [entryThresholdZ, setEntryThresholdZ] = useState("2.0");
  const [exitZ, setExitZ] = useState("0.0");
  const [softExitZ, setSoftExitZ] = useState("1.0");
  const [maxHoldingDays, setMaxHoldingDays] = useState("7");
  const [stopLossMult, setStopLossMult] = useState("1.5");
  const [takeProfitMult, setTakeProfitMult] = useState("0.75");
  const [hedgeMethod, setHedgeMethod] = useState<"regression" | "volRatio">(
    "regression"
  );
  const [timeframe, setTimeframe] = useState<"hourly" | "daily" | "weekly">(
    "daily"
  );

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<
    Array<{
      id: string;
      asset_a: string;
      asset_b: string;
      created_at: string;
      result_data: AnalysisResult;
    }>
  >([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(false);
  const [isFetchingPriceA, setIsFetchingPriceA] = useState(false);
  const [isFetchingPriceB, setIsFetchingPriceB] = useState(false);
  const [isFetchingHistoryA, setIsFetchingHistoryA] = useState(false);
  const [isFetchingHistoryB, setIsFetchingHistoryB] = useState(false);
  const [priceAChange24h, setPriceAChange24h] = useState<number | null>(null);
  const [priceBChange24h, setPriceBChange24h] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  const supabase = createClient();

  // Fetch user on client side to avoid blocking navigation
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: fetchedUser },
      } = await supabase.auth.getUser();
      setCurrentUser(fetchedUser);
    };
    fetchUser();
  }, [supabase]);

  // Load saved analyses function
  const loadSavedAnalyses = async () => {
    if (!currentUser) return;
    setIsLoadingAnalyses(true);
    try {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setSavedAnalyses(data || []);
    } catch (err) {
      console.error("Error loading analyses:", err);
    } finally {
      setIsLoadingAnalyses(false);
    }
  };

  // Load saved analyses if user is logged in
  useEffect(() => {
    loadSavedAnalyses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleFetchPrice = async (asset: "A" | "B") => {
    const symbol = asset === "A" ? assetA : assetB;
    const setIsLoading =
      asset === "A" ? setIsFetchingPriceA : setIsFetchingPriceB;
    const setPrice = asset === "A" ? setPriceA : setPriceB;
    const setChange = asset === "A" ? setPriceAChange24h : setPriceBChange24h;

    if (!symbol.trim()) {
      alert(`Please enter a symbol for Asset ${asset} first`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/crypto/price?symbol=${encodeURIComponent(symbol.trim())}`
      );
      const data = await response.json();

      if (response.ok && data.price) {
        setPrice(data.price.toFixed(2));
        setChange(data.priceChangePercent24h || 0);
      } else {
        alert(`Failed to fetch price: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      alert(
        `Error fetching price: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchHistory = async (asset: "A" | "B", days: number = 90) => {
    const symbol = asset === "A" ? assetA : assetB;
    const setIsLoading =
      asset === "A" ? setIsFetchingHistoryA : setIsFetchingHistoryB;
    const setHistory = asset === "A" ? setHistoricalA : setHistoricalB;

    if (!symbol.trim()) {
      alert(`Please enter a symbol for Asset ${asset} first`);
      return;
    }

    setIsLoading(true);
    try {
      // Adjust days based on timeframe
      let apiDays = days;
      if (timeframe === "hourly") {
        apiDays = 1; // CoinGecko only provides hourly for <= 1 day
      } else if (timeframe === "weekly") {
        apiDays = Math.min(days, 365); // Max 365 days for weekly
      }

      const response = await fetch(
        `/api/crypto/history?symbol=${encodeURIComponent(
          symbol.trim()
        )}&days=${apiDays}&timeframe=${timeframe}`
      );
      const data = await response.json();

      if (response.ok && data.prices && data.prices.length > 0) {
        setHistory(data.prices.join("\n"));
      } else {
        alert(
          `Failed to fetch historical data: ${data.error || "Unknown error"}`
        );
      }
    } catch (err) {
      alert(
        `Error fetching historical data: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchBothPrices = async () => {
    await Promise.all([handleFetchPrice("A"), handleFetchPrice("B")]);
  };

  const handleFetchBothHistories = async (days: number = 90) => {
    await Promise.all([
      handleFetchHistory("A", days),
      handleFetchHistory("B", days),
    ]);
  };

  const handleRunAnalysis = () => {
    setError(null);
    try {
      const parsedA = parseSeries(historicalA);
      const parsedB = parseSeries(historicalB);

      if (parsedA.length === 0 || parsedB.length === 0) {
        throw new Error("Please provide historical data for both assets");
      }

      const inputs: AnalysisInputs = {
        assetA: assetA.trim() || "A",
        assetB: assetB.trim() || "B",
        priceA: parseFloat(priceA),
        priceB: parseFloat(priceB),
        historicalA: parsedA,
        historicalB: parsedB,
        lookbackN: lookbackN ? parseInt(lookbackN) : undefined,
        portfolioSizeUsd: parseFloat(portfolioSizeUsd),
        riskPct: parseFloat(riskPct),
        maxLeverageCap: parseFloat(maxLeverageCap),
        entryThresholdZ: parseFloat(entryThresholdZ),
        exitZ: parseFloat(exitZ),
        softExitZ: parseFloat(softExitZ),
        maxHoldingDays: parseInt(maxHoldingDays),
        stopLossMult: parseFloat(stopLossMult),
        takeProfitMult: parseFloat(takeProfitMult),
        hedgeMethod,
      };

      const analysisResult = runAnalysis(inputs);

      // Calculate FOILS indicator if we have price change data
      if (priceAChange24h !== null && priceBChange24h !== null) {
        const avgPriceChange = (priceAChange24h + priceBChange24h) / 2;
        const foils = calculateFOILS(
          avgPriceChange,
          avgPriceChange,
          analysisResult.stats.zScoreNow,
          analysisResult.stats.correlation,
          analysisResult.stats.spreadStdev,
          analysisResult.stats.spreadMean,
          analysisResult.stats.spreadNow
        );
        analysisResult.foils = foils;
      }

      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResult(null);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!currentUser || !result) return;

    setIsSaving(true);
    try {
      const { error } = await supabase.from("analyses").insert({
        user_id: currentUser.id,
        asset_a: result.inputs.assetA,
        asset_b: result.inputs.assetB,
        input_data: result.inputs,
        result_data: result,
      });

      if (error) throw error;

      // Reload saved analyses
      setIsLoadingAnalyses(true);
      const { data, error: fetchError } = await supabase
        .from("analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setSavedAnalyses(data || []);
      setIsLoadingAnalyses(false);

      alert("Analysis saved successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save analysis");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadExample = () => {
    // Generate example data
    const basePriceA = 50000;
    const basePriceB = 3000;
    const exampleA: number[] = [];
    const exampleB: number[] = [];

    for (let i = 0; i < 100; i++) {
      const noiseA = (Math.random() - 0.5) * 2000;
      const noiseB = (Math.random() - 0.5) * 200;
      exampleA.push(basePriceA + noiseA);
      exampleB.push(basePriceB + noiseB + noiseA * 0.1); // Some correlation
    }

    setHistoricalA(exampleA.join("\n"));
    setHistoricalB(exampleB.join("\n"));
  };

  const handleCopyJSON = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    alert("JSON copied to clipboard!");
  };

  const handleDownloadJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pair-analysis-${result.inputs.assetA}-${
      result.inputs.assetB
    }-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAnalysis = async (id: string) => {
    if (!confirm("Are you sure you want to delete this analysis?")) return;

    try {
      const { error } = await supabase.from("analyses").delete().eq("id", id);
      if (error) throw error;
      await loadSavedAnalyses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete analysis");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              PairLab
            </Link>
            <Badge variant="outline" className="hidden sm:flex">
              <Activity className="h-3 w-3 mr-1" />
              Delta-Neutral Trading
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <Badge variant="secondary" className="hidden sm:flex">
                  {currentUser.email}
                </Badge>
                <LogoutButton />
              </>
            ) : (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Sign in to save and view history
                </span>
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Link href="/auth/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Start Info Card - Web3 Style */}
            <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border-2 border-blue-300 dark:border-blue-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Quick Start Guide
                  </CardTitle>
                </div>
                <CardDescription>
                  Get started quickly with live market data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-3 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <Badge variant="outline" className="mt-0.5">
                    1
                  </Badge>
                  <div>
                    <strong className="text-blue-700 dark:text-blue-300">
                      Enter symbols:
                    </strong>{" "}
                    Use CoinGecko symbols (e.g., btc, eth, sol, xrp)
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <Badge variant="outline" className="mt-0.5">
                    2
                  </Badge>
                  <div>
                    <strong className="text-purple-700 dark:text-purple-300">
                      Fetch live prices:
                    </strong>{" "}
                    Click &quot;Fetch Live Prices&quot; to get current market
                    prices
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <Badge variant="outline" className="mt-0.5">
                    3
                  </Badge>
                  <div>
                    <strong className="text-pink-700 dark:text-pink-300">
                      Fetch historical data:
                    </strong>{" "}
                    Click &quot;Fetch 30 Days&quot; or &quot;Fetch 90 Days&quot;
                    to get price history automatically
                  </div>
                </div>
                <div className="flex items-start gap-3 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <Badge variant="outline" className="mt-0.5">
                    4
                  </Badge>
                  <div>
                    <strong className="text-green-700 dark:text-green-300">
                      Run analysis:
                    </strong>{" "}
                    Click &quot;Run Analysis&quot; to calculate spread, Z-score,
                    and position sizing
                  </div>
                </div>
                <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-300 dark:border-blue-700 rounded-lg mt-3">
                  <p className="text-xs text-muted-foreground">
                    <Activity className="h-3 w-3 inline mr-1" />
                    All data is fetched from CoinGecko free API (no API key
                    required). Rate limit: ~10-50 calls/minute.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Pair Selector */}
            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <CardTitle>Pair Selector</CardTitle>
                </div>
                <CardDescription>
                  Enter the symbols for the two assets you want to analyze
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetA">Asset A Symbol</Label>
                    <Input
                      id="assetA"
                      value={assetA}
                      onChange={(e) => setAssetA(e.target.value)}
                      placeholder="BTC"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use CoinGecko symbol (e.g., btc, eth, sol)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assetB">Asset B Symbol</Label>
                    <Input
                      id="assetB"
                      value={assetB}
                      onChange={(e) => setAssetB(e.target.value)}
                      placeholder="ETH"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use CoinGecko symbol (e.g., btc, eth, sol)
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleFetchBothPrices}
                    variant="outline"
                    size="sm"
                    disabled={isFetchingPriceA || isFetchingPriceB}
                  >
                    {isFetchingPriceA || isFetchingPriceB ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Fetch Live Prices
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Inputs Panel */}
            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <CardTitle>Analysis Parameters</CardTitle>
                </div>
                <CardDescription>
                  Configure prices, historical data, and risk parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="priceA">Current Price A</Label>
                      <Button
                        onClick={() => handleFetchPrice("A")}
                        variant="ghost"
                        size="sm"
                        disabled={isFetchingPriceA}
                      >
                        {isFetchingPriceA ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <Input
                      id="priceA"
                      type="number"
                      step="0.01"
                      value={priceA}
                      onChange={(e) => setPriceA(e.target.value)}
                    />
                    {priceAChange24h !== null && (
                      <p
                        className={`text-xs ${
                          priceAChange24h >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        24h: {priceAChange24h >= 0 ? "+" : ""}
                        {priceAChange24h.toFixed(2)}%
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="priceB">Current Price B</Label>
                      <Button
                        onClick={() => handleFetchPrice("B")}
                        variant="ghost"
                        size="sm"
                        disabled={isFetchingPriceB}
                      >
                        {isFetchingPriceB ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <Input
                      id="priceB"
                      type="number"
                      step="0.01"
                      value={priceB}
                      onChange={(e) => setPriceB(e.target.value)}
                    />
                    {priceBChange24h !== null && (
                      <p
                        className={`text-xs ${
                          priceBChange24h >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        24h: {priceBChange24h >= 0 ? "+" : ""}
                        {priceBChange24h.toFixed(2)}%
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="historicalA">
                      Historical Closes for A (CSV or newline-separated)
                    </Label>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleFetchHistory("A", 30)}
                        variant="ghost"
                        size="sm"
                        disabled={isFetchingHistoryA}
                      >
                        {isFetchingHistoryA ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          "30d"
                        )}
                      </Button>
                      <Button
                        onClick={() => handleFetchHistory("A", 90)}
                        variant="ghost"
                        size="sm"
                        disabled={isFetchingHistoryA}
                      >
                        {isFetchingHistoryA ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          "90d"
                        )}
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="historicalA"
                    rows={4}
                    value={historicalA}
                    onChange={(e) => setHistoricalA(e.target.value)}
                    placeholder="50000, 50100, 49900..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {historicalA.split(/[,\n]/).filter((s) => s.trim()).length}{" "}
                    data points
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="historicalB">
                      Historical Closes for B (CSV or newline-separated)
                    </Label>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleFetchHistory("B", 30)}
                        variant="ghost"
                        size="sm"
                        disabled={isFetchingHistoryB}
                      >
                        {isFetchingHistoryB ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          "30d"
                        )}
                      </Button>
                      <Button
                        onClick={() => handleFetchHistory("B", 90)}
                        variant="ghost"
                        size="sm"
                        disabled={isFetchingHistoryB}
                      >
                        {isFetchingHistoryB ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          "90d"
                        )}
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="historicalB"
                    rows={4}
                    value={historicalB}
                    onChange={(e) => setHistoricalB(e.target.value)}
                    placeholder="3000, 3010, 2990..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {historicalB.split(/[,\n]/).filter((s) => s.trim()).length}{" "}
                    data points
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleFetchBothHistories(30)}
                    variant="outline"
                    size="sm"
                    disabled={isFetchingHistoryA || isFetchingHistoryB}
                  >
                    {isFetchingHistoryA || isFetchingHistoryB ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Fetch 30 Days History
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleFetchBothHistories(90)}
                    variant="outline"
                    size="sm"
                    disabled={isFetchingHistoryA || isFetchingHistoryB}
                  >
                    {isFetchingHistoryA || isFetchingHistoryB ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Fetch 90 Days History
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="portfolioSizeUsd">
                      Portfolio Size (USD)
                    </Label>
                    <Input
                      id="portfolioSizeUsd"
                      type="number"
                      step="1000"
                      value={portfolioSizeUsd}
                      onChange={(e) => setPortfolioSizeUsd(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="riskPct">Risk per Trade (%)</Label>
                    <Input
                      id="riskPct"
                      type="number"
                      step="0.1"
                      value={riskPct}
                      onChange={(e) => setRiskPct(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxLeverageCap">Max Leverage Cap</Label>
                    <Input
                      id="maxLeverageCap"
                      type="number"
                      step="0.5"
                      value={maxLeverageCap}
                      onChange={(e) => setMaxLeverageCap(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lookbackN">
                      Lookback Window (optional, leave empty for full series)
                    </Label>
                    <Input
                      id="lookbackN"
                      type="number"
                      value={lookbackN}
                      onChange={(e) => setLookbackN(e.target.value)}
                      placeholder="e.g., 50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entryThresholdZ">Entry Z Threshold</Label>
                    <Input
                      id="entryThresholdZ"
                      type="number"
                      step="0.1"
                      value={entryThresholdZ}
                      onChange={(e) => setEntryThresholdZ(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exitZ">Exit Z</Label>
                    <Input
                      id="exitZ"
                      type="number"
                      step="0.1"
                      value={exitZ}
                      onChange={(e) => setExitZ(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="softExitZ">Soft Exit |Z|</Label>
                    <Input
                      id="softExitZ"
                      type="number"
                      step="0.1"
                      value={softExitZ}
                      onChange={(e) => setSoftExitZ(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxHoldingDays">Max Holding Days</Label>
                    <Input
                      id="maxHoldingDays"
                      type="number"
                      value={maxHoldingDays}
                      onChange={(e) => setMaxHoldingDays(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stopLossMult">
                      Stop-Loss Multiple of Spread Stdev
                    </Label>
                    <Input
                      id="stopLossMult"
                      type="number"
                      step="0.1"
                      value={stopLossMult}
                      onChange={(e) => setStopLossMult(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="takeProfitMult">Take-Profit Multiple</Label>
                    <Input
                      id="takeProfitMult"
                      type="number"
                      step="0.1"
                      value={takeProfitMult}
                      onChange={(e) => setTakeProfitMult(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hedgeMethod">Hedge Method</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          {hedgeMethod === "regression"
                            ? "Regression"
                            : "Volatility Ratio"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => setHedgeMethod("regression")}
                        >
                          Regression
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setHedgeMethod("volRatio")}
                        >
                          Volatility Ratio
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeframe">Timeframe</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          {timeframe === "hourly"
                            ? "Hourly"
                            : timeframe === "weekly"
                            ? "Weekly"
                            : "Daily"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => setTimeframe("hourly")}
                        >
                          Hourly (1 day max)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTimeframe("daily")}>
                          Daily (default)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTimeframe("weekly")}
                        >
                          Weekly (365 days max)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleRunAnalysis} className="flex-1">
                    Run Analysis
                  </Button>
                  <Button
                    onClick={handleSaveAnalysis}
                    disabled={!currentUser || !result || isSaving}
                    variant="outline"
                  >
                    {isSaving ? "Saving..." : "Save Analysis"}
                  </Button>
                  <Button onClick={handleLoadExample} variant="outline">
                    Load Example Data
                  </Button>
                  <Button
                    onClick={handleCopyJSON}
                    disabled={!result}
                    variant="outline"
                  >
                    Copy JSON
                  </Button>
                  <Button
                    onClick={handleDownloadJSON}
                    disabled={!result}
                    variant="outline"
                  >
                    Download JSON
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Panel */}
            {result && (
              <div className="space-y-4">
                {/* Quick Analysis Summary - Web3 Style */}
                <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/50 dark:to-purple-950/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <CardTitle className="text-xl">
                        Analysis Summary
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Z-Score Card */}
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Z-Score
                          </div>
                          {Math.abs(result.stats.zScoreNow) >= 2 ? (
                            <Zap className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <Activity className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <div
                          className={`text-3xl font-bold ${
                            Math.abs(result.stats.zScoreNow) >= 2
                              ? "text-yellow-600 dark:text-yellow-400"
                              : Math.abs(result.stats.zScoreNow) >= 1
                              ? "text-orange-600 dark:text-orange-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {result.stats.zScoreNow.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {Math.abs(result.stats.zScoreNow) >= 2
                            ? "Strong Signal"
                            : Math.abs(result.stats.zScoreNow) >= 1
                            ? "Moderate Signal"
                            : "Weak Signal"}
                        </div>
                      </div>

                      {/* Signal Card */}
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Trade Signal
                          </div>
                          {result.signal.tradeSignal !== "NO_SIGNAL" ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <Badge
                          variant={
                            result.signal.tradeSignal === "NO_SIGNAL"
                              ? "secondary"
                              : result.signal.tradeSignal === "SHORT_A_LONG_B"
                              ? "destructive"
                              : "default"
                          }
                          className="text-sm px-3 py-1.5 font-semibold"
                        >
                          {result.signal.tradeSignal === "SHORT_A_LONG_B"
                            ? "SHORT A / LONG B"
                            : result.signal.tradeSignal === "LONG_A_SHORT_B"
                            ? "LONG A / SHORT B"
                            : "NO SIGNAL"}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-2">
                          {result.signal.confidenceNote}
                        </div>
                      </div>

                      {/* Correlation Card */}
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-green-200 dark:border-green-800 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Correlation
                          </div>
                          <Shield
                            className={`h-4 w-4 ${
                              result.stats.correlation >= 0.7
                                ? "text-green-500"
                                : "text-yellow-500"
                            }`}
                          />
                        </div>
                        <div
                          className={`text-3xl font-bold ${
                            result.stats.correlation >= 0.7
                              ? "text-green-600 dark:text-green-400"
                              : "text-yellow-600 dark:text-yellow-400"
                          }`}
                        >
                          {(result.stats.correlation * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {result.stats.correlation >= 0.7
                            ? "Strong Pair"
                            : "Moderate Pair"}
                        </div>
                      </div>
                    </div>

                    {/* FOILS Indicator */}
                    {result.foils && (
                      <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <div className="text-sm font-semibold">
                            Market Sentiment (FOILS)
                          </div>
                        </div>
                        <Badge
                          variant={getFOILSBadgeVariant(result.foils.overall)}
                          className="text-base px-4 py-2"
                        >
                          {result.foils.overall}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-2">
                          Confidence: {result.foils.confidence}%
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Positions Card */}
                {/* Positions to Open - Web3 Style */}
                {result.positions && (
                  <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/50 dark:to-pink-950/50">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <CardTitle className="text-xl">
                          Open These Positions on Perp DEX
                        </CardTitle>
                      </div>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Shield className="h-4 w-4" />
                        Delta-neutral pair: Hold both positions together
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Asset A Position */}
                        <div className="p-5 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 border-2 border-blue-400/50 dark:border-blue-600/50 rounded-xl backdrop-blur-sm shadow-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              {result.inputs.assetA}
                            </div>
                            {result.positions.assetA.direction === "long" ? (
                              <TrendingUp className="h-5 w-5 text-green-500" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">
                                Direction
                              </span>
                              <Badge
                                variant={
                                  result.positions.assetA.direction === "long"
                                    ? "default"
                                    : "destructive"
                                }
                                className="text-sm px-3 py-1 font-semibold"
                              >
                                {result.positions.assetA.direction.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">
                                Size (USD)
                              </span>
                              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                $
                                {result.positions.assetA.usdNotional.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">
                                Units
                              </span>
                              <span className="text-lg font-semibold font-mono">
                                {result.positions.assetA.units.toFixed(6)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">
                                Leverage
                              </span>
                              <Badge
                                variant="outline"
                                className="text-base px-3 py-1 font-bold"
                              >
                                {Math.round(
                                  result.positions.suggestedLeverageX
                                )}
                                x
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Asset B Position */}
                        <div className="p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border-2 border-green-400/50 dark:border-green-600/50 rounded-xl backdrop-blur-sm shadow-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              {result.inputs.assetB}
                            </div>
                            {result.positions.assetB.direction === "long" ? (
                              <TrendingUp className="h-5 w-5 text-green-500" />
                            ) : (
                              <TrendingDown className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">
                                Direction
                              </span>
                              <Badge
                                variant={
                                  result.positions.assetB.direction === "long"
                                    ? "default"
                                    : "destructive"
                                }
                                className="text-sm px-3 py-1 font-semibold"
                              >
                                {result.positions.assetB.direction.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">
                                Size (USD)
                              </span>
                              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                $
                                {result.positions.assetB.usdNotional.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">
                                Units
                              </span>
                              <span className="text-lg font-semibold font-mono">
                                {result.positions.assetB.units.toFixed(6)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <span className="text-sm font-medium text-muted-foreground">
                                Leverage
                              </span>
                              <Badge
                                variant="outline"
                                className="text-base px-3 py-1 font-bold"
                              >
                                {Math.round(
                                  result.positions.suggestedLeverageX
                                )}
                                x
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* When to Close - Web3 Style */}
                <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-950/50 dark:to-red-950/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <CardTitle className="text-xl">
                        When to Close Positions
                      </CardTitle>
                    </div>
                    <CardDescription>
                      Exit both positions together based on spread levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-blue-300 dark:border-blue-700 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Current Spread
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {result.stats.spreadNow.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Z: {result.stats.zScoreNow.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-green-300 dark:border-green-700 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-green-500" />
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Target Spread
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                          {result.stats.spreadMean.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Z: {result.inputs.exitZ}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 border-2 border-green-300 dark:border-green-700 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <strong className="text-green-700 dark:text-green-300">
                            Close for profit
                          </strong>
                        </div>
                        <div className="text-sm text-green-800 dark:text-green-200">
                          When spread reaches{" "}
                          <span className="font-bold">
                            {result.stats.spreadMean.toFixed(2)}
                          </span>{" "}
                          (Z-score = {result.inputs.exitZ})
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <strong className="text-yellow-700 dark:text-yellow-300">
                            Time limit
                          </strong>
                        </div>
                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                          After{" "}
                          <span className="font-bold">
                            {result.inputs.maxHoldingDays} days
                          </span>{" "}
                          or when airdrop requirements met
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 dark:from-red-500/20 dark:to-pink-500/20 border-2 border-red-300 dark:border-red-700 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <strong className="text-red-700 dark:text-red-300">
                            Emergency exit
                          </strong>
                        </div>
                        <div className="text-sm text-red-800 dark:text-red-200">
                          If spread reaches{" "}
                          {result.signal.tradeSignal === "SHORT_A_LONG_B" ||
                          (result.signal.tradeSignal === "NO_SIGNAL" &&
                            result.stats.zScoreNow >= 0)
                            ? (
                                result.stats.spreadNow +
                                result.riskPlan.stopLossSpreadDistance
                              ).toFixed(2)
                            : (
                                result.stats.spreadNow -
                                result.riskPlan.stopLossSpreadDistance
                              ).toFixed(2)}{" "}
                          (current: {result.stats.spreadNow.toFixed(2)})
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-300 dark:border-blue-700 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="text-xs text-muted-foreground">
                          <strong className="text-blue-700 dark:text-blue-300">
                            Pro Tip:
                          </strong>{" "}
                          Monitor spread daily. Exit both positions
                          simultaneously. Goal is volume/trading activity with
                          minimal profits from outperformance.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Column: Saved Analyses (if logged in) */}
          {currentUser && (
            <div className="lg:col-span-1">
              <SavedAnalysesList
                analyses={savedAnalyses}
                isLoading={isLoadingAnalyses}
                onDelete={handleDeleteAnalysis}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
