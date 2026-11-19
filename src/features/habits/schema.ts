import { z } from "zod";

import { isPaletteColor } from "@/lib/domain/palette";

export const habitFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Введите название" })
    .max(60, { error: "Не длиннее 60 символов" }),
  color: z
    .string()
    // Явный boolean: иначе TypeScript выведет предикат типа, zod сузит тип
    // поля, и типы входа и выхода формы разойдутся.
    .refine((value): boolean => isPaletteColor(value), {
      error: "Выберите цвет",
    }),
  // Как CHECK в базе: хотя бы один день, только 1–7.
  weekdays: z
    .array(z.number().int().min(1).max(7))
    .min(1, { error: "Выберите хотя бы один день" }),
});

export type HabitFormValues = z.infer<typeof habitFormSchema>;
