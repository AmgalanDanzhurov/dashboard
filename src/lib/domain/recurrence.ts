import { addDays, getDaysInMonth, getISODay, parseISO } from "date-fns";
import { z } from "zod";

import { addDaysISO, daysFrom, toISODate } from "./dates";
import { plural } from "./plural";
import type { ISODate } from "./types";

/** Правило повторения. Хранится в tasks.recurrence (jsonb). */
export const recurrenceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("daily") }),
  z.object({
    type: z.literal("every_n_days"),
    interval: z.number().int().min(2).max(365),
  }),
  z.object({
    type: z.literal("weekly"),
    /** ISO: 1 = пн … 7 = вс. */
    weekdays: z.array(z.number().int().min(1).max(7)).min(1),
  }),
  z.object({
    type: z.literal("monthly"),
    /** 1–31; если в месяце меньше дней — последний день месяца. */
    dayOfMonth: z.number().int().min(1).max(31),
  }),
]);

export type Recurrence = z.infer<typeof recurrenceSchema>;

/** Правило из базы или null, если задача не повторяется (или правило битое). */
export function parseRecurrence(value: unknown): Recurrence | null {
  const parsed = recurrenceSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Дата day-го числа месяца с учётом его длины: 31 → 28/29 февраля. */
function clampedDayOfMonth(year: number, month: number, day: number): ISODate {
  const last = getDaysInMonth(new Date(year, month, 1));
  return toISODate(new Date(year, month, Math.min(day, last)));
}

/**
 * Срок следующего экземпляра: первая дата по правилу, которая строго позже
 * и текущего срока, и сегодняшнего дня. Пропущенные периоды просроченной
 * задачи не создаются.
 */
export function getNextDueDate(
  rule: Recurrence,
  currentDue: ISODate,
  today: ISODate,
): ISODate {
  // Самая поздняя из двух дат: следующий срок должен быть позже неё.
  const floor = daysFrom(currentDue, today) > 0 ? today : currentDue;

  switch (rule.type) {
    case "daily":
      return addDaysISO(floor, 1);

    case "every_n_days": {
      // Шагаем от текущего срока, чтобы не сбивать ритм:
      // «раз в 3 дня» остаётся в той же сетке дат даже после просрочки.
      const behind = daysFrom(currentDue, floor);
      const steps = Math.floor(behind / rule.interval) + 1;
      return addDaysISO(currentDue, steps * rule.interval);
    }

    case "weekly": {
      const start = parseISO(floor);
      for (let i = 1; i <= 7; i += 1) {
        const date = addDays(start, i);
        if (rule.weekdays.includes(getISODay(date))) return toISODate(date);
      }
      // Недостижимо: schema требует хотя бы один день недели.
      return addDaysISO(floor, 7);
    }

    case "monthly": {
      const due = parseISO(currentDue);
      let year = due.getFullYear();
      let month = due.getMonth();
      // Начинаем с месяца текущего срока: если число по правилу ещё впереди,
      // оно и будет следующим сроком.
      for (;;) {
        const candidate = clampedDayOfMonth(year, month, rule.dayOfMonth);
        if (daysFrom(floor, candidate) > 0) return candidate;
        month += 1;
        if (month === 12) {
          month = 0;
          year += 1;
        }
      }
    }
  }
}

const WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

export const weekdayOptions = WEEKDAY_SHORT.map((label, i) => ({
  value: i + 1,
  label,
}));

/** Подпись для бейджа: «Каждый день», «Каждые 3 дня», «Пн, Ср, Пт», «Каждое 15-е число». */
export function describeRecurrence(rule: Recurrence): string {
  switch (rule.type) {
    case "daily":
      return "Каждый день";
    case "every_n_days":
      return `Каждые ${rule.interval} ${plural(rule.interval, ["день", "дня", "дней"])}`;
    case "weekly": {
      const days = [...new Set(rule.weekdays)].sort((a, b) => a - b);
      if (days.length === 7) return "Каждый день";
      if (days.join() === "1,2,3,4,5") return "По будням";
      if (days.join() === "6,7") return "По выходным";
      return days.map((d) => WEEKDAY_SHORT[d - 1]).join(", ");
    }
    case "monthly":
      return `Каждое ${rule.dayOfMonth}-е число`;
  }
}
