import type { Metadata } from "next";
import { Suspense } from "react";

import { QueryIdPlaceholder } from "@/components/layout/QueryIdPlaceholder";

export const metadata: Metadata = { title: "Раздел" };

// useSearchParams при статическом экспорте требует границы <Suspense>.
export default function AreaPage() {
  return (
    <Suspense>
      <QueryIdPlaceholder
        title="Раздел"
        description="Кольцо прогресса раздела, его проекты и задачи без проекта — этап 4."
      />
    </Suspense>
  );
}
