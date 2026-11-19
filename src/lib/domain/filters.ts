import { daysFrom } from "./dates";
import { resolveAreaId } from "./location";
import { byManualOrder } from "./manualOrder";
import { isPriority, isStatus, priorityMeta } from "./taskMeta";
import type { ISODate, Project, Task, TaskPriority, TaskStatus } from "./types";

export type DueFilter = "overdue" | "today" | "week" | "none";
/** manual — «Свой порядок»: как расставил пользователь перетаскиванием. */
export type TaskSort = "due" | "priority" | "created" | "manual";

export type TaskFilters = {
  /** id раздела или "inbox" для задач без раздела и проекта. */
  area: string | null;
  project: string | null;
  status: TaskStatus[];
  priority: TaskPriority[];
  /** Задача подходит, если у неё есть хотя бы один из тегов. */
  tags: string[];
  due: DueFilter | null;
  q: string;
  sort: TaskSort;
};

export const defaultFilters: TaskFilters = {
  area: null,
  project: null,
  status: [],
  priority: [],
  tags: [],
  due: null,
  q: "",
  sort: "due",
};

type FilterableTask = Pick<
  Task,
  | "title"
  | "status"
  | "priority"
  | "due_date"
  | "project_id"
  | "area_id"
  | "tagIds"
  | "created_at"
  | "sort_order"
>;

/** Просрочена: срок раньше сегодняшнего дня и задача не выполнена. */
export function isOverdue(
  task: Pick<Task, "due_date" | "status">,
  today: ISODate,
): boolean {
  return (
    task.status !== "done" &&
    task.due_date !== null &&
    daysFrom(today, task.due_date) < 0
  );
}

function matchesDue(
  task: FilterableTask,
  due: DueFilter,
  today: ISODate,
): boolean {
  if (due === "none") return task.due_date === null;
  if (task.due_date === null) return false;
  if (due === "overdue") return isOverdue(task, today);
  const days = daysFrom(today, task.due_date);
  if (due === "today") return days === 0;
  return days >= 0 && days <= 6; // «7 дней»: сегодня и шесть следующих
}

/**
 * Фильтрует задачи. Задачи архивных проектов скрыты, кроме случая, когда
 * явно выбран этот проект (например, на странице архивного проекта).
 */
export function filterTasks<T extends FilterableTask>(
  tasks: readonly T[],
  filters: TaskFilters,
  today: ISODate,
  projectsById: ReadonlyMap<string, Pick<Project, "area_id" | "archived_at">>,
): T[] {
  const q = filters.q.trim().toLocaleLowerCase("ru");
  return tasks.filter((task) => {
    if (task.project_id && task.project_id !== filters.project) {
      if (projectsById.get(task.project_id)?.archived_at) return false;
    }
    if (filters.area === "inbox") {
      if (task.project_id || task.area_id) return false;
    } else if (filters.area) {
      if (resolveAreaId(task, projectsById) !== filters.area) return false;
    }
    if (filters.project && task.project_id !== filters.project) return false;
    if (filters.status.length && !filters.status.includes(task.status)) {
      return false;
    }
    if (filters.priority.length && !filters.priority.includes(task.priority)) {
      return false;
    }
    if (
      filters.tags.length &&
      !task.tagIds.some((id) => filters.tags.includes(id))
    ) {
      return false;
    }
    if (filters.due && !matchesDue(task, filters.due, today)) return false;
    if (q && !task.title.toLocaleLowerCase("ru").includes(q)) return false;
    return true;
  });
}

const byDue = (a: FilterableTask, b: FilterableTask) =>
  a.due_date === b.due_date
    ? 0
    : a.due_date === null
      ? 1 // без срока — в конце
      : b.due_date === null
        ? -1
        : a.due_date.localeCompare(b.due_date);

const byPriority = (a: FilterableTask, b: FilterableTask) =>
  priorityMeta(a.priority).rank - priorityMeta(b.priority).rank;

const byCreatedDesc = (a: FilterableTask, b: FilterableTask) =>
  b.created_at.localeCompare(a.created_at);

