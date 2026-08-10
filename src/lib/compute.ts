import type { Asset, Category, Rates, WalletState } from "./types";

export type Slice = {
  key: string;
  label: string;
  color: string;
  emoji: string;
  usd: number;
  share: number;
  count: number;
};

/** Вартість одного активу в USD. Невідома валюта → 0, щоб не ламати підсумок. */
export function assetUsd(asset: Asset, rates: Rates): number {
  const rate = rates[asset.currency];
  if (!Number.isFinite(rate)) return 0;
  return asset.amount * rate;
}

export function totalUsd(assets: Asset[], rates: Rates): number {
  return assets.reduce((sum, a) => sum + assetUsd(a, rates), 0);
}

export function usdToUah(usd: number, rates: Rates): number {
  const uah = rates.UAH;
  if (!uah) return 0;
  return usd / uah;
}

function share(usd: number, total: number) {
  return total > 0 ? (usd / total) * 100 : 0;
}

export function byCategory(state: WalletState): Slice[] {
  const total = totalUsd(state.assets, state.rates);
  const map = new Map<string, number>();
  const counts = new Map<string, number>();

  for (const asset of state.assets) {
    map.set(asset.categoryId, (map.get(asset.categoryId) ?? 0) + assetUsd(asset, state.rates));
    counts.set(asset.categoryId, (counts.get(asset.categoryId) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([id, usd]) => {
      const cat = state.categories.find((c) => c.id === id);
      return {
        key: id,
        label: cat?.name ?? "Невідомо",
        color: cat?.color ?? "#94a3b8",
        emoji: cat?.emoji ?? "📦",
        usd,
        share: share(usd, total),
        count: counts.get(id) ?? 0,
      };
    })
    .sort((a, b) => b.usd - a.usd);
}

const CURRENCY_COLORS: Record<string, string> = {
  UAH: "#4ade80",
  USD: "#38bdf8",
  USDT: "#2dd4bf",
  EUR: "#a78bfa",
  BTC: "#fb923c",
  ETH: "#818cf8",
  SOL: "#e879f9",
  TON: "#22d3ee",
  PLN: "#fb7185",
};

export function byCurrency(state: WalletState): Slice[] {
  const total = totalUsd(state.assets, state.rates);
  const map = new Map<string, number>();
  const counts = new Map<string, number>();

  for (const asset of state.assets) {
    map.set(asset.currency, (map.get(asset.currency) ?? 0) + assetUsd(asset, state.rates));
    counts.set(asset.currency, (counts.get(asset.currency) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([code, usd]) => ({
      key: code,
      label: code,
      color: CURRENCY_COLORS[code] ?? "#94a3b8",
      emoji: "",
      usd,
      share: share(usd, total),
      count: counts.get(code) ?? 0,
    }))
    .sort((a, b) => b.usd - a.usd);
}

const KIND_META: Record<string, { label: string; color: string; emoji: string }> = {
  bank: { label: "Банки", color: "#facc15", emoji: "🏦" },
  crypto: { label: "Крипта", color: "#f0b90b", emoji: "₿" },
  cash: { label: "Готівка", color: "#4ade80", emoji: "💵" },
  invest: { label: "Інвестиції", color: "#a78bfa", emoji: "📈" },
  other: { label: "Інше", color: "#94a3b8", emoji: "📦" },
};

export function byKind(state: WalletState): Slice[] {
  const total = totalUsd(state.assets, state.rates);
  const map = new Map<string, number>();
  const counts = new Map<string, number>();

  for (const asset of state.assets) {
    const kind = state.categories.find((c) => c.id === asset.categoryId)?.kind ?? "other";
    map.set(kind, (map.get(kind) ?? 0) + assetUsd(asset, state.rates));
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }

  return [...map.entries()]
    .map(([kind, usd]) => ({
      key: kind,
      label: KIND_META[kind]?.label ?? kind,
      color: KIND_META[kind]?.color ?? "#94a3b8",
      emoji: KIND_META[kind]?.emoji ?? "📦",
      usd,
      share: share(usd, total),
      count: counts.get(kind) ?? 0,
    }))
    .sort((a, b) => b.usd - a.usd);
}

export function assetsOfCategory(assets: Asset[], categoryId: string, rates: Rates) {
  return assets
    .filter((a) => a.categoryId === categoryId)
    .sort((a, b) => assetUsd(b, rates) - assetUsd(a, rates));
}

export function categoryById(categories: Category[], id: string) {
  return categories.find((c) => c.id === id);
}

export function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Дописує сьогоднішню точку в історію, перетираючи попередню за цю ж добу. */
export function withTodaySnapshot(history: WalletState["history"], total: number) {
  const day = startOfDay(Date.now());
  const rest = history.filter((h) => h.day !== day);
  return [...rest, { day, totalUsd: total }].sort((a, b) => a.day - b.day).slice(-180);
}

/** Зміна відносно найстарішої точки в межах вікна (днів). */
export function changeOverDays(history: WalletState["history"], current: number, days: number) {
  if (history.length === 0) return null;
  const cutoff = startOfDay(Date.now()) - days * 86_400_000;
  const inWindow = history.filter((h) => h.day >= cutoff);
  const base = (inWindow.length > 0 ? inWindow[0] : history[history.length - 1]).totalUsd;
  if (!base) return null;
  return { abs: current - base, pct: ((current - base) / base) * 100 };
}
