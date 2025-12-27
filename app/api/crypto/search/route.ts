import { NextResponse } from "next/server";
import { searchCrypto } from "@/lib/crypto-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const results = await searchCrypto(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error searching crypto:", error);
    return NextResponse.json(
      { error: "Failed to search cryptocurrencies" },
      { status: 500 }
    );
  }
}

