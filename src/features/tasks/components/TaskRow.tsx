"use client";

import { CalendarDays, Repeat } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagChip } from "@/features/tags/components/TagChip";
import { dueLabel } from "@/lib/domain/dates";
import { isOverdue } from "@/lib/domain/filters";
import { describeRecurrence, parseRecurrence } from "@/lib/domain/recurrence";
import { taskLocation } from "@/lib/domain/location";
import { priorities, priorityMeta, statuses } from "@/lib/domain/taskMeta";
import type { Task, TaskPriority, TaskStatus } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

import { useSetTaskPriority, useSetTaskStatus } from "../hooks";
import type { TaskData } from "../useTaskData";

import { PlanTodayButton } from "./PlanTodayButton";

type Props = {
  task: Task;
  data: TaskData;
  /** Показывать, где лежит задача (на общей странице задач). */
  showLocation: boolean;
  onOpen: (task: Task) => void;
};

export function TaskRow({ task, data, showLocation, onOpen }: Props) {
  const setStatus = useSetTaskStatus();
  const setPriority = useSetTaskPriority();
  const done = task.status === "done";
  const overdue = isOverdue(task, data.today);
  const priority = priorityMeta(task.priority);
  const location = showLocation ? locationLabel(task, data) : null;
  const rule = parseRecurrence(task.recurrence);

  return (
    <li className="flex items-start gap-3 py-2.5">
      <Checkbox
        className="mt-0.5"
        checked={done}
        aria-label={
          done
            ? `Вернуть «${task.title}» в работу`
            : `Выполнить «${task.title}»`
        }
        onCheckedChange={(checked) =>
          setStatus.mutate({ task, status: checked === true ? "done" : "todo" })
        }
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => onOpen(task)}
            className={cn(
              "min-w-0 flex-1 rounded-sm text-left break-words outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring",
              done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </button>
          {/* Выполненную задачу в план дня не добавляют. */}
          {!done ? (
            <div className="-mt-1 -mr-1">
              <PlanTodayButton task={task} />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <Select
            value={task.status}
            onValueChange={(status) =>
              setStatus.mutate({ task, status: status as TaskStatus })
            }
          >
            <SelectTrigger
              size="sm"
              aria-label="Статус"
              className="h-6 gap-1 border-none px-1.5 text-xs shadow-none"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={task.priority}
            onValueChange={(value) =>
              setPriority.mutate({ task, priority: value as TaskPriority })
            }
          >
            <SelectTrigger
              size="sm"
              aria-label="Приоритет"
              className="h-6 gap-1 border-none px-1.5 text-xs shadow-none"
            >
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: priority.color }}
              />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {task.due_date ? (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                overdue && "font-medium text-destructive",
              )}
            >
              <CalendarDays className="size-3.5" aria-hidden />
              {overdue ? <span className="sr-only">Просрочено:</span> : null}
              {dueLabel(task.due_date, data.today)}
            </span>
          ) : null}

          {rule ? (
            <span className="inline-flex items-center gap-1">
              <Repeat className="size-3.5" aria-hidden />
              <span className="sr-only">Повтор:</span>
              {describeRecurrence(rule)}
            </span>
          ) : null}

          {location ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{ backgroundColor: location.color }}
              />
              {location.label}
            </span>
          ) : null}

          {task.tagIds.map((id) => {
            const tag = data.tagsById.get(id);
            return tag ? <TagChip key={id} tag={tag} /> : null;
          })}
        </div>
      </div>
    </li>
  );
}

function locationLabel(
  task: Task,
  data: TaskData,
): { label: string; color: string } {
  const location = taskLocation(task);
  if (location.kind === "project") {
    const project = data.projectsById.get(location.projectId);
    const area = project ? data.areasById.get(project.area_id) : undefined;
    return {
      label: [area?.name, project?.name].filter(Boolean).join(" → "),
      color: project?.color ?? "transparent",
    };
  }
  if (location.kind === "area") {
    const area = data.areasById.get(location.areaId);
    return { label: area?.name ?? "", color: area?.color ?? "transparent" };
  }
  return { label: "Входящие", color: "var(--muted-foreground)" };
}
