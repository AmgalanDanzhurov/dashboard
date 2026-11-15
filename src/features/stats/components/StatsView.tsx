"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { BarList } from "@/components/charts/BarList";
import { BurndownChart } from "@/components/charts/BurndownChart";
import { QueryError } from "@/components/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompletedChart } from "@/features/dashboard/components/CompletedChart";
import { KpiTiles } from "@/features/dashboard/components/KpiTiles";
import { useTaskData } from "@/features/tasks/useTaskData";
import { addDaysISO } from "@/lib/domain/dates";
import { priorities } from "@/lib/domain/taskMeta";
import {
  burndown,
  completedByArea,
  completedByDay,
  completedByTag,
  countByPriority,
  dashboardKpis,
  withoutArchived,
} from "@/lib/domain/stats";
import { cn } from "@/lib/utils";

const PERIODS = [7, 30, 90] as const;
type Period = (typeof PERIODS)[number];

function parsePeriod(value: string | null): Period {
  return PERIODS.find((p) => String(p) === value) ?? 30;
}

/** Страница /stats: период 7 / 30 / 90 дней в адресе, разбивки и burndown. */
export function StatsView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const data = useTaskData();

  const period = parsePeriod(params.get("period"));

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null) next.delete(key);
    else next.set(key, value);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  const heading = (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <h1 className="mr-auto text-2xl font-semibold tracking-tight">
        Статистика
      </h1>
      <div
        role="group"
        aria-label="Период"
        className="inline-flex rounded-lg border p-0.5"
      >
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={period === p}
            onClick={() => setParam("period", p === 30 ? null : String(p))}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium tabular-nums transition-colors outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring",
              period === p
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p} дней
          </button>
        ))}
      </div>
    </header>
  );

  if (data.isPending) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        {heading}
        <span className="sr-only">Загружаем статистику…</span>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
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

  const { today, projectsById } = data;
  const from = addDaysISO(today, -(period - 1));

  const byArea = completedByArea(data.tasks, projectsById, from, today);
  const areaItems = [
    ...data.areas.map((a) => ({
      key: a.id,
      label: a.name,
      value: byArea.get(a.id) ?? 0,
      color: a.color,
    })),
    {
      key: "inbox",
      label: "Входящие",
      value: byArea.get("inbox") ?? 0,
      color: "var(--muted-foreground)",
    },
  ].filter((i) => i.value > 0);

  const byTag = completedByTag(data.tasks, from, today);
  const tagItems = data.tags
    .map((t) => ({
      key: t.id,
      label: t.name,
      value: byTag.get(t.id) ?? 0,
      color: t.color,
    }))
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value);

  const openActive = withoutArchived(data.tasks, projectsById).filter(
    (t) => t.status !== "done",
  );
  const byPriority = countByPriority(openActive);
  // Срочные сверху: порядок важности, а не алфавит.
  const priorityItems = [...priorities]
    .sort((a, b) => a.rank - b.rank)
    .map((p) => ({
      key: p.value,
      label: p.label,
      value: byPriority[p.value],
      color: p.color,
    }));

  const activeProjects = data.projects.filter((p) => p.archived_at === null);
  const selectedProject =
    activeProjects.find((p) => p.id === params.get("project")) ??
    activeProjects[0];
  const projectTasks = selectedProject
    ? data.tasks.filter((t) => t.project_id === selectedProject.id)
    : [];

  return (
    <div className="flex flex-col gap-6">
      {heading}

      <KpiTiles kpis={dashboardKpis(data.tasks, today, projectsById)} />

      <CompletedChart
        title={`Выполнено по дням за ${period} дней`}
        days={completedByDay(data.tasks, from, today)}
        today={today}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Выполнено по разделам">
          <BarList
            label="Выполнено по разделам"
            items={areaItems}
            emptyText="За этот период ничего не выполнено."
          />
        </Panel>
        <Panel title="Выполнено по тегам">
          <BarList
            label="Выполнено по тегам"
            items={tagItems}
            emptyText={
              data.tags.length === 0
                ? "Тегов пока нет."
                : "За этот период нет выполненных задач с тегами."
            }
          />
        </Panel>
        <Panel title="Открытые задачи по приоритету">
          <BarList
            label="Открытые задачи по приоритету"
            items={priorityItems}
            emptyText="Открытых задач нет."
          />
        </Panel>
      </div>

      <Panel
        title="Burndown проекта"
        action={
          activeProjects.length > 0 && selectedProject ? (
            <Select
              value={selectedProject.id}
              onValueChange={(id) => setParam("project", id)}
            >
              <SelectTrigger size="sm" aria-label="Проект">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span
                      aria-hidden
                      className="size-2 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null
        }
      >
        {selectedProject ? (
          <BurndownChart
            points={burndown(projectTasks, from, today)}
            today={today}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Активных проектов нет — burndown строится по задачам проекта.
          </p>
        )}
      </Panel>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
