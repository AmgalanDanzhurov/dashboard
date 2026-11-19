"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { todayISO } from "@/lib/domain/dates";
import { isScheduled } from "@/lib/domain/habits";
import type { ISODate } from "@/lib/domain/types";

import { useHabitChecks, useHabits } from "../hooks";

import { HabitCard } from "./HabitCard";
import { HabitFormDialog } from "./HabitFormDialog";

/** Страница /habits: привычки с отметками за неделю и стриками. */
export function HabitsView() {
  const habits = useHabits();
  const checks = useHabitChecks();
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const today = todayISO();

  // Отметки по привычкам: id → множество дней.
  const checkedByHabit = useMemo(() => {
    const map = new Map<string, Set<ISODate>>();
    for (const c of checks.data ?? []) {
      const days = map.get(c.habit_id) ?? new Set<ISODate>();
      days.add(c.day);
      map.set(c.habit_id, days);
    }
    return map;
  }, [checks.data]);

  const all = habits.data ?? [];
  const active = all.filter((h) => h.archived_at === null);
  const archived = all.filter((h) => h.archived_at !== null);
  const dueToday = active.filter((h) => isScheduled(h.weekdays, today));
  const doneToday = dueToday.filter((h) =>
    checkedByHabit.get(h.id)?.has(today),
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="mr-auto flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Привычки</h1>
          {habits.data && dueToday.length > 0 ? (
            <p className="text-sm text-muted-foreground tabular-nums">
              Сегодня сделано {doneToday.length} из {dueToday.length}
            </p>
          ) : null}
        </div>
        {archived.length > 0 ? (
          <div className="flex items-center gap-2">
            <Switch
              id="habits-show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="habits-show-archived">
              Показать архив ({archived.length})
            </Label>
          </div>
        ) : null}
        <Button onClick={() => setCreating(true)}>
          <Plus /> Новая привычка
        </Button>
      </header>

      {habits.isPending || checks.isPending ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <span className="sr-only">Загружаем привычки…</span>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : habits.isError || checks.isError ? (
        <QueryError
          error={habits.error ?? checks.error}
          onRetry={() => {
            void habits.refetch();
            void checks.refetch();
          }}
        />
      ) : all.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
          <h2 className="font-medium">Заведите первую привычку</h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            Например, «Зарядка» каждый день или «Бег» по понедельникам, средам и
            пятницам. Отмечайте выполнение — стрик покажет, сколько дней подряд
            получилось.
          </p>
          <Button onClick={() => setCreating(true)}>
            <Plus /> Новая привычка
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {[...active, ...(showArchived ? archived : [])].map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              checked={checkedByHabit.get(habit.id) ?? new Set()}
              today={today}
              siblings={active}
            />
          ))}
        </div>
      )}

      <HabitFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
