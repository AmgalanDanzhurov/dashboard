import { describe, expect, it } from "vitest";

import { plural, TASK_FORMS } from "./plural";

describe("plural", () => {
  it.each([
    [0, "задач"],
    [1, "задача"],
    [2, "задачи"],
    [4, "задачи"],
    [5, "задач"],
    [11, "задач"],
    [12, "задач"],
    [14, "задач"],
    [21, "задача"],
    [22, "задачи"],
    [101, "задача"],
    [111, "задач"],
  ])("%i %s", (n, word) => {
    expect(plural(n, TASK_FORMS)).toBe(word);
  });
});
