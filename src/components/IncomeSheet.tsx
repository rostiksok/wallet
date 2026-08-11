"use client";

import { useEffect, useState } from "react";
import Sheet from "./Sheet";
import { formatMoney, parseNumber } from "@/lib/format";
import { esvPerMonth, quarterLabel, quarterOf, uahPerUnit } from "@/lib/fop";
import { newId } from "@/lib/useWallet";
import type { FopIncome, FopSettings, Rates } from "@/lib/types";

/** Дохід ФОП надходить у грошах, тому крипта тут не пропонується. */
const INCOME_CURRENCIES = ["USD", "UAH", "EUR", "PLN"];

type Props = {
  open: boolean;
  onClose: () => void;
  income: FopIncome | null;
  settings: FopSettings;
  rates: Rates;
  onSave: (income: FopIncome) => void;
  onDelete: (id: string) => void;
};

function toDateInput(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Парсимо як локальну дату: new Date("2026-08-11") дало б UTC і зсув на день назад. */
function fromDateInput(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return Date.now();
  return new Date(y, m - 1, d, 12).getTime();
}

export default function IncomeSheet({
  open,
  onClose,
  income,
  settings,
  rates,
  onSave,
  onDelete,
}: Props) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [rate, setRate] = useState("");
  const [date, setDate] = useState(() => toDateInput(Date.now()));
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(income ? String(income.amount) : "");
    setCurrency(income?.currency ?? "USD");
    setRate(income ? String(income.rate) : "");
    setDate(toDateInput(income?.date ?? Date.now()));
    setNote(income?.note ?? "");
    setConfirmDelete(false);
  }, [open, income]);

  // Курс НБУ на дату зарахування ФОП дивиться на сайті НБУ, але для чернетки
  // підставляємо ручний курс із гаманця — цифру завжди можна перебити.
  const suggested = uahPerUnit(currency, rates);
  const value = parseNumber(amount);
  const usedRate = currency === "UAH" ? 1 : parseNumber(rate) || suggested;
  const uah = value * usedRate;

  const ep = (uah * settings.singleTaxPct) / 100;
  const vz = (uah * settings.militaryPct) / 100;
  const canSave = value > 0 && usedRate > 0;

  function submit() {
    if (!canSave) return;
    onSave({
      id: income?.id ?? newId(),
      date: fromDateInput(date),
      currency,
      amount: value,
      rate: usedRate,
      note: note.trim() || undefined,
    });
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={income ? "Редагувати надходження" : "Нове надходження"}
      subtitle={`Потрапить у ${quarterLabel(quarterOf(fromDateInput(date)))}`}
      footer={
        <div className="flex gap-3">
          {income && (
            <button
              onClick={() => (confirmDelete ? (onDelete(income.id), onClose()) : setConfirmDelete(true))}
              className={`h-13 shrink-0 rounded-2xl px-5 font-medium transition active:scale-[0.97] ${
                confirmDelete
                  ? "bg-danger text-ink-950"
                  : "border border-ink-700 text-danger hover:bg-ink-800"
              }`}
            >
              {confirmDelete ? "Точно?" : "Видалити"}
            </button>
          )}
          <button
            onClick={submit}
            disabled={!canSave}
            className="h-13 flex-1 rounded-2xl bg-accent font-semibold text-ink-950 transition active:scale-[0.97] disabled:opacity-30"
          >
            Зберегти
          </button>
        </div>
      }
    >
      <div className="space-y-6 pb-2">
        <div>
          <Label>Сума надходження</Label>
          <div className="flex items-center gap-2 rounded-2xl border border-ink-700 bg-ink-850 px-4 focus-within:border-accent/60">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              className="tnum h-14 min-w-0 flex-1 bg-transparent text-2xl font-semibold outline-none placeholder:text-ink-600"
            />
            <span className="tnum shrink-0 text-lg font-medium text-ink-400">{currency}</span>
          </div>
        </div>

        <div>
          <Label>Валюта</Label>
          <div className="flex flex-wrap gap-2">
            {INCOME_CURRENCIES.map((code) => (
              <Chip
                key={code}
                active={currency === code}
                onClick={() => {
                  setCurrency(code);
                  setRate("");
                }}
              >
                {code}
              </Chip>
            ))}
          </div>
        </div>

        {currency !== "UAH" && (
          <div>
            <Label>Курс НБУ на дату зарахування</Label>
            <div className="flex items-center gap-2 rounded-2xl border border-ink-700 bg-ink-850 px-4 focus-within:border-accent/60">
              <span className="shrink-0 text-ink-400">1 {currency} =</span>
              <input
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
                inputMode="decimal"
                placeholder={suggested ? suggested.toFixed(4) : "0"}
                className="tnum h-13 min-w-0 flex-1 bg-transparent text-right font-medium outline-none placeholder:text-ink-600"
              />
              <span className="shrink-0 text-ink-400">₴</span>
            </div>
            <p className="mt-2 px-1 text-sm text-ink-400">
              Дохід у гривні рахується саме за цим курсом — він і піде в декларацію.
            </p>
          </div>
        )}

        <div>
          <Label>Дата зарахування</Label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="tnum h-13 w-full rounded-2xl border border-ink-700 bg-ink-850 px-4 outline-none focus:border-accent/60"
          />
        </div>

        <div>
          <Label>Нотатка</Label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Інвойс #12, замовник…"
            className="h-13 w-full rounded-2xl border border-ink-700 bg-ink-850 px-4 outline-none placeholder:text-ink-600 focus:border-accent/60"
          />
        </div>

        <div className="rounded-2xl border border-ink-700 bg-ink-850 px-4 py-4">
          <p className="text-sm text-ink-400">З цього надходження</p>
          <p className="tnum mt-1 text-2xl font-semibold">{formatMoney(ep + vz, "UAH")}</p>
          <div className="mt-3 space-y-1.5 text-sm">
            <Line label="Дохід у гривні" value={formatMoney(uah, "UAH")} />
            <Line label={`Єдиний податок ${settings.singleTaxPct}%`} value={formatMoney(ep, "UAH")} />
            <Line label={`Військовий збір ${settings.militaryPct}%`} value={formatMoney(vz, "UAH")} />
            {settings.payEsv && (
              <Line
                label="ЄСВ (фіксований, за місяць)"
                value={formatMoney(esvPerMonth(settings), "UAH")}
                muted
              />
            )}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function Line({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={muted ? "text-ink-400" : "text-ink-300"}>{label}</span>
      <span className={`tnum shrink-0 ${muted ? "text-ink-400" : ""}`}>{value}</span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 px-1 text-sm font-medium text-ink-400">{children}</p>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-11 items-center rounded-xl border px-4 text-[15px] transition active:scale-95 ${
        active
          ? "border-accent bg-accent/10 font-medium text-accent"
          : "border-ink-700 bg-ink-850 text-ink-300"
      }`}
    >
      {children}
    </button>
  );
}
