import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Статистика" };

export default function StatsPage() {
  return (
    <PagePlaceholder
      title="Статистика"
      description="Выполнено по дням, по разделам, тегам и приоритетам, burndown проекта — этап 8."
    />
  );
}
