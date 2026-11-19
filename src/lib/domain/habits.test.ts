import { describe, expect, it } from "vitest";

import {
  bestHabitStreak,
  canEditDay,
  completionRate,
  currentHabitStreak,
  describeSchedule,
  isScheduled,
  lastDays,
  weekdayShort,
} from "./habits";

// 2026-11-20 — пятница. 16-е — понедельник, 18-е — среда.
const TODAY = "2026-11-20";
const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];
const MON_WED_FRI = [1, 3, 5];

const set = (...days: string[]) => new Set(days);

describe("isScheduled / canEditDay / lastDays", () => {
  it("расписание по дням недели", () => {
    expect(isScheduled(MON_WED_FRI, "2026-11-16")).toBe(true);
    expect(isScheduled(MON_WED_FRI, "2026-11-17")).toBe(false);
    expect(isScheduled(EVERY_DAY, "2026-11-22")).toBe(true);
  });

  it("менять можно сегодня и 6 дней назад, не будущее", () => {
    expect(canEditDay(TODAY, TODAY)).toBe(true);
    expect(canEditDay("2026-11-14", TODAY)).toBe(true);
    expect(canEditDay("2026-11-13", TODAY)).toBe(false);
    expect(canEditDay("2026-11-21", TODAY)).toBe(false);
  });

  it("последние 7 дней от старого к сегодня", () => {
    expect(lastDays(TODAY, 7)).toEqual([
      "2026-11-14",
      "2026-11-15",
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
    ]);
    expect(weekdayShort("2026-11-16")).toBe("Пн");
  });
});

describe("currentHabitStreak — каждый день", () => {
  it("дни подряд, включая сегодня", () => {
    expect(
      currentHabitStreak(
        EVERY_DAY,
        set("2026-11-18", "2026-11-19", TODAY),
        TODAY,
      ),
    ).toBe(3);
  });

  it("сегодня не отмечено — серия до вчера не обнуляется", () => {
    expect(
      currentHabitStreak(EVERY_DAY, set("2026-11-18", "2026-11-19"), TODAY),
    ).toBe(2);
  });

  it("пропуск вчера обрывает серию", () => {
    expect(
      currentHabitStreak(EVERY_DAY, set("2026-11-17", "2026-11-18"), TODAY),
    ).toBe(0);
    expect(currentHabitStreak(EVERY_DAY, set("2026-11-17", TODAY), TODAY)).toBe(
      1,
    );
  });

  it("без отметок — ноль", () => {
    expect(currentHabitStreak(EVERY_DAY, set(), TODAY)).toBe(0);
  });
});

describe("currentHabitStreak — по дням недели", () => {
  it("дни вне расписания пропускаются и серию не рвут", () => {
    // Пн 16, Ср 18, Пт 20 — три запланированных дня подряд.
    expect(
      currentHabitStreak(
        MON_WED_FRI,
        set("2026-11-16", "2026-11-18", TODAY),
        TODAY,
      ),
    ).toBe(3);
  });

  it("сегодня не по расписанию — считаем с прошлого запланированного", () => {
    // Сб 21: запланированы Пн, Ср, Пт.
    expect(
      currentHabitStreak(
        MON_WED_FRI,
        set("2026-11-18", "2026-11-20"),
        "2026-11-21",
      ),
    ).toBe(2);
  });

  it("пропущенная среда обрывает серию", () => {
    expect(
      currentHabitStreak(MON_WED_FRI, set("2026-11-16", TODAY), TODAY),
    ).toBe(1);
  });

  it("отметки в дни вне расписания не добавляются к серии", () => {
    expect(
      currentHabitStreak(
        MON_WED_FRI,
        set("2026-11-17", "2026-11-19", TODAY),
        TODAY,
      ),
    ).toBe(1);
  });
});

describe("bestHabitStreak", () => {
  it("находит лучшую серию в прошлом", () => {
    const checked = set(
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04", // 4 подряд
      "2026-11-06",
      "2026-11-07", // 2 подряд
      "2026-11-19",
    );
    expect(bestHabitStreak(EVERY_DAY, checked, TODAY)).toBe(4);
  });

  it("с расписанием дни вне его не рвут серию", () => {
    // Пн 2, Ср 4, Пт 6, Пн 9 — четыре запланированных дня подряд.
    const checked = set("2026-11-02", "2026-11-04", "2026-11-06", "2026-11-09");
    expect(bestHabitStreak(MON_WED_FRI, checked, TODAY)).toBe(4);
  });

  it("без отметок — ноль", () => {
    expect(bestHabitStreak(EVERY_DAY, set(), TODAY)).toBe(0);
  });
});

describe("completionRate", () => {
  it("доля выполненных запланированных дней", () => {
    // 14–20 ноября: Пн 16, Ср 18, Пт 20 запланированы; выполнены два.
    expect(
      completionRate(
        MON_WED_FRI,
        set("2026-11-16", TODAY, "2026-11-17"),
        "2026-11-14",
        TODAY,
      ),
    ).toEqual({ done: 2, scheduled: 3, percent: 67 });
  });
});

describe("describeSchedule", () => {
  it.each([
    [EVERY_DAY, "Каждый день"],
    [[1, 2, 3, 4, 5], "По будням"],
    [[7, 6], "По выходным"],
    [[5, 1, 3], "Пн, Ср, Пт"],
  ])("%j → %s", (days, label) => {
    expect(describeSchedule(days)).toBe(label);
  });
});
