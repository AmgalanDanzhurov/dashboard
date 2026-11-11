import { describe, expect, it } from "vitest";

import { moveByOne } from "./order";

const items = [
  { id: "a", position: 0 },
  { id: "b", position: 1 },
  { id: "c", position: 2 },
];

describe("moveByOne", () => {
  it("меняет местами с соседом и сохраняет только изменившиеся позиции", () => {
    expect(moveByOne(items, "b", "up")).toEqual([
      { id: "b", position: 0 },
      { id: "a", position: 1 },
    ]);
    expect(moveByOne(items, "b", "down")).toEqual([
      { id: "c", position: 1 },
      { id: "b", position: 2 },
    ]);
  });

  it("на краях ничего не делает", () => {
    expect(moveByOne(items, "a", "up")).toEqual([]);
    expect(moveByOne(items, "c", "down")).toEqual([]);
    expect(moveByOne(items, "нет такого", "up")).toEqual([]);
  });

  it("чинит одинаковые позиции", () => {
    const same = [
      { id: "a", position: 0 },
      { id: "b", position: 0 },
      { id: "c", position: 0 },
    ];
    expect(moveByOne(same, "c", "up")).toEqual([
      { id: "c", position: 1 },
      { id: "b", position: 2 },
    ]);
  });
});
