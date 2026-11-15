import { describe, expect, it } from "vitest";

import {
  describeRecurrence,
  getNextDueDate,
  parseRecurrence,
  type Recurrence,
} from "./recurrence";

const next = (rule: Recurrence, due: string, today: string) =>
  getNextDueDate(rule, due, today);

describe("getNextDueDate — каждый день", () => {
  const rule: Recurrence = { type: "daily" };

  it("выполнено в срок — следующий день", () => {
    expect(next(rule, "2026-11-16", "2026-11-16")).toBe("2026-11-17");
  });

  it("выполнено раньше срока — день после срока", () => {
    expect(next(rule, "2026-11-20", "2026-11-16")).toBe("2026-11-21");
  });

  it("просрочка на несколько дней — завтра, пропущенные дни не создаются", () => {
    expect(next(rule, "2026-11-10", "2026-11-16")).toBe("2026-11-17");
  });

  it("переход через месяц и год", () => {
    expect(next(rule, "2026-12-31", "2026-12-31")).toBe("2027-01-01");
  });
});

describe("getNextDueDate — каждые N дней", () => {
  const rule: Recurrence = { type: "every_n_days", interval: 3 };

  it("в срок — плюс N дней", () => {
    expect(next(rule, "2026-11-16", "2026-11-16")).toBe("2026-11-19");
  });

  it("раньше срока — плюс N от срока", () => {
    expect(next(rule, "2026-11-18", "2026-11-16")).toBe("2026-11-21");
  });

  it("просрочка на несколько периодов — ритм сохраняется", () => {
    // Сетка: 1, 4, 7, 10, 13, 16, 19… Сегодня 16-е — следующий срок 19-е.
    expect(next(rule, "2026-11-01", "2026-11-16")).toBe("2026-11-19");
    // Сегодня 17-е — тоже 19-е.
    expect(next(rule, "2026-11-01", "2026-11-17")).toBe("2026-11-19");
  });
});

describe("getNextDueDate — по дням недели", () => {
  // 2026-11-16 — понедельник.
  const monWedFri: Recurrence = { type: "weekly", weekdays: [1, 3, 5] };

  it("ближайший следующий день из списка", () => {
    expect(next(monWedFri, "2026-11-16", "2026-11-16")).toBe("2026-11-18");
    expect(next(monWedFri, "2026-11-18", "2026-11-18")).toBe("2026-11-20");
  });

  it("переход через воскресенье", () => {
    // Пятница 20-е → понедельник 23-е.
    expect(next(monWedFri, "2026-11-20", "2026-11-20")).toBe("2026-11-23");
    const sunday: Recurrence = { type: "weekly", weekdays: [7] };
    expect(next(sunday, "2026-11-22", "2026-11-22")).toBe("2026-11-29");
  });

  it("просрочка — ближайший день после сегодня", () => {
    // Срок был в среду 4-го, сегодня вторник 17-е → среда 18-е.
    expect(next(monWedFri, "2026-11-04", "2026-11-17")).toBe("2026-11-18");
  });
});

describe("getNextDueDate — каждый месяц", () => {
  it("то же число следующего месяца", () => {
    const rule: Recurrence = { type: "monthly", dayOfMonth: 15 };
    expect(next(rule, "2026-11-15", "2026-11-15")).toBe("2026-12-15");
    expect(next(rule, "2026-12-15", "2026-12-15")).toBe("2027-01-15");
  });

  it("31-е число: в феврале — последний день, в марте — снова 31-е", () => {
    const rule: Recurrence = { type: "monthly", dayOfMonth: 31 };
    expect(next(rule, "2027-01-31", "2027-01-31")).toBe("2027-02-28");
    expect(next(rule, "2027-02-28", "2027-02-28")).toBe("2027-03-31");
    expect(next(rule, "2026-10-31", "2026-10-31")).toBe("2026-11-30");
  });

  it("високосный год — 29 февраля", () => {
    const rule: Recurrence = { type: "monthly", dayOfMonth: 30 };
    expect(next(rule, "2028-01-30", "2028-01-30")).toBe("2028-02-29");
  });

  it("просрочка на несколько месяцев — ближайшее число после сегодня", () => {
    const rule: Recurrence = { type: "monthly", dayOfMonth: 10 };
    expect(next(rule, "2026-08-10", "2026-11-16")).toBe("2026-12-10");
    expect(next(rule, "2026-08-10", "2026-11-05")).toBe("2026-11-10");
  });

  it("срок поставлен раньше числа правила — это число в том же месяце", () => {
    const rule: Recurrence = { type: "monthly", dayOfMonth: 20 };
    expect(next(rule, "2026-11-12", "2026-11-12")).toBe("2026-11-20");
  });
});

describe("describeRecurrence", () => {
  it.each<[Recurrence, string]>([
    [{ type: "daily" }, "Каждый день"],
    [{ type: "every_n_days", interval: 3 }, "Каждые 3 дня"],
    [{ type: "every_n_days", interval: 10 }, "Каждые 10 дней"],
    [{ type: "weekly", weekdays: [5, 1, 3] }, "Пн, Ср, Пт"],
    [{ type: "weekly", weekdays: [1, 2, 3, 4, 5] }, "По будням"],
    [{ type: "weekly", weekdays: [6, 7] }, "По выходным"],
    [{ type: "monthly", dayOfMonth: 15 }, "Каждое 15-е число"],
  ])("%j → %s", (rule, label) => {
    expect(describeRecurrence(rule)).toBe(label);
  });
});

describe("parseRecurrence", () => {
  it("принимает правило из базы и отвергает мусор", () => {
    expect(parseRecurrence({ type: "daily" })).toEqual({ type: "daily" });
    expect(parseRecurrence(null)).toBeNull();
    expect(parseRecurrence({ type: "weekly", weekdays: [] })).toBeNull();
    expect(parseRecurrence({ type: "every_n_days", interval: 1 })).toBeNull();
  });
});
