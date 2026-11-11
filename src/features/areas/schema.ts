import { z } from "zod";

import { isPaletteColor } from "@/lib/domain/palette";

export const areaFormSchema = z.object({
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
});

export type AreaFormValues = z.infer<typeof areaFormSchema>;
