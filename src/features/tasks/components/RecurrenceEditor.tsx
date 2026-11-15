"use client";

import { useId } from "react";
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { todayISO } from "@/lib/domain/dates";
import { weekdayOptions } from "@/lib/domain/recurrence";
import { cn } from "@/lib/utils";

import type { RecurrenceFormValues, TaskFormValues } from "../schema";

const typeOptions: { value: RecurrenceFormValues["type"]; label: string }[] = [
  { value: "none", label: "Не повторять" },
  { value: "daily", label: "Каждый день" },
  { value: "every_n_days", label: "Каждые N дней" },
  { value: "weekly", label: "По дням недели" },
  { value: "monthly", label: "Каждый месяц" },
];

type Props = {
  control: Control<TaskFormValues>;
  register: UseFormRegister<TaskFormValues>;
  setValue: UseFormSetValue<TaskFormValues>;
  errors: FieldErrors<TaskFormValues>;
};

/** Блок «Повтор» в форме задачи. */
export function RecurrenceEditor({
  control,
  register,
  setValue,
  errors,
}: Props) {
  const weekdaysLabelId = useId();
  const type = useWatch({ control, name: "recurrence.type" });
  const dueDate = useWatch({ control, name: "dueDate" });
  const recurrenceErrors = errors.recurrence;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="task-recurrence">Повтор</Label>
        <Controller
          control={control}
          name="recurrence.type"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                // Повтору нужен срок — ставим сегодняшний, если его нет.
                if (value !== "none" && !dueDate) {
                  setValue("dueDate", todayISO(), { shouldValidate: true });
                }
              }}
            >
              <SelectTrigger id="task-recurrence" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {type === "every_n_days" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-interval">Через сколько дней</Label>
          <Input
            id="task-interval"
            type="number"
            min={2}
            max={365}
            inputMode="numeric"
            className="w-28"
            aria-invalid={recurrenceErrors?.interval ? true : undefined}
            {...register("recurrence.interval", { valueAsNumber: true })}
          />
          {recurrenceErrors?.interval ? (
            <p className="text-sm text-destructive">
              {recurrenceErrors.interval.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {type === "weekly" ? (
        <div className="flex flex-col gap-2">
          <span id={weekdaysLabelId} className="text-sm font-medium">
            Дни недели
          </span>
          <Controller
            control={control}
            name="recurrence.weekdays"
            render={({ field }) => (
              <div
                role="group"
                aria-labelledby={weekdaysLabelId}
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
            )}
          />
          {recurrenceErrors?.weekdays ? (
            <p className="text-sm text-destructive">
              {recurrenceErrors.weekdays.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {type === "monthly" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-day-of-month">Число месяца</Label>
          <Input
            id="task-day-of-month"
            type="number"
            min={1}
            max={31}
            inputMode="numeric"
            className="w-28"
            aria-invalid={recurrenceErrors?.dayOfMonth ? true : undefined}
            aria-describedby="task-day-of-month-hint"
            {...register("recurrence.dayOfMonth", { valueAsNumber: true })}
          />
          <p
            id="task-day-of-month-hint"
            className="text-xs text-muted-foreground"
          >
            Если в месяце меньше дней — последний день месяца.
          </p>
          {recurrenceErrors?.dayOfMonth ? (
            <p className="text-sm text-destructive">
              {recurrenceErrors.dayOfMonth.message}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
