import { describe, expect, it } from "vitest";

import { isSamePath, routes } from "./routes";

describe("routes", () => {
  it("строит адрес раздела и проекта через query-параметр", () => {
    expect(routes.area("abc")).toBe("/area/?id=abc");
    expect(routes.project("a b")).toBe("/project/?id=a%20b");
  });
});

describe("isSamePath", () => {
  it("не различает завершающий слэш", () => {
    expect(isSamePath("/tasks", "/tasks/")).toBe(true);
    expect(isSamePath("/", "/")).toBe(true);
  });

  it("различает разные страницы", () => {
    expect(isSamePath("/tasks/", "/stats/")).toBe(false);
    expect(isSamePath("/", "/tasks/")).toBe(false);
  });
});
