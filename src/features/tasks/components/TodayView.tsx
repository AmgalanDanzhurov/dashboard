"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { QueryError } from "@/components/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { sortTasks } from "@/lib/domain/filters";
import { plural, TASK_FORMS } from "@/lib/domain/plural";
import { withoutArchived } from "@/lib/domain/stats";
import { todayGroupOf, todayTasks } from "@/lib/domain/today";

import { useTaskData } from "../useTaskData";

import { QuickAddTask } from "./QuickAddTask";
import { TaskList } from "./TaskList";

/** Страница /today: задачи дня — просроченные, со сроком сегодня и план дня. */
export function TodayView() {
  const data = useTaskData();
  const { today } = data;

  const tasks = sortTasks(
    todayTasks(withoutArchived(data.tasks, data.projectsById), today),
    "due",
  );
  const openCount = tasks.filter((t) => todayGroupOf(t, today) !== null).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Сегодня</h1>
        <p className="text-sm text-muted-foreground first-letter:uppercase">
          {format(new Date(), "EEEE, d MMMM", { locale: ru })}
          {data.isPending
            ? null
            : ` · ${openCount} ${plural(openCount, TASK_FORMS)} на сегодня`}
        </p>
      </header>

      <QuickAddTask
        location={{ kind: "inbox" }}
        plannedFor={today}
        placeholder="Задача на сегодня"
      />

      {data.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <span className="sr-only">Загружаем задачи…</span>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : data.error ? (
        <QueryError error={data.error} onRetry={data.refetch} />
      ) : (
        <TaskList
          tasks={tasks}
          data={data}
          grouping="today"
          showLocation
          emptyText="На сегодня ничего нет. Добавьте задачу строкой выше или нажмите кнопку с солнцем у любой задачи, чтобы взять её в план дня."
        />
      )}
    </div>
  );
}
