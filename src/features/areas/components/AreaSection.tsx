"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ProgressBar } from "@/components/progress/ProgressBar";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/features/projects/components/ProjectCard";
import { ProjectFormDialog } from "@/features/projects/components/ProjectFormDialog";
import { formatProgress, progressOf } from "@/lib/domain/progress";
import type { Area, Progress, ProgressById, Project } from "@/lib/domain/types";
import { routes } from "@/lib/routes";

import { AreaMenu } from "./AreaMenu";

type Props = {
  area: Area;
  progress: Progress;
  projects: Project[];
  projectProgress: ProgressById | undefined;
};

/** Раздел в списке /areas: прогресс и карточки его проектов. */
export function AreaSection({
  area,
  progress,
  projects,
  projectProgress,
}: Props) {
  const [creating, setCreating] = useState(false);

  return (
    <section
      aria-labelledby={`area-${area.id}`}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: area.color }}
          />
          <h2
            id={`area-${area.id}`}
            className="min-w-0 flex-1 text-lg font-semibold break-words"
          >
            <Link
              href={routes.area(area.id)}
              className="hover:underline hover:underline-offset-4"
            >
              {area.name}
            </Link>
          </h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatProgress(progress)}
          </span>
          <AreaMenu area={area} reorderable />
        </div>
        <ProgressBar
          progress={progress}
          color={area.color}
          label={`Прогресс раздела «${area.name}»`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            progress={progressOf(projectProgress, project.id)}
          />
        ))}
        <Button
          variant="outline"
          className="h-auto min-h-24 border-dashed text-muted-foreground"
          onClick={() => setCreating(true)}
        >
          <Plus /> Новый проект
        </Button>
      </div>

      <ProjectFormDialog
        open={creating}
        onOpenChange={setCreating}
        defaultAreaId={area.id}
      />
    </section>
  );
}
