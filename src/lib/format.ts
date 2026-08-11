import { CURRENCIES } from "./defaults";

export function currencyMeta(code: string) {
  return CURRENCIES.find((c) => c.code === code);
}

/** Кількість знаків після коми для конкретної валюти (крипта — більше). */
export function decimalsFor(code: string) {
  return currencyMeta(code)?.decimals ?? 2;
}

/** Сума в її власній валюті: 0.042 BTC, 24 500,00 UAH */
export function formatAmount(amount: number, code: string) {
  const d = decimalsFor(code);
  const value = new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: amount % 1 === 0 && d > 2 ? 0 : Math.min(d, 2),
    maximumFractionDigits: d,
  }).format(amount);
  return `${value} ${code}`;
}

/** Гроші у валюті відображення. compact — для великих сум на вузьких екранах. */
export function formatMoney(value: number, code: "USD" | "UAH", compact = false) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: code,
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 1 : 2,
    notation: compact && Math.abs(value) >= 100_000 ? "compact" : "standard",
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(value < 10 ? 1 : 0)}%`;
}

export function formatDate(ts: number) {
  return new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short" }).format(ts);
}

/** Дата з роком, якщо він не поточний: дедлайни за минулі квартали не мають плутати. */
export function formatDay(ts: number) {
  const sameYear = new Date(ts).getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(ts);
}

/** Українські форми числа: 1 день, 2 дні, 5 днів. */
export function plural(n: number, one: string, few: string, many: string) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}

export function formatDateTime(ts: number) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(ts);
}

/** Приймає "1 234,56" / "1234.56" / "1 234" і повертає число. */
export function parseNumber(raw: string): number {
  const cleaned = raw
    .replace(/\s| /g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.\-]/g, "");
  const parts = cleaned.split(".");
  const normalized = parts.length > 2 ? `${parts.shift()}.${parts.join("")}` : cleaned;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}
