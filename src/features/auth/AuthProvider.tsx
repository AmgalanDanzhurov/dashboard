"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useEffect, useState } from "react";

import { subscribeToSession } from "./api";

export type AuthState =
  | { status: "loading"; session: null }
  | { status: "authenticated"; session: Session }
  | { status: "unauthenticated"; session: null };

export const AuthContext = createContext<AuthState | null>(null);

const loading: AuthState = { status: "loading", session: null };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(loading);

  useEffect(
    () =>
      subscribeToSession((session) => {
        setState(
          session
            ? { status: "authenticated", session }
            : { status: "unauthenticated", session: null },
        );
      }),
    [],
  );

  return <AuthContext value={state}>{children}</AuthContext>;
}
