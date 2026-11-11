"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ProgressRing } from "@/components/progress/ProgressRing";
import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ProjectCard } from "@/features/projects/components/ProjectCard";
import { ProjectFormDialog } from "@/features/projects/components/ProjectFormDialog";
import { useProjectProgress, useProjects } from "@/features/projects/hooks";
import { formatProgress, progressOf } from "@/lib/domain/progress";
import { routes } from "@/lib/routes";

import { useAreaProgress, useAreas } from "../hooks";

import { AreaMenu } from "./AreaMenu";

/** Страница /area/?id=: прогресс раздела и его проекты. */
export function AreaView() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const areas = useAreas();
  const projects = useProjects();
  const areaProgress = useAreaProgress();
  const projectProgress = useProjectProgress();

  if (areas.isPending || projects.isPending) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <span className="sr-only">Загружаем раздел…</span>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="size-24 rounded-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (areas.isError || projects.isError) {
    return (
      <QueryError
        error={areas.error ?? projects.error}
        onRetry={() => {
          void areas.refetch();
          void projects.refetch();
        }}
      />
    );
  }

  const area = areas.data.find((a) => a.id === id);
  if (!area) {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Раздел не найден
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

  const progress = progressOf(areaProgress.data, area.id);
  const areaProjects = projects.data.filter((p) => p.area_id === area.id);
  const archivedCount = areaProjects.filter(
    (p) => p.archived_at !== null,
  ).length;
  const visibleProjects = areaProjects.filter(
    (p) => showArchived || p.archived_at === null,
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <nav aria-label="Путь" className="text-sm text-muted-foreground">
          <Link href={routes.areas} className="hover:text-foreground">
            Разделы
          </Link>
        </nav>
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-2.5 size-3 shrink-0 rounded-full"
            style={{ backgroundColor: area.color }}
          />
          <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight break-words">
            {area.name}
          </h1>
          <AreaMenu
            area={area}
            onDeleted={() => router.replace(routes.areas)}
          />
        </div>
        <div className="flex items-center gap-4">
          <ProgressRing
            progress={progress}
            color={area.color}
            label={`Прогресс раздела «${area.name}»`}
          />
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium tabular-nums">
              {formatProgress(progress)}
            </span>
            <span className="text-muted-foreground">
              Задачи раздела и его активных проектов, без повторяющихся
            </span>
          </div>
        </div>
      </header>

      <section aria-labelledby="area-projects" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <h2 id="area-projects" className="mr-auto text-lg font-semibold">
            Проекты
          </h2>
          {archivedCount > 0 ? (
            <div className="flex items-center gap-2">
              <Switch
                id="area-show-archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="area-show-archived">
                Показать архив ({archivedCount})
              </Label>
            </div>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              progress={progressOf(projectProgress.data, project.id)}
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
      </section>

      <section aria-labelledby="area-tasks" className="flex flex-col gap-2">
        <h2 id="area-tasks" className="text-lg font-semibold">
          Задачи без проекта
        </h2>
        <p className="text-sm text-muted-foreground">
          Список задач и быстрое добавление появятся на этапе 5.
        </p>
      </section>

      <ProjectFormDialog
        open={creating}
        onOpenChange={setCreating}
        defaultAreaId={area.id}
      />
    </div>
  );
}
