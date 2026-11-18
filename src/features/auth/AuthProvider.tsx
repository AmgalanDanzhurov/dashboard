"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useEffect, useState } from "react";

import { readSupabaseEnv } from "@/lib/env";

import { subscribeToSession } from "./api";

export type AuthState =
  | { status: "loading"; session: null }
  | { status: "authenticated"; session: Session }
  | { status: "unauthenticated"; session: null };

export const AuthContext = createContext<AuthState | null>(null);

const loading: AuthState = { status: "loading", session: null };

/** Сообщение об ошибке настройки Supabase или null, если всё задано. */
function supabaseConfigError(): string | null {
  try {
    readSupabaseEnv();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(loading);
  // Переменные подставляются при сборке, поэтому проверка постоянна.
  const [configError] = useState(supabaseConfigError);

  useEffect(() => {
    if (configError) return;
    return subscribeToSession((session) => {
      setState(
        session
          ? { status: "authenticated", session }
          : { status: "unauthenticated", session: null },
      );
    });
  }, [configError]);

  // Без адреса и ключа Supabase приложение работать не может. Вместо
  // падения всей страницы объясняем, что поправить.
  if (configError) return <ConfigErrorScreen message={configError} />;

  return <AuthContext value={state}>{children}</AuthContext>;
}

function ConfigErrorScreen({ message }: { message: string }) {
  return (
    <main
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center gap-3 p-4 text-center"
    >
      <h1 className="text-2xl font-semibold tracking-tight">
        Сайт собран без настроек Supabase
      </h1>
      <p className="max-w-md text-muted-foreground">
        Добавьте переменные NEXT_PUBLIC_SUPABASE_URL и
        NEXT_PUBLIC_SUPABASE_ANON_KEY (в GitHub: Settings → Secrets and
        variables → Actions → Variables) и пересоберите сайт.
      </p>
      <p className="max-w-md text-xs text-muted-foreground">{message}</p>
    </main>
  );
}
