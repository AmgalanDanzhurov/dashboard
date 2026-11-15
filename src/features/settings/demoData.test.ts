import { describe, expect, it } from "vitest";

import { daysFrom, localDateOf } from "@/lib/domain/dates";
import { completedByDay } from "@/lib/domain/stats";

import { buildDemoTasks, demoAreas, demoProjects, demoTags } from "./demoData";

const TODAY = "2026-11-16";
const tasks = buildDemoTasks(TODAY);

describe("демо-данные", () => {
  it("3 раздела, 4 проекта, около 40 задач", () => {
    expect(demoAreas).toHaveLength(3);
    expect(demoProjects).toHaveLength(4);
    expect(tasks.length).toBeGreaterThanOrEqual(38);
    expect(tasks.length).toBeLessThanOrEqual(45);
  });

  it("названия задач уникальны — по ним связываются теги", () => {
    expect(new Set(tasks.map((t) => t.title)).size).toBe(tasks.length);
  });

  it("каждая задача лежит не больше чем в одном месте", () => {
    for (const t of tasks) expect(t.project && t.area).toBeFalsy();
    expect(tasks.some((t) => t.area)).toBe(true);
    expect(tasks.some((t) => !t.area && !t.project)).toBe(true);
  });

  it("создана не позже выполнения, выполненные — в последние 30 дней", () => {
    for (const t of tasks) {
      if (t.status !== "done") {
        expect(t.completed_at).toBeNull();
        continue;
      }
      expect(t.completed_at).not.toBeNull();
      const completed = localDateOf(t.completed_at!);
      expect(t.created_at <= t.completed_at!).toBe(true);
      expect(daysFrom(completed, TODAY)).toBeGreaterThanOrEqual(0);
      expect(daysFrom(completed, TODAY)).toBeLessThan(30);
    }
  });

  it("выполненные разбросаны по дням, а не в одном", () => {
    const days = completedByDay(
      tasks.map((t) => ({
        ...t,
        tagIds: [],
        project_id: null,
        area_id: null,
      })),
      "2026-10-18",
      TODAY,
    ).filter((d) => d.count > 0);
    expect(days.length).toBeGreaterThan(15);
  });

  it("у повторяющихся задач есть срок в будущем", () => {
    const recurring = tasks.filter((t) => t.recurrence);
    expect(recurring.length).toBeGreaterThanOrEqual(2);
    for (const t of recurring) {
      expect(t.due_date).not.toBeNull();
      expect(daysFrom(TODAY, t.due_date!)).toBeGreaterThanOrEqual(0);
    }
  });

  it("есть просроченные, сегодняшние и на неделе — чтобы заполнить дашборд", () => {
    const open = tasks.filter((t) => t.status !== "done" && t.due_date);
    const offsets = open.map((t) => daysFrom(TODAY, t.due_date!));
    expect(offsets.some((d) => d < 0)).toBe(true);
    expect(offsets.some((d) => d === 0)).toBe(true);
    expect(offsets.some((d) => d > 0 && d <= 7)).toBe(true);
  });

  it("теги и проекты ссылаются на существующие ключи", () => {
    const tagKeys = new Set(demoTags.map((t) => t.key));
    const projectKeys = new Set(demoProjects.map((p) => p.key));
    const areaKeys = new Set(demoAreas.map((a) => a.key));
    for (const t of tasks) {
      for (const tag of t.tags) expect(tagKeys.has(tag)).toBe(true);
      if (t.project) expect(projectKeys.has(t.project)).toBe(true);
      if (t.area) expect(areaKeys.has(t.area)).toBe(true);
    }
    for (const p of demoProjects) expect(areaKeys.has(p.area)).toBe(true);
  });
});
