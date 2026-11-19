import type { Habit, HabitCheck, ISODate } from "@/lib/domain/types";
import { getSupabase } from "@/lib/supabase/client";
import { toDataError } from "@/lib/supabase/errors";
import { fetchAll } from "@/lib/supabase/fetchAll";

import type { HabitFormValues } from "./schema";

/** Все привычки, включая архивные: фильтрует интерфейс. */
export async function listHabits(): Promise<Habit[]> {
  const { data, error } = await getSupabase()
    .from("habits")
    .select("*")
    .order("position")
    .order("created_at");
  if (error) throw toDataError(error, "загрузить привычки");
  return data;
}

/**
 * Все отметки — нужны для лучшего стрика. Страницами: за пару лет
 * нескольких привычек набирается больше 1000 строк.
 */
export async function listHabitChecks(): Promise<HabitCheck[]> {
  const { data, error } = await fetchAll<HabitCheck>((from, to) =>
    getSupabase()
      .from("habit_checks")
      .select("*")
      .order("day")
      .order("habit_id")
      .range(from, to),
  );
  if (error) throw toDataError(error, "загрузить отметки привычек");
  return data;
}

function toRow(values: HabitFormValues) {
  return {
    name: values.name,
    color: values.color,
    weekdays: [...new Set(values.weekdays)].sort((a, b) => a - b),
  };
}

export async function createHabit(
  values: HabitFormValues,
  position: number,
): Promise<Habit> {
  const { data, error } = await getSupabase()
    .from("habits")
    .insert({ ...toRow(values), position })
    .select()
    .single();
  if (error) throw toDataError(error, "создать привычку");
  return data;
}

export async function updateHabit(
  id: string,
  values: HabitFormValues,
): Promise<void> {
  const { error } = await getSupabase()
    .from("habits")
    .update(toRow(values))
    .eq("id", id);
  if (error) throw toDataError(error, "сохранить привычку");
}

export async function setHabitArchived(
  id: string,
  archived: boolean,
): Promise<void> {
  const { error } = await getSupabase()
    .from("habits")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) {
    throw toDataError(
      error,
      archived ? "архивировать привычку" : "восстановить привычку",
    );
  }
}

export async function saveHabitPositions(
  updates: readonly { id: string; position: number }[],
): Promise<void> {
  const results = await Promise.all(
    updates.map(({ id, position }) =>
      getSupabase().from("habits").update({ position }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error)?.error;
  if (failed) throw toDataError(failed, "изменить порядок привычек");
}

/** Удаляет привычку; её отметки удаляются каскадно. */
export async function deleteHabit(id: string): Promise<void> {
  const { error } = await getSupabase().from("habits").delete().eq("id", id);
  if (error) throw toDataError(error, "удалить привычку");
}

/** Ставит или снимает отметку «сделано» за день. */
export async function setHabitCheck(
  habitId: string,
  day: ISODate,
  done: boolean,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = done
    ? // upsert: повторное нажатие на уже отмеченный день не даёт ошибки.
      await supabase
        .from("habit_checks")
        .upsert({ habit_id: habitId, day }, { ignoreDuplicates: true })
    : await supabase
        .from("habit_checks")
        .delete()
        .eq("habit_id", habitId)
        .eq("day", day);
  if (error) {
    throw toDataError(error, done ? "отметить привычку" : "снять отметку");
  }
}
