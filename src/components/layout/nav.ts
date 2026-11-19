import {
  ChartColumn,
  Layers,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { routes } from "@/lib/routes";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const dashboard: NavItem = {
  href: routes.dashboard,
  label: "Дашборд",
  icon: LayoutDashboard,
};
const today: NavItem = { href: routes.today, label: "Сегодня", icon: Sun };
const tasks: NavItem = {
  href: routes.tasks,
  label: "Задачи",
  icon: ListChecks,
};
const areas: NavItem = { href: routes.areas, label: "Разделы", icon: Layers };
const stats: NavItem = {
  href: routes.stats,
  label: "Статистика",
  icon: ChartColumn,
};
const settings: NavItem = {
  href: routes.settings,
  label: "Настройки",
  icon: Settings,
};

/** Боковая панель на десктопе: все пункты. */
export const navItems: readonly NavItem[] = [
  dashboard,
  today,
  tasks,
  areas,
  stats,
  settings,
];

/**
 * Нижняя панель на телефоне вмещает пять пунктов: четыре главных и «Ещё»,
 * в котором остальные.
 */
export const mobilePrimaryItems: readonly NavItem[] = [
  dashboard,
  today,
  tasks,
  areas,
];
export const mobileMoreItems: readonly NavItem[] = [stats, settings];
