"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { initialState } from "./defaults";
import { loadState, saveState } from "./storage";
import { totalUsd, withTodaySnapshot } from "./compute";
import type { Asset, Category, FopIncome, FopSettings, TaxKind, WalletState } from "./types";

const EMPTY = initialState(false);

export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function useWallet() {
  // null === ще не читали localStorage. Прапорець саме у стані, а не в ref:
  // ref став би true вже в цьому ж коміті, і ефект збереження встиг би
  // записати порожній стан поверх реальних даних.
  const [stored, setStored] = useState<WalletState | null>(null);

  // localStorage читаємо тільки після монтування — інакше зламається гідрація.
  useEffect(() => {
    setStored(loadState() ?? initialState(true));
  }, []);

  useEffect(() => {
    if (!stored) return;
    saveState(stored);
  }, [stored]);

  const state = stored ?? EMPTY;
  const ready = stored !== null;

  const setState = useCallback(
    (updater: WalletState | ((prev: WalletState) => WalletState)) => {
      // Апдейти до гідрації ігноруємо — інакше вони теж затруть сховище.
      setStored((prev) =>
        prev === null ? null : typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [],
  );

  const total = useMemo(() => totalUsd(state.assets, state.rates), [state.assets, state.rates]);

  // Одна точка історії на добу — щоб показувати зміну за тиждень/місяць.
  useEffect(() => {
    if (!ready) return;
    setState((prev) => {
      const next = withTodaySnapshot(prev.history, totalUsd(prev.assets, prev.rates));
      const last = prev.history[prev.history.length - 1];
      const fresh = next[next.length - 1];
      if (last && last.day === fresh.day && last.totalUsd === fresh.totalUsd) return prev;
      return { ...prev, history: next };
    });
  }, [ready, total]);

  const upsertAsset = useCallback((asset: Asset) => {
    setState((prev) => {
      const exists = prev.assets.some((a) => a.id === asset.id);
      return {
        ...prev,
        assets: exists
          ? prev.assets.map((a) => (a.id === asset.id ? asset : a))
          : [...prev.assets, asset],
      };
    });
  }, []);

  // Разом з активом прибираємо його з рахунків ФОП — інакше в налаштуваннях
  // лишиться посилання в нікуди.
  const removeAsset = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      assets: prev.assets.filter((a) => a.id !== id),
      fop: {
        ...prev.fop,
        settings: {
          ...prev.fop.settings,
          accountIds: prev.fop.settings.accountIds.filter((a) => a !== id),
        },
      },
    }));
  }, []);

  const upsertCategory = useCallback((category: Category) => {
    setState((prev) => {
      const exists = prev.categories.some((c) => c.id === category.id);
      return {
        ...prev,
        categories: exists
          ? prev.categories.map((c) => (c.id === category.id ? category : c))
          : [...prev.categories, category],
      };
    });
  }, []);

  /** Активи видаленої категорії переїжджають в «Інше», щоб не зникли з підсумку. */
  const removeCategory = useCallback((id: string) => {
    setState((prev) => {
      const fallback = prev.categories.find((c) => c.id !== id)?.id;
      if (!fallback) return prev;
      return {
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
        assets: prev.assets.map((a) => (a.categoryId === id ? { ...a, categoryId: fallback } : a)),
      };
    });
  }, []);

  const setRate = useCallback((code: string, usdPerUnit: number) => {
    setState((prev) => ({
      ...prev,
      rates: { ...prev.rates, [code]: usdPerUnit },
      ratesUpdatedAt: Date.now(),
    }));
  }, []);

  const upsertIncome = useCallback((income: FopIncome) => {
    setState((prev) => {
      const exists = prev.fop.incomes.some((i) => i.id === income.id);
      return {
        ...prev,
        fop: {
          ...prev.fop,
          incomes: exists
            ? prev.fop.incomes.map((i) => (i.id === income.id ? income : i))
            : [...prev.fop.incomes, income],
        },
      };
    });
  }, []);

  const removeIncome = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      fop: { ...prev.fop, incomes: prev.fop.incomes.filter((i) => i.id !== id) },
    }));
  }, []);

  /** Позначка «сплачено» живе на парі квартал+податок: ЄП і ЄСВ платяться різними днями. */
  const toggleTaxPaid = useCallback((quarterKey: string, kind: TaxKind) => {
    setState((prev) => {
      const current = prev.fop.paid[quarterKey] ?? [];
      const next = current.includes(kind)
        ? current.filter((k) => k !== kind)
        : [...current, kind];
      const paid = { ...prev.fop.paid };
      if (next.length > 0) paid[quarterKey] = next;
      else delete paid[quarterKey];
      return { ...prev, fop: { ...prev.fop, paid } };
    });
  }, []);

  const setFopSettings = useCallback((patch: Partial<FopSettings>) => {
    setState((prev) => ({
      ...prev,
      fop: { ...prev.fop, settings: { ...prev.fop.settings, ...patch } },
    }));
  }, []);

  const replaceState = useCallback((next: WalletState) => setState(next), []);

  const reset = useCallback(() => setState(initialState(false)), []);

  return {
    state,
    ready,
    total,
    upsertAsset,
    removeAsset,
    upsertCategory,
    removeCategory,
    setRate,
    upsertIncome,
    removeIncome,
    toggleTaxPaid,
    setFopSettings,
    replaceState,
    reset,
  };
}

export type WalletApi = ReturnType<typeof useWallet>;
