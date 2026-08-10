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

export type WalletState = {
  version: number;
  categories: Category[];
  assets: Asset[];
  rates: Rates;
  ratesUpdatedAt: number;
  history: Snapshot[];
};
