"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";

import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAreaProgress } from "@/features/areas/hooks";
import { useProjectProgress } from "@/features/projects/hooks";
import { TaskList } from "@/features/tasks/components/TaskList";
import { useTaskData } from "@/features/tasks/useTaskData";
import { addDaysISO, daysFrom } from "@/lib/domain/dates";
import { sortTasks } from "@/lib/domain/filters";
import { todayGroupOf } from "@/lib/domain/today";
import {
  completedByDay,
  countByStatus,
  dashboardKpis,
  withoutArchived,
} from "@/lib/domain/stats";
import { routes } from "@/lib/routes";

import { AreasOverview } from "./AreasOverview";
import { CompletedChart } from "./CompletedChart";
import { KpiTiles } from "./KpiTiles";
import { StatusDonut } from "./StatusDonut";

/** Главный экран: за пару секунд отвечает на вопрос «как у меня дела». */
export function DashboardView() {
  const data = useTaskData();
  const areaProgress = useAreaProgress();
  const projectProgress = useProjectProgress();

  const heading = (
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
      <p className="text-sm text-muted-foreground first-letter:uppercase">
        {format(new Date(), "EEEE, d MMMM", { locale: ru })}
      </p>
    </header>
  );

  if (data.isPending) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        {heading}
        <span className="sr-only">Загружаем дашборд…</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }
  if (data.error) {
    return (
      <div className="flex flex-col gap-6">
        {heading}
        <QueryError error={data.error} onRetry={data.refetch} />
      </div>
    );
  }

  if (data.areas.length === 0 && data.tasks.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {heading}
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
          <h2 className="font-medium">Здесь пока пусто</h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            Создайте разделы — например «Учёба», «Работа», «Личное» — и добавьте
            первые задачи. Дашборд покажет, сколько сделано и что горит.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={routes.areas}>Создать раздел</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={routes.tasks}>Добавить задачу</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { today, projectsById } = data;
  const active = withoutArchived(data.tasks, projectsById);
  const open = sortTasks(
    active.filter((t) => t.status !== "done"),
    "due",
  );
  // Сегодня — как на странице «Сегодня»: просрочка, срок сегодня и план дня.
  const dueNow = open.filter((t) => todayGroupOf(t, today) !== null);
  const dueSoon = open.filter((t) => {
    // Уже показанные в «Сегодня» (например, в плане дня) не повторяем.
    if (!t.due_date || todayGroupOf(t, today) !== null) return false;
    const days = daysFrom(today, t.due_date);
    return days >= 1 && days <= 7;
  });

  return (
    <div className="flex flex-col gap-6">
      {heading}

      <KpiTiles kpis={dashboardKpis(data.tasks, today, projectsById)} />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <CompletedChart
          days={completedByDay(data.tasks, addDaysISO(today, -13), today)}
          today={today}
        />
        <StatusDonut counts={countByStatus(active)} />
      </div>

      {data.areas.length > 0 ? (
        <AreasOverview
          areas={data.areas}
          projects={data.projects}
          areaProgress={areaProgress.data}
          projectProgress={projectProgress.data}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="due-now-heading"
          className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="due-now-heading" className="font-medium">
              Сегодня
            </h2>
            <Link
              href={routes.today}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
            >
              Открыть
            </Link>
          </div>
          <TaskList
            tasks={dueNow}
            data={data}
            grouping="today"
            showLocation
            emptyText="На сегодня ничего не горит."
          />
        </section>
        <section
          aria-labelledby="due-soon-heading"
          className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4"
        >
          <h2 id="due-soon-heading" className="font-medium">
            Ближайшие 7 дней
          </h2>
          <TaskList
            tasks={dueSoon}
            data={data}
            grouping="due"
            showLocation
            emptyText="На неделю вперёд сроков нет."
          />
        </section>
      </div>
    </div>
  );
}
