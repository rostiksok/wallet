"use client";

import { useEffect, useState } from "react";
import Sheet from "./Sheet";
import { CURRENCIES } from "@/lib/defaults";
import { formatMoney, parseNumber } from "@/lib/format";
import { usdToUah } from "@/lib/compute";
import { newId } from "@/lib/useWallet";
import type { Asset, Category, Rates } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  asset: Asset | null;
  defaultCategoryId?: string;
  categories: Category[];
  rates: Rates;
  onSave: (asset: Asset) => void;
  onDelete: (id: string) => void;
};

export default function AssetSheet({
  open,
  onClose,
  asset,
  defaultCategoryId,
  categories,
  rates,
  onSave,
  onDelete,
}: Props) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "other");
  const [currency, setCurrency] = useState("UAH");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Кожне відкриття наповнює форму заново: або активом на редагування, або дефолтами.
  useEffect(() => {
    if (!open) return;
    setName(asset?.name ?? "");
    setCategoryId(asset?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "other");
    setCurrency(asset?.currency ?? "UAH");
    setAmount(asset ? String(asset.amount) : "");
    setNote(asset?.note ?? "");
    setConfirmDelete(false);
  }, [open, asset, defaultCategoryId, categories]);

  const value = parseNumber(amount);
  const usd = value * (rates[currency] ?? 0);
  const canSave = name.trim().length > 0 && value !== 0;

  function submit() {
    if (!canSave) return;
    onSave({
      id: asset?.id ?? newId(),
      name: name.trim(),
      categoryId,
      currency,
      amount: value,
      note: note.trim() || undefined,
      updatedAt: Date.now(),
    });
    onClose();
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={asset ? "Редагувати актив" : "Новий актив"}
      subtitle={asset ? undefined : "Скільки і де в тебе лежить"}
      footer={
        <div className="flex gap-3">
          {asset && (
            <button
              onClick={() => (confirmDelete ? (onDelete(asset.id), onClose()) : setConfirmDelete(true))}
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
          <Label>Сума</Label>
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
          <p className="tnum mt-2 px-1 text-sm text-ink-400">
            ≈ {formatMoney(usd, "USD")} · {formatMoney(usdToUah(usd, rates), "UAH")}
          </p>
        </div>

        <div>
          <Label>Валюта</Label>
          <div className="flex flex-wrap gap-2">
            {CURRENCIES.map((c) => (
              <Chip key={c.code} active={currency === c.code} onClick={() => setCurrency(c.code)}>
                {c.code}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <Label>Де лежить</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Chip
                key={c.id}
                active={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}
                color={c.color}
              >
                <span className="mr-1.5">{c.emoji}</span>
                {c.name}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <Label>Назва</Label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Чорна картка, Spot, Earn…"
            className="h-13 w-full rounded-2xl border border-ink-700 bg-ink-850 px-4 outline-none placeholder:text-ink-600 focus:border-accent/60"
          />
        </div>

        <div>
          <Label>Нотатка</Label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Необовʼязково"
            className="h-13 w-full rounded-2xl border border-ink-700 bg-ink-850 px-4 outline-none placeholder:text-ink-600 focus:border-accent/60"
          />
        </div>
      </div>
    </Sheet>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 px-1 text-sm font-medium text-ink-400">{children}</p>;
}

function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  // Колір категорії йде в рамку й підкладку, але не в текст: жовтий чи блакитний
  // напис читабельний на темному фоні й зникає на світлому.
  const tinted = active && color;

  return (
    <button
      onClick={onClick}
      style={tinted ? { borderColor: color, background: `${color}1f` } : undefined}
      className={`flex h-11 items-center rounded-xl border px-3.5 text-[15px] transition active:scale-95 ${
        active
          ? tinted
            ? "font-medium text-ink-100"
            : "border-accent bg-accent/10 font-medium text-accent"
          : "border-ink-700 bg-ink-850 text-ink-300"
      }`}
    >
      {children}
    </button>
  );
}
