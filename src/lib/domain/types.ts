import type { Tables } from "@/lib/supabase/database.types";

// Доменные типы выводятся из сгенерированных типов БД: при изменении схемы
// и перегенерации типов TypeScript сразу покажет, что поменялось.

export type Area = Tables<"areas">;
export type Project = Tables<"projects">;

export type Progress = {
  done: number;
  total: number;
  /** 0–100, целое. */
  percent: number;
};

/** Прогресс по id раздела или проекта. Отсутствующий id — «Нет задач». */
export type ProgressById = Record<string, Progress>;
