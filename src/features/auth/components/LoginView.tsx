"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { safeRedirectPath } from "@/lib/routes";

import { useSession } from "../hooks";

import { LoginForm } from "./LoginForm";

/** Страница входа. Если сессия уже есть, сразу уводит по адресу из ?next=. */
export function LoginView() {
  const { status } = useSession();
  const router = useRouter();
  const next = safeRedirectPath(useSearchParams().get("next"));

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вход</CardTitle>
          <CardDescription>Личный дашборд задач</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "unauthenticated" ? (
            <LoginForm />
          ) : (
            <div className="flex flex-col gap-4" aria-busy="true">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
