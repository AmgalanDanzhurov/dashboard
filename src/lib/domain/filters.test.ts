import { describe, expect, it } from "vitest";

import {
  activeFilterCount,
  defaultFilters,
  filterTasks,
  filtersToParams,
  groupByDue,
  isOverdue,
  parseFilters,
  sortTasks,
  type TaskFilters,
} from "./filters";
import type { Task } from "./types";

const TODAY = "2026-11-12";

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
    planned_for: null,
    sort_order: seq,
    project_id: null,
    area_id: null,
    created_at: `2026-11-01T10:00:${String(seq).padStart(2, "0")}Z`,
    updated_at: "2026-11-01T10:00:00Z",
    tagIds: [],
    ...overrides,
  };
}

const projects = new Map([
  ["p-active", { area_id: "a1", archived_at: null }],
  ["p-archived", { area_id: "a1", archived_at: "2026-11-01T00:00:00Z" }],
]);

const filters = (patch: Partial<TaskFilters>): TaskFilters => ({
  ...defaultFilters,
  ...patch,
});

describe("isOverdue", () => {
  it("срок раньше сегодня и задача не выполнена", () => {
    expect(isOverdue(task({ due_date: "2026-11-11" }), TODAY)).toBe(true);
  });

  it("сегодняшний срок, выполненная или без срока — не просрочены", () => {
    expect(isOverdue(task({ due_date: TODAY }), TODAY)).toBe(false);
    expect(
      isOverdue(task({ due_date: "2026-11-01", status: "done" }), TODAY),
    ).toBe(false);
    expect(isOverdue(task(), TODAY)).toBe(false);
  });
});

describe("filterTasks", () => {
  const inbox = task({ title: "Купить молоко" });
  const inArea = task({ area_id: "a1", priority: "high", tagIds: ["g1"] });
  const inProject = task({ project_id: "p-active", status: "in_progress" });
  const inArchived = task({ project_id: "p-archived" });
  const otherArea = task({ area_id: "a2", due_date: "2026-11-10" });
  const all = [inbox, inArea, inProject, inArchived, otherArea];

  const run = (patch: Partial<TaskFilters>) =>
    filterTasks(all, filters(patch), TODAY, projects).map((t) => t.id);

  it("без фильтров скрывает только задачи архивных проектов", () => {
    expect(run({})).toEqual(
      [inbox, inArea, inProject, otherArea].map((t) => t.id),
    );
  });

  it("по разделу — задачи прямо в разделе и в его проектах", () => {
    expect(run({ area: "a1" })).toEqual([inArea.id, inProject.id]);
  });

  it("«Входящие» — без раздела и проекта", () => {
    expect(run({ area: "inbox" })).toEqual([inbox.id]);
  });

  it("явно выбранный архивный проект показывает свои задачи", () => {
    expect(run({ project: "p-archived" })).toEqual([inArchived.id]);
  });

  it("статус, приоритет и теги", () => {
    expect(run({ status: ["in_progress"] })).toEqual([inProject.id]);
    expect(run({ priority: ["high", "urgent"] })).toEqual([inArea.id]);
    expect(run({ tags: ["g1", "g2"] })).toEqual([inArea.id]);
  });

  it("поиск по названию без учёта регистра", () => {
    expect(run({ q: "  МОЛОКО " })).toEqual([inbox.id]);
  });

  it("сроки", () => {
    const today = task({ due_date: TODAY });
    const inSix = task({ due_date: "2026-11-18" });
    const inSeven = task({ due_date: "2026-11-19" });
    const overdue = task({ due_date: "2026-11-11" });
    const noDue = task();
    const list = [today, inSix, inSeven, overdue, noDue];
    const ids = (due: TaskFilters["due"]) =>
      filterTasks(list, filters({ due }), TODAY, projects).map((t) => t.id);

    expect(ids("today")).toEqual([today.id]);
    expect(ids("week")).toEqual([today.id, inSix.id]);
    expect(ids("overdue")).toEqual([overdue.id]);
    expect(ids("none")).toEqual([noDue.id]);
  });
});

