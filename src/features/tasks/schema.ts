import { z } from "zod";

import { isPriority, isStatus } from "@/lib/domain/taskMeta";

/**
 * Состояние редактора повтора. Все поля хранятся всегда, даже когда тип
 * их не использует: если переключить «по дням недели» → «каждый день» → назад,
 * выбранные дни не потеряются.
 */
export const recurrenceFormSchema = z.object({
  type: z.enum(["none", "daily", "every_n_days", "weekly", "monthly"]),
  // Пустое <input type="number"> даёт NaN. Пропускаем его здесь, а понятную
  // ошибку выдаёт superRefine — и только если поле нужно выбранному типу.
  interval: z.union([z.number(), z.nan()]),
  weekdays: z.array(z.number().int().min(1).max(7)),
  dayOfMonth: z.union([z.number(), z.nan()]),
});

export type RecurrenceFormValues = z.infer<typeof recurrenceFormSchema>;

/** Форма редактирования задачи. Расположение — строка encodeLocation. */
export const taskFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { error: "Введите название" })
      .max(200, { error: "Не длиннее 200 символов" }),
    description: z
      .string()
      .trim()
      .max(5000, { error: "Не длиннее 5000 символов" }),
    status: z.string().refine((v): boolean => isStatus(v)),
    priority: z.string().refine((v): boolean => isPriority(v)),
    /** "" — без срока, иначе YYYY-MM-DD из <input type="date">. */
    dueDate: z.union([z.literal(""), z.iso.date({ error: "Неверная дата" })]),
    location: z.string(),
    tagIds: z.array(z.string()),
    recurrence: recurrenceFormSchema,
  })
  .superRefine((values, ctx) => {
    const { type, interval, weekdays, dayOfMonth } = values.recurrence;
    if (type === "none") return;
    // Так же проверяет и база: CHECK (recurrence is null or due_date is not null).
    if (values.dueDate === "") {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Для повтора нужен срок",
      });
    }
    if (
      type === "every_n_days" &&
      !(Number.isInteger(interval) && interval >= 2 && interval <= 365)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["recurrence", "interval"],
        message: "Целое число от 2 до 365",
      });
    }
    if (type === "weekly" && weekdays.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["recurrence", "weekdays"],
        message: "Выберите хотя бы один день",
      });
    }
    if (
      type === "monthly" &&
      !(Number.isInteger(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 31)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["recurrence", "dayOfMonth"],
        message: "Число от 1 до 31",
      });
    }
  });

export type TaskFormValues = z.infer<typeof taskFormSchema>;

/** Строка быстрого добавления: только название. */
export const quickAddSchema = z
  .string()
  .trim()
  .min(1)
  .max(200, { error: "Название не длиннее 200 символов" });
