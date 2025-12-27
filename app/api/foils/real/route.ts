import { NextResponse } from "next/server";
import { getRealFOILSData, realFOILSToIndicator } from "@/lib/foils-real-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const spreadZScore = searchParams.get("spreadZScore");

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Convert symbol format: "BTC" -> "BTCUSDT" for Binance
    const binanceSymbol = symbol.toUpperCase().replace("/", "") + "USDT";
    
    const realData = await getRealFOILSData(binanceSymbol);
    
    if (!realData) {
      return NextResponse.json(
        { error: `FOILS data not found for symbol: ${symbol}` },
        { status: 404 }
      );
    }

    // Convert to indicator format
    const zScore = spreadZScore ? parseFloat(spreadZScore) : 0;
    const indicator = realFOILSToIndicator(realData, zScore);

    return NextResponse.json({
      ...indicator,
      rawData: realData,
    });
  } catch (error) {
    console.error("Error fetching real FOILS data:", error);
    return NextResponse.json(
      { error: "Failed to fetch FOILS data" },
      { status: 500 }
    );
  }
}

