import { describe, expect, it } from "vitest";

import {
  burndown,
  completedByArea,
  completedByDay,
  completedByTag,
  countByPriority,
  countByStatus,
  currentStreak,
  dashboardKpis,
  daysBetween,
} from "./stats";
import type { Task } from "./types";

const TODAY = "2026-11-16";

/** Метка времени полудня этого дня по местному времени. */
function at(date: string, hour = 12): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, hour).toISOString();
}

let seq = 0;
function task(overrides: Partial<Task> = {}): Task {
  seq += 1;
  return {
    id: `t${seq}`,
    user_id: "u",
    title: `Задача ${seq}`,
    description: null,
    status: "todo",
    priority: "medium",
    due_date: null,
    completed_at: null,
    recurrence: null,
    series_id: null,
    project_id: null,
    area_id: null,
    created_at: at("2026-11-01"),
    updated_at: at("2026-11-01"),
    tagIds: [],
    ...overrides,
  };
}

const done = (date: string, overrides: Partial<Task> = {}) =>
  task({ status: "done", completed_at: at(date), ...overrides });

const projects = new Map([
  ["p-active", { area_id: "a1", archived_at: null }],
  ["p-archived", { area_id: "a1", archived_at: at("2026-11-10") }],
]);

describe("daysBetween", () => {
  it("включает оба конца и переходит через месяц", () => {
    expect(daysBetween("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });
});

describe("completedByDay", () => {
  it("считает по дням и заполняет пустые дни нулями", () => {
    const tasks = [done("2026-11-14"), done("2026-11-16"), done("2026-11-16")];
    expect(completedByDay(tasks, "2026-11-13", "2026-11-16")).toEqual([
      { date: "2026-11-13", count: 0 },
      { date: "2026-11-14", count: 1 },
      { date: "2026-11-15", count: 0 },
      { date: "2026-11-16", count: 2 },
    ]);
  });

  it("день выполнения — местный: задача в 23:50 остаётся в своём дне", () => {
    const late = task({
      status: "done",
      completed_at: at("2026-11-15", 23.8),
    });
    expect(completedByDay([late], "2026-11-15", "2026-11-16")).toEqual([
      { date: "2026-11-15", count: 1 },
      { date: "2026-11-16", count: 0 },
    ]);
  });

  it("не выполненные задачи не считаются", () => {
    expect(completedByDay([task()], TODAY, TODAY)).toEqual([
      { date: TODAY, count: 0 },
    ]);
  });
});

describe("currentStreak", () => {
  it("дни подряд, включая сегодня", () => {
    const tasks = [done("2026-11-14"), done("2026-11-15"), done(TODAY)];
    expect(currentStreak(tasks, TODAY)).toBe(3);
  });

  it("сегодня ещё ничего — серия до вчера не обнуляется", () => {
    const tasks = [done("2026-11-14"), done("2026-11-15")];
    expect(currentStreak(tasks, TODAY)).toBe(2);
  });

  it("пропуск дня обрывает серию", () => {
    const tasks = [done("2026-11-13"), done("2026-11-15")];
    expect(currentStreak(tasks, TODAY)).toBe(1);
  });

  it("без выполненных — ноль", () => {
    expect(currentStreak([task()], TODAY)).toBe(0);
  });
});

describe("countByStatus / countByPriority", () => {
  it("считает все значения, включая нулевые", () => {
    const tasks = [
      task(),
      task({ status: "in_progress", priority: "urgent" }),
      done(TODAY, { priority: "urgent" }),
    ];
    expect(countByStatus(tasks)).toEqual({ todo: 1, in_progress: 1, done: 1 });
    expect(countByPriority(tasks)).toEqual({
      low: 0,
      medium: 1,
      high: 0,
      urgent: 2,
    });
  });
});

describe("completedByTag / completedByArea", () => {
  const tasks = [
    done("2026-11-15", { tagIds: ["g1", "g2"], area_id: "a2" }),
    done("2026-11-16", { tagIds: ["g1"], project_id: "p-active" }),
    done("2026-11-16"),
    done("2026-11-01", { tagIds: ["g1"] }), // вне периода
  ];

  it("по тегам за период", () => {
    expect(
      Object.fromEntries(completedByTag(tasks, "2026-11-10", TODAY)),
    ).toEqual({ g1: 2, g2: 1 });
  });

  it("по разделам за период, задачи без раздела — inbox", () => {
    expect(
      Object.fromEntries(completedByArea(tasks, projects, "2026-11-10", TODAY)),
    ).toEqual({ a2: 1, a1: 1, inbox: 1 });
  });
});

describe("burndown", () => {
  it("открытые на конец каждого дня", () => {
    const tasks = [
      task({ created_at: at("2026-11-10") }), // открыта всё время
      done("2026-11-12", { created_at: at("2026-11-10") }),
      task({ created_at: at("2026-11-12") }),
    ];
    expect(burndown(tasks, "2026-11-10", "2026-11-13")).toEqual([
      { date: "2026-11-10", open: 2 },
      { date: "2026-11-11", open: 2 },
      // Выполненная 12-го к концу дня уже не открыта, а новая появилась.
      { date: "2026-11-12", open: 2 },
      { date: "2026-11-13", open: 2 },
    ]);
  });

  it("повторяющиеся задачи не учитываются", () => {
    const recurring = task({
      created_at: at("2026-11-10"),
      due_date: "2026-11-10",
      recurrence: { type: "daily" },
    });
    expect(burndown([recurring], "2026-11-10", "2026-11-11")).toEqual([
      { date: "2026-11-10", open: 0 },
      { date: "2026-11-11", open: 0 },
    ]);
  });
});

describe("dashboardKpis", () => {
  it("считает текущее состояние без архива, а историю — с архивом", () => {
    const tasks = [
      done(TODAY),
      done("2026-11-15", { project_id: "p-archived" }),
      done("2026-11-09"), // восемь дней назад — не в неделе
      task({ status: "in_progress" }),
      task({ status: "in_progress", project_id: "p-archived" }),
      task({ due_date: "2026-11-15" }),
      task({ due_date: "2026-11-14", project_id: "p-archived" }),
      task({ due_date: TODAY }),
    ];
    expect(dashboardKpis(tasks, TODAY, projects)).toEqual({
      doneToday: 1,
      doneWeek: 2,
      inProgress: 1,
      overdue: 1,
      streak: 2,
    });
  });
});
