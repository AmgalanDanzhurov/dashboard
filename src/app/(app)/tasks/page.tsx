import type { Metadata } from "next";
import { Suspense } from "react";

import { TasksView } from "@/features/tasks/components/TasksView";

export const metadata: Metadata = { title: "Задачи" };

// Фильтры живут в адресе (useSearchParams), поэтому нужен <Suspense>.
export default function TasksPage() {
  return (
    <Suspense>
      <TasksView />
    </Suspense>
  );
}
