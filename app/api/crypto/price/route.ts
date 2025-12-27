import { NextResponse } from "next/server";
import { getCurrentPrice } from "@/lib/crypto-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  try {
    const price = await getCurrentPrice(symbol);
    
    if (!price) {
      return NextResponse.json(
        { error: `Price not found for symbol: ${symbol}` },
        { status: 404 }
      );
    }

    return NextResponse.json(price);
  } catch (error) {
    console.error("Error fetching price:", error);
    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    );
  }
}

