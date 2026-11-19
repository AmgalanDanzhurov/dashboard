"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";

import { ColorPicker } from "@/components/ColorPicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nextFreeColor } from "@/lib/domain/palette";
import { weekdayOptions } from "@/lib/domain/recurrence";
import type { Habit } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

import { useCreateHabit, useHabits, useUpdateHabit } from "../hooks";
import { habitFormSchema, type HabitFormValues } from "../schema";

const presets = [
  { label: "Каждый день", days: [1, 2, 3, 4, 5, 6, 7] },
  { label: "Будни", days: [1, 2, 3, 4, 5] },
  { label: "Выходные", days: [6, 7] },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Если передана — редактирование, иначе создание. */
  habit?: Habit;
};

export function HabitFormDialog({ open, onOpenChange, habit }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {habit ? "Редактировать привычку" : "Новая привычка"}
          </DialogTitle>
          <DialogDescription>
            Отмечайте её каждый запланированный день — стрик покажет серию.
          </DialogDescription>
        </DialogHeader>
        <HabitForm habit={habit} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function HabitForm({ habit, onDone }: { habit?: Habit; onDone: () => void }) {
  const colorLabelId = useId();
  const daysLabelId = useId();
  const { data: habits = [] } = useHabits();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HabitFormValues>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      name: habit?.name ?? "",
      color: habit?.color ?? nextFreeColor(habits.map((h) => h.color)),
      weekdays: habit?.weekdays ?? [1, 2, 3, 4, 5, 6, 7],
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (habit) await updateHabit.mutateAsync({ id: habit.id, values });
    else await createHabit.mutateAsync({ values, habits });
    onDone();
  });

  return (
    <form
      onSubmit={(e) => void onSubmit(e).catch(() => undefined)}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="habit-name">Название</Label>
        <Input
          id="habit-name"
          autoFocus
          placeholder="Например, зарядка"
          aria-invalid={errors.name ? true : undefined}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <span id={daysLabelId} className="text-sm font-medium">
          Дни
        </span>
        <Controller
          control={control}
          name="weekdays"
          render={({ field }) => (
            <div className="flex flex-col gap-2">
              <div
                role="group"
                aria-labelledby={daysLabelId}
                className="flex flex-wrap gap-1.5"
              >
                {weekdayOptions.map((day) => {
                  const selected = field.value.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        field.onChange(
                          selected
                            ? field.value.filter((d) => d !== day.value)
                            : [...field.value, day.value],
                        )
                      }
                      className={cn(
                        "size-9 rounded-md border text-sm font-medium transition-colors outline-none",
                        "focus-visible:ring-2 focus-visible:ring-ring",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => field.onChange(preset.days)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        />
        {errors.weekdays ? (
          <p className="text-sm text-destructive">{errors.weekdays.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <span id={colorLabelId} className="text-sm font-medium">
          Цвет
        </span>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <ColorPicker
              value={field.value}
              onChange={field.onChange}
              labelledBy={colorLabelId}
            />
          )}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {habit ? "Сохранить" : "Создать"}
        </Button>
      </DialogFooter>
    </form>
  );
}
