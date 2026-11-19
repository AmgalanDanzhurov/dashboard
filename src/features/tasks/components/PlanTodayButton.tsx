"use client";

import { Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { todayISO } from "@/lib/domain/dates";
import { isPlannedForToday } from "@/lib/domain/today";
import type { Task } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

import { useSetTaskPlannedFor } from "../hooks";

// Горчичный из палитры: контраст не ниже 3:1 и на светлом, и на тёмном фоне.
const PLANNED_COLOR = "#b7800a";

type Props = {
  task: Task;
  /** icon — в строке задачи, labeled — в панели редактирования. */
  variant?: "icon" | "labeled";
};

/** Добавляет задачу в план дня на сегодня или убирает её оттуда. */
export function PlanTodayButton({ task, variant = "icon" }: Props) {
  const setPlannedFor = useSetTaskPlannedFor();
  const planned = isPlannedForToday(task, todayISO());
  const label = planned
    ? "Убрать из плана на сегодня"
    : "Добавить в план на сегодня";

  const toggle = () =>
    setPlannedFor.mutate({ task, plannedFor: planned ? null : todayISO() });

  if (variant === "labeled") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-pressed={planned}
        onClick={toggle}
        className="self-start"
      >
        <Sun
          aria-hidden
          style={planned ? { color: PLANNED_COLOR } : undefined}
          className={cn(planned && "fill-current")}
        />
        {planned ? "В плане на сегодня" : "На сегодня"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-pressed={planned}
      aria-label={`${label}: «${task.title}»`}
      title={label}
      onClick={toggle}
      className={cn(!planned && "text-muted-foreground")}
    >
      <Sun
        aria-hidden
        style={planned ? { color: PLANNED_COLOR } : undefined}
        className={cn(planned && "fill-current")}
      />
    </Button>
  );
}
