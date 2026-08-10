import type { Asset, Category, Rates, WalletState } from "./types";

export const STORAGE_KEY = "wallet.state.v1";
export const STATE_VERSION = 1;

export const CURRENCIES: { code: string; label: string; decimals: number }[] = [
  { code: "UAH", label: "Гривня", decimals: 2 },
  { code: "USD", label: "Долар", decimals: 2 },
  { code: "EUR", label: "Євро", decimals: 2 },
  { code: "USDT", label: "Tether", decimals: 2 },
  { code: "BTC", label: "Bitcoin", decimals: 8 },
  { code: "ETH", label: "Ethereum", decimals: 6 },
  { code: "SOL", label: "Solana", decimals: 4 },
  { code: "TON", label: "Toncoin", decimals: 4 },
  { code: "PLN", label: "Злотий", decimals: 2 },
];

/** Скільки USD коштує 1 одиниця валюти. */
export const DEFAULT_RATES: Rates = {
  USD: 1,
  USDT: 1,
  UAH: 1 / 41.5,
  EUR: 1.08,
  PLN: 0.25,
  BTC: 65000,
  ETH: 3200,
  SOL: 150,
  TON: 5,
};

export const PALETTE = [
  "#facc15",
  "#f0b90b",
  "#22d3ee",
  "#4ade80",
  "#a78bfa",
  "#fb7185",
  "#38bdf8",
  "#fb923c",
  "#e879f9",
  "#2dd4bf",
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "mono", name: "Монобанк", kind: "bank", color: "#facc15", emoji: "🐱" },
  { id: "binance", name: "Binance", kind: "crypto", color: "#f0b90b", emoji: "🅑" },
  { id: "whitebit", name: "WhiteBIT", kind: "crypto", color: "#22d3ee", emoji: "⬦" },
  { id: "cash", name: "Готівка", kind: "cash", color: "#4ade80", emoji: "💵" },
  { id: "privat", name: "ПриватБанк", kind: "bank", color: "#a78bfa", emoji: "🏦" },
  { id: "other", name: "Інше", kind: "other", color: "#94a3b8", emoji: "📦" },
];

const now = Date.now();

export const DEMO_ASSETS: Asset[] = [
  { id: "a1", name: "Чорна картка", categoryId: "mono", currency: "UAH", amount: 24500, updatedAt: now },
  { id: "a2", name: "Банка «Подушка»", categoryId: "mono", currency: "UAH", amount: 61000, updatedAt: now },
  { id: "a3", name: "Spot", categoryId: "binance", currency: "USDT", amount: 1250, updatedAt: now },
  { id: "a4", name: "BTC", categoryId: "binance", currency: "BTC", amount: 0.042, updatedAt: now },
  { id: "a5", name: "Earn", categoryId: "whitebit", currency: "USDT", amount: 800, updatedAt: now },
  { id: "a6", name: "Долари вдома", categoryId: "cash", currency: "USD", amount: 1500, updatedAt: now },
  { id: "a7", name: "Гривня вдома", categoryId: "cash", currency: "UAH", amount: 8000, updatedAt: now },
];

export function initialState(withDemo: boolean): WalletState {
  return {
    version: STATE_VERSION,
    categories: DEFAULT_CATEGORIES,
    assets: withDemo ? DEMO_ASSETS : [],
    rates: { ...DEFAULT_RATES },
    ratesUpdatedAt: Date.now(),
    history: [],
  };
}
