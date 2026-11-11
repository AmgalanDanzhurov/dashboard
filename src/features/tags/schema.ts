import { z } from "zod";

import { isPaletteColor } from "@/lib/domain/palette";

export const tagFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Введите название" })
    .max(40, { error: "Не длиннее 40 символов" }),
  color: z
    .string()
    // Явный boolean: иначе TypeScript выведет предикат типа, zod сузит тип
    // поля, и типы входа и выхода формы разойдутся.
    .refine((value): boolean => isPaletteColor(value), {
      error: "Выберите цвет",
    }),
});

export type TagFormValues = z.infer<typeof tagFormSchema>;
