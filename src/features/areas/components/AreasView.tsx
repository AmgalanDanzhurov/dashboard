"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { QueryError } from "@/components/QueryError";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useProjectProgress, useProjects } from "@/features/projects/hooks";
import { progressOf } from "@/lib/domain/progress";

import { useAreaProgress, useAreas } from "../hooks";

import { AreaFormDialog } from "./AreaFormDialog";
import { AreaSection } from "./AreaSection";

/** Страница /areas: все разделы с прогрессом и проектами. */
export function AreasView() {
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const areas = useAreas();
  const projects = useProjects();
  const areaProgress = useAreaProgress();
  const projectProgress = useProjectProgress();

  const archivedCount = (projects.data ?? []).filter(
    (p) => p.archived_at !== null,
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <h1 className="mr-auto text-2xl font-semibold tracking-tight">
          Разделы
        </h1>
        {archivedCount > 0 ? (
          <div className="flex items-center gap-2">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label htmlFor="show-archived">
              Показать архив ({archivedCount})
            </Label>
          </div>
        ) : null}
        <Button onClick={() => setCreating(true)}>
          <Plus /> Новый раздел
        </Button>
      </header>

      {areas.isPending || projects.isPending ? (
        <AreasSkeleton />
      ) : areas.isError || projects.isError ? (
        <QueryError
          error={areas.error ?? projects.error}
          onRetry={() => {
            void areas.refetch();
            void projects.refetch();
          }}
        />
      ) : areas.data.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
          <h2 className="font-medium">Создайте первый раздел</h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            Разделы — крупные сферы жизни, например «Учёба», «Работа» и
            «Личное». Внутри раздела живут проекты и задачи.
          </p>
          <Button onClick={() => setCreating(true)}>
            <Plus /> Новый раздел
          </Button>
        </div>
      ) : (
        areas.data.map((area) => (
          <AreaSection
            key={area.id}
            area={area}
            progress={progressOf(areaProgress.data, area.id)}
            projects={projects.data.filter(
              (p) =>
                p.area_id === area.id &&
                (showArchived || p.archived_at === null),
            )}
            projectProgress={projectProgress.data}
          />
        ))
      )}

      <AreaFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function AreasSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <span className="sr-only">Загружаем разделы…</span>
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-2 w-full" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
