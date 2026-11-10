"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { routes } from "@/lib/routes";

import { PagePlaceholder } from "./PagePlaceholder";

type Props = {
  title: string;
  description: string;
};

/**
 * Заглушка страницы, которая открывается по ?id=. Проверяет главный приём
 * статического экспорта: id читается в браузере, а не из сегмента пути.
 * Должна рендериться внутри <Suspense>.
 */
export function QueryIdPlaceholder({ title, description }: Props) {
  const id = useSearchParams().get("id");

  return (
    <PagePlaceholder title={title} description={description}>
      <p className="text-sm text-muted-foreground">
        {id ? (
          <>
            Параметр <code className="font-mono">id</code>:{" "}
            <span className="font-mono">{id}</span>
          </>
        ) : (
          <>
            В адресе нет параметра <code className="font-mono">id</code>.{" "}
            <Link
              href={routes.areas}
              className="text-foreground underline underline-offset-4"
            >
              К разделам
            </Link>
          </>
        )}
      </p>
    </PagePlaceholder>
  );
}
