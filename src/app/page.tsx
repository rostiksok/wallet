"use client";

import { useMemo, useState } from "react";
import Donut from "@/components/Donut";
import Sparkline from "@/components/Sparkline";
import AssetSheet from "@/components/AssetSheet";
import CategorySheet, { plural } from "@/components/CategorySheet";
import RatesSheet from "@/components/RatesSheet";
import SettingsSheet from "@/components/SettingsSheet";
import { useWallet } from "@/lib/useWallet";
import {
  assetUsd,
  assetsOfCategory,
  byCategory,
  byCurrency,
  byKind,
  changeOverDays,
  usdToUah,
} from "@/lib/compute";
import { formatAmount, formatMoney, formatPercent } from "@/lib/format";
import type { Asset, Category } from "@/lib/types";

type Mode = "category" | "currency" | "kind";

const MODES: { value: Mode; label: string }[] = [
  { value: "category", label: "За рахунками" },
  { value: "currency", label: "За валютами" },
  { value: "kind", label: "За типом" },
];

export default function Page() {
  const wallet = useWallet();
  const { state, ready, total } = wallet;

  const [mode, setMode] = useState<Mode>("category");
  const [activeSlice, setActiveSlice] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [assetSheet, setAssetSheet] = useState<{ open: boolean; asset: Asset | null; categoryId?: string }>({
    open: false,
    asset: null,
  });
  const [categorySheet, setCategorySheet] = useState<{ open: boolean; category: Category | null }>({
    open: false,
    category: null,
  });
  const [ratesOpen, setRatesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const slices = useMemo(() => {
    if (mode === "currency") return byCurrency(state);
    if (mode === "kind") return byKind(state);
    return byCategory(state);
  }, [mode, state]);

  const uahTotal = usdToUah(total, state.rates);
  const change = changeOverDays(state.history, total, 30);
  const usedCurrencies = useMemo(
    () => [...new Set(state.assets.map((a) => a.currency))],
    [state.assets],
  );

  const active = slices.find((s) => s.key === activeSlice) ?? null;
  const mask = (text: string) => (hidden ? "•••••" : text);

  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="size-8 animate-spin rounded-full border-2 border-ink-700 border-t-accent" />
      </main>
    );
  }

  const isEmpty = state.assets.length === 0;

  return (
    <main
      className="mx-auto w-full max-w-md px-4 lg:max-w-6xl lg:px-8"
      style={{ paddingBottom: "max(7rem, calc(env(safe-area-inset-bottom) + 6rem))" }}
    >
      <header
        className="flex items-center justify-between gap-3 py-4"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">Мої активи</h1>
          <p className="text-sm text-ink-400">
            {state.assets.length} {plural(state.assets.length, "актив", "активи", "активів")} ·{" "}
            {state.categories.length} {plural(state.categories.length, "рахунок", "рахунки", "рахунків")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton label={hidden ? "Показати суми" : "Сховати суми"} onClick={() => setHidden((v) => !v)}>
            {hidden ? (
              <path
                d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.4 5.2A9.6 9.6 0 0112 5c5 0 9 4.5 9 7 0 .9-.7 2.2-1.9 3.4M6.3 6.8C4 8.3 3 10.4 3 12c0 2 4 7 9 7 1.4 0 2.7-.4 3.8-1"
                strokeLinecap="round"
              />
            ) : (
              <>
                <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" strokeLinecap="round" />
                <circle cx="12" cy="12" r="2.6" />
              </>
            )}
          </IconButton>
          <IconButton label="Курси валют" onClick={() => setRatesOpen(true)}>
            <path
              d="M7 8h10M7 8l3-3M7 8l3 3M17 16H7m10 0l-3-3m3 3l-3 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </IconButton>
          <IconButton label="Налаштування" onClick={() => setSettingsOpen(true)}>
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1v.2a2 2 0 11-4 0v-.1A1.6 1.6 0 006.6 19l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.1-2.7H2.5a2 2 0 110-4h.1A1.6 1.6 0 004.3 6.6l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 002.7-1.1V2.5a2 2 0 114 0v.1A1.6 1.6 0 0017.4 4.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7h.2a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1.2z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </IconButton>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="lg:sticky lg:top-6 lg:space-y-4">
          <section className="animate-rise rounded-3xl border border-ink-700 bg-gradient-to-b from-ink-850 to-ink-900 p-5">
            <p className="text-sm text-ink-400">Разом</p>
            <p className="tnum mt-1 text-[clamp(2rem,10vw,2.75rem)] leading-tight font-semibold tracking-tight">
              {mask(formatMoney(total, "USD"))}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="tnum text-lg text-ink-300">{mask(formatMoney(uahTotal, "UAH", true))}</p>
              {change && Math.abs(change.pct) >= 0.05 && (
                <span
                  className={`tnum rounded-full px-2 py-0.5 text-sm font-medium ${
                    change.abs >= 0 ? "bg-accent/15 text-accent" : "bg-danger/15 text-danger"
                  }`}
                >
                  {change.abs >= 0 ? "↑" : "↓"} {formatPercent(Math.abs(change.pct))} за місяць
                </span>
              )}
            </div>
            {state.history.length > 2 && (
              <div className="-mx-1 mt-3">
                <Sparkline history={state.history} />
              </div>
            )}
          </section>

          {!isEmpty && (
            <>
              <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:mt-0 lg:px-0">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => {
                      setMode(m.value);
                      setActiveSlice(null);
                    }}
                    className={`h-10 shrink-0 rounded-full border px-4 text-[15px] transition active:scale-95 ${
                      mode === m.value
                        ? "border-ink-100 bg-ink-100 font-medium text-ink-950"
                        : "border-ink-700 bg-ink-850 text-ink-300"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <section className="mt-4 rounded-3xl border border-ink-700 bg-ink-900 p-5 lg:mt-0">
                <Donut
                  slices={slices}
                  activeKey={activeSlice}
                  onSelect={setActiveSlice}
                  center={
                    active ? (
                      <div>
                        <p
                          className="slice-tint tnum text-xl font-semibold"
                          style={{ "--slice": active.color } as React.CSSProperties}
                        >
                          {formatPercent(active.share)}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-tight text-ink-400">
                          {active.label}
                        </p>
                        <p className="tnum mt-1 text-sm">{mask(formatMoney(active.usd, "USD", true))}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-ink-400">Всього</p>
                        <p className="tnum text-lg font-semibold">{mask(formatMoney(total, "USD", true))}</p>
                      </div>
                    )
                  }
                />

                <ul className="mt-5 space-y-1">
                  {slices.map((slice) => (
                    <li key={slice.key}>
                      <button
                        onClick={() => setActiveSlice(activeSlice === slice.key ? null : slice.key)}
                        className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition ${
                          activeSlice === slice.key ? "bg-ink-800" : "active:bg-ink-850"
                        }`}
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: slice.color }}
                        />
                        <span className="min-w-0 flex-1 truncate text-[15px]">
                          {slice.emoji && <span className="mr-1.5">{slice.emoji}</span>}
                          {slice.label}
                        </span>
                        <span className="tnum shrink-0 text-right">
                          <span className="block text-[15px]">{mask(formatMoney(slice.usd, "USD", true))}</span>
                          <span className="block text-xs text-ink-400">{formatPercent(slice.share)}</span>
                        </span>
                      </button>
                      {activeSlice === slice.key && (
                        <div className="mb-1 rounded-xl bg-ink-850 px-3 py-2">
                          <p className="tnum text-sm text-ink-300">
                            {mask(formatMoney(usdToUah(slice.usd, state.rates), "UAH"))} ·{" "}
                            {slice.count} {plural(slice.count, "актив", "активи", "активів")}
                          </p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>

        <div className="mt-4 lg:mt-0">
          {isEmpty ? (
            <section className="animate-rise rounded-3xl border border-dashed border-ink-700 px-6 py-12 text-center">
              <p className="text-4xl">🪙</p>
              <p className="mt-3 font-medium">Поки що порожньо</p>
              <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-ink-400">
                Додай перший актив — картку Монобанку, баланс на Binance, готівку вдома. Підсумок
                зʼявиться одразу.
              </p>
              <button
                onClick={() => setAssetSheet({ open: true, asset: null })}
                className="mt-5 h-12 rounded-2xl bg-accent px-6 font-semibold text-ink-950 transition active:scale-95"
              >
                Додати актив
              </button>
            </section>
          ) : (
            <section className="space-y-2">
              <div className="flex items-center justify-between px-1 pb-1">
                <h2 className="font-semibold">Рахунки</h2>
                <button
                  onClick={() => setCategorySheet({ open: true, category: null })}
                  className="text-sm font-medium text-accent transition active:scale-95"
                >
                  + Категорія
                </button>
              </div>

              {byCategory(state).map((slice) => {
                const category = state.categories.find((c) => c.id === slice.key)!;
                const items = assetsOfCategory(state.assets, slice.key, state.rates);
                const isOpen = expanded === slice.key;

                return (
                  <div
                    key={slice.key}
                    className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900"
                  >
                    <div className="flex items-center">
                      <button
                        onClick={() => setExpanded(isOpen ? null : slice.key)}
                        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 text-left transition active:bg-ink-850"
                      >
                        <span
                          className="grid size-10 shrink-0 place-items-center rounded-xl text-lg"
                          style={{ background: `${category.color}1f` }}
                        >
                          {category.emoji}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{category.name}</span>
                          <span className="tnum block text-sm text-ink-400">
                            {formatPercent(slice.share)} · {items.length}{" "}
                            {plural(items.length, "актив", "активи", "активів")}
                          </span>
                        </span>
                        <span className="tnum shrink-0 text-right">
                          <span className="block font-medium">{mask(formatMoney(slice.usd, "USD", true))}</span>
                          <span className="block text-sm text-ink-400">
                            {mask(formatMoney(usdToUah(slice.usd, state.rates), "UAH", true))}
                          </span>
                        </span>
                        <svg
                          viewBox="0 0 24 24"
                          className={`size-5 shrink-0 text-ink-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>

                    {isOpen && (
                      <div className="border-t border-ink-800 px-2 pt-1 pb-2">
                        {items.map((asset) => (
                          <button
                            key={asset.id}
                            onClick={() => setAssetSheet({ open: true, asset })}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition active:bg-ink-850"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[15px]">{asset.name}</span>
                              <span className="tnum block text-sm text-ink-400">
                                {mask(formatAmount(asset.amount, asset.currency))}
                                {asset.note && ` · ${asset.note}`}
                              </span>
                            </span>
                            <span className="tnum shrink-0 text-sm text-ink-300">
                              {mask(formatMoney(assetUsd(asset, state.rates), "USD", true))}
                            </span>
                          </button>
                        ))}

                        <div className="mt-1 flex gap-2 px-1">
                          <button
                            onClick={() => setAssetSheet({ open: true, asset: null, categoryId: slice.key })}
                            className="h-10 flex-1 rounded-xl border border-ink-700 text-sm font-medium text-ink-300 transition active:scale-[0.98]"
                          >
                            + Актив
                          </button>
                          <button
                            onClick={() => setCategorySheet({ open: true, category })}
                            className="h-10 rounded-xl border border-ink-700 px-4 text-sm text-ink-400 transition active:scale-[0.98]"
                          >
                            Змінити
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {state.categories
                .filter((c) => !state.assets.some((a) => a.categoryId === c.id))
                .map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setAssetSheet({ open: true, asset: null, categoryId: category.id })}
                    className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-ink-700 px-4 py-3.5 text-left transition active:scale-[0.99]"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink-850 text-lg opacity-60">
                      {category.emoji}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-ink-400">{category.name}</span>
                    <span className="shrink-0 text-sm font-medium text-accent">Додати</span>
                  </button>
                ))}
            </section>
          )}
        </div>
      </div>

      {!isEmpty && (
        <button
          onClick={() => setAssetSheet({ open: true, asset: null })}
          aria-label="Додати актив"
          className="fixed right-4 z-40 grid size-14 place-items-center rounded-full bg-accent text-ink-950 shadow-lg shadow-black/40 transition active:scale-90 lg:right-8"
          style={{ bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))" }}
        >
          <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      )}

      <AssetSheet
        open={assetSheet.open}
        onClose={() => setAssetSheet({ open: false, asset: null })}
        asset={assetSheet.asset}
        defaultCategoryId={assetSheet.categoryId}
        categories={state.categories}
        rates={state.rates}
        onSave={wallet.upsertAsset}
        onDelete={wallet.removeAsset}
      />

      <CategorySheet
        open={categorySheet.open}
        onClose={() => setCategorySheet({ open: false, category: null })}
        category={categorySheet.category}
        categories={state.categories}
        assetCount={
          categorySheet.category
            ? state.assets.filter((a) => a.categoryId === categorySheet.category!.id).length
            : 0
        }
        onSave={wallet.upsertCategory}
        onDelete={wallet.removeCategory}
      />

      <RatesSheet
        open={ratesOpen}
        onClose={() => setRatesOpen(false)}
        rates={state.rates}
        updatedAt={state.ratesUpdatedAt}
        usedCurrencies={usedCurrencies}
        onChange={wallet.setRate}
      />

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        state={state}
        onReplace={wallet.replaceState}
        onReset={wallet.reset}
      />
    </main>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full text-ink-300 transition active:scale-90 hover:bg-ink-800"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
        {children}
      </svg>
    </button>
  );
}
