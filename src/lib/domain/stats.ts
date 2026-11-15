import { addDaysISO, daysFrom, localDateOf } from "./dates";
import { isOverdue } from "./filters";
import { resolveAreaId } from "./location";
import type { ISODate, Project, Task, TaskPriority, TaskStatus } from "./types";

// Статистика считается на клиенте по уже загруженным задачам: для одного
// человека это сотни или тысячи строк. Даты — дни в часовом поясе браузера.

type StatTask = Pick<
  Task,
  | "status"
  | "priority"
  | "due_date"
  | "completed_at"
  | "created_at"
  | "project_id"
  | "area_id"
  | "recurrence"
  | "tagIds"
>;

type ProjectsById = ReadonlyMap<
  string,
  Pick<Project, "area_id" | "archived_at">
>;

/** День выполнения задачи или null, если она не выполнена. */
function completedOn(task: StatTask): ISODate | null {
  return task.status === "done" && task.completed_at
    ? localDateOf(task.completed_at)
    : null;
}

function inRange(date: ISODate, from: ISODate, to: ISODate): boolean {
  return daysFrom(from, date) >= 0 && daysFrom(date, to) >= 0;
}

/** Все дни от from до to включительно. */
export function daysBetween(from: ISODate, to: ISODate): ISODate[] {
  const count = daysFrom(from, to) + 1;
  return Array.from({ length: Math.max(0, count) }, (_, i) =>
    addDaysISO(from, i),
  );
}

/** Задачи без тех, что лежат в архивных проектах. */
export function withoutArchived<T extends StatTask>(
  tasks: readonly T[],
  projectsById: ProjectsById,
): T[] {
  return tasks.filter(
    (t) => !t.project_id || !projectsById.get(t.project_id)?.archived_at,
  );
}

/** Выполнено по дням за период; дни без выполненных задач — с нулём. */
export function completedByDay(
  tasks: readonly StatTask[],
  from: ISODate,
  to: ISODate,
): { date: ISODate; count: number }[] {
  const counts = new Map<ISODate, number>();
  for (const task of tasks) {
    const day = completedOn(task);
    if (day) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return daysBetween(from, to).map((date) => ({
    date,
    count: counts.get(date) ?? 0,
  }));
}

/**
 * Серия: сколько дней подряд выполнялась хотя бы одна задача. Если сегодня
 * ещё ничего не выполнено, серия считается до вчерашнего дня и не обнуляется.
 */
export function currentStreak(
  tasks: readonly StatTask[],
  today: ISODate,
): number {
  const days = new Set(tasks.map(completedOn).filter(Boolean));
  let day = days.has(today) ? today : addDaysISO(today, -1);
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day = addDaysISO(day, -1);
  }
  return streak;
}

export function countByStatus(
  tasks: readonly StatTask[],
): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    done: 0,
  };
  for (const task of tasks) counts[task.status] += 1;
  return counts;
}

export function countByPriority(
  tasks: readonly StatTask[],
): Record<TaskPriority, number> {
  const counts: Record<TaskPriority, number> = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  };
  for (const task of tasks) counts[task.priority] += 1;
  return counts;
}

/** Выполнено за период по тегам: id тега → число задач. */
export function completedByTag(
  tasks: readonly StatTask[],
  from: ISODate,
  to: ISODate,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    const day = completedOn(task);
    if (!day || !inRange(day, from, to)) continue;
    for (const tagId of task.tagIds) {
      counts.set(tagId, (counts.get(tagId) ?? 0) + 1);
    }
  }
  return counts;
}

/** Выполнено за период по разделам: id раздела или "inbox" → число задач. */
export function completedByArea(
  tasks: readonly StatTask[],
  projectsById: ProjectsById,
  from: ISODate,
  to: ISODate,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    const day = completedOn(task);
    if (!day || !inRange(day, from, to)) continue;
    const key = resolveAreaId(task, projectsById) ?? "inbox";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Burndown: сколько задач было открыто на конец каждого дня — созданы не
 * позже этого дня и не выполнены к его концу. Повторяющиеся задачи не
 * учитываются: у них всегда есть открытый экземпляр, и график не дойдёт до
 * нуля. Удалённые задачи выпадают из истории — это допустимо.
 */
export function burndown(
  tasks: readonly StatTask[],
  from: ISODate,
  to: ISODate,
): { date: ISODate; open: number }[] {
  const items = tasks
    .filter((t) => t.recurrence === null)
    .map((t) => ({
      created: localDateOf(t.created_at),
      completed: completedOn(t),
    }));
  return daysBetween(from, to).map((date) => ({
    date,
    open: items.filter(
      (t) =>
        daysFrom(t.created, date) >= 0 &&
        (t.completed === null || daysFrom(date, t.completed) > 0),
    ).length,
  }));
}

export type DashboardKpis = {
  doneToday: number;
  /** Сегодня и шесть предыдущих дней. */
  doneWeek: number;
  inProgress: number;
  overdue: number;
  streak: number;
};

/**
 * KPI дашборда. «В работе» и «Просрочено» — текущее состояние, без задач
 * архивных проектов. Выполненные и серия — история, архив в неё входит.
 */
export function dashboardKpis(
  tasks: readonly StatTask[],
  today: ISODate,
  projectsById: ProjectsById,
): DashboardKpis {
  const active = withoutArchived(tasks, projectsById);
  const week = completedByDay(tasks, addDaysISO(today, -6), today);
  return {
    doneToday: week[week.length - 1]?.count ?? 0,
    doneWeek: week.reduce((sum, d) => sum + d.count, 0),
    inProgress: active.filter((t) => t.status === "in_progress").length,
    overdue: active.filter((t) => isOverdue(t, today)).length,
    streak: currentStreak(tasks, today),
  };
}
