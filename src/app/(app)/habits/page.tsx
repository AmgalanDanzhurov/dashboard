import type { Metadata } from "next";

import { HabitsView } from "@/features/habits/components/HabitsView";

export const metadata: Metadata = { title: "Привычки" };

export default function HabitsPage() {
  return <HabitsView />;
}
