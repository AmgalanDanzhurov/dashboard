import {
  AlertTriangle,
  CheckCheck,
  CircleDot,
  Flame,
  Trophy,
} from "lucide-react";
import Link from "next/link";

import { plural } from "@/lib/domain/plural";
import type { DashboardKpis } from "@/lib/domain/stats";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type Tile = {
  label: string;
  value: number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Ссылка на отфильтрованный список задач. */
  href?: string;
  /** Подсветить: что-то требует внимания. */
  alert?: boolean;
};

const DAY_FORMS = ["день", "дня", "дней"] as const;

/** Ряд KPI-карточек: главные числа дашборда. */
export function KpiTiles({ kpis }: { kpis: DashboardKpis }) {
  const tiles: Tile[] = [
    {
      label: "Выполнено сегодня",
      value: kpis.doneToday,
      hint: "задач за сегодня",
      icon: CheckCheck,
    },
    {
      label: "За 7 дней",
      value: kpis.doneWeek,
      hint: "сегодня и 6 дней до",
      icon: Trophy,
    },
    {
      label: "В работе",
      value: kpis.inProgress,
      hint: "статус «В работе»",
      icon: CircleDot,
      href: `${routes.tasks}?status=in_progress`,
    },
    {
      label: "Просрочено",
      value: kpis.overdue,
      hint: kpis.overdue ? "срок уже прошёл" : "всё в срок",
      icon: AlertTriangle,
      href: `${routes.tasks}?due=overdue`,
      alert: kpis.overdue > 0,
    },
    {
      label: "Серия",
      value: kpis.streak,
      hint: `${plural(kpis.streak, DAY_FORMS)} подряд с выполненной задачей`,
      icon: Flame,
    },
  ];

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        const body = (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon
                aria-hidden
                className={cn("size-4", tile.alert && "text-destructive")}
              />
              {tile.label}
            </div>
            <div
              className={cn(
                "text-3xl font-semibold tabular-nums",
                tile.alert && "text-destructive",
              )}
            >
              {tile.value}
            </div>
            <div className="text-xs text-muted-foreground">{tile.hint}</div>
          </>
        );
        const className =
          "flex h-full flex-col gap-1 rounded-xl border bg-card p-4";
        return (
          <li
            key={tile.label}
            // Пятая карточка на телефоне — на всю ширину, а не одна в ряду.
            className="min-w-0 last:col-span-2 sm:last:col-span-1"
          >
            {tile.href ? (
              <Link
                href={tile.href}
                className={cn(
                  className,
                  "transition-colors outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {body}
              </Link>
            ) : (
              <div className={className}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
