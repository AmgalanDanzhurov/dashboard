import Link from "next/link";

import { ProgressBar } from "@/components/progress/ProgressBar";
import { ProgressRing } from "@/components/progress/ProgressRing";
import { formatProgress, progressOf } from "@/lib/domain/progress";
import type { Area, ProgressById, Project } from "@/lib/domain/types";
import { routes } from "@/lib/routes";

type Props = {
  areas: Area[];
  projects: Project[];
  areaProgress: ProgressById | undefined;
  projectProgress: ProgressById | undefined;
};

/** Прогресс по разделам и кольца активных проектов, сгруппированные по разделам. */
export function AreasOverview({
  areas,
  projects,
  areaProgress,
  projectProgress,
}: Props) {
  return (
    <section
      aria-labelledby="areas-heading"
      className="flex flex-col gap-4 rounded-xl border bg-card p-4"
    >
      <h2 id="areas-heading" className="font-medium">
        Прогресс по разделам
      </h2>
      <div className="flex flex-col gap-6">
        {areas.map((area) => {
          const progress = progressOf(areaProgress, area.id);
          const active = projects.filter(
            (p) => p.area_id === area.id && p.archived_at === null,
          );
          return (
            <div key={area.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: area.color }}
                />
                <Link
                  href={routes.area(area.id)}
                  className="min-w-0 flex-1 truncate text-sm font-medium hover:underline hover:underline-offset-4"
                >
                  {area.name}
                </Link>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {progress.total ? `${progress.percent}% · ` : ""}
                  {formatProgress(progress)}
                </span>
              </div>
              <ProgressBar
                progress={progress}
                color={area.color}
                label={`Прогресс раздела «${area.name}»`}
              />
              {active.length > 0 ? (
                <ul className="flex flex-wrap gap-4">
                  {active.map((project) => (
                    <li key={project.id}>
                      <Link
                        href={routes.project(project.id)}
                        className="flex w-24 flex-col items-center gap-1.5 rounded-md p-1 text-center outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <ProgressRing
                          size={64}
                          progress={progressOf(projectProgress, project.id)}
                          color={project.color}
                          label={`Прогресс проекта «${project.name}»`}
                        />
                        <span className="line-clamp-2 text-xs break-words">
                          {project.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
