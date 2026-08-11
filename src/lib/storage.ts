import { DEFAULT_FOP_SETTINGS, DEFAULT_RATES, STATE_VERSION, STORAGE_KEY, initialState } from "./defaults";
import type { FopState, WalletState } from "./types";

/** Розділ ФОП зʼявився у версії 2 — у старих копіях його просто немає. */
function mergeFop(fop: Partial<FopState> | undefined): FopState {
  return {
    incomes: fop?.incomes ?? [],
    paid: fop?.paid ?? {},
    settings: { ...DEFAULT_FOP_SETTINGS, ...(fop?.settings ?? {}) },
  };
}

/** Читає стан з localStorage, дозаповнюючи поля, яких могло не бути в старіших версіях. */
export function loadState(): WalletState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WalletState>;
    if (!parsed || !Array.isArray(parsed.assets) || !Array.isArray(parsed.categories)) return null;
    return {
      version: STATE_VERSION,
      categories: parsed.categories,
      assets: parsed.assets,
      rates: { ...DEFAULT_RATES, ...(parsed.rates ?? {}) },
      ratesUpdatedAt: parsed.ratesUpdatedAt ?? Date.now(),
      history: parsed.history ?? [],
      fop: mergeFop(parsed.fop),
    };
  } catch {
    return null;
  }
}

export function saveState(state: WalletState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Приватний режим / переповнене сховище — тихо ігноруємо, UI лишається робочим.
  }
}

export function clearState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function exportState(state: WalletState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wallet-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importState(file: File): Promise<WalletState> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Partial<WalletState>;
  if (!Array.isArray(parsed.assets) || !Array.isArray(parsed.categories)) {
    throw new Error("Файл не схожий на резервну копію Wallet");
  }
  const base = initialState(false);
  return {
    ...base,
    categories: parsed.categories,
    assets: parsed.assets,
    rates: { ...DEFAULT_RATES, ...(parsed.rates ?? {}) },
    ratesUpdatedAt: parsed.ratesUpdatedAt ?? Date.now(),
    history: parsed.history ?? [],
    fop: mergeFop(parsed.fop),
  };
}
