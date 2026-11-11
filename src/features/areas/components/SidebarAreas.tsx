"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { progressOf } from "@/lib/domain/progress";
import { isSamePath, routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { useAreaProgress, useAreas } from "../hooks";

/** Список разделов в боковой панели. Читает ?id=, поэтому нужен <Suspense>. */
export function SidebarAreas() {
  const areas = useAreas();
  const progress = useAreaProgress();
  const pathname = usePathname();
  const currentId = useSearchParams().get("id");
  const onAreaPage = isSamePath(pathname, "/area/");

  if (areas.isPending) {
    return (
      <div className="flex flex-col gap-2 px-3" aria-hidden>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }
  if (areas.isError || areas.data.length === 0) return null;

  return (
    <nav aria-labelledby="sidebar-areas" className="flex flex-col gap-1">
      <h2
        id="sidebar-areas"
        className="px-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase"
      >
        Разделы
      </h2>
      <ul className="flex flex-col gap-0.5">
        {areas.data.map((area) => {
          const active = onAreaPage && currentId === area.id;
          return (
            <li key={area.id}>
              <Link
                href={routes.area(area.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: area.color }}
                />
                <span className="min-w-0 flex-1 truncate">{area.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {progressOf(progress.data, area.id).percent}%
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
