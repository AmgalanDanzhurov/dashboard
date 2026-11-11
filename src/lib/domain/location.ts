import type { Project, Task } from "./types";

/** Где лежит задача: в проекте, прямо в разделе или во «Входящих». */
export type TaskLocation =
  | { kind: "project"; projectId: string }
  | { kind: "area"; areaId: string }
  | { kind: "inbox" };

type LocatedTask = Pick<Task, "project_id" | "area_id">;

export function taskLocation(task: LocatedTask): TaskLocation {
  if (task.project_id) return { kind: "project", projectId: task.project_id };
  if (task.area_id) return { kind: "area", areaId: task.area_id };
  return { kind: "inbox" };
}

/** Колонки задачи для записи в базу: заполнено не больше одной. */
export function locationColumns(location: TaskLocation): {
  project_id: string | null;
  area_id: string | null;
} {
  return {
    project_id: location.kind === "project" ? location.projectId : null,
    area_id: location.kind === "area" ? location.areaId : null,
  };
}

/**
 * Раздел задачи: её area_id, раздел её проекта или null для «Входящих».
 * Используется фильтрами и статистикой по разделам.
 */
export function resolveAreaId(
  task: LocatedTask,
  projectsById: ReadonlyMap<string, Pick<Project, "area_id">>,
): string | null {
  if (task.area_id) return task.area_id;
  if (task.project_id)
    return projectsById.get(task.project_id)?.area_id ?? null;
  return null;
}

// Строковое представление — для значения <select> и параметра в URL.

export function encodeLocation(location: TaskLocation): string {
  switch (location.kind) {
    case "project":
      return `project:${location.projectId}`;
    case "area":
      return `area:${location.areaId}`;
    case "inbox":
      return "inbox";
  }
}

export function decodeLocation(value: string): TaskLocation {
  const [kind, id] = value.split(":");
  if (kind === "project" && id) return { kind: "project", projectId: id };
  if (kind === "area" && id) return { kind: "area", areaId: id };
  return { kind: "inbox" };
}
