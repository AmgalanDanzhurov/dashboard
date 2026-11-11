import type { Session } from "@supabase/supabase-js";

import { AppError } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase/client";

import { toSignInError } from "./errors";

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw toSignInError(error);
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) {
    throw new AppError("Не удалось выйти. Попробуйте ещё раз.", {
      cause: error,
    });
  }
}

/**
 * Подписка на изменения сессии. Первый вызов приходит сразу (событие
 * INITIAL_SESSION) с сессией из localStorage или null.
 * Возвращает функцию отписки.
 */
export function subscribeToSession(
  onChange: (session: Session | null) => void,
): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
    onChange(session);
  });
  return () => data.subscription.unsubscribe();
}
