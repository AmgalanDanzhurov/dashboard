import { describe, expect, it } from "vitest";

import { readSupabaseEnv } from "./env";

describe("readSupabaseEnv", () => {
  it("возвращает адрес и ключ, если они заданы", () => {
    expect(
      readSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_test",
      }),
    ).toEqual({
      url: "https://abc.supabase.co",
      anonKey: "sb_publishable_test",
    });
  });

  it("объясняет по-русски, чего не хватает", () => {
    expect(() =>
      readSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      }),
    ).toThrow(/Не настроено подключение к Supabase/);
  });
});
