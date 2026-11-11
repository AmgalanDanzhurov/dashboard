import type { Progress, ProgressById } from "./types";

export function calcProgress(done: number, total: number): Progress {
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

export const emptyProgress: Progress = calcProgress(0, 0);

/** Прогресс из строки представления area_progress / project_progress. */
export function progressFromRow(row: {
  done: number | null;
  total: number | null;
}): Progress {
  return calcProgress(row.done ?? 0, row.total ?? 0);
}

export function progressOf(
  byId: ProgressById | undefined,
  id: string,
): Progress {
  return byId?.[id] ?? emptyProgress;
}

/** Подпись под полосой: «7 из 10» или «Нет задач», если задач нет. */
export function formatProgress({ done, total }: Progress): string {
  return total === 0 ? "Нет задач" : `${done} из ${total}`;
}
