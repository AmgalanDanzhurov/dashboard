"use client";

import { ArchiveRestore } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { ProgressRing } from "@/components/progress/ProgressRing";
import { QueryError } from "@/components/QueryError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAreas } from "@/features/areas/hooks";
import { LocationTasks } from "@/features/tasks/components/LocationTasks";
import { formatProgress, progressOf } from "@/lib/domain/progress";
import { routes } from "@/lib/routes";

import {
  useProjectProgress,
  useProjects,
  useSetProjectArchived,
} from "../hooks";

import { ProjectMenu } from "./ProjectMenu";

/** Страница /project/?id=: прогресс проекта. Задачи появятся на этапе 5. */
export function ProjectView() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();

  const projects = useProjects();
  const areas = useAreas();
  const progressById = useProjectProgress();
  const setArchived = useSetProjectArchived();

  if (projects.isPending || areas.isPending) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <span className="sr-only">Загружаем проект…</span>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="size-24 rounded-full" />
      </div>
    );
  }
  if (projects.isError || areas.isError) {
    return (
      <QueryError
        error={projects.error ?? areas.error}
        onRetry={() => {
          void projects.refetch();
          void areas.refetch();
        }}
      />
    );
  }

  const project = projects.data.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Проект не найден
        </h1>
        <p className="text-muted-foreground">
          Возможно, он был удалён или ссылка неполная.
        </p>
        <Button asChild variant="outline">
          <Link href={routes.areas}>Ко всем разделам</Link>
        </Button>
      </div>
    );
  }

  const area = areas.data.find((a) => a.id === project.area_id);
  const progress = progressOf(progressById.data, project.id);
  const archived = project.archived_at !== null;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <nav aria-label="Путь" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href={routes.areas} className="hover:text-foreground">
                Разделы
              </Link>
            </li>
            {area ? (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link
                    href={routes.area(area.id)}
                    className="hover:text-foreground"
                  >
                    {area.name}
                  </Link>
                </li>
              </>
            ) : null}
          </ol>
        </nav>

        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-2.5 size-3 shrink-0 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight break-words">
            {project.name}
          </h1>
          {archived ? <Badge variant="secondary">Архив</Badge> : null}
          <ProjectMenu
            project={project}
            onDeleted={() =>
              router.replace(area ? routes.area(area.id) : routes.areas)
            }
          />
        </div>

        {archived ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-4 text-sm">
            <span className="mr-auto">
              Проект в архиве: он скрыт с дашборда и не входит в прогресс
              раздела.
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={setArchived.isPending}
              onClick={() => setArchived.mutate({ project, archived: false })}
            >
              <ArchiveRestore /> Восстановить
            </Button>
          </div>
        ) : null}

        {project.description ? (
          <p className="max-w-prose whitespace-pre-line text-muted-foreground">
            {project.description}
          </p>
        ) : null}

        <div className="flex items-center gap-4">
          <ProgressRing
            progress={progress}
            color={project.color}
            label={`Прогресс проекта «${project.name}»`}
          />
          {/* «Нет задач» уже написано в кольце — не повторяем. */}
          {progress.total > 0 ? (
            <span className="text-sm font-medium tabular-nums">
              {formatProgress(progress)}
            </span>
          ) : null}
        </div>
      </header>

      <section aria-labelledby="project-tasks" className="flex flex-col gap-4">
        <h2 id="project-tasks" className="text-lg font-semibold">
          Задачи
        </h2>
        <LocationTasks
          location={{ kind: "project", projectId: project.id }}
          emptyText="В проекте пока нет открытых задач."
        />
      </section>
    </div>
  );
}