export function sortTasks<T extends FilterableTask>(
  tasks: readonly T[],
  sort: TaskSort,
): T[] {
  const compare =
    sort === "due"
      ? (a: T, b: T) => byDue(a, b) || byPriority(a, b) || byCreatedDesc(a, b)
      : sort === "priority"
        ? (a: T, b: T) => byPriority(a, b) || byDue(a, b) || byCreatedDesc(a, b)
        : sort === "manual"
          ? byManualOrder
          : byCreatedDesc;
  return [...tasks].sort(compare);
}

export type DueGroupKey =
  "overdue" | "today" | "tomorrow" | "week" | "later" | "none";

export const dueGroupLabels: Record<DueGroupKey, string> = {
  overdue: "Просрочено",
  today: "Сегодня",
  tomorrow: "Завтра",
  week: "На неделе",
  later: "Позже",
  none: "Без срока",
};

const groupOrder: DueGroupKey[] = [
  "overdue",
  "today",
  "tomorrow",
  "week",
  "later",
  "none",
];

function dueGroupOf(task: FilterableTask, today: ISODate): DueGroupKey {
  if (task.due_date === null) return "none";
  const days = daysFrom(today, task.due_date);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days <= 6) return "week";
  return "later";
}

/**
 * Группы по сроку для невыполненных задач, в порядке «Просрочено» →
 * «Без срока». Пустые группы опускаются, порядок внутри группы сохраняется.
 * Выполненные задачи сюда не попадают — их показывают отдельно.
 */
export function groupByDue<T extends FilterableTask>(
  tasks: readonly T[],
  today: ISODate,
): { key: DueGroupKey; label: string; tasks: T[] }[] {
  const groups = new Map<DueGroupKey, T[]>();
  for (const task of tasks) {
    if (task.status === "done") continue;
    const key = dueGroupOf(task, today);
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }
  return groupOrder.flatMap((key) => {
    const items = groups.get(key);
    return items ? [{ key, label: dueGroupLabels[key], tasks: items }] : [];
  });
}

// ─── Фильтры в URL ───────────────────────────────────────────────────────────
// Ссылку на отфильтрованный список можно сохранить. В адрес пишутся только
// отличия от значений по умолчанию.

const dueValues: DueFilter[] = ["overdue", "today", "week", "none"];
export const sortValues: TaskSort[] = ["due", "priority", "created", "manual"];

/** Подписи сортировок для переключателей. */
export const sortLabels: Record<TaskSort, string> = {
  due: "По сроку",
  priority: "По приоритету",
  created: "Сначала новые",
  manual: "Свой порядок",
};

export function parseSort(value: string | null): TaskSort | null {
  return sortValues.find((v) => v === value) ?? null;
}

function list(params: URLSearchParams, key: string): string[] {
  return (params.get(key) ?? "").split(",").filter(Boolean);
}

export function parseFilters(params: URLSearchParams): TaskFilters {
  const due = params.get("due");
  const sort = params.get("sort");
  return {
    area: params.get("area") || null,
    project: params.get("project") || null,
    status: list(params, "status").filter(isStatus),
    priority: list(params, "priority").filter(isPriority),
    tags: list(params, "tags"),
    due: dueValues.find((v) => v === due) ?? null,
    q: params.get("q") ?? "",
    sort: sortValues.find((v) => v === sort) ?? defaultFilters.sort,
  };
}

export function filtersToParams(filters: TaskFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.area) params.set("area", filters.area);
  if (filters.project) params.set("project", filters.project);
  if (filters.status.length) params.set("status", filters.status.join(","));
  if (filters.priority.length) {
    params.set("priority", filters.priority.join(","));
  }
  if (filters.tags.length) params.set("tags", filters.tags.join(","));
  if (filters.due) params.set("due", filters.due);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.sort !== defaultFilters.sort) params.set("sort", filters.sort);
  return params;
}

/** Сколько фильтров включено (без поиска и сортировки) — для счётчика на кнопке. */
export function activeFilterCount(filters: TaskFilters): number {
  return (
    Number(Boolean(filters.area)) +
    Number(Boolean(filters.project)) +
    Number(filters.status.length > 0) +
    Number(filters.priority.length > 0) +
    Number(filters.tags.length > 0) +
    Number(Boolean(filters.due))
  );
}
