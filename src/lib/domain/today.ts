import { daysFrom, localDateOf } from "./dates";
import type { ISODate, Task } from "./types";

type TodayTask = Pick<
  Task,
  "status" | "due_date" | "planned_for" | "completed_at"
>;

export type TodayGroupKey = "overdue" | "due" | "planned";

export const todayGroupLabels: Record<TodayGroupKey, string> = {
  overdue: "Просрочено",
  due: "Срок сегодня",
  planned: "В плане дня",
};

/** В плане дня на сегодня: отметка «На сегодня» стоит именно на этот день. */
export function isPlannedForToday(
  task: Pick<Task, "planned_for">,
  today: ISODate,
): boolean {
  return task.planned_for === today;
}

/**
 * Куда задача попадает на странице «Сегодня» или null, если не попадает.
 * Каждая задача — в одну группу: просрочка важнее срока, срок — плана.
 */
export function todayGroupOf(
  task: TodayTask,
  today: ISODate,
): TodayGroupKey | null {
  if (task.status === "done") return null;
  if (task.due_date !== null) {
    const days = daysFrom(today, task.due_date);
    if (days < 0) return "overdue";
    if (days === 0) return "due";
  }
  return isPlannedForToday(task, today) ? "planned" : null;
}

/**
 * Выполнено сегодня из того, что относилось к сегодняшнему дню: было в
 * плане дня или со сроком не позже сегодня.
 */
export function isDoneToday(task: TodayTask, today: ISODate): boolean {
  if (task.status !== "done" || !task.completed_at) return false;
  if (localDateOf(task.completed_at) !== today) return false;
  const dueByToday =
    task.due_date !== null && daysFrom(today, task.due_date) <= 0;
  return dueByToday || isPlannedForToday(task, today);
}

/** Задачи страницы «Сегодня»: открытые задачи дня и выполненные сегодня. */
export function todayTasks<T extends TodayTask>(
  tasks: readonly T[],
  today: ISODate,
): T[] {
  return tasks.filter(
    (t) => todayGroupOf(t, today) !== null || isDoneToday(t, today),
  );
}

/** Группы невыполненных задач дня в порядке «Просрочено» → «В плане дня». */
export function groupToday<T extends TodayTask>(
  tasks: readonly T[],
  today: ISODate,
): { key: TodayGroupKey; label: string; tasks: T[] }[] {
  const order: TodayGroupKey[] = ["overdue", "due", "planned"];
  return order.flatMap((key) => {
    const items = tasks.filter((t) => todayGroupOf(t, today) === key);
    return items.length
      ? [{ key, label: todayGroupLabels[key], tasks: items }]
      : [];
  });
}
