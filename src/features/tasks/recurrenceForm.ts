import { getISODay, parseISO } from "date-fns";

import type { Recurrence } from "@/lib/domain/recurrence";
import type { ISODate } from "@/lib/domain/types";

import type { RecurrenceFormValues } from "./schema";

/**
 * Состояние редактора из правила задачи. Неиспользуемые поля заполняются
 * по сроку: день недели срока, число срока, интервал 2 дня.
 */
export function toRecurrenceForm(
  rule: Recurrence | null,
  anchor: ISODate,
): RecurrenceFormValues {
  const date = parseISO(anchor);
  const defaults: RecurrenceFormValues = {
    type: "none",
    interval: 2,
    weekdays: [getISODay(date)],
    dayOfMonth: date.getDate(),
  };
  if (!rule) return defaults;
  switch (rule.type) {
    case "daily":
      return { ...defaults, type: "daily" };
    case "every_n_days":
      return { ...defaults, type: "every_n_days", interval: rule.interval };
    case "weekly":
      return { ...defaults, type: "weekly", weekdays: rule.weekdays };
    case "monthly":
      return { ...defaults, type: "monthly", dayOfMonth: rule.dayOfMonth };
  }
}

/** Правило для базы из проверенного состояния редактора. */
export function fromRecurrenceForm(
  form: RecurrenceFormValues,
): Recurrence | null {
  switch (form.type) {
    case "none":
      return null;
    case "daily":
      return { type: "daily" };
    case "every_n_days":
      return { type: "every_n_days", interval: form.interval };
    case "weekly":
      return {
        type: "weekly",
        weekdays: [...new Set(form.weekdays)].sort((a, b) => a - b),
      };
    case "monthly":
      return { type: "monthly", dayOfMonth: form.dayOfMonth };
  }
}
