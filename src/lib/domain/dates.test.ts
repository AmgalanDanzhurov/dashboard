import { describe, expect, it } from "vitest";

import { addDaysISO, daysFrom, dueLabel, formatDue, toISODate } from "./dates";

describe("dates", () => {
  it("toISODate берёт локальную дату, а не UTC", () => {
    // 23:30 по местному времени — всё ещё тот же день.
    expect(toISODate(new Date(2026, 10, 12, 23, 30))).toBe("2026-11-12");
  });

  it("addDaysISO переходит через месяц и год", () => {
    expect(addDaysISO("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysISO("2026-11-12", -12)).toBe("2026-10-31");
  });

  it("daysFrom считает календарные дни", () => {
    expect(daysFrom("2026-11-12", "2026-11-12")).toBe(0);
    expect(daysFrom("2026-11-12", "2026-11-13")).toBe(1);
    expect(daysFrom("2026-11-12", "2026-11-05")).toBe(-7);
  });

  it("formatDue пишет «20 окт» без точки, год — только для другого года", () => {
    expect(formatDue("2026-10-20", "2026-11-12")).toBe("20 окт");
    expect(formatDue("2027-01-05", "2026-11-12")).toBe("5 янв 2027");
  });
});

describe("dueLabel", () => {
  it("ближайшие дни словами, остальные — датой", () => {
    expect(dueLabel("2026-11-12", "2026-11-12")).toBe("Сегодня");
    expect(dueLabel("2026-11-13", "2026-11-12")).toBe("Завтра");
    expect(dueLabel("2026-11-11", "2026-11-12")).toBe("Вчера");
    expect(dueLabel("2026-11-20", "2026-11-12")).toBe("20 ноя");
  });
});

describe("formatDue — все месяцы", () => {
  it("трёхбуквенные сокращения без точек", () => {
    const labels = Array.from({ length: 12 }, (_, i) =>
      formatDue(`2026-${String(i + 1).padStart(2, "0")}-01`, "2026-06-01"),
    );
    expect(labels).toEqual([
      "1 янв",
      "1 фев",
      "1 мар",
      "1 апр",
      "1 мая",
      "1 июн",
      "1 июл",
      "1 авг",
      "1 сен",
      "1 окт",
      "1 ноя",
      "1 дек",
    ]);
  });
});
