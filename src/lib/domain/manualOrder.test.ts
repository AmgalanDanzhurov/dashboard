import { describe, expect, it } from "vitest";

import {
  applyOrder,
  byManualOrder,
  MIN_GAP,
  ORDER_STEP,
  planMove,
} from "./manualOrder";

// Реалистичные значения: миллисекунды ноября 2026 года.
const T0 = 1_794_000_000_000;
const list = [
  { id: "a", sort_order: T0 },
  { id: "b", sort_order: T0 + 5_000 },
  { id: "c", sort_order: T0 + 9_000 },
  { id: "d", sort_order: T0 + 20_000 },
];

/** Порядок после применения изменений. */
function orderAfter(updates: { id: string; sort_order: number }[]): string[] {
  return applyOrder(list, updates)
    .map((t) => ({ ...t, created_at: "" }))
    .sort(byManualOrder)
    .map((t) => t.id);
}

describe("planMove", () => {
  it("вниз между соседями — одно обновление, середина", () => {
    const updates = planMove(list, "a", "c");
    expect(updates).toEqual([{ id: "a", sort_order: T0 + 14_500 }]);
    expect(orderAfter(updates)).toEqual(["b", "c", "a", "d"]);
  });

  it("вверх между соседями", () => {
    const updates = planMove(list, "d", "b");
    expect(updates).toEqual([{ id: "d", sort_order: T0 + 2_500 }]);
    expect(orderAfter(updates)).toEqual(["a", "d", "b", "c"]);
  });

  it("в начало и в конец — шаг от крайней задачи", () => {
    expect(planMove(list, "c", "a")).toEqual([
      { id: "c", sort_order: T0 - ORDER_STEP },
    ]);
    expect(planMove(list, "a", "d")).toEqual([
      { id: "a", sort_order: T0 + 20_000 + ORDER_STEP },
    ]);
  });

  it("на своё место или неизвестный id — ничего", () => {
    expect(planMove(list, "b", "b")).toEqual([]);
    expect(planMove(list, "b", "нет")).toEqual([]);
    expect(planMove([{ id: "a", sort_order: T0 }], "a", "a")).toEqual([]);
  });

  it("слишком тесные соседи — перенумерация всего списка", () => {
    const tight = [
      { id: "a", sort_order: T0 },
      { id: "b", sort_order: T0 + MIN_GAP / 4 },
      { id: "c", sort_order: T0 + MIN_GAP / 2 },
    ];
    // c между a и b: зазор MIN_GAP/4 — делить нельзя.
    const updates = planMove(tight, "c", "b");
    const sorted = applyOrder(tight, updates)
      .map((t) => ({ ...t, created_at: "" }))
      .sort(byManualOrder);
    expect(sorted.map((t) => t.id)).toEqual(["a", "c", "b"]);
    // После перенумерации между соседями снова есть место.
    expect(sorted[1].sort_order - sorted[0].sort_order).toBe(ORDER_STEP);
  });

  it("сотня переносов в одно и то же место не ломает порядок", () => {
    let items = [...list];
    for (let i = 0; i < 100; i += 1) {
      // Каждый раз переносим последнюю задачу на второе место.
      const ordered = [...items]
        .map((t) => ({ ...t, created_at: "" }))
        .sort(byManualOrder);
      const last = ordered[ordered.length - 1];
      items = applyOrder(items, planMove(ordered, last.id, ordered[1].id));
      const after = [...items]
        .map((t) => ({ ...t, created_at: "" }))
        .sort(byManualOrder);
      expect(after[1].id).toBe(last.id);
    }
  });
});

describe("byManualOrder", () => {
  it("при равном порядке — по дате создания", () => {
    const tasks = [
      { id: "b", sort_order: 1, created_at: "2026-11-02" },
      { id: "a", sort_order: 1, created_at: "2026-11-01" },
    ];
    expect([...tasks].sort(byManualOrder).map((t) => t.id)).toEqual(["a", "b"]);
  });
});
