"use client";

import { Check, Flame, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { addDaysISO, formatLongDate } from "@/lib/domain/dates";
import {
  bestHabitStreak,
  canEditDay,
  completionRate,
  currentHabitStreak,
  describeSchedule,
  isScheduled,
  lastDays,
  weekdayShort,
} from "@/lib/domain/habits";
import { plural } from "@/lib/domain/plural";
import type { Habit, ISODate } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

import { useToggleHabitCheck } from "../hooks";

import { HabitMenu } from "./HabitMenu";

const DAY_FORMS = ["день", "дня", "дней"] as const;
const STREAK_COLOR = "#ea580c";

type Props = {
  habit: Habit;
  checked: ReadonlySet<ISODate>;
  today: ISODate;
  siblings: Habit[];
};

/** Привычка: расписание, отметки за 7 дней, текущий и лучший стрик. */
export function HabitCard({ habit, checked, today, siblings }: Props) {
  const toggle = useToggleHabitCheck();
  const archived = habit.archived_at !== null;
  const streak = currentHabitStreak(habit.weekdays, checked, today);
  const best = bestHabitStreak(habit.weekdays, checked, today);
  const rate = completionRate(
    habit.weekdays,
    checked,
    addDaysISO(today, -29),
    today,
  );

  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-1.5 size-3 shrink-0 rounded-full"
          style={{ backgroundColor: habit.color }}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="font-medium break-words">{habit.name}</h2>
          <p className="text-sm text-muted-foreground">
            {describeSchedule(habit.weekdays)}
          </p>
        </div>
        {archived ? <Badge variant="secondary">Архив</Badge> : null}
        <div className="-mt-1 -mr-2">
          <HabitMenu
            habit={habit}
            siblings={siblings}
            checkCount={checked.size}
          />
        </div>
      </div>

      {/* Полоска отметок: 7 дней, сегодня справа. */}
      <ol
        aria-label={`Отметки «${habit.name}» за последние 7 дней`}
        className="grid grid-cols-7 gap-1.5"
      >
        {lastDays(today, 7).map((day) => {
          const scheduled = isScheduled(habit.weekdays, day);
          const done = checked.has(day);
          const isToday = day === today;
          const editable = !archived && scheduled && canEditDay(day, today);
          const dayName = `${weekdayShort(day)}, ${formatLongDate(day)}`;
          return (
            <li key={day} className="flex flex-col items-center gap-1">
              <span
                aria-hidden
                className={cn(
                  "text-[11px] text-muted-foreground",
                  isToday && "font-semibold text-foreground",
                )}
              >
                {weekdayShort(day)}
              </span>
              <button
                type="button"
                disabled={!editable}
                aria-pressed={done}
                aria-label={
                  scheduled
                    ? `${dayName}: ${done ? "сделано" : "не сделано"}`
                    : `${dayName}: не по расписанию`
                }
                onClick={() =>
                  toggle.mutate({ habitId: habit.id, day, done: !done })
                }
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 transition-colors outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                  !scheduled && "border-dashed opacity-40",
                  isToday && !done && "border-foreground/60",
                  editable && !done && "hover:bg-accent",
                  !editable && "cursor-default",
                )}
                style={
                  done
                    ? {
                        backgroundColor: habit.color,
                        borderColor: habit.color,
                        color: "white",
                      }
                    : undefined
                }
              >
                {done ? (
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                ) : (
                  <span aria-hidden className="text-xs tabular-nums">
                    {Number(day.slice(8, 10))}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <div className="flex items-center gap-1.5">
          {/* Оранжевый из палитры, а не красный: серия — не ошибка. */}
          <Flame
            aria-hidden
            className={cn("size-4", streak === 0 && "text-muted-foreground")}
            style={streak > 0 ? { color: STREAK_COLOR } : undefined}
          />
          <dt className="sr-only">Текущий стрик</dt>
          <dd className="font-medium tabular-nums">
            {streak} {plural(streak, DAY_FORMS)}
          </dd>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Trophy aria-hidden className="size-4" />
          <dt>Лучший:</dt>
          <dd className="tabular-nums">{best}</dd>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <dt>За 30 дней:</dt>
          <dd className="tabular-nums">
            {rate.scheduled ? `${rate.percent}%` : "—"}
          </dd>
        </div>
      </dl>
    </article>
  );
}
