import type { Metadata } from "next";
import { Suspense } from "react";

import { QueryIdPlaceholder } from "@/components/layout/QueryIdPlaceholder";

export const metadata: Metadata = { title: "Проект" };

// useSearchParams при статическом экспорте требует границы <Suspense>.
export default function ProjectPage() {
  return (
    <Suspense>
      <QueryIdPlaceholder
        title="Проект"
        description="Кольцо прогресса, burndown за 30 дней и задачи проекта — этапы 4 и 8."
      />
    </Suspense>
  );
}
