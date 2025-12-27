# FOILS Data Sources Explained

## Current Implementation (Calculated/Proxy)

**FOILS is currently calculated locally** using proxies from available data. It does NOT fetch real futures market data.

### What Data Sources Are Used:

1. **Open Interest (OI)** - Estimated from:
   - Price momentum (24h price change %)
   - Volatility (spread standard deviation)
   - Logic: Rising prices + high volatility = increasing OI

2. **Funding Rate (FR)** - Estimated from:
   - Spread Z-score
   - Logic: High positive Z = high funding (bearish for longs)

3. **Long/Short Ratio (L/S)** - Estimated from:
   - Correlation between assets
   - Spread deviation
   - Logic: High correlation + extreme spread = imbalanced positioning

### Limitations:

- ❌ Not real futures market data
- ❌ Uses proxies/estimates
- ✅ Works with free APIs (CoinGecko)
- ✅ No API keys required
- ✅ Always available

---

## Real FOILS Data Option (New)

I've added infrastructure to fetch **real FOILS data** from Binance Futures API.

### What's Available:

1. **Real Open Interest** ✅
   - Actual futures open interest from Binance
   - Shows total value of open positions

2. **Real Funding Rate** ✅
   - Actual funding rate (what longs pay shorts)
   - Updates every 8 hours
   - Positive = longs pay shorts
   - Negative = shorts pay longs

3. **Long/Short Ratio** ⚠️
   - Not available from Binance public API
   - Would need:
     - Account API (requires API key, not recommended client-side)
     - Third-party service (CryptoQuant, Glassnode)
     - Order book analysis (complex)

### How to Use Real Data:

The code is ready, but you need to:

1. **Update the dashboard** to call `/api/foils/real?symbol=BTC&spreadZScore=1.5`
2. **Handle symbol conversion**: "BTC" → "BTCUSDT" for Binance
3. **Add error handling** for when Binance data isn't available

### API Endpoints:

- **Real FOILS**: `/api/foils/real?symbol=BTC&spreadZScore=1.5`
- **Current (calculated)**: Uses `calculateFOILS()` function

---

## Comparison

| Feature | Calculated (Current) | Real Data (New) |
|---------|---------------------|-----------------|
| Open Interest | Proxy from price action | ✅ Real from Binance |
| Funding Rate | Proxy from Z-score | ✅ Real from Binance |
| Long/Short Ratio | Proxy from correlation | ⚠️ Not available (fallback) |
| API Key Required | ❌ No | ❌ No (public data) |
| Rate Limits | CoinGecko limits | Binance limits |
| Availability | Always works | Depends on Binance API |

---

## Recommendation

**For now**: Keep using calculated FOILS (current implementation)
- Works reliably
- No external dependencies
- Good enough for pair trading analysis

**For production**: Consider integrating real data
- More accurate for futures trading
- Better for professional traders
- Requires handling multiple exchanges
- May need API keys for higher limits

---

## Code Location

- **Calculated FOILS**: `lib/foils-indicator.ts`
- **Real FOILS**: `lib/foils-real-data.ts`
- **API Route**: `app/api/foils/real/route.ts`
- **Usage**: `components/dashboard-client.tsx` (line ~210)