describe("sortTasks", () => {
  const a = task({ due_date: "2026-11-20", priority: "low" });
  const b = task({ due_date: "2026-11-15", priority: "urgent" });
  const c = task({ due_date: null, priority: "high" });
  const d = task({ due_date: "2026-11-15", priority: "high" });

  it("по сроку: ранние раньше, без срока — в конце, при равенстве — важнее", () => {
    expect(sortTasks([a, b, c, d], "due").map((t) => t.id)).toEqual(
      [b, d, a, c].map((t) => t.id),
    );
  });

  it("по приоритету: срочные первыми, при равенстве — по сроку", () => {
    expect(sortTasks([a, b, c, d], "priority").map((t) => t.id)).toEqual(
      [b, d, c, a].map((t) => t.id),
    );
  });

  it("по дате создания: новые первыми", () => {
    expect(sortTasks([a, b, c, d], "created").map((t) => t.id)).toEqual(
      [d, c, b, a].map((t) => t.id),
    );
  });

  it("не меняет исходный массив", () => {
    const input = [a, b];
    sortTasks(input, "due");
    expect(input).toEqual([a, b]);
  });
});

describe("groupByDue", () => {
  it("раскладывает по группам в нужном порядке и пропускает пустые", () => {
    const list = [
      task({ due_date: "2026-11-30" }),
      task({ due_date: "2026-11-13" }),
      task({ due_date: "2026-11-01" }),
      task(),
      task({ due_date: TODAY }),
      task({ due_date: "2026-11-18" }),
      task({ due_date: TODAY, status: "done" }),
    ];
    expect(
      groupByDue(list, TODAY).map((g) => [g.label, g.tasks.length]),
    ).toEqual([
      ["Просрочено", 1],
      ["Сегодня", 1],
      ["Завтра", 1],
      ["На неделе", 1],
      ["Позже", 1],
      ["Без срока", 1],
    ]);
  });

  it("переход через воскресенье и конец месяца", () => {
    // 2026-11-29 — воскресенье, следующий день — 30 ноября.
    const groups = groupByDue(
      [task({ due_date: "2026-11-30" }), task({ due_date: "2026-12-04" })],
      "2026-11-29",
    );
    expect(groups.map((g) => g.key)).toEqual(["tomorrow", "week"]);
  });
});

describe("фильтры в URL", () => {
  it("туда и обратно", () => {
    const f = filters({
      area: "inbox",
      status: ["todo", "in_progress"],
      priority: ["urgent"],
      tags: ["g1", "g2"],
      due: "week",
      q: "отчёт",
      sort: "priority",
    });
    expect(parseFilters(filtersToParams(f))).toEqual(f);
  });

  it("значения по умолчанию в адрес не пишутся", () => {
    expect(filtersToParams(defaultFilters).toString()).toBe("");
  });

  it("мусор в адресе игнорируется", () => {
    const parsed = parseFilters(
      new URLSearchParams("status=todo,wrong&priority=huge&due=never&sort=x"),
    );
    expect(parsed.status).toEqual(["todo"]);
    expect(parsed.priority).toEqual([]);
    expect(parsed.due).toBeNull();
    expect(parsed.sort).toBe("due");
  });

  it("считает включённые фильтры", () => {
    expect(activeFilterCount(defaultFilters)).toBe(0);
    expect(
      activeFilterCount(filters({ area: "a1", status: ["todo"], q: "x" })),
    ).toBe(2);
  });
});

describe("sortTasks — свой порядок", () => {
  it("по sort_order, без учёта срока и приоритета", () => {
    const a = task({
      sort_order: 30,
      due_date: "2026-11-13",
      priority: "urgent",
    });
    const b = task({ sort_order: 10 });
    const c = task({ sort_order: 20 });
    expect(sortTasks([a, b, c], "manual").map((t) => t.id)).toEqual(
      [b, c, a].map((t) => t.id),
    );
  });

  it("сортировка manual переживает адрес", () => {
    expect(parseFilters(new URLSearchParams("sort=manual")).sort).toBe(
      "manual",
    );
  });
});
