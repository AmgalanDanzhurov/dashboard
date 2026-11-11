import type { Metadata } from "next";
import { Suspense } from "react";

import { TasksView } from "@/features/tasks/components/TasksView";

// absolute: иначе шаблон из layout даст «Задачи · Задачи».
export const metadata: Metadata = { title: { absolute: "Задачи" } };

// Фильтры живут в адресе (useSearchParams), поэтому нужен <Suspense>.
export default function TasksPage() {
  return (
    <Suspense>
      <TasksView />
    </Suspense>
  );
}
