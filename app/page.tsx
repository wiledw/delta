import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  BarChart3,
  Zap,
  Shield,
  Target,
  TrendingUp,
  Activity,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HomeProps {
  searchParams: Promise<{ code?: string; error?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  
  // Handle OAuth callback if code is present in URL (fallback)
  // This happens if Supabase redirects to home instead of /auth/callback
  if (params.code) {
    redirect(`/auth/callback?code=${params.code}`);
  }

  // Handle OAuth errors
  if (params.error) {
    redirect(`/auth/error?error=${encodeURIComponent(params.error)}`);
  }

  // Check if user is logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // If user is logged in and on home page, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="flex-1 w-full flex flex-col items-center">
        {/* Header */}
        <nav className="w-full flex justify-center border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="w-full max-w-7xl flex justify-between items-center p-4 px-6 text-sm">
            <div className="flex gap-5 items-center">
              <Link
                href={"/"}
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
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}
              <ThemeSwitcher />
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 w-full max-w-7xl px-6 py-20">
          <div className="flex flex-col gap-12 items-center">
            {/* Main Hero */}
            <div className="flex flex-col gap-8 items-center text-center max-w-4xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  PairLab
                </h1>
              </div>
              <p className="text-2xl md:text-3xl font-semibold text-foreground">
                Delta-Neutral Pair Trading Analytics
              </p>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
                Analyze crypto pairs, compute spread and Z-score signals, and size delta-neutral positions for airdrop farming. 
                Built for traders who want to generate volume while maintaining market neutrality.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    Start Trading
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                {!hasEnvVars && (
                  <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-12">
              <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/50 dark:to-indigo-950/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle>Spread Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Calculate spread, Z-score, and correlation between any two crypto assets. 
                    Get real-time market data from CoinGecko API.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/50 dark:to-pink-950/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg">
                      <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle>Position Sizing</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Automatically calculate delta-neutral position sizes with leverage recommendations. 
                    Optimized for perp DEX trading.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/50 dark:to-emerald-950/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
                      <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle>Risk Management</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Built-in risk calculations with stop-loss and take-profit levels. 
                    Clear exit signals based on spread reversion.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-950/50 dark:to-red-950/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 dark:bg-orange-500/20 rounded-lg">
                      <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle>FOILS Indicator</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Market sentiment analysis using Funding, Open Interest, and Long/Short ratio indicators. 
                    Get additional context for your trading decisions.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50/50 to-amber-50/50 dark:from-yellow-950/50 dark:to-amber-950/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-lg">
                      <Activity className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <CardTitle>Live Market Data</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Fetch real-time prices and historical data with one click. 
                    Support for hourly, daily, and weekly timeframes.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-2 border-cyan-200 dark:border-cyan-800 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/50 dark:to-blue-950/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <CardTitle>Airdrop Farming</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Optimized for airdrop farming strategies. Generate trading volume 
                    while maintaining delta-neutrality for minimal directional risk.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* How It Works */}
            <div className="w-full mt-20">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  How It Works
                </h2>
                <p className="text-lg text-muted-foreground">
                  Simple steps to start your delta-neutral pair trading
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { step: "1", title: "Select Pair", desc: "Choose two crypto assets to analyze (e.g., BTC/ETH)" },
                  { step: "2", title: "Fetch Data", desc: "Get live prices and historical data automatically" },
                  { step: "3", title: "Run Analysis", desc: "Calculate spread, Z-score, and position sizes" },
                  { step: "4", title: "Open Positions", desc: "Execute delta-neutral positions on your perp DEX" },
                ].map((item) => (
                  <Card key={item.step} className="text-center">
                    <CardHeader>
                      <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl mb-4">
                        {item.step}
                      </div>
                      <CardTitle>{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{item.desc}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Key Benefits */}
            <div className="w-full mt-20">
              <Card className="border-2 border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50/50 to-blue-50/50 dark:from-slate-950/50 dark:to-blue-950/50">
                <CardHeader>
                  <CardTitle className="text-3xl text-center mb-2">Why PairLab?</CardTitle>
                  <CardDescription className="text-center text-lg">
                    Everything you need for delta-neutral pair trading
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {[
                      "Free live market data (no API key required)",
                      "Automatic position sizing with leverage calculations",
                      "Real-time spread and Z-score monitoring",
                      "FOILS market sentiment indicators",
                      "Save and track your analyses",
                      "Optimized for airdrop farming strategies",
                    ].map((benefit) => (
                      <div key={benefit} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-base">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA Section */}
            <div className="w-full mt-20 text-center">
              <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-3xl mb-2">Ready to Start Trading?</CardTitle>
                  <CardDescription className="text-lg">
                    Join PairLab and start analyzing crypto pairs today
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      Get Started
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-md mt-20">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link
                  href={"/"}
                  className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                >
                  PairLab
                </Link>
                <span className="text-sm text-muted-foreground">Delta-Neutral Pair Trading</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
                    className="font-semibold hover:underline text-foreground"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
