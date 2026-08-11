import { assetUsd, startOfDay } from "./compute";
import type { Asset, FopIncome, FopSettings, TaxKind, WalletState } from "./types";

/** ЄСВ — 22% мінімалки за кожен місяць, незалежно від того, чи був дохід. */
export const ESV_RATE = 22;

/** Річний ліміт 3 групи — 1167 мінімальних зарплат на 1 січня. */
export const LIMIT_MIN_WAGES = 1167;

export const TAX_LABEL: Record<TaxKind, string> = {
  ep: "Єдиний податок",
  vz: "Військовий збір",
  esv: "ЄСВ",
};

export const TAX_SHORT: Record<TaxKind, string> = { ep: "ЄП", vz: "ВЗ", esv: "ЄСВ" };

export const TAX_KINDS: TaxKind[] = ["ep", "vz", "esv"];

const DAY = 86_400_000;

/** Гроші рахуємо до копійки — інакше суми «пливуть» на дрібних частках. */
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function esvPerMonth(s: FopSettings) {
  return s.esvMonthly ?? round2((s.minWage * ESV_RATE) / 100);
}

export function incomeLimit(s: FopSettings) {
  return s.minWage * LIMIT_MIN_WAGES;
}

/** Дохід ФОП завжди у гривні: валюта × курс НБУ на дату зарахування. */
export function incomeUah(income: FopIncome) {
  return income.amount * income.rate;
}

/** Скільки гривень за 1 USD — з ручних курсів гаманця (там зберігається USD за 1 UAH). */
export function uahPerUsd(rates: WalletState["rates"]) {
  return rates.UAH > 0 ? 1 / rates.UAH : 0;
}

/** Курс НБУ для підказки у формі: скільки гривень коштує 1 одиниця валюти. */
export function uahPerUnit(code: string, rates: WalletState["rates"]) {
  if (code === "UAH") return 1;
  const unit = rates[code];
  if (!unit || !rates.UAH) return 0;
  return unit / rates.UAH;
}

// --- Квартали -------------------------------------------------------------

export type Quarter = { year: number; q: number };

export function quarterOf(ts: number): Quarter {
  const d = new Date(ts);
  return { year: d.getFullYear(), q: Math.floor(d.getMonth() / 3) + 1 };
}

export function quarterKey({ year, q }: Quarter) {
  return `${year}-Q${q}`;
}

export function quarterLabel({ year, q }: Quarter) {
  return `${q} квартал ${year}`;
}

/** Коротка форма для рядків списків, де повна назва не влазить у ширину екрана. */
export function quarterShort({ year, q }: Quarter) {
  return `${q} кв. ${year}`;
}

/** Наскрізний номер кварталу — щоб порівнювати й перебирати діапазони. */
function quarterIndex({ year, q }: Quarter) {
  return year * 4 + (q - 1);
}

function quarterFromIndex(index: number): Quarter {
  return { year: Math.floor(index / 4), q: (index % 4) + 1 };
}

/**
 * ЄП і ВЗ: 40 днів на квартальну декларацію + 10 на сплату = 50 днів після кварталу
 * (20 травня, 19 серпня, 19 листопада, 19 лютого). Вихідні цей строк не переносять.
 *
 * Дні додаємо через setDate, а не через +50*DAY: між 30 вересня і 19 листопада
 * Україна переходить на зимовий час, і арифметика в мілісекундах з'їдала б добу.
 */
export function taxDeadline({ year, q }: Quarter) {
  const d = new Date(year, q * 3, 0);
  d.setDate(d.getDate() + 50);
  return startOfDay(d.getTime());
}

/**
 * ЄСВ: до 19 числа місяця після кварталу. Тут строк, навпаки, переноситься на
 * найближчий робочий день — свята не враховуємо, тільки суботу й неділю.
 */
export function esvDeadline({ year, q }: Quarter) {
  const d = new Date(year, q * 3, 19);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return startOfDay(d.getTime());
}

/**
 * Скільки місяців ЄСВ уже «набігло». Поточний місяць рахуємо повністю: ЄСВ
 * нараховується за місяць цілком, навіть якщо він щойно почався.
 */
function esvMonthsAccrued(quarter: Quarter, now: number) {
  const current = quarterOf(now);
  const diff = quarterIndex(quarter) - quarterIndex(current);
  if (diff > 0) return 0;
  if (diff < 0) return 3;
  return (new Date(now).getMonth() % 3) + 1;
}

