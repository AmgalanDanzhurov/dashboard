"use client";

import { useContext } from "react";

import { AuthContext, type AuthState } from "./AuthProvider";

/** Текущая сессия: loading, пока supabase-js читает её из localStorage. */
export function useSession(): AuthState {
  const state = useContext(AuthContext);
  if (!state) throw new Error("useSession нужно вызывать внутри AuthProvider");
  return state;
}
