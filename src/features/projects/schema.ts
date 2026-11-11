import { z } from "zod";

import { isPaletteColor } from "@/lib/domain/palette";

export const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Введите название" })
    .max(100, { error: "Не длиннее 100 символов" }),
  description: z
    .string()
    .trim()
    .max(2000, { error: "Не длиннее 2000 символов" }),
  color: z
    .string()
    // Явный boolean: иначе TypeScript выведет предикат типа, zod сузит тип
    // поля, и типы входа и выхода формы разойдутся.
    .refine((value): boolean => isPaletteColor(value), {
      error: "Выберите цвет",
    }),
  areaId: z.string().min(1, { error: "Выберите раздел" }),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
