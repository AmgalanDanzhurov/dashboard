import { describe, expect, it } from "vitest";

import { isSamePath, routes, safeRedirectPath } from "./routes";

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

describe("safeRedirectPath", () => {
  it("пропускает внутренние пути вместе с query", () => {
    expect(safeRedirectPath("/tasks/")).toBe("/tasks/");
    expect(safeRedirectPath("/area/?id=42")).toBe("/area/?id=42");
  });

  it("не уводит на чужие сайты", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/");
    expect(safeRedirectPath("//evil.com")).toBe("/");
    expect(safeRedirectPath("/\\evil.com")).toBe("/");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
  });

  it("без адреса и со страницей входа ведёт на дашборд", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
    expect(safeRedirectPath("/login/")).toBe("/");
    expect(safeRedirectPath("/login?next=/tasks/")).toBe("/");
  });
});

describe("loginWithNext", () => {
  it("кодирует адрес возврата", () => {
    expect(routes.loginWithNext("/area/?id=42")).toBe(
      "/login/?next=%2Farea%2F%3Fid%3D42",
    );
  });
});
