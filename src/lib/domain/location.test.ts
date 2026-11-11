import { describe, expect, it } from "vitest";

import {
  decodeLocation,
  encodeLocation,
  locationColumns,
  resolveAreaId,
  taskLocation,
} from "./location";

const projects = new Map([["p1", { area_id: "a1" }]]);

describe("resolveAreaId", () => {
  it("задача прямо в разделе", () => {
    expect(resolveAreaId({ area_id: "a2", project_id: null }, projects)).toBe(
      "a2",
    );
  });

  it("задача в проекте — раздел проекта", () => {
    expect(resolveAreaId({ area_id: null, project_id: "p1" }, projects)).toBe(
      "a1",
    );
  });

  it("«Входящие» и неизвестный проект — null", () => {
    expect(resolveAreaId({ area_id: null, project_id: null }, projects)).toBe(
      null,
    );
    expect(resolveAreaId({ area_id: null, project_id: "нет" }, projects)).toBe(
      null,
    );
  });
});

describe("taskLocation / locationColumns", () => {
  it("туда и обратно", () => {
    for (const location of [
      { kind: "project", projectId: "p1" },
      { kind: "area", areaId: "a1" },
      { kind: "inbox" },
    ] as const) {
      expect(taskLocation(locationColumns(location))).toEqual(location);
      expect(decodeLocation(encodeLocation(location))).toEqual(location);
    }
  });

  it("никогда не заполняет обе колонки", () => {
    expect(locationColumns({ kind: "project", projectId: "p1" })).toEqual({
      project_id: "p1",
      area_id: null,
    });
  });

  it("мусор из URL считается «Входящими»", () => {
    expect(decodeLocation("что-то")).toEqual({ kind: "inbox" });
    expect(decodeLocation("project:")).toEqual({ kind: "inbox" });
  });
});
