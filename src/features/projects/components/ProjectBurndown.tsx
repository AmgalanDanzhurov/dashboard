"use client";

import { BurndownChart } from "@/components/charts/BurndownChart";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/features/tasks/hooks";
import { addDaysISO, todayISO } from "@/lib/domain/dates";
import { burndown } from "@/lib/domain/stats";

/** Burndown проекта за последние 30 дней. */
export function ProjectBurndown({ projectId }: { projectId: string }) {
  const tasks = useTasks();
  const today = todayISO();

  return (
    <section
      aria-labelledby="project-burndown"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4"
    >
      <div>
        <h2 id="project-burndown" className="font-medium">
          Burndown за 30 дней
        </h2>
        <p className="text-sm text-muted-foreground">
          Открытые задачи на конец каждого дня, без повторяющихся.
        </p>
      </div>
      {tasks.data ? (
        <BurndownChart
          points={burndown(
            tasks.data.filter((t) => t.project_id === projectId),
            addDaysISO(today, -29),
            today,
          )}
          today={today}
        />
      ) : tasks.isError ? (
        <p className="text-sm text-muted-foreground">
          Не удалось загрузить задачи для графика.
        </p>
      ) : (
        <Skeleton className="h-48 w-full" />
      )}
    </section>
  );
}
