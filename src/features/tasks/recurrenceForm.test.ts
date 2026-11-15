import { describe, expect, it } from "vitest";

import type { Recurrence } from "@/lib/domain/recurrence";

import { fromRecurrenceForm, toRecurrenceForm } from "./recurrenceForm";
import { taskFormSchema, type TaskFormValues } from "./schema";

// 2026-11-18 — среда, 18-е число.
const ANCHOR = "2026-11-18";

describe("toRecurrenceForm / fromRecurrenceForm", () => {
  it.each<Recurrence | null>([
    null,
    { type: "daily" },
    { type: "every_n_days", interval: 5 },
    { type: "weekly", weekdays: [1, 3, 5] },
    { type: "monthly", dayOfMonth: 31 },
  ])("туда и обратно: %j", (rule) => {
    expect(fromRecurrenceForm(toRecurrenceForm(rule, ANCHOR))).toEqual(rule);
  });

  it("неиспользуемые поля заполняются по сроку", () => {
    expect(toRecurrenceForm(null, ANCHOR)).toEqual({
      type: "none",
      interval: 2,
      weekdays: [3],
      dayOfMonth: 18,
    });
  });

  it("дни недели сортируются и не повторяются", () => {
    expect(
      fromRecurrenceForm({
        type: "weekly",
        interval: 2,
        weekdays: [5, 1, 5],
        dayOfMonth: 1,
      }),
    ).toEqual({ type: "weekly", weekdays: [1, 5] });
  });
});

describe("taskFormSchema — повтор", () => {
  const base: TaskFormValues = {
    title: "Зарядка",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: ANCHOR,
    location: "inbox",
    tagIds: [],
    recurrence: toRecurrenceForm(null, ANCHOR),
  };

  const errors = (patch: Partial<TaskFormValues>) => {
    const result = taskFormSchema.safeParse({ ...base, ...patch });
    return result.success
      ? []
      : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  };

  it("повтору нужен срок", () => {
    expect(
      errors({
        dueDate: "",
        recurrence: { ...base.recurrence, type: "daily" },
      }),
    ).toEqual(["dueDate: Для повтора нужен срок"]);
  });

  it("без повтора срок не обязателен", () => {
    expect(errors({ dueDate: "" })).toEqual([]);
  });

  it("проверяет интервал, дни недели и число месяца", () => {
    expect(
      errors({
        recurrence: { ...base.recurrence, type: "every_n_days", interval: 1 },
      }),
    ).toEqual(["recurrence.interval: Целое число от 2 до 365"]);
    expect(
      errors({
        recurrence: { ...base.recurrence, type: "weekly", weekdays: [] },
      }),
    ).toEqual(["recurrence.weekdays: Выберите хотя бы один день"]);
    expect(
      errors({
        recurrence: {
          ...base.recurrence,
          type: "monthly",
          dayOfMonth: Number.NaN,
        },
      }),
    ).toEqual(["recurrence.dayOfMonth: Число от 1 до 31"]);
  });
});

describe("taskFormSchema — пустые числовые поля", () => {
  it("не мешают, если тип повтора их не использует", () => {
    const result = taskFormSchema.safeParse({
      title: "Зарядка",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: ANCHOR,
      location: "inbox",
      tagIds: [],
      recurrence: {
        type: "daily",
        interval: Number.NaN,
        weekdays: [],
        dayOfMonth: Number.NaN,
      },
    });
    expect(result.success).toBe(true);
  });
});
