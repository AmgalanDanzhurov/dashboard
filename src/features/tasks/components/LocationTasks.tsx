"use client";

import { QueryError } from "@/components/QueryError";
import { Skeleton } from "@/components/ui/skeleton";
import { sortTasks } from "@/lib/domain/filters";
import { taskLocation, type TaskLocation } from "@/lib/domain/location";

import { useTaskData } from "../useTaskData";

import { QuickAddTask } from "./QuickAddTask";
import { groupingFor, SortSelect, useSortParam } from "./SortSelect";
import { TaskList } from "./TaskList";

type Props = {
  /** Задачи какого места показывать; сюда же добавляются новые. */
  location: TaskLocation;
  emptyText: string;
};

/** Задачи одного раздела (без проекта) или одного проекта, со строкой добавления. */
export function LocationTasks({ location, emptyText }: Props) {
  const data = useTaskData();
  const [sort, setSort] = useSortParam();
  const key = JSON.stringify(location);

  const tasks = sortTasks(
    data.tasks.filter((t) => JSON.stringify(taskLocation(t)) === key),
    sort,
  );

  return (
    <div className="flex flex-col gap-4">
      <QuickAddTask location={location} />
      <div className="flex justify-end">
        <SortSelect value={sort} onChange={setSort} />
      </div>
      {data.isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
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
          grouping={groupingFor(sort, "due")}
          showLocation={false}
          emptyText={emptyText}
        />
      )}
    </div>
  );
}
