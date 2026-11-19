import type { Enums, Tables } from "@/lib/supabase/database.types";

// Доменные типы выводятся из сгенерированных типов БД: при изменении схемы
// и перегенерации типов TypeScript сразу покажет, что поменялось.

export type Area = Tables<"areas">;
export type Project = Tables<"projects">;
export type Tag = Tables<"tags">;
export type Habit = Tables<"habits">;
export type HabitCheck = Tables<"habit_checks">;

export type TaskStatus = Enums<"task_status">;
export type TaskPriority = Enums<"task_priority">;

/** Задача вместе с id её тегов (из связки task_tags). */
export type Task = Tables<"tasks"> & { tagIds: string[] };

export type Progress = {
  done: number;
  total: number;
  /** 0–100, целое. */
  percent: number;
};

/** Прогресс по id раздела или проекта. Отсутствующий id — «Нет задач». */
export type ProgressById = Record<string, Progress>;

/** Дата без времени в формате YYYY-MM-DD, как due_date в базе. */
export type ISODate = string;
