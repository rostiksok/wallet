"use client";

import { useMemo, useState } from "react";
import FopSettingsSheet from "@/components/FopSettingsSheet";
import IncomeSheet from "@/components/IncomeSheet";
import { useWalletState } from "@/lib/walletContext";
import {
  TAX_LABEL,
  TAX_SHORT,
  coverage,
  daysLeft,
  esvPerMonth,
  fopBalance,
  incomeUah,
  quarters,
  reserve,
  setAsidePct,
  uahPerUsd,
  yearStats,
  type QuarterCalc,
} from "@/lib/fop";
import { formatAmount, formatDay, formatMoney, formatPercent, plural } from "@/lib/format";
import type { FopIncome, TaxKind } from "@/lib/types";

export default function TaxPage() {
  const wallet = useWalletState();
  const { state, ready } = wallet;

  // Одне «сьогодні» на весь рендер: інакше квартал і дедлайни могли б
  // порахуватися відносно різних міток часу.
  const [now] = useState(() => Date.now());
  const [openQuarter, setOpenQuarter] = useState<string | null>(null);
  const [incomeSheet, setIncomeSheet] = useState<{ open: boolean; income: FopIncome | null }>({
    open: false,
    income: null,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const list = useMemo(() => quarters(state, now), [state, now]);
  const need = useMemo(() => reserve(list, now), [list, now]);
  const balance = useMemo(() => fopBalance(state), [state]);
  const cover = useMemo(() => coverage(state, need.total, balance), [state, need.total, balance]);

  const settings = state.fop.settings;
  const year = new Date(now).getFullYear();
  const stats = yearStats(list, settings, year);
  const rate = uahPerUsd(state.rates);
  const current = list.find((q) => !q.closed) ?? list[0];

  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="size-8 animate-spin rounded-full border-2 border-ink-700 border-t-accent" />
      </main>
    );
  }

  const hasIncome = state.fop.incomes.length > 0;

  return (
    <main
      className="mx-auto w-full max-w-md px-4 lg:max-w-6xl lg:px-8"
      style={{
        paddingBottom: "max(11rem, calc(env(safe-area-inset-bottom) + 10rem))",
      }}
    >
      <header
        className="flex items-center justify-between gap-3 py-4"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">Податки ФОП</h1>
          <p className="text-sm text-ink-400">
            3 група · {settings.singleTaxPct}% + {settings.militaryPct}%
            {settings.payEsv && " + ЄСВ"}
          </p>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Налаштування ФОП"
          className="grid size-11 shrink-0 place-items-center rounded-full text-ink-300 transition active:scale-90 hover:bg-ink-800"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1v.2a2 2 0 11-4 0v-.1A1.6 1.6 0 006.6 19l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.1-2.7H2.5a2 2 0 110-4h.1A1.6 1.6 0 004.3 6.6l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 002.7-1.1V2.5a2 2 0 114 0v.1A1.6 1.6 0 0017.4 4.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7h.2a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1.2z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="space-y-4 lg:sticky lg:top-6">
          <section className="animate-rise rounded-3xl border border-ink-700 bg-gradient-to-b from-ink-850 to-ink-900 p-5">
            <p className="text-sm text-ink-400">Тримати на ФОП</p>
            <p className="tnum mt-1 text-[clamp(2rem,10vw,2.75rem)] leading-tight font-semibold tracking-tight">
              {formatMoney(need.total, "UAH")}
            </p>
            <p className="tnum mt-1 text-lg text-ink-300">
              ≈ {formatMoney(rate > 0 ? need.total / rate : 0, "USD")}
            </p>

            {need.overdue > 0 && (
              <p className="tnum mt-3 rounded-xl bg-danger/15 px-3 py-2 text-sm font-medium text-danger">
                Прострочено {formatMoney(need.overdue, "UAH")} — сплати якнайшвидше
              </p>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2">
              {(["ep", "vz", "esv"] as TaxKind[]).map((kind) => (
                <div key={kind} className="rounded-xl bg-ink-850 px-3 py-2.5">
                  <p className="text-xs text-ink-400">{TAX_SHORT[kind]}</p>
                  <p className="tnum mt-0.5 text-sm font-medium">
                    {/* У трьох плитках поруч копійки тільки заважають порівнювати. */}
                    {formatMoney(Math.round(need.byKind[kind]), "UAH", true)}
                  </p>
                </div>
              ))}
            </div>

            {current && !current.closed && current.income > 0 && (
              <p className="mt-3 text-sm leading-relaxed text-ink-400">
                {current.label} ще триває — з кожним надходженням резерв росте на{" "}
                {settings.singleTaxPct + settings.militaryPct}%.
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-ink-700 bg-ink-900 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Рахунки ФОП</h2>
              <button
                onClick={() => setSettingsOpen(true)}
                className="text-sm font-medium text-accent transition active:scale-95"
              >
                {cover.linked ? "Змінити" : "Обрати"}
              </button>
            </div>

            {!cover.linked ? (
              <p className="mt-2 text-sm leading-relaxed text-ink-400">
                Познач у налаштуваннях, які активи лежать на ФОП — і побачиш, скільки з них
                зарезервовано під податки, а скільки можна вивести на себе.
              </p>
            ) : (
              <>
                <div className="mt-3 space-y-1.5 text-[15px]">
                  <Line label="Гривня" value={formatMoney(balance.uah, "UAH")} />
                  <Line
                    label={`Валюта ≈ ${formatMoney(balance.fxUsd, "USD", true)}`}
                    value={formatMoney(balance.fxUah, "UAH")}
                  />
                  <div className="my-2 h-px bg-ink-800" />
                  <Line label="Разом" value={formatMoney(balance.total, "UAH")} strong />
                  <Line label="Резерв під податки" value={`− ${formatMoney(need.total, "UAH")}`} />
                </div>

                <div
                  className={`tnum mt-3 rounded-2xl px-4 py-3 ${
                    cover.missing > 0 ? "bg-danger/12" : "bg-accent/12"
                  }`}
                >
                  <p className={`text-sm ${cover.missing > 0 ? "text-danger" : "text-accent"}`}>
                    {cover.missing > 0 ? "Не вистачає на податки" : "Вільно вивести на себе"}
                  </p>
                  <p
                    className={`text-xl font-semibold ${
                      cover.missing > 0 ? "text-danger" : "text-accent"
                    }`}
                  >
                    {formatMoney(cover.missing > 0 ? cover.missing : cover.free, "UAH")}
                  </p>
                </div>

                {cover.missing === 0 && !cover.uahCovers && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-400">
                    Гривні на рахунку менше за резерв: щоб заплатити, доведеться продати{" "}
                    <span className="tnum font-medium text-ink-300">
                      ≈ {formatMoney(cover.sellUsd, "USD")}
                    </span>{" "}
                    (із запасом {settings.bufferPct}% на курс). Решту можна спокійно тримати в
                    доларі.
                  </p>
                )}
                {cover.uahCovers && cover.linked && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-400">
                    Гривні на рахунку вистачає на весь резерв — валюту продавати не треба.
                  </p>
                )}
              </>
            )}
          </section>

          {need.items.length > 0 && (
            <section className="rounded-3xl border border-ink-700 bg-ink-900 p-5">
              <h2 className="font-semibold">Найближчі платежі</h2>
              <ul className="mt-3 space-y-2">
                {need.items.slice(0, 4).map((item) => {
                  const days = daysLeft(item.deadline, now);
                  return (
                    <li key={item.key} className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px]">{item.label}</p>
                        <p className="truncate text-sm text-ink-400">
                          {item.quarterLabel} · до {formatDay(item.deadline)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tnum font-medium">
                          {item.growing && <span className="text-ink-400">від </span>}
                          {formatMoney(item.amount, "UAH")}
                        </p>
                        <p className="text-sm text-ink-400">
                          <DaysLeft days={days} />
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {need.items.some((i) => i.growing) && (
                <p className="mt-3 text-sm text-ink-400">
                  «від» — квартал ще не закрито, сума зросте з новими надходженнями.
                </p>
              )}
            </section>
          )}
        </div>

        <div className="mt-4 space-y-2 lg:mt-0">
          <div className="flex items-center justify-between px-1 pb-1">
            <h2 className="font-semibold">Квартали</h2>
            <button
              onClick={() => setIncomeSheet({ open: true, income: null })}
              className="text-sm font-medium text-accent transition active:scale-95"
            >
              + Надходження
            </button>
          </div>

          {!hasIncome && (
            <section className="animate-rise rounded-3xl border border-dashed border-ink-700 px-6 py-10 text-center">
              <p className="text-4xl">🧾</p>
              <p className="mt-3 font-medium">Ще немає надходжень</p>
              <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-ink-400">
                Додай кожне зарахування на рахунок ФОП — сума в гривні рахується за курсом НБУ на
                той день, і саме з неї беруться 5% і 1%.
              </p>
              <button
                onClick={() => setIncomeSheet({ open: true, income: null })}
                className="mt-5 h-12 rounded-2xl bg-accent px-6 font-semibold text-ink-950 transition active:scale-95"
              >
                Додати надходження
              </button>
            </section>
          )}

          {list.map((quarter) => (
            <QuarterCard
              key={quarter.key}
              quarter={quarter}
              now={now}
              open={openQuarter === quarter.key}
              onToggle={() => setOpenQuarter(openQuarter === quarter.key ? null : quarter.key)}
              onTogglePaid={(kind) => wallet.toggleTaxPaid(quarter.key, kind)}
              onEditIncome={(income) => setIncomeSheet({ open: true, income })}
              esvMonthly={settings.payEsv ? esvPerMonth(settings) : 0}
            />
          ))}

          <section className="mt-4 rounded-3xl border border-ink-700 bg-ink-900 p-5">
            <h2 className="font-semibold">{year} рік</h2>

            <div className="mt-3 space-y-1.5 text-[15px]">
              <Line label="Дохід" value={formatMoney(stats.income, "UAH")} strong />
              <Line label="Податки за рік" value={formatMoney(stats.taxes, "UAH")} />
              {stats.income > 0 && (
                <Line
                  label="Ефективна ставка"
                  value={`${stats.effectivePct.toFixed(1)}%`}
                />
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-ink-400">Річний ліміт 3 групи</span>
                <span className="tnum">{formatPercent(stats.limitPct)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-800">
                <div
                  className={`h-full rounded-full ${stats.limitPct > 90 ? "bg-danger" : "bg-accent"}`}
                  style={{ width: `${Math.max(stats.limitPct, 1)}%` }}
                />
              </div>
              <p className="tnum mt-2 text-sm text-ink-400">
                {formatMoney(stats.income, "UAH", true)} з {formatMoney(stats.limit, "UAH", true)} ·
                лишилось {formatMoney(Math.max(0, stats.limit - stats.income), "UAH", true)}
              </p>
            </div>

            {stats.income > 0 && (
              <p className="mt-4 rounded-2xl bg-ink-850 px-4 py-3 text-sm leading-relaxed text-ink-400">
                З кожного надходження відкладай{" "}
                <span className="tnum font-semibold text-ink-100">
                  {setAsidePct(list, settings, year).toFixed(1)}%
                </span>{" "}
                — це {settings.singleTaxPct}% ЄП, {settings.militaryPct}% ВЗ
                {settings.payEsv && ` і ЄСВ ${formatMoney(esvPerMonth(settings), "UAH")}/міс`}, з
                поправкою на твій середній дохід.
              </p>
            )}
          </section>
        </div>
      </div>

      <button
        onClick={() => setIncomeSheet({ open: true, income: null })}
        aria-label="Додати надходження"
        className="fixed right-4 z-40 grid size-14 place-items-center rounded-full bg-accent text-ink-950 shadow-lg shadow-black/40 transition active:scale-90 lg:right-8"
        style={{ bottom: "max(5.5rem, calc(env(safe-area-inset-bottom) + 5rem))" }}
      >
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={2.4}>
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>

      <IncomeSheet
        open={incomeSheet.open}
        onClose={() => setIncomeSheet({ open: false, income: null })}
        income={incomeSheet.income}
        settings={settings}
        rates={state.rates}
        onSave={wallet.upsertIncome}
        onDelete={wallet.removeIncome}
      />

      <FopSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        assets={state.assets}
        categories={state.categories}
        onChange={wallet.setFopSettings}
      />
    </main>
  );
}

function QuarterCard({
  quarter,
  now,
  open,
  onToggle,
  onTogglePaid,
  onEditIncome,
  esvMonthly,
}: {
  quarter: QuarterCalc;
  now: number;
  open: boolean;
  onToggle: () => void;
  onTogglePaid: (kind: TaxKind) => void;
  onEditIncome: (income: FopIncome) => void;
  esvMonthly: number;
}) {
  const settled = quarter.due === 0 && quarter.total > 0;
  const rows: { kind: TaxKind; amount: number; deadline: number }[] = [
    { kind: "ep", amount: quarter.ep, deadline: quarter.taxDeadline },
    { kind: "vz", amount: quarter.vz, deadline: quarter.taxDeadline },
    { kind: "esv", amount: quarter.esv, deadline: quarter.esvDeadline },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-900">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-ink-850"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{quarter.short}</span>
            {!quarter.closed && (
              <span className="shrink-0 rounded-full bg-ink-800 px-2 py-0.5 text-xs text-ink-300">
                триває
              </span>
            )}
            {settled && (
              <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                сплачено
              </span>
            )}
          </span>
          <span className="tnum block truncate text-sm text-ink-400">
            дохід {formatMoney(quarter.income, "UAH", true)}
          </span>
        </span>
        <span className="tnum shrink-0 text-right">
          <span className="block font-medium">{formatMoney(quarter.due, "UAH", true)}</span>
          <span className="block text-sm text-ink-400">до сплати</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`size-5 shrink-0 text-ink-400 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-ink-800 px-4 pt-3 pb-4">
          <div className="space-y-1.5">
            {rows.map((row) => {
              const paid = quarter.paid.includes(row.kind);
              return (
                <button
                  key={row.kind}
                  onClick={() => onTogglePaid(row.kind)}
                  aria-pressed={paid}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition active:bg-ink-850"
                >
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-md border ${
                      paid ? "border-accent bg-accent text-ink-950" : "border-ink-600"
                    }`}
                  >
                    {paid && (
                      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3.5}>
                        <path d="M5 12.5l5 5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[15px] ${paid ? "text-ink-400 line-through" : ""}`}>
                      {TAX_LABEL[row.kind]}
                    </span>
                    <span className="block truncate text-sm text-ink-400">
                      до {formatDay(row.deadline)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className={`tnum block ${paid ? "text-ink-400 line-through" : ""}`}>
                      {formatMoney(row.amount, "UAH")}
                    </span>
                    {!paid && row.amount > 0 && (
                      <span className="block text-sm text-ink-400">
                        <DaysLeft days={daysLeft(row.deadline, now)} />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {!quarter.closed && esvMonthly > 0 && quarter.esvMonths < 3 && (
            <p className="mt-2 px-2 text-sm text-ink-400">
              ЄСВ нараховано за {quarter.esvMonths}{" "}
              {plural(quarter.esvMonths, "місяць", "місяці", "місяців")} з 3 — до кінця кварталу
              добіжить ще {formatMoney(quarter.esvFull - quarter.esv, "UAH")}.
            </p>
          )}

          {quarter.incomes.length > 0 && (
            <div className="mt-3 border-t border-ink-800 pt-2">
              <p className="px-2 pb-1 text-sm text-ink-400">
                {quarter.incomes.length}{" "}
                {plural(quarter.incomes.length, "надходження", "надходження", "надходжень")} за{" "}
                {quarter.label}
              </p>
              {quarter.incomes.map((income) => (
                <button
                  key={income.id}
                  onClick={() => onEditIncome(income)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition active:bg-ink-850"
                >
                  <span className="min-w-0 flex-1">
                    <span className="tnum block text-[15px]">
                      {formatAmount(income.amount, income.currency)}
                      {income.currency !== "UAH" && (
                        <span className="text-ink-400"> × {income.rate.toFixed(2)}</span>
                      )}
                    </span>
                    <span className="block truncate text-sm text-ink-400">
                      {formatDay(income.date)}
                      {income.note && ` · ${income.note}`}
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-sm text-ink-300">
                    {formatMoney(incomeUah(income), "UAH", true)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DaysLeft({ days }: { days: number }) {
  if (days < 0) return <span className="font-medium text-danger">прострочено</span>;
  if (days === 0) return <span className="font-medium text-danger">сьогодні</span>;
  return (
    <span className={days <= 7 ? "font-medium text-danger" : undefined}>
      через {days} {plural(days, "день", "дні", "днів")}
    </span>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0 truncate text-ink-400">{label}</span>
      <span className={`tnum shrink-0 ${strong ? "font-medium" : ""}`}>{value}</span>
    </div>
  );
}
