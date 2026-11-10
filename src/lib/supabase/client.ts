import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { readSupabaseEnv } from "@/lib/env";

import type { Database } from "./database.types";

export type AppSupabaseClient = SupabaseClient<Database>;

let client: AppSupabaseClient | undefined;

/**
 * Единственный клиент Supabase в приложении. Вызывается только из api.ts фич.
 *
 * Клиент создаётся при первом вызове, а не при импорте модуля: страницы
 * пререндерятся при сборке, где нет localStorage и могут быть не заданы
 * переменные Supabase.
 */
export function getSupabase(): AppSupabaseClient {
  if (!client) {
    const { url, anonKey } = readSupabaseEnv();
    client = createClient<Database>(url, anonKey, {
      auth: {
        // Сессия хранится в localStorage и продлевается автоматически.
        persistSession: true,
        autoRefreshToken: true,
        // Вход только по паролю: токенов в адресе (magic link, OAuth) не бывает.
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}
