"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { QueryError } from "@/components/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import {
  filterTasks,
  filtersToParams,
  parseFilters,
  sortTasks,
  type TaskFilters,
} from "@/lib/domain/filters";
import type { TaskLocation } from "@/lib/domain/location";

import { useTaskData } from "../useTaskData";

import { QuickAddTask } from "./QuickAddTask";
import { TaskFiltersBar } from "./TaskFiltersBar";
import { TaskList } from "./TaskList";

/** Страница /tasks: все задачи с фильтрами в адресе. */
export function TasksView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const data = useTaskData();

  const filters = parseFilters(new URLSearchParams(searchParams.toString()));

  function setFilters(next: TaskFilters) {
    const query = filtersToParams(next).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  // Новая задача попадает туда, что сейчас выбрано в фильтре.
  const quickAddLocation: TaskLocation = filters.project
    ? { kind: "project", projectId: filters.project }
    : filters.area && filters.area !== "inbox"
      ? { kind: "area", areaId: filters.area }
      : { kind: "inbox" };

  const visible = sortTasks(
    filterTasks(data.tasks, filters, data.today, data.projectsById),
    filters.sort,
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Задачи</h1>

      <QuickAddTask
        key={JSON.stringify(quickAddLocation)}
        location={quickAddLocation}
        placeholder={
          quickAddLocation.kind === "inbox"
            ? "Новая задача во «Входящие» — Enter"
            : undefined
        }
      />

      {data.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <span className="sr-only">Загружаем задачи…</span>
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : data.error ? (
        <QueryError error={data.error} onRetry={data.refetch} />
      ) : (
        <>
          <TaskFiltersBar filters={filters} onChange={setFilters} data={data} />
          <TaskList
            tasks={visible}
            data={data}
            grouped={filters.sort === "due"}
            showLocation
            emptyText={
              data.tasks.length === 0
                ? "Задач пока нет. Добавьте первую строкой выше."
                : "Нет задач, подходящих под фильтры."
            }
          />
        </>
      )}
    </div>
  );
}
