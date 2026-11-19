"use client";

import { ChevronRight } from "lucide-react";
import { useId, useState } from "react";

import { groupByDue } from "@/lib/domain/filters";
import { groupToday } from "@/lib/domain/today";
import type { Task } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

import type { TaskData } from "../useTaskData";

import { SortableTaskList } from "./SortableTaskList";
import { TaskRow } from "./TaskRow";
import { TaskSheet } from "./TaskSheet";

type Props = {
  /** Уже отфильтрованные и отсортированные задачи. */
  tasks: readonly Task[];
  data: TaskData;
  /**
   * Как разбить невыполненные: по сроку («Просрочено», «Сегодня», …),
   * по группам страницы «Сегодня», не разбивать (приоритет, дата создания)
   * или «Свой порядок» — подряд, с перетаскиванием.
   */
  grouping: "due" | "today" | "none" | "manual";
  showLocation: boolean;
  emptyText: string;
};

/**
 * Список задач: невыполненные (по группам срока или подряд) и свёрнутый
 * блок «Выполнено». По клику на название открывается панель редактирования.
 */
export function TaskList({
  tasks,
  data,
  grouping,
  showLocation,
  emptyText,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  // Префикс id заголовков: на одной странице бывает несколько списков.
  const idPrefix = useId();

  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks
    .filter((t) => t.status === "done")
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  // Открытая задача берётся из полного списка: она могла уйти из фильтра.
  const openTask = data.tasks.find((t) => t.id === openId) ?? null;

  const groups =
    grouping === "due"
      ? groupByDue(open, data.today)
      : grouping === "today"
        ? groupToday(open, data.today)
        : null;

  const row = (task: Task) => (
    <TaskRow
      key={task.id}
      task={task}
      data={data}
      showLocation={showLocation}
      onOpen={(t) => setOpenId(t.id)}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      {open.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : groups ? (
        groups.map((group) => (
          <section key={group.key} aria-labelledby={`${idPrefix}-${group.key}`}>
            <h3
              id={`${idPrefix}-${group.key}`}
              className={cn(
                "text-sm font-medium",
                group.key === "overdue" && "text-destructive",
              )}
            >
              {group.label}{" "}
              <span className="font-normal text-muted-foreground tabular-nums">
                {group.tasks.length}
              </span>
            </h3>
            <ul className="divide-y">{group.tasks.map(row)}</ul>
          </section>
        ))
      ) : grouping === "manual" ? (
        <SortableTaskList
          tasks={open}
          data={data}
          showLocation={showLocation}
          onOpen={(t) => setOpenId(t.id)}
        />
      ) : (
        <ul className="divide-y">{open.map(row)}</ul>
      )}

      {done.length > 0 ? (
        <section>
          <button
            type="button"
            aria-expanded={showDone}
            onClick={() => setShowDone((v) => !v)}
            className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight
              aria-hidden
              className={cn(
                "size-4 transition-transform",
                showDone && "rotate-90",
              )}
            />
            Выполнено{" "}
            <span className="font-normal tabular-nums">{done.length}</span>
          </button>
          {showDone ? <ul className="divide-y">{done.map(row)}</ul> : null}
        </section>
      ) : null}

      <TaskSheet task={openTask} onClose={() => setOpenId(null)} data={data} />
    </div>
  );
}
