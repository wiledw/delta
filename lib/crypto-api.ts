/**
 * CoinGecko API Integration
 * 
 * Rate Limits (with API key):
 * - Demo Account: 30 calls/min
 * - Pro Account: 500-1,000+ calls/min
 * 
 * API key should be set in NEXT_PUBLIC_COINGECKO_API_KEY environment variable
 */

const COINGECKO_API = "https://api.coingecko.com/api/v3";

/**
 * Get CoinGecko API key from environment
 * Works on both server and client side
 */
function getApiKey(): string | null {
  if (typeof window !== "undefined") {
    // Client-side: use public env var
    return process.env.NEXT_PUBLIC_COINGECKO_API_KEY || null;
  }
  // Server-side: can use private env var too
  return process.env.NEXT_PUBLIC_COINGECKO_API_KEY || process.env.COINGECKO_API_KEY || null;
}

// Client-side cache (in-memory)
const priceCache = new Map<string, { data: CryptoPrice; timestamp: number }>();
const historyCache = new Map<string, { data: number[]; timestamp: number }>();

const PRICE_CACHE_TTL = 60 * 1000; // 60 seconds
const HISTORY_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Map common symbols to CoinGecko IDs
 * CoinGecko uses IDs (like "bitcoin") not symbols (like "btc")
 */
const SYMBOL_TO_ID_MAP: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  xrp: "ripple",
  bnb: "binancecoin",
  doge: "dogecoin",
  ada: "cardano",
  matic: "matic-network",
  dot: "polkadot",
  avax: "avalanche-2",
  link: "chainlink",
  ltc: "litecoin",
  uni: "uniswap",
  atom: "cosmos",
  etc: "ethereum-classic",
  xlm: "stellar",
  algo: "algorand",
  vet: "vechain",
  icp: "internet-computer",
  fil: "filecoin",
  trx: "tron",
  eos: "eos",
  xmr: "monero",
  aave: "aave",
  mkr: "maker",
  comp: "compound-governance-token",
  snx: "havven",
  yfi: "yearn-finance",
  sushi: "sushi",
  crv: "curve-dao-token",
  // Add more as needed
};

/**
 * Convert symbol to CoinGecko ID
 * If not in map, try using symbol as-is (some work)
 */
function symbolToId(symbol: string): string {
  const lower = symbol.toLowerCase();
  return SYMBOL_TO_ID_MAP[lower] || lower;
}

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
}

export interface HistoricalPrice {
  timestamp: number;
  price: number;
}

/**
 * Get current price for a cryptocurrency
 * @param symbol - Crypto symbol (e.g., "btc", "eth")
 */
export async function getCurrentPrice(symbol: string): Promise<CryptoPrice | null> {
  try {
    const id = symbolToId(symbol);
    const cacheKey = `price_${id}`;
    
    // Check cache
    const cached = priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < PRICE_CACHE_TTL) {
      return cached.data;
    }

    const apiKey = getApiKey();
    const headers: HeadersInit = {};
    
    // Add API key header if available
    if (apiKey) {
      headers["x-cg-demo-api-key"] = apiKey;
    }

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`,
      {
        cache: "no-store",
        headers,
      }
    );

    if (response.status === 429) {
      console.warn(`Rate limit exceeded for ${symbol}. Please wait before retrying.`);
      // Return cached data if available, even if expired
      if (cached) {
        return cached.data;
      }
      throw new Error("Rate limit exceeded. Please try again in a minute.");
    }

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch price for ${symbol} (ID: ${id})`);
    }

    const data = await response.json();
    const coinData = data[id];

    if (!coinData) {
      console.error(`Coin not found in response: ${id}. Available:`, Object.keys(data));
      return null;
    }

    const result = {
      symbol: symbol.toUpperCase(),
      name: id,
      price: coinData.usd,
      priceChange24h: coinData.usd_24h_change || 0,
      priceChangePercent24h: coinData.usd_24h_change || 0,
    };

    // Update cache
    priceCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Get historical prices for a cryptocurrency
 * @param symbol - Crypto symbol (e.g., "btc", "eth")
 * @param days - Number of days of history (max 365)
 * @param timeframe - Timeframe: "hourly", "daily", "weekly"
 * @returns Array of prices
 */
