import type { Metadata } from "next";

import { TodayView } from "@/features/tasks/components/TodayView";

export const metadata: Metadata = { title: "Сегодня" };

export default function TodayPage() {
  return <TodayView />;
}
