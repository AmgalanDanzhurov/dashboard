import {
  ChartColumn,
  Layers,
  LayoutDashboard,
  ListChecks,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { routes } from "@/lib/routes";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Общий список для боковой панели и нижней панели на телефоне.
export const navItems: readonly NavItem[] = [
  { href: routes.dashboard, label: "Дашборд", icon: LayoutDashboard },
  { href: routes.tasks, label: "Задачи", icon: ListChecks },
  { href: routes.areas, label: "Разделы", icon: Layers },
  { href: routes.stats, label: "Статистика", icon: ChartColumn },
  { href: routes.settings, label: "Настройки", icon: Settings },
];
