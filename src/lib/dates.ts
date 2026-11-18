/**
 * Datas de calendário ("YYYY-MM-DD") sem horário. Toda aritmética é feita
 * em UTC para não sofrer com fuso/horário de verão.
 */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Data de hoje no fuso informado (ex.: America/Bahia). */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  // en-CA formata como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Dias entre duas datas (b - a). */
export function diffInDays(a: string, b: string): number {
  return Math.round(
    (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000,
  );
}

export type DateRange = { from: string; to: string };

/** Últimos N dias até `today`, inclusive. */
export function lastDays(today: string, days: number): DateRange {
  return { from: addDays(today, -(days - 1)), to: today };
}

export function isWithin(date: string, range: DateRange): boolean {
  return date >= range.from && date <= range.to;
}

/** Lista todas as datas do intervalo (inclusive). */
export function eachDay(range: DateRange): string[] {
  const days: string[] = [];
  for (let d = range.from; d <= range.to; d = addDays(d, 1)) days.push(d);
  return days;
}

const shortFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });
const fullFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const longFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

const toUtc = (date: string) => new Date(`${date}T00:00:00Z`);

/** 18/11 */
export const formatDateShort = (date: string) => shortFormatter.format(toUtc(date));
/** 18/11/2026 */
export const formatDate = (date: string) => fullFormatter.format(toUtc(date));
/** quarta-feira, 18 de novembro */
export const formatDateLong = (date: string) => longFormatter.format(toUtc(date));
