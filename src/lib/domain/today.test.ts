import { describe, expect, it } from "vitest";

import { groupToday, isDoneToday, todayGroupOf, todayTasks } from "./today";

const TODAY = "2026-11-20";

type T = {
  id: string;
  status: "todo" | "in_progress" | "done";
  due_date: string | null;
  planned_for: string | null;
  completed_at: string | null;
};

function task(patch: Partial<T> & { id: string }): T {
  return {
    status: "todo",
    due_date: null,
    planned_for: null,
    completed_at: null,
    ...patch,
  };
}

/** Метка времени полудня этого дня по местному времени. */
function at(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 12).toISOString();
}

describe("todayGroupOf", () => {
  it("просрочено, срок сегодня, в плане дня", () => {
    expect(todayGroupOf(task({ id: "a", due_date: "2026-11-18" }), TODAY)).toBe(
      "overdue",
    );
    expect(todayGroupOf(task({ id: "b", due_date: TODAY }), TODAY)).toBe("due");
    expect(todayGroupOf(task({ id: "c", planned_for: TODAY }), TODAY)).toBe(
      "planned",
    );
  });

  it("задача в одной группе: просрочка важнее плана", () => {
    expect(
      todayGroupOf(
        task({ id: "a", due_date: "2026-11-18", planned_for: TODAY }),
        TODAY,
      ),
    ).toBe("overdue");
    expect(
      todayGroupOf(
        task({ id: "b", due_date: TODAY, planned_for: TODAY }),
        TODAY,
      ),
    ).toBe("due");
  });

  it("план на вчера назавтра не действует", () => {
    expect(
      todayGroupOf(task({ id: "a", planned_for: "2026-11-19" }), TODAY),
    ).toBeNull();
  });

  it("срок в будущем без плана и выполненные — не на сегодня", () => {
    expect(
      todayGroupOf(task({ id: "a", due_date: "2026-11-21" }), TODAY),
    ).toBeNull();
    expect(
      todayGroupOf(
        task({ id: "b", status: "done", due_date: "2026-11-18" }),
        TODAY,
      ),
    ).toBeNull();
  });

  it("срок завтра, но добавлена в план — в плане дня", () => {
    expect(
      todayGroupOf(
        task({ id: "a", due_date: "2026-11-21", planned_for: TODAY }),
        TODAY,
      ),
    ).toBe("planned");
  });
});

describe("isDoneToday", () => {
  it("выполнена сегодня и относилась к сегодня", () => {
    expect(
      isDoneToday(
        task({
          id: "a",
          status: "done",
          planned_for: TODAY,
          completed_at: at(TODAY),
        }),
        TODAY,
      ),
    ).toBe(true);
    expect(
      isDoneToday(
        task({
          id: "b",
          status: "done",
          due_date: "2026-11-19",
          completed_at: at(TODAY),
        }),
        TODAY,
      ),
    ).toBe(true);
  });

  it("выполнена вчера или не относилась к сегодня — нет", () => {
    expect(
      isDoneToday(
        task({
          id: "a",
          status: "done",
          planned_for: "2026-11-19",
          completed_at: at("2026-11-19"),
        }),
        TODAY,
      ),
    ).toBe(false);
    expect(
      isDoneToday(
        task({
          id: "b",
          status: "done",
          due_date: "2026-11-25",
          completed_at: at(TODAY),
        }),
        TODAY,
      ),
    ).toBe(false);
  });
});

describe("todayTasks / groupToday", () => {
  const list = [
    task({ id: "planned", planned_for: TODAY }),
    task({ id: "overdue", due_date: "2026-11-10" }),
    task({ id: "later", due_date: "2026-12-01" }),
    task({ id: "due", due_date: TODAY }),
    task({
      id: "done",
      status: "done",
      planned_for: TODAY,
      completed_at: at(TODAY),
    }),
  ];

  it("собирает задачи дня и выполненные сегодня", () => {
    expect(todayTasks(list, TODAY).map((t) => t.id)).toEqual([
      "planned",
      "overdue",
      "due",
      "done",
    ]);
  });

  it("группирует невыполненные по порядку, сохраняя порядок внутри группы", () => {
    expect(
      groupToday(list, TODAY).map((g) => [g.label, g.tasks.map((t) => t.id)]),
    ).toEqual([
      ["Просрочено", ["overdue"]],
      ["Срок сегодня", ["due"]],
      ["В плане дня", ["planned"]],
    ]);
  });
});
