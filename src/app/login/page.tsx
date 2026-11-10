import type { Metadata } from "next";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Вход" };

// Страница входа живёт вне группы (app), поэтому без боковой панели.
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вход</CardTitle>
          <CardDescription>
            Форма входа по email и паролю появится на этапе 3.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={routes.dashboard}
            className="text-sm underline underline-offset-4"
          >
            Перейти на дашборд
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
