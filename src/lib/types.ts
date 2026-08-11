export type CurrencyCode = string;

export type CategoryKind = "bank" | "crypto" | "cash" | "invest" | "other";

export type Category = {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
  emoji: string;
};

export type Asset = {
  id: string;
  name: string;
  categoryId: string;
  currency: CurrencyCode;
  amount: number;
  note?: string;
  updatedAt: number;
};

/** Курс: скільки USD коштує 1 одиниця валюти. */
export type Rates = Record<CurrencyCode, number>;

export type Snapshot = {
  /** Початок доби (локальний), щоб мати максимум 1 точку на день. */
  day: number;
  totalUsd: number;
};

export type TaxKind = "ep" | "vz" | "esv";

/** Надходження на рахунок ФОП — саме дата зарахування визначає квартал і курс. */
export type FopIncome = {
  id: string;
  date: number;
  currency: CurrencyCode;
  amount: number;
  /** Курс НБУ на дату надходження: скільки гривень за 1 одиницю. Для UAH — 1. */
  rate: number;
  note?: string;
};

export type FopSettings = {
  /** Ставка єдиного податку: 5 — без ПДВ, 3 — з ПДВ. */
  singleTaxPct: number;
  militaryPct: number;
  payEsv: boolean;
  /** Мінімалка на 1 січня: база і для ЄСВ, і для річного ліміту. */
  minWage: number;
  /** Якщо платиш більше мінімального ЄСВ — сума на місяць. Інакше рахуємо з мінімалки. */
  esvMonthly?: number;
  /** Запас на курс: долар до дня сплати може здорожчати. */
  bufferPct: number;
  /** Активи-рахунки ФОП — з ними порівнюємо резерв. */
  accountIds: string[];
};

export type FopState = {
  incomes: FopIncome[];
  /** «2026-Q2» → податки цього кварталу, які вже сплачені. */
  paid: Record<string, TaxKind[]>;
  settings: FopSettings;
};

export type WalletState = {
  version: number;
  categories: Category[];
  assets: Asset[];
  rates: Rates;
  ratesUpdatedAt: number;
  history: Snapshot[];
  fop: FopState;
};
