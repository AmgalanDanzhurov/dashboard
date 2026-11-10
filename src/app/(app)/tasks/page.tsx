import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Задачи" };

export default function TasksPage() {
  return (
    <PagePlaceholder
      title="Задачи"
      description="Все задачи, включая «Входящие», фильтры в адресе и группировка по сроку — этап 5."
    />
  );
}
