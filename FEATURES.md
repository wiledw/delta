# PairLab - New Features

## 🚀 Enhanced User Experience

### 1. **Free Live Price Data (CoinGecko API)**
- **No API key required** - Uses CoinGecko's free public API
- **Rate limit**: ~10-50 calls per minute (more than enough for normal use)
- **Features**:
  - Fetch current prices for any cryptocurrency
  - View 24h price change percentage
  - Auto-populate price fields with live market data

**How to use:**
1. Enter a CoinGecko symbol (e.g., `btc`, `eth`, `sol`, `xrp`, `bnb`, `doge`)
2. Click the refresh icon next to the price field, or
3. Click "Fetch Live Prices" button to fetch both assets at once

### 2. **Automatic Historical Data Fetching**
- Fetch 30 or 90 days of historical price data automatically
- No manual data entry required
- Data points are automatically formatted and ready for analysis

**How to use:**
1. Enter asset symbols
2. Click "30d" or "90d" buttons next to historical data fields, or
3. Click "Fetch 30 Days History" or "Fetch 90 Days History" to fetch both assets

### 3. **FOILS Indicator Integration**
FOILS (Funding, Open Interest, Long/Short Ratio) is a comprehensive market sentiment indicator that combines:
- **Open Interest (OI)**: Tracks market participation and positioning
- **Funding Rate (FR)**: Indicates cost of holding positions
- **Long/Short Ratio (L/S)**: Shows market positioning bias

**How it works:**
- Calculated automatically when you run an analysis with live price data
- Uses price action and spread analysis as proxies for futures market data
- Provides overall sentiment: Bullish, Neutral, or Bearish
- Includes confidence score (0-100%)

**Display:**
- Shows individual indicators (OI, FR, L/S) and overall sentiment
- Color-coded badges for easy interpretation
- Appears in both dashboard results and saved analysis views

### 4. **Improved UX Features**
- **Quick Start Guide**: Info card at the top explaining how to use the app
- **Data point counter**: Shows how many data points you have loaded
- **24h price change display**: Shows price movement next to current prices
- **Loading states**: Visual feedback when fetching data
- **Helper text**: Guidance on using CoinGecko symbols

## 📊 Supported Cryptocurrencies

Any cryptocurrency available on CoinGecko can be analyzed. Common examples:
- `btc` - Bitcoin
- `eth` - Ethereum
- `sol` - Solana
- `xrp` - Ripple
- `bnb` - Binance Coin
- `doge` - Dogecoin
- `ada` - Cardano
- `matic` - Polygon
- And 10,000+ more...

## 🔧 Technical Details

### API Endpoints
- `/api/crypto/price?symbol=btc` - Get current price
- `/api/crypto/history?symbol=btc&days=90` - Get historical prices
- `/api/crypto/search?q=bitcoin` - Search for cryptocurrencies

### Data Sources
- **CoinGecko API**: Free, no authentication required
- **Caching**: Prices cached for 60 seconds, historical data for 1 hour
- **Error handling**: Graceful fallbacks if API is unavailable

### FOILS Calculation
The FOILS indicator uses:
- Price momentum and volatility (as proxy for Open Interest)
- Spread Z-score (as proxy for Funding Rate)
- Correlation and spread deviation (as proxy for Long/Short Ratio)

Note: This is a simplified implementation using available spot market data. For production trading, consider integrating with futures exchange APIs for actual OI, FR, and L/S data.

## 🎯 Workflow Example

1. **Enter symbols**: `btc` and `eth`
2. **Fetch live prices**: Click "Fetch Live Prices" → Prices auto-filled
3. **Fetch historical data**: Click "Fetch 90 Days History" → Historical data auto-filled
4. **Run analysis**: Click "Run Analysis" → Get spread, Z-score, positions, and FOILS indicator
5. **Review results**: Check FOILS indicator for market sentiment
6. **Save analysis**: (if logged in) Click "Save Analysis" to store for later

## 💡 Tips

- Use lowercase CoinGecko symbols (e.g., `btc` not `BTC`)
- Fetch historical data before running analysis
- FOILS indicator only appears when you've fetched live prices
- 90 days of data provides better statistical analysis than 30 days
- You can still manually enter prices and historical data if preferred

