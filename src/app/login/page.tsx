import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginView } from "@/features/auth/components/LoginView";

export const metadata: Metadata = { title: "Вход" };

// Страница входа живёт вне группы (app): без боковой панели и без AuthGuard.
// LoginView читает ?next= через useSearchParams, поэтому нужен <Suspense>.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
