import type { Metadata } from "next";
import { Suspense } from "react";

import { AreaView } from "@/features/areas/components/AreaView";

export const metadata: Metadata = { title: "Раздел" };

// AreaView читает ?id= через useSearchParams, поэтому нужен <Suspense>.
export default function AreaPage() {
  return (
    <Suspense>
      <AreaView />
    </Suspense>
  );
}
