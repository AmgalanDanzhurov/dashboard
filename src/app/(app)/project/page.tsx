import type { Metadata } from "next";
import { Suspense } from "react";

import { ProjectView } from "@/features/projects/components/ProjectView";

export const metadata: Metadata = { title: "Проект" };

// ProjectView читает ?id= через useSearchParams, поэтому нужен <Suspense>.
export default function ProjectPage() {
  return (
    <Suspense>
      <ProjectView />
    </Suspense>
  );
}
