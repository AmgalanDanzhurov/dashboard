import type { Metadata } from "next";
import { Suspense } from "react";

import { TodayView } from "@/features/tasks/components/TodayView";

export const metadata: Metadata = { title: "Сегодня" };

// Сортировка хранится в адресе (useSearchParams), поэтому нужен <Suspense>.
export default function TodayPage() {
  return (
    <Suspense>
      <TodayView />
    </Suspense>
  );
}
