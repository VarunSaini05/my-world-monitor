# Live Market Data Setup Guide

WorldMonitor comes with live stocks, crypto, commodities, and derivatives data out of the box. This guide explains what's available and how to set it up.

## ✅ What Works Without API Keys (Free)

### Stocks & Indices
- **Yahoo Finance** - Real-time stock quotes, indices (S&P 500, NASDAQ, VIX), ETFs
- Live price updates for 29+ stock exchanges globally
- Sector ETF flows and performance tracking

### Cryptocurrencies
- **CoinGecko Public API** - Bitcoin, Ethereum, major altcoins
- Real-time crypto market data (price, volume, market cap)
- DeFi token data (Aave, Curve, Lido, etc.)
- AI token sector tracking
- Fear & Greed Index

### Commodities
- **Yahoo Finance** - Oil (WTI/Brent), Natural Gas, Gold, Silver
- Futures prices (next month, quarterly, yearly contracts)
- Real-time quotes for global commodity markets

### Specialized Markets
- **Earnings Calendar** - Upcoming corporate earnings
- **COT Positioning** - Commodity Futures positioning
- **Insider Transactions** - SEC filings
- **Stablecoin Health** - Peg monitoring (USDC, USDT, DAI)
- **Market Breadth** - Advance/decline ratios

## 🔑 Optional: Enhance With Free API Keys

### Finnhub (Recommended for Stocks)
More reliable stock data and additional metrics.

1. Register for free tier: https://finnhub.io/
2. Copy your API key from the dashboard
3. For local development: Create `.env.local`
   ```bash
   FINNHUB_API_KEY=your_api_key_here
   ```
4. For Render deployment: Add environment variable in Render dashboard
   - Go to your service settings
   - Add: `FINNHUB_API_KEY=your_api_key_here`
   - Redeploy

### CoinGecko (Optional for Better Crypto Data)
Better rate limits and more comprehensive crypto coverage.

1. Register for free tier: https://www.coingecko.com/en/api
2. Copy your API key
3. Add to `.env.local` or Render environment:
   ```bash
   COINGECKO_API_KEY=your_api_key_here
   ```

### Alpha Vantage (Optional Stock Fallback)
Useful as a backup source for stocks.

1. Register for free tier: https://www.alphavantage.co/
2. Copy your API key
3. Add to `.env.local` or Render environment:
   ```bash
   ALPHA_VANTAGE_API_KEY=your_api_key_here
   ```

## 📊 Data Freshness in Deployment

### Local Development (`npm run dev`)
- Stock prices: Real-time (streaming)
- Crypto: Updated every 30 seconds
- Commodities: Real-time
- Cache: 5 minutes for most data

### Render Deployment (Free Tier)
The app uses Redis-compatible caching via the fallback cache system:
- Stock prices: Every 1-5 minutes (depends on activity)
- Crypto: Every 5-10 minutes
- Commodities: Every 5-10 minutes
- Fallback to seed data if sources are temporarily unavailable

⚠️ **Note**: Render's free tier may spin down during inactivity. See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for info on upgrading to a persistent plan.

## 🧪 Testing Live Market Data

### Local Development
1. Run `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000)
3. Look for panels: Finance Radar, Markets, Crypto, Commodities
4. Data should update automatically

### Render Deployment
1. Visit your live deployment
2. Check the Finance Radar panel for real-time data
3. If data is missing, check:
   - **Health**: https://your-app.onrender.com/api/health
   - **Logs**: Render dashboard → Logs tab

## 🔧 Troubleshooting

### No market data showing
- **Free tier rate limits hit**: Wait 1 hour, limits reset daily
- **Render free tier spun down**: Upgrade to Pro plan or increase activity
- **Missing API key**: If Finnhub key is set, data will still work via Yahoo Finance fallback

### Data is stale
- Render free tier may have long cache TTLs
- Upgrade to Pro plan for more frequent updates
- Or add `FINNHUB_API_KEY` for better coverage

### Crypto data incomplete
- CoinGecko free tier has lower limits
- Add `COINGECKO_API_KEY` for full coverage
- Bitcoin and Ethereum always work (no key needed)

## 📈 Market Data Panels in App

Available in full variant:
- **Finance Radar** - Stock indices, sectors, commodities at a glance
- **Markets** - Detailed stock and commodity quotes
- **Crypto** - Crypto market overview, sectors, DeFi
- **Daily Market Brief** - AI-synthesized market summary
- **Earnings Calendar** - Upcoming corporate events

## 🚀 Next Steps

1. **Local Testing** (no setup needed):
   ```bash
   npm ci
   npm run dev
   ```

2. **Render Deployment** (no setup needed, works with free tiers):
   - Market data will work automatically
   - Optionally add API keys for better reliability

3. **Optional API Keys** (for better experience):
   - Register at Finnhub, CoinGecko, Alpha Vantage
   - Add to Render environment variables
   - Redeploy

All market data sources provide real-time updates. The system automatically falls back gracefully if a source is unavailable.
