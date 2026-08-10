# Wallet

All your savings in one place: how much you have, where it sits, and in which currencies.

```bash
npm install
npm run dev     # http://localhost:3000
```

## Features

- **Total balance** in USD, with the hryvnia equivalent underneath.
- **Three views** of the same data: by account (Monobank, Binance, WhiteBIT, cash…),
  by currency (UAH, USD, USDT, BTC…), and by type (banks / crypto / cash).
- **Donut chart** — tap a segment to see the share and amount of that category.
- **History**: a snapshot of the total is stored once a day, which drives the monthly
  change and the chart.
- **Manual rates** — the arrows icon in the header. For hryvnia the field asks
  "1 USD = ? UAH", for expensive currencies "1 BTC = ? USD".
- **Hide amounts** — the eye icon, handy when someone is looking at your screen.
- **JSON export / import** in settings.

## Data

Everything lives in this browser's `localStorage` (key `wallet.state.v1`) — nothing is sent
to a server. Clearing site data wipes your assets too, which is why settings include an
export to file.

On first run the app seeds demo assets so you can see what it looks like when filled in.
"Clear all" in settings removes them.

## Structure

| Path | What's inside |
| --- | --- |
| `src/lib/types.ts` | Models: `Asset`, `Category`, `Rates`, `WalletState` |
| `src/lib/defaults.ts` | Currencies, starting categories, default rates, demo data |
| `src/lib/compute.ts` | USD conversion, grouping, history, change over a period |
| `src/lib/useWallet.ts` | State + autosave to `localStorage` |
| `src/lib/storage.ts` | Read/write, export, import |
| `src/components/` | Bottom sheet, chart, sparkline, forms |
| `src/app/page.tsx` | Main screen |

## Mobile

The layout is mobile-first: a single column up to `lg`, then a sticky left column with the
total and the chart, and the account list on the right. `safe-area-inset` is handled on
iPhone, forms open from the bottom as a bottom sheet, every interactive element is at least
44px, and inputs use `font-size: 16px` so iOS doesn't zoom the page on focus.
