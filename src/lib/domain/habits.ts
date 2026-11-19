import { getISODay, parseISO } from "date-fns";

import { addDaysISO, daysFrom } from "./dates";
import { weekdayOptions } from "./recurrence";
import type { ISODate } from "./types";

/** Отметки можно ставить и снимать за сегодня и столько дней назад. */
export const EDITABLE_DAYS = 7;

/** Запланирована ли привычка на этот день (ISO: 1 = пн … 7 = вс). */
export function isScheduled(
  weekdays: readonly number[],
  day: ISODate,
): boolean {
  return weekdays.includes(getISODay(parseISO(day)));
}

/** Можно ли менять отметку за этот день: сегодня и 6 дней до него. */
export function canEditDay(day: ISODate, today: ISODate): boolean {
  const ago = daysFrom(day, today);
  return ago >= 0 && ago < EDITABLE_DAYS;
}

/** Последние n дней, от старого к сегодняшнему. */
export function lastDays(today: ISODate, n: number): ISODate[] {
  return Array.from({ length: n }, (_, i) => addDaysISO(today, i - n + 1));
}

/**
 * Текущий стрик: сколько запланированных дней подряд выполнено, считая
 * назад от сегодня. Дни вне расписания пропускаются. Если сегодня ещё не
 * отмечено, серия считается до прошлого запланированного дня.
 */
export function currentHabitStreak(
  weekdays: readonly number[],
  checked: ReadonlySet<ISODate>,
  today: ISODate,
): number {
  const earliest = [...checked].sort()[0];
  if (!earliest) return 0;

  let day = today;
  // Неотмеченное сегодня не рвёт серию — день ещё не закончился.
  if (!checked.has(today)) day = addDaysISO(today, -1);

  let streak = 0;
  while (daysFrom(earliest, day) >= 0) {
    if (isScheduled(weekdays, day)) {
      if (!checked.has(day)) break;
      streak += 1;
    }
    day = addDaysISO(day, -1);
  }
  return streak;
}

/** Лучший стрик за всю историю отметок, по тем же правилам. */
export function bestHabitStreak(
  weekdays: readonly number[],
  checked: ReadonlySet<ISODate>,
  today: ISODate,
): number {
  const earliest = [...checked].sort()[0];
  if (!earliest) return 0;

  let best = 0;
  let run = 0;
  for (
    let day = earliest;
    daysFrom(day, today) >= 0;
    day = addDaysISO(day, 1)
  ) {
    if (!isScheduled(weekdays, day)) continue;
    if (checked.has(day)) {
      run += 1;
      best = Math.max(best, run);
    } else if (day !== today) {
      // Сегодня ещё можно успеть — не обрываем серию на нём.
      run = 0;
    }
  }
  return best;
}

/** Доля выполненных запланированных дней за период (0–100, целое). */
export function completionRate(
  weekdays: readonly number[],
  checked: ReadonlySet<ISODate>,
  from: ISODate,
  to: ISODate,
): { done: number; scheduled: number; percent: number } {
  let done = 0;
  let scheduled = 0;
  for (let day = from; daysFrom(day, to) >= 0; day = addDaysISO(day, 1)) {
    if (!isScheduled(weekdays, day)) continue;
    scheduled += 1;
    if (checked.has(day)) done += 1;
  }
  return {
    done,
    scheduled,
    percent: scheduled === 0 ? 0 : Math.round((done / scheduled) * 100),
  };
}

/** Подпись расписания: «Каждый день», «По будням», «Пн, Ср, Пт». */
export function describeSchedule(weekdays: readonly number[]): string {
  const days = [...new Set(weekdays)].sort((a, b) => a - b);
  if (days.length === 7) return "Каждый день";
  if (days.join() === "1,2,3,4,5") return "По будням";
  if (days.join() === "6,7") return "По выходным";
  return days
    .map((d) => weekdayOptions.find((o) => o.value === d)?.label ?? "")
    .join(", ");
}

/** Короткая подпись дня в полоске отметок: «Пн». */
export function weekdayShort(day: ISODate): string {
  return weekdayOptions[getISODay(parseISO(day)) - 1]?.label ?? "";
}
