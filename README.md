# PairLab - Delta-Neutral Pair Trading Analytics

A Next.js 14+ app for analyzing crypto pairs and calculating delta-neutral positions for airdrop farming on perpetual DEXes.

## Features

- **Delta-Neutral Position Calculator**: Calculate optimal position sizes for long/short pairs (e.g., BTC short + ETH long)
- **Spread Analysis**: Z-score, correlation, beta calculations for pair trading
- **Live Price Data**: Fetch current prices and historical data from CoinGecko API (free tier)
- **Multiple Timeframes**: Hourly, Daily, or Weekly analysis
- **FOILS Indicator**: Market sentiment analysis (Funding, Open Interest, Long/Short Ratio)
- **Risk Management**: Stop loss, take profit, and exit rules based on spread levels
- **Save & Review**: Save analyses and review them later (requires login)
- **Airdrop Farming Focus**: Optimized for maintaining delta-neutral positions while farming airdrops

## Quick Start

### 1. Prerequisites

- Node.js 18+ 
- Supabase account (free tier works)
- CoinGecko API key (optional, free tier available)

### 2. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd delta

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# CoinGecko API (optional - works without it, but rate limits apply)
NEXT_PUBLIC_COINGECKO_API_KEY=your_coingecko_api_key
```

Get your Supabase credentials from [your Supabase project settings](https://supabase.com/dashboard/project/_/settings/api)

Get a CoinGecko API key from [CoinGecko API](https://www.coingecko.com/en/api) (free tier: 30 calls/min)

### 4. Database Setup

Run the Supabase migration to create the analyses table:

```bash
# Using Supabase CLI (recommended)
supabase db push

# Or manually run the SQL in supabase/migrations/001_create_analyses_table.sql
# via the Supabase dashboard SQL editor
```

See `MIGRATION_GUIDE.md` for detailed instructions.

### 5. Run the App

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## How to Use

### Basic Workflow

1. **Enter Asset Symbols**: Input CoinGecko symbols (e.g., `btc`, `eth`, `sol`)
2. **Fetch Live Prices**: Click "Fetch Live Prices" to get current market prices
3. **Select Timeframe**: Choose Hourly, Daily, or Weekly from the dropdown
4. **Fetch Historical Data**: Click "Fetch 30 Days" or "Fetch 90 Days" to get price history
5. **Configure Parameters**: Set portfolio size, risk %, leverage cap, etc.
6. **Run Analysis**: Click "Run Analysis" to calculate positions
7. **Open Positions**: Use the calculated positions to open trades on your perp DEX

### Understanding the Results

**Analysis Summary:**
- **Z-Score**: How far the spread is from its mean (higher = more deviation)
- **Signal**: SHORT A / LONG B or LONG A / SHORT B (or NO SIGNAL)
- **Correlation**: How closely the assets move together (0.7+ is good for pairs)

**Positions to Open:**
- Two positions shown: Asset A and Asset B
- Each shows: Direction (LONG/SHORT), Size (USD), Units, Leverage
- Use the same leverage for both positions on your DEX

**When to Close:**
- **Close for profit**: When spread reaches target (returns to mean)
- **Time limit**: After max holding days or when airdrop requirements met
- **Emergency exit**: If spread moves too far against you (stop loss)

### Timeframes

- **Hourly**: For very short-term trades (hours to days) - fetches 1 day of hourly data
- **Daily**: For short to medium-term trades (days to weeks) - fetches 30-90 days
- **Weekly**: For longer-term analysis - fetches up to 365 days, filtered to weekly

**Recommended for airdrop farming**: Daily timeframe with 90 days of data

### Key Concepts

**Spread**: The difference between Asset A price and (Beta × Asset B price). This is what you're trading, not individual prices.

**Delta-Neutral**: Positions hedge each other - if both assets move together, you break even. You profit from relative outperformance.

**Beta**: Measures how much Asset A moves relative to Asset B. Used to size positions correctly.

**Z-Score**: Standardized measure of how far the spread is from its historical mean. Higher Z-score = stronger signal.

## API Rate Limits

**CoinGecko Free Tier:**
- Without API key: ~10-50 calls/minute (varies)
- With API key: 30 calls/minute
- Historical data: Cached for 5 minutes to reduce calls

**Binance Futures** (for real FOILS data - optional):
- 1200 requests per minute
- See `API_RATE_LIMITS.md` for details

## Project Structure

```
delta/
├── app/
│   ├── api/crypto/          # API routes for crypto data
│   ├── dashboard/           # Main calculator page
│   └── analysis/[id]/       # View saved analysis
├── components/
│   ├── dashboard-client.tsx # Main calculator UI
│   ├── analysis-view.tsx    # Saved analysis viewer
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── pair-trading-math.ts # Core calculations
│   ├── crypto-api.ts        # CoinGecko integration
│   ├── foils-indicator.ts   # FOILS calculation
│   └── foils-real-data.ts   # Binance FOILS (optional)
└── supabase/
    └── migrations/          # Database migrations
```

## Tech Stack

- **Next.js 14+** (App Router)
- **Supabase** (Auth, Database, RLS)
- **Tailwind CSS** (Styling)
- **shadcn/ui** (UI Components)
- **CoinGecko API** (Price data)
- **TypeScript** (Type safety)

## Documentation

- `MIGRATION_GUIDE.md` - Database setup instructions
- `FEATURES.md` - Detailed feature list
- `API_RATE_LIMITS.md` - API rate limit information
- `ENV_SETUP.md` - Environment variable setup

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
