"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { groupByDue } from "@/lib/domain/filters";
import type { Task } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

import type { TaskData } from "../useTaskData";

import { TaskRow } from "./TaskRow";
import { TaskSheet } from "./TaskSheet";

type Props = {
  /** Уже отфильтрованные и отсортированные задачи. */
  tasks: readonly Task[];
  data: TaskData;
  /** true — невыполненные разбиты на группы по сроку. */
  grouped: boolean;
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
  grouped,
  showLocation,
  emptyText,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks
    .filter((t) => t.status === "done")
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  // Открытая задача берётся из полного списка: она могла уйти из фильтра.
  const openTask = data.tasks.find((t) => t.id === openId) ?? null;

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
      ) : grouped ? (
        groupByDue(open, data.today).map((group) => (
          <section key={group.key} aria-labelledby={`group-${group.key}`}>
            <h3
              id={`group-${group.key}`}
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
