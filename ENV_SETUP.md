# Environment Variables Setup

## Required Environment Variables

### CoinGecko API Key

Add your CoinGecko API key to your `.env.local` file:

```bash
NEXT_PUBLIC_COINGECKO_API_KEY=CG-ckm4vTWYm6Apapxk8eoCHG7N
```

**Important Notes:**
- The `NEXT_PUBLIC_` prefix makes it available on the client-side
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Restart your dev server after adding the key

### Supabase Variables (Already Configured)

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

## Setup Steps

1. **Create `.env.local` file** in the project root (if it doesn't exist)

2. **Add your CoinGecko API key**:
   ```bash
   echo "NEXT_PUBLIC_COINGECKO_API_KEY=CG-ckm4vTWYm6Apapxk8eoCHG7N" >> .env.local
   ```

3. **Restart your development server**:
   ```bash
   npm run dev
   ```

## Benefits of Using API Key

- ✅ **Higher rate limits**: 30 calls/min (demo) vs 5-15 calls/min (public)
- ✅ **More reliable**: Less likely to hit rate limits
- ✅ **Better performance**: Stable rate limits regardless of global usage

## Verification

After adding the key, you should see:
- No rate limit errors
- Faster API responses
- More reliable data fetching

The app will automatically use the API key if it's available, and fall back to public API if not.

