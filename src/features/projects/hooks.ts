"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Project } from "@/lib/domain/types";
import { errorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query/queryKeys";

import {
  countProjectTasks,
  createProject,
  deleteProject,
  listProjectProgress,
  listProjects,
  setProjectArchived,
  updateProject,
} from "./api";
import type { ProjectFormValues } from "./schema";

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: listProjects,
  });
}

export function useProjectProgress() {
  return useQuery({
    queryKey: queryKeys.projects.progress(),
    queryFn: listProjectProgress,
  });
}

export function useProjectTaskCount(projectId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...queryKeys.projects.all, "task-count", projectId],
    queryFn: () => countProjectTasks(projectId),
    enabled,
    staleTime: 0,
  });
}

const onError = (error: unknown) => toast.error(errorMessage(error));

/**
 * Проекты влияют и на прогресс разделов (архивация, перенос, удаление),
 * поэтому после изменений обновляем оба набора запросов.
 */
function useInvalidateProjectsAndAreas() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.areas.progress() }),
      // Удаление проекта каскадно удаляет его задачи.
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
    ]);
}

export function useCreateProject() {
  const invalidate = useInvalidateProjectsAndAreas();
  return useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      toast.success(`Проект «${project.name}» создан`);
      return invalidate();
    },
    onError,
  });
}

export function useUpdateProject() {
  const invalidate = useInvalidateProjectsAndAreas();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProjectFormValues }) =>
      updateProject(id, values),
    onSuccess: () => {
      toast.success("Проект сохранён");
      return invalidate();
    },
    onError,
  });
}

export function useSetProjectArchived() {
  const invalidate = useInvalidateProjectsAndAreas();
  return useMutation({
    mutationFn: ({
      project,
      archived,
    }: {
      project: Project;
      archived: boolean;
    }) => setProjectArchived(project.id, archived),
    onSuccess: (_data, { project, archived }) => {
      toast.success(
        archived
          ? `Проект «${project.name}» в архиве`
          : `Проект «${project.name}» восстановлен`,
      );
      return invalidate();
    },
    onError,
  });
}

export function useDeleteProject() {
  const invalidate = useInvalidateProjectsAndAreas();
  return useMutation({
    mutationFn: (project: Project) => deleteProject(project.id),
    onSuccess: (_data, project) => {
      toast.success(`Проект «${project.name}» удалён`);
      // Не ждём обновления: вызывающий код должен успеть уйти со страницы проекта.
      void invalidate();
    },
    onError,
  });
}
