import { describe, expect, it } from "vitest";

import { fetchAll } from "./fetchAll";

/** Поддельная таблица: отдаёт срез, как .range(from, to) в Supabase. */
function table(size: number) {
  const rows = Array.from({ length: size }, (_, i) => i);
  const calls: [number, number][] = [];
  const page = async (from: number, to: number) => {
    calls.push([from, to]);
    return { data: rows.slice(from, to + 1), error: null };
  };
  return { page, calls };
}

describe("fetchAll", () => {
  it("читает все строки страницами", async () => {
    const t = table(25);
    const { data, error } = await fetchAll(t.page, 10);
    expect(error).toBeNull();
    expect(data).toHaveLength(25);
    expect(t.calls).toEqual([
      [0, 9],
      [10, 19],
      [20, 29],
    ]);
  });

  it("ровно на границе страницы делает ещё один пустой запрос", async () => {
    const t = table(20);
    expect((await fetchAll(t.page, 10)).data).toHaveLength(20);
    expect(t.calls).toHaveLength(3);
  });

  it("при ошибке останавливается и возвращает её", async () => {
    let n = 0;
    const result = await fetchAll(async () => {
      n += 1;
      return n === 1
        ? { data: Array.from({ length: 10 }, (_, i) => i), error: null }
        : { data: null, error: { code: "XX000", message: "сбой" } };
    }, 10);
    expect(result.error?.message).toBe("сбой");
    expect(result.data).toHaveLength(10);
  });
});