export async function getHistoricalPrices(
  symbol: string,
  days: number = 90,
  timeframe: "hourly" | "daily" | "weekly" = "daily"
): Promise<number[]> {
  try {
    const id = symbolToId(symbol);
    
    // Adjust days based on timeframe
    // CoinGecko auto-detects interval: hourly for days<=1, daily for days>1
    let apiDays = days;
    
    if (timeframe === "hourly") {
      apiDays = 1; // CoinGecko only provides hourly for <= 1 day
    } else if (timeframe === "weekly") {
      apiDays = Math.min(days, 365); // Max 365 days
    } else {
      // daily
      apiDays = Math.min(days, 365);
    }
    
    const cacheKey = `history_${id}_${apiDays}_${timeframe}`;
    
    // Check cache
    const cached = historyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < HISTORY_CACHE_TTL) {
      return cached.data;
    }

    const apiKey = getApiKey();
    const headers: HeadersInit = {};
    
    // Add API key header if available
    if (apiKey) {
      headers["x-cg-demo-api-key"] = apiKey;
    }

    // CoinGecko auto-detects interval based on days parameter
    // Don't pass interval parameter - it's not needed and may cause 401 errors
    const response = await fetch(
      `${COINGECKO_API}/coins/${id}/market_chart?vs_currency=usd&days=${apiDays}`,
      {
        cache: "no-store",
        headers,
      }
    );

    if (response.status === 429) {
      console.warn(`Rate limit exceeded for ${symbol} history. Please wait before retrying.`);
      // Return cached data if available, even if expired
      if (cached) {
        return cached.data;
      }
      throw new Error("Rate limit exceeded. Please try again in a minute.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`, errorText);
      
      // If 401, it might be API key issue - try without API key for free tier
      if (response.status === 401 && apiKey) {
        console.warn("API key authentication failed, retrying without API key (free tier)");
        const retryResponse = await fetch(
          `${COINGECKO_API}/coins/${id}/market_chart?vs_currency=usd&days=${apiDays}`,
          {
            cache: "no-store",
          }
        );
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          const retryPrices = retryData.prices as [number, number][];
          if (retryPrices && retryPrices.length > 0) {
            let result = retryPrices.map(([, price]) => price);
            if (timeframe === "weekly") {
              const weeklyData: number[] = [];
              for (let i = 0; i < result.length; i += 7) {
                weeklyData.push(result[i]);
              }
              result = weeklyData;
            }
            historyCache.set(cacheKey, { data: result, timestamp: Date.now() });
            return result;
          }
        }
      }
      
      throw new Error(`Failed to fetch historical data for ${symbol} (ID: ${id}): ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const prices = data.prices as [number, number][];

    if (!prices || prices.length === 0) {
      console.error(`No price data returned for ${id}`);
      return [];
    }

    // Extract prices (CoinGecko returns [timestamp, price] pairs)
    let result = prices.map(([, price]) => price);

    // Filter for weekly timeframe (take every 7th data point)
    if (timeframe === "weekly") {
      const weeklyData: number[] = [];
      for (let i = 0; i < result.length; i += 7) {
        weeklyData.push(result[i]);
      }
      result = weeklyData;
    }

    // Update cache
    historyCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
}

/**
 * Search for cryptocurrency by symbol or name
 */
export async function searchCrypto(query: string): Promise<Array<{ id: string; symbol: string; name: string }>> {
  try {
    const apiKey = getApiKey();
    const headers: HeadersInit = {};
    
    // Add API key header if available
    if (apiKey) {
      headers["x-cg-demo-api-key"] = apiKey;
    }

    const response = await fetch(
      `${COINGECKO_API}/search?query=${encodeURIComponent(query)}`,
      {
        cache: "no-store",
        headers,
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.coins || []).slice(0, 10).map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
    }));
  } catch (error) {
    console.error("Error searching crypto:", error);
    return [];
  }
}

/**
 * Get multiple current prices at once
 */
export async function getMultiplePrices(
  symbols: string[]
): Promise<Map<string, CryptoPrice>> {
  const results = new Map<string, CryptoPrice>();
  
  // CoinGecko allows multiple IDs in one request
  const ids = symbols.map(s => symbolToId(s)).join(",");
  
  try {
    const apiKey = getApiKey();
    const headers: HeadersInit = {};
    
    // Add API key header if available
    if (apiKey) {
      headers["x-cg-demo-api-key"] = apiKey;
    }

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      {
        cache: "no-store",
        headers,
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      throw new Error("Failed to fetch prices");
    }

    const data = await response.json();
    
    symbols.forEach(symbol => {
      const id = symbolToId(symbol);
      const coinData = data[id];
      if (coinData) {
        results.set(symbol.toUpperCase(), {
          symbol: symbol.toUpperCase(),
          name: id,
          price: coinData.usd,
          priceChange24h: coinData.usd_24h_change || 0,
          priceChangePercent24h: coinData.usd_24h_change || 0,
        });
      }
    });
  } catch (error) {
    console.error("Error fetching multiple prices:", error);
  }

  return results;
}

