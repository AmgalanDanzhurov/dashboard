"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { moveByOne } from "@/lib/domain/order";
import type { Area } from "@/lib/domain/types";
import { errorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query/queryKeys";

import {
  countAreaContents,
  createArea,
  deleteArea,
  listAreaProgress,
  listAreas,
  saveAreaPositions,
  updateArea,
} from "./api";
import type { AreaFormValues } from "./schema";

export function useAreas() {
  return useQuery({ queryKey: queryKeys.areas.list(), queryFn: listAreas });
}

export function useAreaProgress() {
  return useQuery({
    queryKey: queryKeys.areas.progress(),
    queryFn: listAreaProgress,
  });
}

export function useAreaContents(areaId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...queryKeys.areas.all, "contents", areaId],
    queryFn: () => countAreaContents(areaId),
    enabled,
    // Счётчик для диалога удаления должен быть свежим.
    staleTime: 0,
  });
}

const onError = (error: unknown) => toast.error(errorMessage(error));

export function useCreateArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      values,
      areas,
    }: {
      values: AreaFormValues;
      areas: Area[];
    }) =>
      createArea({
        ...values,
        position: Math.max(-1, ...areas.map((a) => a.position)) + 1,
      }),
    onSuccess: (area) => {
      toast.success(`Раздел «${area.name}» создан`);
      return queryClient.invalidateQueries({ queryKey: queryKeys.areas.all });
    },
    onError,
  });
}

export function useUpdateArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: AreaFormValues }) =>
      updateArea(id, values),
    onSuccess: () => {
      toast.success("Раздел сохранён");
      return queryClient.invalidateQueries({ queryKey: queryKeys.areas.all });
    },
    onError,
  });
}

export function useMoveArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      areas,
      id,
      direction,
    }: {
      areas: Area[];
      id: string;
      direction: "up" | "down";
    }) => saveAreaPositions(moveByOne(areas, id, direction)),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.areas.list() }),
    onError,
  });
}

export function useDeleteArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (area: Area) => deleteArea(area.id),
    onSuccess: async (_data, area) => {
      toast.success(`Раздел «${area.name}» удалён`);
      // Вместе с разделом каскадно удалились его проекты.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.areas.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
      ]);
    },
    onError,
  });
}
