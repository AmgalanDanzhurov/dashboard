import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Страница не найдена" };

// При статическом экспорте становится out/404.html — его отдаёт GitHub Pages.
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <p className="text-sm font-medium text-muted-foreground tabular-nums">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        Страница не найдена
      </h1>
      <p className="max-w-sm text-muted-foreground">
        Возможно, ссылка устарела или в адресе опечатка.
      </p>
      <Button asChild>
        <Link href={routes.dashboard}>На дашборд</Link>
      </Button>
    </main>
  );
}
