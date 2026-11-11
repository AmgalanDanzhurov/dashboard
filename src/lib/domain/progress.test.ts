import { describe, expect, it } from "vitest";

import {
  calcProgress,
  formatProgress,
  progressFromRow,
  progressOf,
} from "./progress";

describe("calcProgress", () => {
  it("считает процент и округляет до целого", () => {
    expect(calcProgress(7, 10)).toEqual({ done: 7, total: 10, percent: 70 });
    expect(calcProgress(1, 3).percent).toBe(33);
    expect(calcProgress(2, 3).percent).toBe(67);
  });

  it("без задач — 0%, а не деление на ноль", () => {
    expect(calcProgress(0, 0).percent).toBe(0);
  });

  it("все выполнены — 100%", () => {
    expect(calcProgress(5, 5).percent).toBe(100);
  });
});

describe("formatProgress", () => {
  it("пишет «N из M»", () => {
    expect(formatProgress(calcProgress(7, 10))).toBe("7 из 10");
    expect(formatProgress(calcProgress(0, 4))).toBe("0 из 4");
  });

  it("для пустого раздела или проекта пишет «Нет задач»", () => {
    expect(formatProgress(calcProgress(0, 0))).toBe("Нет задач");
  });
});

describe("progressFromRow / progressOf", () => {
  it("null из представления считается нулём", () => {
    expect(progressFromRow({ done: null, total: null })).toEqual(
      calcProgress(0, 0),
    );
  });

  it("неизвестный id — «Нет задач»", () => {
    expect(progressOf({}, "x").total).toBe(0);
    expect(progressOf(undefined, "x").total).toBe(0);
    expect(progressOf({ a: calcProgress(1, 2) }, "a").percent).toBe(50);
  });
});
