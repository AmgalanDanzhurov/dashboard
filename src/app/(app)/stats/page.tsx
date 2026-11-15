import type { Metadata } from "next";
import { Suspense } from "react";

import { StatsView } from "@/features/stats/components/StatsView";

export const metadata: Metadata = { title: "Статистика" };

// Период и проект хранятся в адресе (useSearchParams), поэтому нужен <Suspense>.
export default function StatsPage() {
  return (
    <Suspense>
      <StatsView />
    </Suspense>
  );
}
