import type { TaskPriority, TaskStatus } from "./types";

export const statuses: readonly { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "К выполнению" },
  { value: "in_progress", label: "В работе" },
  { value: "done", label: "Готово" },
];

/**
 * Приоритеты от низкого к срочному. Цвета одинаковы во всех списках и
 * графиках; оттенки — из палитры, с контрастом не ниже 3:1 в обеих темах.
 */
export const priorities: readonly {
  value: TaskPriority;
  label: string;
  color: string;
  /** Меньше — важнее. */
  rank: number;
}[] = [
  { value: "low", label: "Низкий", color: "#64748b", rank: 3 },
  { value: "medium", label: "Средний", color: "#3b82f6", rank: 2 },
  { value: "high", label: "Высокий", color: "#ea580c", rank: 1 },
  { value: "urgent", label: "Срочный", color: "#e11d48", rank: 0 },
];

const priorityByValue = new Map(priorities.map((p) => [p.value, p]));
const statusByValue = new Map(statuses.map((s) => [s.value, s]));

export function priorityMeta(value: TaskPriority) {
  // Map построен из полного списка, поэтому значение всегда найдётся.
  return priorityByValue.get(value) ?? priorities[1];
}

export function statusLabel(value: TaskStatus): string {
  return statusByValue.get(value)?.label ?? value;
}

export function isStatus(value: string): value is TaskStatus {
  return statusByValue.has(value as TaskStatus);
}

export function isPriority(value: string): value is TaskPriority {
  return priorityByValue.has(value as TaskPriority);
}
