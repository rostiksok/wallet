import type { Asset, Category, FopIncome, FopSettings, Rates, WalletState } from "./types";

export const STORAGE_KEY = "wallet.state.v1";
export const STATE_VERSION = 2;

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

/**
 * Мінімальна зарплата на 1 січня 2026 — 8 647 ₴ (Держбюджет-2026). З неї рахуються
 * і ЄСВ (22% = 1 902,34 ₴/міс), і річний ліміт 3 групи (1167 мінімалок = 10 091 049 ₴).
 * Змінюється раз на рік — тому не константа в коді, а поле налаштувань.
 */
export const MIN_WAGE = 8647;

export const DEFAULT_FOP_SETTINGS: FopSettings = {
  singleTaxPct: 5,
  militaryPct: 1,
  payEsv: true,
  minWage: MIN_WAGE,
  bufferPct: 5,
  accountIds: [],
};

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

/**
 * Демо-надходження прив'язані до «сьогодні», а не до конкретних дат: інакше з часом
 * вони поїхали б у давно закриті квартали й порожній розділ виглядав би зламаним.
 */
export const DEMO_INCOMES: FopIncome[] = [
  { id: "n1", date: now - 68 * 86_400_000, currency: "USD", amount: 2400, rate: 41.2, note: "Інвойс #7" },
  { id: "n2", date: now - 37 * 86_400_000, currency: "USD", amount: 2500, rate: 41.4, note: "Інвойс #8" },
  { id: "n3", date: now - 12 * 86_400_000, currency: "USD", amount: 2650, rate: 41.6, note: "Інвойс #9" },
  { id: "n4", date: now - 5 * 86_400_000, currency: "UAH", amount: 18000, rate: 1, note: "Локальний клієнт" },
];

export function initialState(withDemo: boolean): WalletState {
  return {
    version: STATE_VERSION,
    categories: DEFAULT_CATEGORIES,
    assets: withDemo ? DEMO_ASSETS : [],
    rates: { ...DEFAULT_RATES },
    ratesUpdatedAt: Date.now(),
    history: [],
    fop: {
      incomes: withDemo ? DEMO_INCOMES : [],
      paid: {},
      settings: { ...DEFAULT_FOP_SETTINGS },
    },
  };
}
