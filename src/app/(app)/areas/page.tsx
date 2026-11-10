import type { Metadata } from "next";
import Link from "next/link";

import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Разделы" };

export default function AreasPage() {
  return (
    <PagePlaceholder
      title="Разделы"
      description="Разделы с прогрессом и карточки их проектов — этап 4."
    >
      {/* Временные ссылки: проверяют переход на страницы с ?id= при статическом экспорте. */}
      <ul className="flex flex-col gap-2 text-sm">
        <li>
          <Link
            href={routes.area("demo-area")}
            className="underline underline-offset-4"
          >
            Открыть тестовый раздел
          </Link>
        </li>
        <li>
          <Link
            href={routes.project("demo-project")}
            className="underline underline-offset-4"
          >
            Открыть тестовый проект
          </Link>
        </li>
      </ul>
    </PagePlaceholder>
  );
}
