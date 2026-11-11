import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import type { ISODate } from "./types";

// Все даты сроков — календарные дни в часовом поясе браузера.
// «Сегодня» передаётся параметром, чтобы функции не зависели от часов.

export function toISODate(date: Date): ISODate {
  return format(date, "yyyy-MM-dd");
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function addDaysISO(date: ISODate, days: number): ISODate {
  return toISODate(addDays(parseISO(date), days));
}

/** Сколько календарных дней от today до date (отрицательное — в прошлом). */
export function daysFrom(today: ISODate, date: ISODate): number {
  return differenceInCalendarDays(parseISO(date), parseISO(today));
}

// Свои сокращения: у date-fns они разной длины («сент.», «нояб.», «мая»),
// а в списках нужно единообразное «20 окт».
const MONTHS = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
] as const;

/** «20 окт»; для другого года — «20 окт 2027». */
export function formatDue(date: ISODate, today: ISODate): string {
  const [year, month, day] = date.split("-").map(Number);
  const label = `${day} ${MONTHS[month - 1]}`;
  return date.slice(0, 4) === today.slice(0, 4) ? label : `${label} ${year}`;
}

/** «12 ноября 2026» — полная дата для подписей и подсказок. */
export function formatLongDate(date: ISODate): string {
  return format(parseISO(date), "d MMMM yyyy", { locale: ru });
}

/** Подпись срока в списке: «Сегодня», «Завтра», «Вчера» или «20 окт». */
export function dueLabel(date: ISODate, today: ISODate): string {
  const days = daysFrom(today, date);
  if (days === 0) return "Сегодня";
  if (days === 1) return "Завтра";
  if (days === -1) return "Вчера";
  return formatDue(date, today);
}

/**
 * Календарный день метки времени из базы (created_at, completed_at) в
 * часовом поясе браузера. Нельзя брать первые 10 символов строки: это день
 * по UTC, и вечерние задачи «уезжают» на соседний день.
 */
export function localDateOf(timestamp: string): ISODate {
  return toISODate(new Date(timestamp));
}
