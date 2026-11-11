"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/hooks";
import { routes } from "@/lib/routes";

/**
 * Пускает на страницу только после входа. Без сессии уводит на /login,
 * запомнив текущий адрес, чтобы вернуться сюда после входа.
 * Это удобство, а не защита: данные защищает RLS в базе.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "unauthenticated") return;
    // pathname без basePath, а query basePath не затрагивает.
    router.replace(routes.loginWithNext(pathname + window.location.search));
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    return (
      <div
        className="flex min-h-dvh items-center justify-center p-4"
        aria-busy="true"
      >
        <span className="sr-only">Проверяем вход…</span>
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }

  return children;
}
