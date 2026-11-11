"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import type { Task, TaskPriority, TaskStatus } from "@/lib/domain/types";
import { errorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query/queryKeys";

import {
  createTask,
  deleteTask,
  listTasks,
  setTaskPriority,
  setTaskStatus,
  updateTask,
  type TaskInput,
} from "./api";

export function useTasks() {
  return useQuery({ queryKey: queryKeys.tasks.list(), queryFn: listTasks });
}

const onError = (error: unknown) => toast.error(errorMessage(error));

/** Задачи меняют прогресс разделов и проектов — обновляем всё вместе. */
function invalidateTasksAndProgress(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.areas.progress() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.progress() }),
  ]);
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => invalidateTasksAndProgress(queryClient),
    onError,
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ task, input }: { task: Task; input: TaskInput }) =>
      updateTask(task, input),
    onSuccess: () => {
      toast.success("Задача сохранена");
      return invalidateTasksAndProgress(queryClient);
    },
    onError,
  });
}

/**
 * Optimistic update: меняет задачу в кэше сразу, до ответа сервера,
 * и откатывает изменение, если сервер вернул ошибку.
 */
function useOptimisticTaskPatch<V extends { task: Task }>(
  apply: (task: Task, vars: V) => Task,
  request: (vars: V) => Promise<void>,
) {
  const queryClient = useQueryClient();
  const key = queryKeys.tasks.list();

  return useMutation({
    mutationFn: request,
    onMutate: async (vars) => {
      // Ждём, пока не завершатся загрузки, иначе они затрут наше изменение.
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);
      queryClient.setQueryData<Task[]>(key, (tasks) =>
        tasks?.map((t) => (t.id === vars.task.id ? apply(t, vars) : t)),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      onError(error);
    },
    onSettled: () => invalidateTasksAndProgress(queryClient),
  });
}

export function useSetTaskStatus() {
  return useOptimisticTaskPatch<{ task: Task; status: TaskStatus }>(
    (task, { status }) => ({
      ...task,
      status,
      // Как триггер в базе: completed_at есть только у выполненных.
      completed_at:
        status === "done"
          ? (task.completed_at ?? new Date().toISOString())
          : null,
    }),
    ({ task, status }) => setTaskStatus(task.id, status),
  );
}

export function useSetTaskPriority() {
  return useOptimisticTaskPatch<{ task: Task; priority: TaskPriority }>(
    (task, { priority }) => ({ ...task, priority }),
    ({ task, priority }) => setTaskPriority(task.id, priority),
  );
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (task: Task) => deleteTask(task.id),
    onSuccess: (_data, task) => {
      toast.success(`Задача «${task.title}» удалена`);
      void invalidateTasksAndProgress(queryClient);
    },
    onError,
  });
}
