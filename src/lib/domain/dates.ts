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

/** «20 окт»; для другого года — «20 окт 2027». */
export function formatDue(date: ISODate, today: ISODate): string {
  const sameYear = date.slice(0, 4) === today.slice(0, 4);
  return format(parseISO(date), sameYear ? "d MMM" : "d MMM yyyy", {
    locale: ru,
  }).replace(".", "");
}
