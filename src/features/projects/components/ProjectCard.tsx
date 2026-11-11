import Link from "next/link";

import { ProgressBar } from "@/components/progress/ProgressBar";
import { Badge } from "@/components/ui/badge";
import { formatProgress } from "@/lib/domain/progress";
import type { Progress, Project } from "@/lib/domain/types";
import { routes } from "@/lib/routes";

import { ProjectMenu } from "./ProjectMenu";

type Props = {
  project: Project;
  progress: Progress;
};

export function ProjectCard({ project, progress }: Props) {
  const archived = project.archived_at !== null;

  return (
    <article className="relative flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-accent/40">
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className="mt-1.5 size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <h3 className="min-w-0 flex-1 font-medium break-words">
          {/* Ссылка растянута на всю карточку через ::after. */}
          <Link
            href={routes.project(project.id)}
            className="outline-none after:absolute after:inset-0 after:rounded-xl"
          >
            {project.name}
          </Link>
        </h3>
        {archived ? <Badge variant="secondary">Архив</Badge> : null}
        {/* Меню поверх растянутой ссылки. */}
        <div className="relative z-10 -mt-1.5 -mr-2">
          <ProjectMenu project={project} />
        </div>
      </div>
      <ProgressBar
        progress={progress}
        color={project.color}
        label={`Прогресс проекта «${project.name}»`}
      />
      <p className="text-sm text-muted-foreground tabular-nums">
        {formatProgress(progress)}
      </p>
    </article>
  );
}
