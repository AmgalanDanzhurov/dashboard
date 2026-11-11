"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Tag } from "@/lib/domain/types";
import { errorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query/queryKeys";

import { createTag, deleteTag, listTags, updateTag } from "./api";
import type { TagFormValues } from "./schema";

export function useTags() {
  return useQuery({ queryKey: queryKeys.tags.list(), queryFn: listTags });
}

const onError = (error: unknown) => toast.error(errorMessage(error));

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTag,
    onSuccess: (tag) => {
      toast.success(`Тег «${tag.name}» создан`);
      return queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
    onError,
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TagFormValues }) =>
      updateTag(id, values),
    onSuccess: () => {
      toast.success("Тег сохранён");
      return queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
    onError,
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tag: Tag) => deleteTag(tag.id),
    onSuccess: (_data, tag) => {
      toast.success(`Тег «${tag.name}» удалён`);
      // У задач пропала связь с тегом.
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      return queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
    onError,
  });
}
