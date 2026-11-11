import { z } from "zod";

import { isPriority, isStatus } from "@/lib/domain/taskMeta";

/** Форма редактирования задачи. Расположение — строка encodeLocation. */
export const taskFormSchema = z.object({
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
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

/** Строка быстрого добавления: только название. */
export const quickAddSchema = z
  .string()
  .trim()
  .min(1)
  .max(200, { error: "Название не длиннее 200 символов" });