// --- Розрахунок кварталу ---------------------------------------------------

export type QuarterCalc = {
  key: string;
  quarter: Quarter;
  label: string;
  short: string;
  incomes: FopIncome[];
  income: number;
  ep: number;
  vz: number;
  esv: number;
  /** ЄСВ за всі 3 місяці — щоб показати, скільки ще добіжить до кінця кварталу. */
  esvFull: number;
  esvMonths: number;
  total: number;
  paid: TaxKind[];
  due: number;
  closed: boolean;
  taxDeadline: number;
  esvDeadline: number;
};

export function calcQuarter(state: WalletState, quarter: Quarter, now: number): QuarterCalc {
  const { settings, incomes, paid } = state.fop;
  const key = quarterKey(quarter);

  const list = incomes
    .filter((i) => quarterKey(quarterOf(i.date)) === key)
    .sort((a, b) => b.date - a.date);

  const income = round2(list.reduce((sum, i) => sum + incomeUah(i), 0));
  const ep = round2((income * settings.singleTaxPct) / 100);
  const vz = round2((income * settings.militaryPct) / 100);

  const months = esvMonthsAccrued(quarter, now);
  const perMonth = settings.payEsv ? esvPerMonth(settings) : 0;
  const esv = round2(perMonth * months);
  const esvFull = round2(perMonth * 3);

  const paidKinds = paid[key] ?? [];
  const amounts: Record<TaxKind, number> = { ep, vz, esv };
  const due = round2(
    TAX_KINDS.reduce((sum, kind) => (paidKinds.includes(kind) ? sum : sum + amounts[kind]), 0),
  );

  return {
    key,
    quarter,
    label: quarterLabel(quarter),
    short: quarterShort(quarter),
    incomes: list,
    income,
    ep,
    vz,
    esv,
    esvFull,
    esvMonths: months,
    total: round2(ep + vz + esv),
    paid: paidKinds,
    due,
    closed: quarterIndex(quarter) < quarterIndex(quarterOf(now)),
    taxDeadline: taxDeadline(quarter),
    esvDeadline: esvDeadline(quarter),
  };
}

/**
 * Квартали від найпершого надходження до поточного — навіть порожні, бо ЄСВ
 * нараховується і в місяці без доходу. Нові — зверху.
 */
export function quarters(state: WalletState, now: number): QuarterCalc[] {
  const current = quarterIndex(quarterOf(now));
  const indexes = state.fop.incomes.map((i) => quarterIndex(quarterOf(i.date)));
  const from = Math.min(current, ...indexes);
  const to = Math.max(current, ...indexes);

  const list: QuarterCalc[] = [];
  for (let i = to; i >= from; i--) list.push(calcQuarter(state, quarterFromIndex(i), now));
  return list;
}

// --- Резерв ---------------------------------------------------------------

export type ReserveItem = {
  key: string;
  kind: TaxKind;
  label: string;
  quarterLabel: string;
  amount: number;
  deadline: number;
  /** Квартал ще триває — сума до дедлайну зросте з новими надходженнями. */
  growing: boolean;
};

/** Усе, що нараховано, але ще не сплачено — від найближчого дедлайну до дальшого. */
export function reserveItems(list: QuarterCalc[]): ReserveItem[] {
  const items: ReserveItem[] = [];

  for (const quarter of list) {
    const rows: { kind: TaxKind; amount: number; deadline: number }[] = [
      { kind: "ep", amount: quarter.ep, deadline: quarter.taxDeadline },
      { kind: "vz", amount: quarter.vz, deadline: quarter.taxDeadline },
      { kind: "esv", amount: quarter.esv, deadline: quarter.esvDeadline },
    ];

    for (const row of rows) {
      if (row.amount <= 0 || quarter.paid.includes(row.kind)) continue;
      items.push({
        key: `${quarter.key}-${row.kind}`,
        kind: row.kind,
        label: TAX_LABEL[row.kind],
        quarterLabel: quarter.short,
        amount: row.amount,
        deadline: row.deadline,
        growing: !quarter.closed,
      });
    }
  }

  return items.sort((a, b) => a.deadline - b.deadline);
}

export type Reserve = {
  items: ReserveItem[];
  total: number;
  byKind: Record<TaxKind, number>;
  /** Прострочене — його треба закривати негайно, тому рахуємо окремо. */
  overdue: number;
  next: ReserveItem | null;
};

