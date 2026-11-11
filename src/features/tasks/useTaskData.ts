"use client";

import { useMemo } from "react";

import { useAreas } from "@/features/areas/hooks";
import { useProjects } from "@/features/projects/hooks";
import { useTags } from "@/features/tags/hooks";
import { todayISO } from "@/lib/domain/dates";

import { useTasks } from "./hooks";

/**
 * Всё, что нужно спискам задач: задачи, разделы, проекты и теги,
 * плюс быстрый доступ по id. Сегодняшняя дата берётся при отрисовке.
 */
export function useTaskData() {
  const tasks = useTasks();
  const areas = useAreas();
  const projects = useProjects();
  const tags = useTags();

  const maps = useMemo(
    () => ({
      areasById: new Map((areas.data ?? []).map((a) => [a.id, a])),
      projectsById: new Map((projects.data ?? []).map((p) => [p.id, p])),
      tagsById: new Map((tags.data ?? []).map((t) => [t.id, t])),
    }),
    [areas.data, projects.data, tags.data],
  );

  const queries = [tasks, areas, projects, tags];

  return {
    tasks: tasks.data ?? [],
    areas: areas.data ?? [],
    projects: projects.data ?? [],
    tags: tags.data ?? [],
    ...maps,
    today: todayISO(),
    isPending: queries.some((q) => q.isPending),
    error: queries.find((q) => q.error)?.error ?? null,
    refetch: () => queries.forEach((q) => void q.refetch()),
  };
}

export type TaskData = ReturnType<typeof useTaskData>;
