# Deriverse Trading Analytics Dashboard

> **Submission for [Superteam Bounty: Design Trading Analytics Dashboard with Journal & Portfolio Analysis](https://superteam.fun/earn/listing/design-trading-analytics-dashboard-with-journal-and-portfolio-analysis)** by Deriverse

A production-ready trading analytics dashboard built for [Deriverse](https://deriverse.gitbook.io/deriverse-v1) — the fully on-chain Solana DEX supporting Spot and Perpetual Futures markets. Parses **real on-chain Deriverse trades** from Solana mainnet using the `@deriverse/kit` SDK, and provides a comprehensive analytics suite with journal and portfolio analysis.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app loads in **Demo mode** with 200 realistic mock trades — no wallet needed.

### View Real On-Chain Data

1. Click **Lookup** in the header
2. Paste a Deriverse trader address (e.g. `FzzkRifeTpLAcgS52SnHeFbHmeYqscyPaiNADBrckEJu`)
3. Click **Load** — real trades are fetched from Solana mainnet via the server-side API route

Or connect a **Phantom / Solflare** wallet — if the wallet has Deriverse trades, they load automatically.

---

## How It Works — On-Chain Integration

The dashboard reads **real Deriverse trading data directly from Solana mainnet**:

1. **Server-side API route** (`/api/trades`) fetches transaction signatures for any wallet address
2. For each transaction, it checks if the Deriverse program (`DRVSpZ2YUYYKgZP8XtLhAGtT1zYSCKzeHfb4DgRnrgqD`) was invoked
3. Decodes `Program data:` log messages using `@deriverse/kit` models:
   - `SpotFillOrderReportModel` — spot trade fills (price, qty, side, PnL)
   - `PerpFillOrderReportModel` — perpetual futures fills
   - `SpotFeesReportModel` / `PerpFeesReportModel` — taker fees & maker rebates
   - `PerpFundingReportModel` — funding rate payments
4. Values are scaled from Deriverse's 1e9 decimal precision to human-readable USD amounts
5. Results are **cached server-side** (5-min TTL) to avoid repeated RPC calls

```
Browser → /api/trades?wallet=<address> → Solana Mainnet RPC → Decode @deriverse/kit logs → JSON response
```

### Key Files for On-Chain Integration

| File | Purpose |
|---|---|
| `src/app/api/trades/route.ts` | Next.js API route — fetches & decodes Deriverse trades server-side |
| `src/lib/deriverse/tx-parser.ts` | Transaction log parser using `@deriverse/kit` models |
| `src/lib/deriverse/engine.ts` | SDK Engine wrapper for wallet connection & position queries |
| `src/store/use-trading-store.ts` | Zustand store — manages demo/live mode switching |

---

## Features

### 1. Dashboard — 15+ Analytics Metrics

| Metric | Description |
|---|---|
| Total PnL | Cumulative profit/loss with trend indicator |
| Win Rate | Percentage with circular SVG gauge |
| Volume & Fees | Total traded volume + fee breakdown |
| Long/Short Ratio | Directional bias with percentage split |
| Avg Duration | Mean trade holding time |
| Profit Factor | Gross profit / gross loss ratio |
| Expectancy | Average expected return per trade |
| Max Drawdown | Peak-to-trough equity decline |
| Win/Loss Streaks | Current and max consecutive wins/losses |
| Sharpe Ratio | Risk-adjusted return (annualized) |
| Sortino Ratio | Downside-risk-adjusted return (annualized) |

**Charts & Visualizations:**
- **Equity Curve** — cumulative PnL with drawdown overlay (3 chart tabs)
- **Daily PnL Heatmap** — 3-month calendar colored by daily performance
- **Session Performance** — Asian / European / US session breakdown
- **Hourly Performance** — time-of-day PnL bar chart (UTC)
- **Order Type Comparison** — limit vs market vs IOC
- **Symbol Breakdown** — per-instrument stats with sparklines
- **Monthly Returns Table** — color-coded monthly PnL grid
- **PnL Distribution** — histogram of trade outcomes
- **Risk Score** — composite 5-factor metric (0–100)
- **Pattern Detection** — auto-detects 7 behavioral patterns

**Filters:**
- Symbol selector (multi-market)
- Date range picker
- Market type (spot / perp)
- Side (long / short)

### 2. Trading Journal

- **Sortable trade table** — date, symbol, side, PnL, size, fees, duration
- **Trade detail dialog** — full breakdown with mini price chart replay
- **Annotation system** — notes, tags (breakout, reversal, scalp, mistake, etc.), star ratings
- **Search & filter** — by symbol, side, tags, winners/losers
- **CSV export** — all trade data + annotations
- **Solana Explorer links** — click any trade to view the on-chain transaction

### 3. Portfolio Analysis

- **Open positions table** — with unrealized PnL
- **Asset allocation** — donut chart of portfolio distribution
- **Margin utilization** — usage bar for perpetual positions
- **Funding payment tracker** — received / paid / net with cumulative chart
- **Fee composition** — taker fees, maker rebates, funding costs breakdown
- **Cumulative fee chart** — fee trends over time

### 4. Wallet Lookup

- **Look up any wallet** — paste any Solana address to view their Deriverse trading history
- **No wallet connection required** — works as a read-only analytics viewer
- **Demo / Live toggle** — switch between mock data and real on-chain data

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | TailwindCSS v4 + shadcn/ui |
| Charts | Recharts |
| Icons | Lucide React |
| State | Zustand |
| Date Handling | date-fns |
| Blockchain SDK | `@deriverse/kit` (log models, program constants) |
| Solana RPC | `@solana/web3.js` (transaction fetching & decoding) |
| Wallet Adapter | `@solana/wallet-adapter-react` (Phantom, Solflare) |

---

## Project Structure

```
src/
├── app/
│   ├── api/trades/route.ts        # Server-side API: fetch & decode Deriverse trades
│   ├── page.tsx                   # Dashboard page (15+ metrics)
│   ├── journal/page.tsx           # Trading journal
│   ├── portfolio/page.tsx         # Portfolio analysis
│   ├── layout.tsx                 # Root layout with sidebar
│   └── providers.tsx              # Theme, wallet, tooltip providers
├── components/
│   ├── layout/                    # Sidebar, header, wallet-provider, error-boundary
│   ├── dashboard/                 # 11 components
│   │   ├── stat-cards.tsx         # KPI stat cards (PnL, win rate, Sharpe, etc.)
│   │   ├── pnl-chart.tsx         # Equity curve + drawdown overlay
│   │   ├── daily-heatmap.tsx     # 3-month calendar heatmap
│   │   ├── session-charts.tsx    # Session, hourly, order type, long/short charts
│   │   ├── win-rate-gauge.tsx    # Circular SVG gauge
│   │   ├── risk-score.tsx        # Composite risk score card
│   │   ├── patterns-alert.tsx    # Auto-detected trading patterns
│   │   ├── symbol-breakdown.tsx  # Per-symbol performance table
│   │   ├── monthly-returns.tsx   # Monthly returns grid
│   │   ├── pnl-distribution.tsx  # PnL histogram
│   │   └── filters.tsx           # Symbol, date, market, side filters
│   ├── journal/                   # Trade table + trade replay
│   └── portfolio/                 # Positions table + portfolio charts
├── lib/
│   ├── analytics.ts               # 20+ analytics functions
│   ├── mock-data.ts               # Seeded deterministic mock data generator
│   └── deriverse/
│       ├── engine.ts              # SDK Engine wrapper
│       └── tx-parser.ts           # On-chain transaction log parser
├── store/
│   └── use-trading-store.ts       # Zustand store (demo + live modes)
└── types/
    └── index.ts                   # TypeScript interfaces
```

---

## Environment Variables (Optional)

```env
# Override RPC endpoint (default: devnet for live data)
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com

# Deriverse SDK configuration (optional — for Engine connection)
NEXT_PUBLIC_DERIVERSE_PROGRAM_ID=DRVSpZ2YUYYKgZP8XtLhAGtT1zYSCKzeHfb4DgRnrgqD
NEXT_PUBLIC_DERIVERSE_VERSION=1
```

The API route (`/api/trades`) always uses **Solana mainnet** for fetching Deriverse trades, regardless of the `NEXT_PUBLIC_RPC_URL` setting.

---

## Architecture Decisions

- **Server-side RPC calls** — the `/api/trades` route fetches on-chain data server-side to avoid browser CORS issues and RPC rate limits
- **In-memory caching** — 5-minute TTL cache prevents redundant RPC calls for the same wallet
- **Rate-limit handling** — 250ms delay between `getTransaction` calls to stay within public RPC limits
- **Graceful degradation** — if live data fails, the app stays in live mode with empty state (no silent fallback to demo)
- **Log-based parsing** — Deriverse emits trade events via `Program data:` log messages (not `returnData`), decoded using `@deriverse/kit` models
- **Decimal scaling** — all Deriverse values use 1e9 precision, scaled to human-readable USD in the parser

---

## Security

- **No private keys handled** — wallet adapter uses standard Solana wallet signing
- **Read-only data access** — only fetches public transaction data from the blockchain
- **Journal annotations** stored in browser localStorage only
- **No external APIs** — all data comes directly from Solana RPC
- **Graceful error handling** — SDK errors never crash the app

---

## License

MIT
