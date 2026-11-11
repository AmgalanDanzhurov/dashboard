import type { Metadata } from "next";

import { AreasView } from "@/features/areas/components/AreasView";

export const metadata: Metadata = { title: "Разделы" };

export default function AreasPage() {
  return <AreasView />;
}