export function reserve(list: QuarterCalc[], now: number): Reserve {
  const items = reserveItems(list);
  const byKind: Record<TaxKind, number> = { ep: 0, vz: 0, esv: 0 };
  let overdue = 0;
  const today = startOfDay(now);

  for (const item of items) {
    byKind[item.kind] = round2(byKind[item.kind] + item.amount);
    if (item.deadline < today) overdue = round2(overdue + item.amount);
  }

  return {
    items,
    total: round2(items.reduce((sum, i) => sum + i.amount, 0)),
    byKind,
    overdue,
    next: items.find((i) => i.deadline >= today) ?? items[0] ?? null,
  };
}

export function daysLeft(deadline: number, now: number) {
  return Math.round((startOfDay(deadline) - startOfDay(now)) / DAY);
}

// --- Рахунки ФОП ----------------------------------------------------------

export type FopBalance = {
  assets: Asset[];
  /** Гривня на рахунку — тільки нею можна заплатити податок без конвертації. */
  uah: number;
  /** Валютна частина: у гривневому еквіваленті й у доларах. */
  fxUah: number;
  fxUsd: number;
  total: number;
};

export function fopBalance(state: WalletState): FopBalance {
  const ids = new Set(state.fop.settings.accountIds);
  const assets = state.assets.filter((a) => ids.has(a.id));
  const rate = uahPerUsd(state.rates);

  let uah = 0;
  let fxUsd = 0;

  for (const asset of assets) {
    if (asset.currency === "UAH") uah += asset.amount;
    else fxUsd += assetUsd(asset, state.rates);
  }

  const fxUah = round2(fxUsd * rate);
  return { assets, uah: round2(uah), fxUah, fxUsd: round2(fxUsd), total: round2(uah + fxUah) };
}

export type Coverage = {
  linked: boolean;
  need: number;
  /** Скільки лишається вільним після резерву — це можна виводити на себе. */
  free: number;
  /** Скільки не вистачає на рахунках ФОП узагалі. */
  missing: number;
  /** Гривні бракує → стільки валюти доведеться продати (із запасом на курс). */
  sellUsd: number;
  uahCovers: boolean;
};

export function coverage(state: WalletState, need: number, balance: FopBalance): Coverage {
  const { accountIds, bufferPct } = state.fop.settings;
  const rate = uahPerUsd(state.rates);
  const gap = Math.max(0, round2(need - balance.uah));

  return {
    linked: accountIds.length > 0,
    need,
    free: round2(balance.total - need),
    missing: Math.max(0, round2(need - balance.total)),
    sellUsd: rate > 0 ? round2((gap * (1 + bufferPct / 100)) / rate) : 0,
    uahCovers: gap === 0,
  };
}

// --- Рік ------------------------------------------------------------------

export type YearStats = {
  year: number;
  income: number;
  taxes: number;
  /** Ефективна ставка з урахуванням ЄСВ — стільки насправді «з'їдає» кожна гривня. */
  effectivePct: number;
  limit: number;
  limitPct: number;
};

export function yearStats(list: QuarterCalc[], settings: FopSettings, year: number): YearStats {
  const inYear = list.filter((q) => q.quarter.year === year);
  const income = round2(inYear.reduce((sum, q) => sum + q.income, 0));
  const taxes = round2(inYear.reduce((sum, q) => sum + q.total, 0));
  const limit = incomeLimit(settings);

  return {
    year,
    income,
    taxes,
    effectivePct: income > 0 ? (taxes / income) * 100 : 0,
    limit,
    limitPct: limit > 0 ? Math.min(100, (income / limit) * 100) : 0,
  };
}

/**
 * Скільки відкладати з кожного надходження. ЄП і ВЗ — це чистий відсоток, а ЄСВ
 * фіксований, тому його розмазуємо по середньомісячному доходу за рік.
 */
export function setAsidePct(list: QuarterCalc[], settings: FopSettings, year: number) {
  const base = settings.singleTaxPct + settings.militaryPct;
  const stats = yearStats(list, settings, year);
  if (!settings.payEsv || stats.income <= 0) return base;

  const esv = list.filter((q) => q.quarter.year === year).reduce((sum, q) => sum + q.esv, 0);
  return base + (esv / stats.income) * 100;
}
