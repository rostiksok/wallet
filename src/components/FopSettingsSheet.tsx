"use client";

import Sheet from "./Sheet";
import { formatAmount, formatMoney, parseNumber } from "@/lib/format";
import { ESV_RATE, LIMIT_MIN_WAGES, esvPerMonth, incomeLimit } from "@/lib/fop";
import type { Asset, Category, FopSettings } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  settings: FopSettings;
  assets: Asset[];
  categories: Category[];
  onChange: (patch: Partial<FopSettings>) => void;
};

export default function FopSettingsSheet({
  open,
  onClose,
  settings,
  assets,
  categories,
  onChange,
}: Props) {
  const esv = esvPerMonth(settings);

  function toggleAccount(id: string) {
    const ids = settings.accountIds.includes(id)
      ? settings.accountIds.filter((a) => a !== id)
      : [...settings.accountIds, id];
    onChange({ accountIds: ids });
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Налаштування ФОП"
      subtitle="3 група спрощеної системи"
      footer={
        <button
          onClick={onClose}
          className="h-13 w-full rounded-2xl bg-ink-800 font-semibold transition active:scale-[0.97]"
        >
          Готово
        </button>
      }
    >
      <div className="space-y-4 pb-2">
        <div className="rounded-2xl border border-ink-700 bg-ink-850 px-4 py-4">
          <p className="font-medium">Ставка єдиного податку</p>
          <p className="mt-0.5 text-sm text-ink-400">3% — якщо ти платник ПДВ</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[5, 3].map((pct) => (
              <button
                key={pct}
                onClick={() => onChange({ singleTaxPct: pct })}
                className={`h-11 rounded-xl border text-sm transition active:scale-95 ${
                  settings.singleTaxPct === pct
                    ? "border-ink-100 bg-ink-100 font-medium text-ink-950"
                    : "border-ink-700 bg-ink-900 text-ink-300"
                }`}
              >
                {pct}% {pct === 3 ? "з ПДВ" : "без ПДВ"}
              </button>
            ))}
          </div>
        </div>

        <NumberRow
          title="Військовий збір"
          hint="Для 3 групи — 1% доходу, щокварталу разом з ЄП"
          value={settings.militaryPct}
          suffix="%"
          onCommit={(n) => onChange({ militaryPct: n })}
        />

        <div className="rounded-2xl border border-ink-700 bg-ink-850 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">Плачу ЄСВ за себе</p>
              <p className="mt-0.5 text-sm text-ink-400">
                Вимкни, якщо ти найманий працівник, пенсіонер або маєш інвалідність
              </p>
            </div>
            <Switch
              checked={settings.payEsv}
              label="Плачу ЄСВ за себе"
              onChange={(v) => onChange({ payEsv: v })}
            />
          </div>
        </div>

        {settings.payEsv && (
          <NumberRow
            title="ЄСВ за місяць"
            hint={`Мінімум — ${ESV_RATE}% мінімалки (${formatMoney(
              (settings.minWage * ESV_RATE) / 100,
              "UAH",
            )}). Більше — якщо доплачуєш стаж`}
            value={esv}
            suffix="₴"
            onCommit={(n) =>
              onChange({ esvMonthly: n > 0 && n !== (settings.minWage * ESV_RATE) / 100 ? n : undefined })
            }
          />
        )}

        <NumberRow
          title="Мінімальна зарплата"
          hint={`База для ЄСВ і річного ліміту (${LIMIT_MIN_WAGES} мінімалок = ${formatMoney(
            incomeLimit(settings),
            "UAH",
            true,
          )})`}
          value={settings.minWage}
          suffix="₴"
          onCommit={(n) => onChange({ minWage: n })}
        />

        <NumberRow
          title="Запас на курс"
          hint="На скільки більше валюти тримати: до дня сплати курс може зрости"
          value={settings.bufferPct}
          suffix="%"
          onCommit={(n) => onChange({ bufferPct: n })}
        />

        <div className="rounded-2xl border border-ink-700 bg-ink-850 px-4 py-4">
          <p className="font-medium">Рахунки ФОП</p>
          <p className="mt-0.5 text-sm text-ink-400">
            Позначені активи вважаються підприємницькими — з ними порівнюється резерв
          </p>

          <div className="mt-3 space-y-1.5">
            {assets.length === 0 && (
              <p className="text-sm text-ink-400">Спочатку додай активи на вкладці «Активи».</p>
            )}
            {assets.map((asset) => {
              const active = settings.accountIds.includes(asset.id);
              const category = categories.find((c) => c.id === asset.categoryId);
              return (
                <button
                  key={asset.id}
                  onClick={() => toggleAccount(asset.id)}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition active:scale-[0.98] ${
                    active ? "border-accent bg-accent/10" : "border-ink-700 bg-ink-900"
                  }`}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg text-base"
                    style={{ background: `${category?.color ?? "#94a3b8"}1f` }}
                  >
                    {category?.emoji ?? "📦"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px]">{asset.name}</span>
                    <span className="tnum block text-sm text-ink-400">
                      {formatAmount(asset.amount, asset.currency)}
                      {category && ` · ${category.name}`}
                    </span>
                  </span>
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-md border ${
                      active ? "border-accent bg-accent text-ink-950" : "border-ink-600"
                    }`}
                  >
                    {active && (
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path d="M5 12.5l5 5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="px-1 text-sm leading-relaxed text-ink-400">
          Дефолти — на 2026 рік: мінімалка 8 647 ₴, ЄСВ 1 902,34 ₴/міс, ліміт доходу 10 091 049 ₴.
          Щойно держава змінить цифри — переб'єш їх тут, і всі розрахунки перерахуються.
        </p>
      </div>
    </Sheet>
  );
}

function NumberRow({
  title,
  hint,
  value,
  suffix,
  onCommit,
}: {
  title: string;
  hint: string;
  value: number;
  suffix: string;
  onCommit: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-850 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm leading-snug text-ink-400">{hint}</p>
      </div>
      <div className="flex h-12 w-28 shrink-0 items-center gap-1 rounded-xl border border-ink-600 bg-ink-900 px-3 focus-within:border-accent/60">
        <input
          defaultValue={String(value)}
          key={value}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => onCommit(parseNumber(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          inputMode="decimal"
          className="tnum min-w-0 flex-1 bg-transparent text-right font-medium outline-none"
        />
        <span className="shrink-0 text-sm text-ink-400">{suffix}</span>
      </div>
    </div>
  );
}

function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? "bg-accent" : "bg-ink-700"
      }`}
    >
      <span
        className={`absolute top-1 size-5 rounded-full bg-ink-100 transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}
