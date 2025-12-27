# API Rate Limits

## CoinGecko API (Free Tier)

**Rate Limit**: **5-15 calls per minute** (varies based on global usage)
- Public API (no key): 5-15 calls/min
- Demo Account (free registration): 30 calls/min
- Paid plans: 500-1,000+ calls/min

**What happens when exceeded**: Returns `429 Too Many Requests` error

**Current Usage**:
- Fetch price: 1 call per asset
- Fetch history: 1 call per asset
- Fetch both prices: 2 calls
- Fetch both histories: 2 calls

**Recommendations**:
- ✅ Cache prices for 60 seconds (already implemented)
- ✅ Cache historical data for 1 hour (already implemented)
- ⚠️ Add rate limiting to prevent too many requests
- 💡 Consider registering for free demo account (30 calls/min)

---

## Binance Futures API (Public Endpoints)

**Rate Limit**: **1,200 requests per minute** per IP
- Weight-based limits for different endpoints
- Open Interest: 5 weight units
- Funding Rate: 1 weight unit

**What happens when exceeded**: Returns `429` error with retry-after header

**Current Usage** (if using real FOILS):
- Fetch Open Interest: ~5 weight units
- Fetch Funding Rate: ~1 weight unit
- Very generous limits for normal use

---

## Current Implementation

### Caching Strategy

**CoinGecko**:
- Prices: `cache: "no-store"` (no caching currently)
- Historical: `cache: "no-store"` (no caching currently)

**Issues**:
- ❌ No client-side caching
- ❌ No rate limit handling
- ❌ Could hit 429 errors with frequent use

### Recommendations

1. **Add client-side caching**:
   - Cache prices for 60 seconds
   - Cache historical data for 1 hour
   - Store in localStorage or memory

2. **Add rate limiting**:
   - Track API calls per minute
   - Queue requests if limit reached
   - Show user-friendly error messages

3. **Register for CoinGecko Demo** (free):
   - Get stable 30 calls/min
   - Just need to sign up (no payment)

4. **Add retry logic**:
   - Handle 429 errors gracefully
   - Retry after delay

---

## Example Usage Limits

**Typical user session**:
- Fetch 2 prices: 2 calls
- Fetch 2 histories (90 days): 2 calls
- **Total: 4 calls** ✅ Well within limits

**Heavy usage** (multiple pairs):
- 5 pairs × 2 calls each = 10 calls ✅ Still OK
- 10 pairs × 2 calls each = 20 calls ⚠️ Might hit limit

**Solution**: Add caching so repeated requests don't hit API

