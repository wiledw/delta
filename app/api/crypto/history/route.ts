import { NextResponse } from "next/server";
import { getHistoricalPrices } from "@/lib/crypto-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const days = searchParams.get("days");
  const timeframe = searchParams.get("timeframe") as "hourly" | "daily" | "weekly" | null;

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  try {
    const daysNum = days ? parseInt(days) : 90;
    const timeframeParam = timeframe || "daily";
    const prices = await getHistoricalPrices(symbol, daysNum, timeframeParam);
    
    if (prices.length === 0) {
      return NextResponse.json(
        { error: `Historical data not found for symbol: ${symbol}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ prices });
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical data" },
      { status: 500 }
    );
  }
}

