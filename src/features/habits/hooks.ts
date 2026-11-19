"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { moveByOne } from "@/lib/domain/order";
import type { Habit, HabitCheck, ISODate } from "@/lib/domain/types";
import { errorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query/queryKeys";

import {
  createHabit,
  deleteHabit,
  listHabitChecks,
  listHabits,
  saveHabitPositions,
  setHabitArchived,
  setHabitCheck,
  updateHabit,
} from "./api";
import type { HabitFormValues } from "./schema";

export function useHabits() {
  return useQuery({ queryKey: queryKeys.habits.list(), queryFn: listHabits });
}

export function useHabitChecks() {
  return useQuery({
    queryKey: queryKeys.habits.checks(),
    queryFn: listHabitChecks,
  });
}

const onError = (error: unknown) => toast.error(errorMessage(error));

function useInvalidateHabits() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.habits.all });
}

export function useCreateHabit() {
  const invalidate = useInvalidateHabits();
  return useMutation({
    mutationFn: ({
      values,
      habits,
    }: {
      values: HabitFormValues;
      habits: Habit[];
    }) =>
      createHabit(values, Math.max(-1, ...habits.map((h) => h.position)) + 1),
    onSuccess: (habit) => {
      toast.success(`Привычка «${habit.name}» создана`);
      return invalidate();
    },
    onError,
  });
}

export function useUpdateHabit() {
  const invalidate = useInvalidateHabits();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: HabitFormValues }) =>
      updateHabit(id, values),
    onSuccess: () => {
      toast.success("Привычка сохранена");
      return invalidate();
    },
    onError,
  });
}

export function useSetHabitArchived() {
  const invalidate = useInvalidateHabits();
  return useMutation({
    mutationFn: ({ habit, archived }: { habit: Habit; archived: boolean }) =>
      setHabitArchived(habit.id, archived),
    onSuccess: (_data, { habit, archived }) => {
      toast.success(
        archived
          ? `Привычка «${habit.name}» в архиве`
          : `Привычка «${habit.name}» восстановлена`,
      );
      return invalidate();
    },
    onError,
  });
}

export function useMoveHabit() {
  const invalidate = useInvalidateHabits();
  return useMutation({
    mutationFn: ({
      habits,
      id,
      direction,
    }: {
      habits: Habit[];
      id: string;
      direction: "up" | "down";
    }) => saveHabitPositions(moveByOne(habits, id, direction)),
    onSettled: invalidate,
    onError,
  });
}

export function useDeleteHabit() {
  const invalidate = useInvalidateHabits();
  return useMutation({
    mutationFn: (habit: Habit) => deleteHabit(habit.id),
    onSuccess: (_data, habit) => {
      toast.success(`Привычка «${habit.name}» удалена`);
      void invalidate();
    },
    onError,
  });
}

/**
 * Отметка за день — сразу в кэше, без ожидания сервера; при ошибке
 * отметка возвращается как была.
 */
export function useToggleHabitCheck() {
  const queryClient = useQueryClient();
  const key = queryKeys.habits.checks();

  return useMutation({
    mutationFn: ({
      habitId,
      day,
      done,
    }: {
      habitId: string;
      day: ISODate;
      done: boolean;
    }) => setHabitCheck(habitId, day, done),
    onMutate: async ({ habitId, day, done }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<HabitCheck[]>(key);
      queryClient.setQueryData<HabitCheck[]>(key, (checks = []) => {
        const rest = checks.filter(
          (c) => !(c.habit_id === habitId && c.day === day),
        );
        // user_id в кэше не нужен интерфейсу; база подставит его сама.
        return done ? [...rest, { habit_id: habitId, day, user_id: "" }] : rest;
      });
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      onError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
