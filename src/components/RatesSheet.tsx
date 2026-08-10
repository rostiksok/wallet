"use client";

import { useState } from "react";
import Sheet from "./Sheet";
import { CURRENCIES } from "@/lib/defaults";
import { formatDateTime, parseNumber } from "@/lib/format";
import type { Rates } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  rates: Rates;
  updatedAt: number;
  usedCurrencies: string[];
  onChange: (code: string, usdPerUnit: number) => void;
};

/** Для дрібних валют (гривня, злотий) зручніше вводити «1 USD = X», а не навпаки. */
function isInverse(usdPerUnit: number) {
  return usdPerUnit > 0 && usdPerUnit < 0.1;
}

export default function RatesSheet({
  open,
  onClose,
  rates,
  updatedAt,
  usedCurrencies,
  onChange,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const list = CURRENCIES.filter(
    (c) => c.code !== "USD" && (showAll || usedCurrencies.includes(c.code)),
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Курси валют"
      subtitle={`Оновлено ${formatDateTime(updatedAt)}`}
      footer={
        <button
          onClick={onClose}
          className="h-13 w-full rounded-2xl bg-ink-800 font-semibold transition active:scale-[0.97]"
        >
          Готово
        </button>
      }
    >
      <div className="space-y-3 pb-2">
        <p className="rounded-2xl bg-ink-850 px-4 py-3 text-sm leading-relaxed text-ink-400">
          Курси задаються вручну — підсумок рахується саме за ними. USD і USDT зафіксовані як 1:1.
        </p>

        {list.map((c) => (
          <RateRow key={c.code} code={c.code} label={c.label} rate={rates[c.code] ?? 0} onChange={onChange} />
        ))}

        <button
          onClick={() => setShowAll((v) => !v)}
          className="h-12 w-full rounded-2xl border border-ink-700 text-sm text-ink-300 transition active:scale-[0.98]"
        >
          {showAll ? "Тільки мої валюти" : "Показати всі валюти"}
        </button>
      </div>
    </Sheet>
  );
}

function RateRow({
  code,
  label,
  rate,
  onChange,
}: {
  code: string;
  label: string;
  rate: number;
  onChange: (code: string, usdPerUnit: number) => void;
}) {
  const inverse = isInverse(rate);
  const shown = inverse ? 1 / rate : rate;
  const [draft, setDraft] = useState<string | null>(null);

  function commit(raw: string) {
    const n = parseNumber(raw);
    if (n > 0) onChange(code, inverse ? 1 / n : n);
    setDraft(null);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-850 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{code}</p>
        <p className="truncate text-sm text-ink-400">
          {inverse ? `1 USD = ? ${code}` : `1 ${code} = ? USD`} · {label}
        </p>
      </div>
      <input
        value={draft ?? formatRate(shown)}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        inputMode="decimal"
        className="tnum h-12 w-28 shrink-0 rounded-xl border border-ink-600 bg-ink-900 px-3 text-right font-medium outline-none focus:border-accent/60"
      />
    </div>
  );
}

function formatRate(n: number) {
  if (!Number.isFinite(n)) return "0";
  if (n >= 100) return n.toFixed(0);
  if (n >= 1) return String(Number(n.toFixed(4)));
  return String(Number(n.toFixed(6)));
}
