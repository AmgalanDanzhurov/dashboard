import { z } from "zod";

const supabaseEnvSchema = z.object({
  url: z.url({
    error: "NEXT_PUBLIC_SUPABASE_URL должен быть адресом проекта Supabase",
  }),
  anonKey: z
    .string()
    .min(1, { error: "NEXT_PUBLIC_SUPABASE_ANON_KEY не задан" }),
});

export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;

/**
 * Читает и проверяет переменные Supabase.
 * process.env.NEXT_PUBLIC_* нужно писать буквально: Next подставляет значения
 * при сборке только для таких обращений.
 */
export function readSupabaseEnv(
  source: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
): SupabaseEnv {
  const parsed = supabaseEnvSchema.safeParse({
    url: source.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: source.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => issue.message)
      .join("; ");
    throw new Error(
      `Не настроено подключение к Supabase: ${details}. См. .env.example.`,
    );
  }
  return parsed.data;
}
